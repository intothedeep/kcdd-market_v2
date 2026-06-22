-- Migration: append_lifecycle RPC (Hotfix H3-A)
-- Branch: feat/post-launch-feedback
--
-- Goal: Replace the SELECT-merge-UPDATE pattern in
-- backend/api/helpers/paymentMetadata.js::appendLifecycle with a single
-- atomic statement. Concurrent Stripe webhook deliveries against the same
-- payment_intent (e.g. payment_intent.succeeded + charge.refunded ~50ms
-- apart) currently race; the loser's lifecycle entry is silently
-- clobbered. Postgres MVCC + jsonb_set in a single UPDATE guarantees
-- both events are preserved.
--
-- Decision: Option C (RPC + SECURITY DEFINER), locked by architect.
-- Mirrors the existing campaign_has_approved_detail helper pattern.
--
-- Lookup key: stripe_payment_intent_id (TEXT, UNIQUE on payment_transactions).
-- The JS caller signature is (supabase, stripePaymentIntentId, entry) so we
-- keep that key here rather than the row's UUID id.

BEGIN;

CREATE OR REPLACE FUNCTION public.append_lifecycle(
  p_stripe_payment_intent_id TEXT,
  p_event JSONB
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE payment_transactions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifecycle}',
    (COALESCE(metadata->'lifecycle', '[]'::jsonb) || p_event),
    true
  )
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id;
$$;

REVOKE ALL ON FUNCTION public.append_lifecycle(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_lifecycle(TEXT, JSONB) TO service_role;

COMMIT;
