-- Migration: wire payment_event_log into the 4 process_stripe_event_* RPCs
-- Branch: feat/payment-logging-reconciliation
--
-- Two additions to each of the 4 webhook RPCs:
--   (a) new LAST param `p_log_row JSONB DEFAULT NULL`. When non-null, exactly
--       one row is appended to public.payment_event_log inside the SAME txn,
--       BEFORE the final stripe_events PK-dedup INSERT, so a duplicate Stripe
--       delivery rolls the audit row back too (no duplicate audit rows).
--   (b) Changing arity creates a new overload, so we DROP the exact old
--       signature first (idempotent via IF EXISTS), then recreate. REVOKE/GRANT
--       re-issued for the new signature.
--
-- Plus a concurrency fix in process_payment_succeeded: the request claim now
-- guards on status='open' (conditional claim). Losing the race marks the
-- transaction pending_auto_refund instead of double-claiming + notifying.

BEGIN;

-- ============================================================
-- 1. payment_intent.succeeded
-- ============================================================
DROP FUNCTION IF EXISTS public.process_payment_succeeded(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, UUID, UUID, TEXT, TEXT, JSONB);

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
  p_lifecycle_entry JSONB,
  p_log_row JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount_dollars NUMERIC := p_amount_cents::NUMERIC / 100;
  v_claimed_id UUID;
