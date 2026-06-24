BEGIN;

CREATE TABLE public.payment_event_log (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type        TEXT NOT NULL,
  outcome           TEXT,
  stripe_event_id   TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id  TEXT,
  error_code        TEXT,
  error_message     TEXT,
  amount_cents      INTEGER,
  currency          TEXT DEFAULT 'usd',
  target_kind       TEXT,
  request_id        UUID,
  campaign_id       UUID,
  organization_id   TEXT,
  actor_clerk_user_id TEXT,
  actor_ip_hash     TEXT,
  source            TEXT NOT NULL,
  backend_version   TEXT,
  context           JSONB
);

CREATE INDEX idx_pel_payment_intent ON public.payment_event_log (stripe_payment_intent_id);
CREATE INDEX idx_pel_created_at     ON public.payment_event_log (created_at DESC);
CREATE INDEX idx_pel_event_type     ON public.payment_event_log (event_type);
CREATE INDEX idx_pel_request_id     ON public.payment_event_log (request_id);
CREATE INDEX idx_pel_campaign_id    ON public.payment_event_log (campaign_id);

ALTER TABLE public.payment_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY pel_admin_read ON public.payment_event_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = public.clerk_user_id() AND user_type = 'admin'
  ));

COMMENT ON TABLE public.payment_event_log IS
  'Canonical append-only payment trace. Service-role write only (no INSERT/UPDATE/DELETE policy by design); admin read via RLS. Includes pre-intent failures (no PI). payment_transactions.metadata.lifecycle is a per-PI convenience mirror.';

COMMIT;
