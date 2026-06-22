import crypto from 'crypto'

const SALT = process.env.IP_HASH_SALT || 'dev-only-replace-in-prod'

export function hashIp(ip) {
  if (!ip) return null
  return crypto
    .createHash('sha256')
    .update(ip + SALT)
    .digest('hex')
    .slice(0, 16)
}

// Builds the metadata JSONB written to payment_transactions on INSERT.
// Never includes card data, raw IP, session tokens, or other PII.
export function buildPaymentMetadata({ paymentIntent, kind, targetSnapshot, req, donorId }) {
  const now = new Date().toISOString()
  // Campaign route allows anonymous donations and does not run clerkAuth,
  // so req.auth.userId is undefined there. Fall back to the explicit donorId
  // arg (sourced from the request body in that path) when JWT is absent.
  const clerkUserIdAtIntent = req?.auth?.userId || donorId || null
  return {
    stripe: {
      payment_intent: paymentIntent,
      last_charge_id: null,
      last_event_id: null,
    },
    lifecycle: [{ at: now, event: 'intent_created' }],
    target: { kind, ...targetSnapshot },
    client: {
      user_agent: req?.headers?.['user-agent'] || null,
      ip_hash: hashIp(req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()),
      clerk_user_id_at_intent: clerkUserIdAtIntent,
    },
    diagnostics: {
      backend_version: process.env.GIT_SHA || 'unknown',
      stripe_api_version: paymentIntent?.api_version || null,
      bypass_connect: process.env.STRIPE_BYPASS_CONNECT === 'true',
    },
  }
}

// Append a single lifecycle event onto an existing payment_transactions row.
// Atomic via SECURITY DEFINER RPC (public.append_lifecycle) — see
// backend/supabase/migrations/20260617000002_append_lifecycle_rpc.sql.
// Replaces the prior SELECT-merge-UPDATE pattern which lost concurrent
// appends (Stripe can deliver two webhooks for the same PI ~50ms apart).
//
// Signature preserved: (supabase, stripePaymentIntentId, entry). Errors
// are logged but not thrown — lifecycle is an audit log; the caller's
// money-tracking writes are the source of truth and must not be blocked
// by an audit failure.
export async function appendLifecycle(supabase, stripePaymentIntentId, entry) {
  const { error } = await supabase.rpc('append_lifecycle', {
    p_stripe_payment_intent_id: stripePaymentIntentId,
    p_event: entry,
  })
  if (error) {
    console.error('appendLifecycle RPC failed:', {
      stripePaymentIntentId,
      error: error.message,
    })
  }
}
