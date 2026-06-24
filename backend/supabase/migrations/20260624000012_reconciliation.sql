BEGIN;

CREATE TABLE public.reconciliation_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_from      TIMESTAMPTZ NOT NULL,
  window_to        TIMESTAMPTZ NOT NULL,
  triggered_by     TEXT NOT NULL,
  trigger_source   TEXT NOT NULL DEFAULT 'admin',
  status           TEXT NOT NULL DEFAULT 'running',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  stripe_count     INTEGER DEFAULT 0,
  local_count      INTEGER DEFAULT 0,
  matched_count    INTEGER DEFAULT 0,
  discrepancy_count INTEGER DEFAULT 0,
  error_message    TEXT
);

CREATE TABLE public.reconciliation_discrepancies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES public.reconciliation_runs(id) ON DELETE CASCADE,
  payment_intent_id TEXT,
  charge_id        TEXT,
  type             TEXT NOT NULL,
  our_value        TEXT,
  stripe_value     TEXT,
  detail           JSONB,
  resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by      TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_disc_run     ON public.reconciliation_discrepancies (run_id);
CREATE INDEX idx_recon_disc_pi      ON public.reconciliation_discrepancies (payment_intent_id);
CREATE INDEX idx_recon_runs_started ON public.reconciliation_runs (started_at DESC);

ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_discrepancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY recon_runs_admin_read ON public.reconciliation_runs
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = public.clerk_user_id() AND user_type = 'admin'));

CREATE POLICY recon_disc_admin_read ON public.reconciliation_discrepancies
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = public.clerk_user_id() AND user_type = 'admin'));

COMMENT ON TABLE public.reconciliation_runs IS 'Service-role write only (no write policy by design); admin read via RLS.';
COMMENT ON TABLE public.reconciliation_discrepancies IS 'Service-role write only (no write policy by design); admin read via RLS.';

COMMIT;