BEGIN
  -- 1. payment_transactions: mark succeeded + record charge id.
  UPDATE payment_transactions
  SET status = 'succeeded',
      stripe_charge_id = p_charge_id,
      completed_at = NOW()
  WHERE stripe_payment_intent_id = p_payment_intent_id;

  -- 2. Request donation: conditional claim (only if still open) + notify org.
  IF p_request_id IS NOT NULL THEN
    UPDATE requests
    SET status = 'claimed',
        claimed_at = NOW(),
        donor_id = p_donor_id
    WHERE id = p_request_id AND status = 'open'
    RETURNING id INTO v_claimed_id;

    IF v_claimed_id IS NULL THEN
      -- Lost the race: this request was already claimed by another payment.
      -- Mark this transaction for auto-refund and do NOT notify the org.
      UPDATE payment_transactions
      SET status = 'pending_auto_refund',
          error_message = 'Request already claimed; queued for auto-refund'
      WHERE stripe_payment_intent_id = p_payment_intent_id;
    ELSE
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

  -- 4b. Unified payment event log (same txn — rolls back on dedup conflict).
  IF p_log_row IS NOT NULL THEN
    INSERT INTO public.payment_event_log (event_type, outcome, stripe_event_id, stripe_payment_intent_id, stripe_charge_id, error_code, error_message, amount_cents, target_kind, request_id, campaign_id, organization_id, actor_clerk_user_id, source, backend_version, context)
    SELECT p_log_row->>'event_type', p_log_row->>'outcome', p_log_row->>'stripe_event_id', p_log_row->>'stripe_payment_intent_id', p_log_row->>'stripe_charge_id', p_log_row->>'error_code', p_log_row->>'error_message', (p_log_row->>'amount_cents')::INTEGER, p_log_row->>'target_kind', (p_log_row->>'request_id')::UUID, (p_log_row->>'campaign_id')::UUID, p_log_row->>'organization_id', p_log_row->>'actor_clerk_user_id', p_log_row->>'source', p_log_row->>'backend_version', p_log_row->'context';
  END IF;

  -- 5. Dedup row LAST.
  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_succeeded(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, UUID, UUID, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_succeeded(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, UUID, UUID, TEXT, TEXT, JSONB, JSONB) TO service_role;

-- ============================================================
-- 2. payment_intent.payment_failed
-- ============================================================
DROP FUNCTION IF EXISTS public.process_payment_failed(TEXT, TEXT, JSONB, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.process_payment_failed(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_error_message TEXT,
  p_lifecycle_entry JSONB,
  p_log_row JSONB DEFAULT NULL
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

  IF p_log_row IS NOT NULL THEN
    INSERT INTO public.payment_event_log (event_type, outcome, stripe_event_id, stripe_payment_intent_id, stripe_charge_id, error_code, error_message, amount_cents, target_kind, request_id, campaign_id, organization_id, actor_clerk_user_id, source, backend_version, context)
    SELECT p_log_row->>'event_type', p_log_row->>'outcome', p_log_row->>'stripe_event_id', p_log_row->>'stripe_payment_intent_id', p_log_row->>'stripe_charge_id', p_log_row->>'error_code', p_log_row->>'error_message', (p_log_row->>'amount_cents')::INTEGER, p_log_row->>'target_kind', (p_log_row->>'request_id')::UUID, (p_log_row->>'campaign_id')::UUID, p_log_row->>'organization_id', p_log_row->>'actor_clerk_user_id', p_log_row->>'source', p_log_row->>'backend_version', p_log_row->'context';
  END IF;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_payment_failed(TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_failed(TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, JSONB) TO service_role;

-- ============================================================
-- 3. charge.refunded
-- ============================================================
DROP FUNCTION IF EXISTS public.process_charge_refunded(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.process_charge_refunded(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_charge_id TEXT,
  p_new_status TEXT,
  p_lifecycle_entry JSONB,
  p_log_row JSONB DEFAULT NULL
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

  IF p_log_row IS NOT NULL THEN
    INSERT INTO public.payment_event_log (event_type, outcome, stripe_event_id, stripe_payment_intent_id, stripe_charge_id, error_code, error_message, amount_cents, target_kind, request_id, campaign_id, organization_id, actor_clerk_user_id, source, backend_version, context)
    SELECT p_log_row->>'event_type', p_log_row->>'outcome', p_log_row->>'stripe_event_id', p_log_row->>'stripe_payment_intent_id', p_log_row->>'stripe_charge_id', p_log_row->>'error_code', p_log_row->>'error_message', (p_log_row->>'amount_cents')::INTEGER, p_log_row->>'target_kind', (p_log_row->>'request_id')::UUID, (p_log_row->>'campaign_id')::UUID, p_log_row->>'organization_id', p_log_row->>'actor_clerk_user_id', p_log_row->>'source', p_log_row->>'backend_version', p_log_row->'context';
  END IF;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_charge_refunded(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_charge_refunded(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB, JSONB) TO service_role;

-- ============================================================
-- 4. charge.dispute.closed
-- ============================================================
DROP FUNCTION IF EXISTS public.process_dispute_closed(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, BOOLEAN, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION public.process_dispute_closed(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_payment_intent_id TEXT,
  p_dispute_amount_cents INTEGER,
  p_new_status TEXT,
  p_is_dispute_lost BOOLEAN,
  p_is_full_dispute BOOLEAN,
  p_lifecycle_entry JSONB,
  p_log_row JSONB DEFAULT NULL
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

  IF p_log_row IS NOT NULL THEN
    INSERT INTO public.payment_event_log (event_type, outcome, stripe_event_id, stripe_payment_intent_id, stripe_charge_id, error_code, error_message, amount_cents, target_kind, request_id, campaign_id, organization_id, actor_clerk_user_id, source, backend_version, context)
    SELECT p_log_row->>'event_type', p_log_row->>'outcome', p_log_row->>'stripe_event_id', p_log_row->>'stripe_payment_intent_id', p_log_row->>'stripe_charge_id', p_log_row->>'error_code', p_log_row->>'error_message', (p_log_row->>'amount_cents')::INTEGER, p_log_row->>'target_kind', (p_log_row->>'request_id')::UUID, (p_log_row->>'campaign_id')::UUID, p_log_row->>'organization_id', p_log_row->>'actor_clerk_user_id', p_log_row->>'source', p_log_row->>'backend_version', p_log_row->'context';
  END IF;

  INSERT INTO stripe_events (event_id, event_type, payload)
  VALUES (p_event_id, p_event_type, p_payload);
END;
$$;

REVOKE ALL ON FUNCTION public.process_dispute_closed(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, BOOLEAN, BOOLEAN, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispute_closed(TEXT, TEXT, JSONB, TEXT, INTEGER, TEXT, BOOLEAN, BOOLEAN, JSONB, JSONB) TO service_role;

COMMIT;
