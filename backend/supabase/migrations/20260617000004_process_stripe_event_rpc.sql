-- Migration: process_stripe_event_* RPCs (Hotfix H3-B + H3-C)
-- Branch: feat/post-launch-feedback
--
-- Goal: Make webhook handlers idempotent + atomic. The previous code
-- INSERTed into stripe_events FIRST (as a dedup record), then performed
-- side-effects. If a side-effect crashed mid-handler, the dedup row was
-- already committed and Stripe's retry was discarded — silent money
-- tracking failure.
--
-- Decision: per-handler SECURITY DEFINER RPC that performs (a) the
-- side-effect DB writes and (b) the stripe_events INSERT in ONE
-- transaction. If any write fails, both roll back, and Stripe's retry
-- gets a clean second chance.
--
-- Receipt email and Stripe API calls remain OUTSIDE these RPCs — they
-- are network operations that cannot participate in a Postgres
-- transaction. Stripe retry duplicating an email is acceptable; missing
-- money tracking is not.
--
-- Dedup contract: on stripe_events PK violation, the RPC raises with
-- ERRCODE 23505 — the JS caller treats that as "already processed, send
-- 200 duplicate" rather than retry-friendly 5xx.

BEGIN;

-- ============================================================
-- 1. payment_intent.succeeded
-- ============================================================
-- Caller responsibilities (OUTSIDE the txn):
--   - Generate the tax receipt PDF (network + storage upload)
--   - Send any donor notifications
-- These are intentionally non-transactional so a successful payment is
-- not blocked by a flaky receipt generator.
CREATE OR REPLACE FUNCTION public.process_payment_succeeded(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_amount_cents INTEGER,
  p_charge_id TEXT,
  p_request_id UUID,
  p_campaign_id UUID,
  p_organization_id TEXT,
  p_donor_id TEXT,
  p_lifecycle_entry JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount_dollars NUMERIC := p_amount_cents::NUMERIC / 100;
BEGIN
  -- 1. payment_transactions: mark succeeded + record charge id.
  UPDATE payment_transactions
  SET status = 'succeeded',
      stripe_charge_id = p_charge_id,
      completed_at = NOW()
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  -- 2. Request donation: mark claimed + notify the org.
  IF p_request_id IS NOT NULL THEN
    UPDATE requests
    SET status = 'claimed',
        claimed_at = NOW(),
        donor_id = p_donor_id
    WHERE id = p_request_id;

    INSERT INTO request_notifications (
      request_id, notification_type, title, message, recipient_id
    ) VALUES (
      p_request_id,
      'claimed',
      'Donation Received!',
      'A donor has claimed your request with a $' || to_char(v_amount_dollars, 'FM999999990.00') || ' donation.',
      p_organization_id
    );
  END IF;

  -- 3. Campaign donation: bump amount_raised + supporters_count.
  IF p_campaign_id IS NOT NULL THEN
    UPDATE campaigns
    SET amount_raised = COALESCE(amount_raised, 0) + v_amount_dollars,
        supporters_count = COALESCE(supporters_count, 0) + 1
    WHERE id = p_campaign_id;
  END IF;

  -- 4. Lifecycle audit on payment_transactions.metadata.
  UPDATE payment_transactions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifecycle}',
    (COALESCE(metadata->'lifecycle', '[]'::jsonb) || p_lifecycle_entry),
    true
  )
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  -- 5. Dedup row LAST. If a duplicate delivery raced and already wrote
  --    this id, the PK violation rolls back the entire txn — but the
  --    other delivery's side-effects are already committed by then, so
  --    a duplicate run is the safe outcome.
  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_succeeded(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_succeeded(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, UUID, UUID, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 2. payment_intent.payment_failed
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_payment_failed(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_error_message TEXT,
  p_lifecycle_entry JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE payment_transactions
  SET status = 'failed',
      error_message = p_error_message
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  UPDATE payment_transactions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifecycle}',
    (COALESCE(metadata->'lifecycle', '[]'::jsonb) || p_lifecycle_entry),
    true
  )
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_failed(TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_failed(TEXT, TEXT, JSONB, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 3. charge.refunded
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_charge_refunded(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_charge_id TEXT,
  p_new_status TEXT,
  p_lifecycle_entry JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE payment_transactions
  SET status = p_new_status
  WHERE stripe_charge_id = p_charge_id;

  UPDATE payment_transactions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifecycle}',
    (COALESCE(metadata->'lifecycle', '[]'::jsonb) || p_lifecycle_entry),
    true
  )
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_charge_refunded(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_charge_refunded(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ============================================================
-- 4. charge.dispute.closed (H3-C: partial-dispute branching)
-- ============================================================
-- p_is_full_dispute: caller computes this OUTSIDE the txn from
-- (dispute.amount === original_charge.amount). On TRUE, decrement
-- supporters_count by 1 in addition to amount_raised. On FALSE, only
-- decrement amount_raised — supporters_count stays put.
-- p_original_amount_cents: stamped into the lifecycle entry for audit.
CREATE OR REPLACE FUNCTION public.process_dispute_closed(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_dispute_amount_cents INTEGER,
  p_new_status TEXT,
  p_is_dispute_lost BOOLEAN,
  p_is_full_dispute BOOLEAN,
  p_lifecycle_entry JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount_dollars NUMERIC := p_dispute_amount_cents::NUMERIC / 100;
  v_campaign_id UUID;
BEGIN
  UPDATE payment_transactions
  SET status = p_new_status
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  IF p_is_dispute_lost THEN
    SELECT campaign_id INTO v_campaign_id
    FROM payment_transactions
    WHERE stripe_payment_intent_id = p_payment_intent_id;

    IF v_campaign_id IS NOT NULL THEN
      IF p_is_full_dispute THEN
        UPDATE campaigns
        SET amount_raised = GREATEST(0, COALESCE(amount_raised, 0) - v_amount_dollars),
            supporters_count = GREATEST(0, COALESCE(supporters_count, 0) - 1)
        WHERE id = v_campaign_id;
      ELSE
        -- Partial dispute: refund money but keep the donor in the
        -- supporters count (they did give SOME money successfully).
        UPDATE campaigns
        SET amount_raised = GREATEST(0, COALESCE(amount_raised, 0) - v_amount_dollars)
        WHERE id = v_campaign_id;
      END IF;
    END IF;
  END IF;

  UPDATE payment_transactions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifecycle}',
    (COALESCE(metadata->'lifecycle', '[]'::jsonb) || p_lifecycle_entry),
    true
  )
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_dispute_closed(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, BOOLEAN, BOOLEAN, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispute_closed(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, BOOLEAN, BOOLEAN, JSONB) TO service_role;

COMMIT;
