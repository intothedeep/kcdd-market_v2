import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { VERIFICATION_STATUS } from '../constants.js'

dotenv.config()

const router = express.Router()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ALLOWED_DEV_ROLES = new Set(['admin', 'cbo', 'donor'])

// Parses DEV_ROLE_OVERRIDES (CSV of `email:role`) into a lowercase-email → role map.
// Returns {} when unset/empty. Roles are validated against ALLOWED_DEV_ROLES.
function parseDevRoleOverrides(raw) {
  const map = {}
  if (!raw) return map
  for (const pair of raw.split(',')) {
    const idx = pair.lastIndexOf(':')
    if (idx === -1) continue
    const email = pair.slice(0, idx).trim().toLowerCase()
    const role = pair
      .slice(idx + 1)
      .trim()
      .toLowerCase()
    if (!email || !ALLOWED_DEV_ROLES.has(role)) continue
    map[email] = role
  }
  return map
}

// Resolves a dev-only role override for the given email.
// PROD-SAFETY BOUNDARY: in production this ALWAYS returns null — DEV_ROLE_OVERRIDES
// is inert and cannot escalate any account.
function resolveDevRoleOverride(email) {
  if (process.env.NODE_ENV === 'production') return null
  if (!email) return null
  const map = parseDevRoleOverrides(process.env.DEV_ROLE_OVERRIDES)
  return map[email.toLowerCase()] ?? null
}

// Parses BOOTSTRAP_ADMIN_EMAILS (CSV of emails) into a lowercased Set.
function parseBootstrapAdminEmails(raw) {
  const set = new Set()
  if (!raw) return set
  for (const part of raw.split(',')) {
    const email = part.trim().toLowerCase()
    if (email) set.add(email)
  }
  return set
}

// Resolves whether the given email is a designated bootstrap admin.
// PROD-ALLOWED (unlike resolveDevRoleOverride): intentionally works in
// production so the first admin can be minted via env var, no SQL needed.
// PROMOTE-ONLY: callers must only ELEVATE on a match, never demote on a non-match.
function resolveBootstrapAdmin(email) {
  if (!email) return false
  return parseBootstrapAdminEmails(process.env.BOOTSTRAP_ADMIN_EMAILS).has(email.toLowerCase())
}

// Fetches email/name for a Clerk user via the Clerk backend SDK.
// Mirrors the client-creation pattern in middleware/clerkAuth.js. Returns
// { email, name } or null on any failure (caller falls back to donor-default).
async function fetchClerkIdentity(clerkUserId) {
  if (!process.env.CLERK_SECRET_KEY) return null
  const { createClerkClient } = await import('@clerk/backend')
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const user = await clerk.users.getUser(clerkUserId)
  const email =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  return { email, name }
}

// POST /api/users/sync
// Ensures a user_profiles row exists for the authenticated Clerk user.
// Persists email/name fetched from the Clerk API, and applies a DEV-ONLY role
// override (DEV_ROLE_OVERRIDES) so designated accounts auto-receive their role
// on sign-in. Idempotent. Uses the service-role client (bypasses RLS + the
// prevent_user_type_escalation trigger), so role writes here are authoritative.
router.post('/sync', async (req, res) => {
  try {
    const clerkUserId = req.auth.userId

    // Resolve identity from Clerk; on any failure fall back to the original
    // insert-or-ignore donor default (preserves dev-without-secret behavior).
    let identity = null
    try {
      identity = await fetchClerkIdentity(clerkUserId)
    } catch (clerkError) {
      console.error('Error fetching Clerk identity (falling back to donor default):', clerkError)
    }

    if (!identity) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          { id: clerkUserId, user_type: 'donor' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      if (error) throw error
      return res.json({ success: true })
    }

    const { email, name } = identity
    const overrideRole = resolveDevRoleOverride(email)
    const isBootstrapAdmin = resolveBootstrapAdmin(email)
    // Precedence: bootstrap-admin (PROD-allowed) wins over a dev override.
    // effectiveRole is non-null only when a role should be FORCE-SET.
    const effectiveRole = isBootstrapAdmin ? 'admin' : overrideRole
    const forceVerified = isBootstrapAdmin || !!overrideRole
    if (isBootstrapAdmin) {
      // Do NOT log the email (Vercel logs are broadly readable).
      console.info('[bootstrap-admin] %s promoted via BOOTSTRAP_ADMIN_EMAILS', clerkUserId)
    }

    const { data: current, error: readError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', clerkUserId)
      .maybeSingle()

    if (readError) throw readError

    if (!current) {
      // New profile: seed email/name + role (effective override or donor default).
      const insertFields = { id: clerkUserId, email, name, user_type: effectiveRole ?? 'donor' }
      if (forceVerified) {
        // Designated accounts skip the onboarding banner + verification friction
        // so they land straight in their dashboard.
        insertFields.onboarding_complete = true
        insertFields.verification_status = VERIFICATION_STATUS.VERIFIED
      }
      const { error } = await supabase.from('user_profiles').insert(insertFields)
      if (error) throw error
      return res.json({ success: true })
    }

    // Existing profile: always refresh email/name. Only touch user_type when an
    // effective role applies (PROMOTE-ONLY) — non-listed users keep their current
    // admin/cbo/donor role (no user_type key in `update`, never demoted).
    const update = { email, name }
    if (effectiveRole) {
      update.user_type = effectiveRole
      update.onboarding_complete = true
      update.verification_status = VERIFICATION_STATUS.VERIFIED
    }

    const { error } = await supabase.from('user_profiles').update(update).eq('id', clerkUserId)
    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error syncing user_profiles:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/users/become-cbo
// Requires clerkAuth middleware (applied in server.js mount).
// Role-flip precondition: admins must not be able to self-demote (lockout vector);
// existing CBOs are a no-op (idempotent); donor/null becomes 'cbo'.
router.post('/become-cbo', async (req, res) => {
  try {
    const clerkUserId = req.auth.userId

    const { data: current, error: readError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', clerkUserId)
      .maybeSingle()

    if (readError) throw readError

    const currentType = current?.user_type ?? null

    if (currentType === 'admin') {
      return res.status(403).json({ error: 'Admins cannot self-demote to CBO' })
    }

    if (currentType === 'cbo') {
      return res.json({ success: true })
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ user_type: 'cbo' })
      .eq('id', clerkUserId)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating user type to cbo:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
