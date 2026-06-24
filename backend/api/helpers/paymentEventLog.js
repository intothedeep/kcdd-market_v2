// Unified payment audit logging. A single INSERT into public.payment_event_log.
//
// This function MUST NEVER throw — audit logging is a side channel and a
// failure here must never break the request/webhook money path. All errors
// are swallowed and logged to console.
//
// backend_version is stamped here (process.env.GIT_SHA) so callers never
// have to pass it.
export async function logPaymentEvent(supabase, row) {
  try {
    const { error } = await supabase.from('payment_event_log').insert({
      event_type: row.event_type,
      outcome: row.outcome ?? null,
      source: row.source,
      stripe_event_id: row.stripe_event_id ?? null,
      stripe_payment_intent_id: row.stripe_payment_intent_id ?? null,
      stripe_charge_id: row.stripe_charge_id ?? null,
      error_code: row.error_code ?? null,
      error_message: row.error_message ?? null,
      amount_cents: row.amount_cents ?? null,
      currency: row.currency ?? null,
      target_kind: row.target_kind ?? null,
      request_id: row.request_id ?? null,
      campaign_id: row.campaign_id ?? null,
      organization_id: row.organization_id ?? null,
      actor_clerk_user_id: row.actor_clerk_user_id ?? null,
      actor_ip_hash: row.actor_ip_hash ?? null,
      context: row.context ?? null,
      backend_version: process.env.GIT_SHA || null,
    })
    if (error) {
      console.error('logPaymentEvent INSERT failed:', error.message)
    }
  } catch (err) {
    console.error('logPaymentEvent threw (swallowed):', err?.message || err)
  }
}
