import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// POST /api/users/sync
// Ensures a user_profiles row exists for the authenticated Clerk user.
// Idempotent: insert-or-ignore on conflict, never overwrites an existing user_type.
// Required because new Clerk users have no auto-trigger creating their profile row,
// and downstream FK constraints (requests.donor_id, etc.) need it to exist.
router.post('/sync', async (req, res) => {
  try {
    const clerkUserId = req.auth.userId

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: clerkUserId, user_type: 'donor' }, { onConflict: 'id', ignoreDuplicates: true })

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
