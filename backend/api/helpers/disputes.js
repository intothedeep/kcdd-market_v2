// Idempotent upsert keyed on dispute_id. Safe under PH-1 webhook replay.
export async function upsertDispute(supabase, dispute) {
  return supabase.from('stripe_disputes').upsert(
    {
      dispute_id: dispute.id,
      payment_intent_id: dispute.payment_intent,
      charge_id: dispute.charge,
      status: dispute.status,
      reason: dispute.reason,
      amount: dispute.amount,
      currency: dispute.currency || 'usd',
      evidence_due_by: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'dispute_id' }
  )
}
