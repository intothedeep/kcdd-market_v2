-- ============================================================
-- stripe_disputes — Stripe dispute (chargeback) lifecycle
-- ============================================================
-- Service-role-only auxiliary table — mirrors the stripe_events pattern from
-- 20260427000000_schema_reconcile.sql. Webhook writes via service_role;
-- admin reads via backend with service_role. Intentionally NO public RLS
-- policies — the RLS validation query should report this as
-- rls_enabled=true / policy_count=0, which is the explicit intent (NOT a
-- silent block — service_role bypasses RLS by design).
--
-- evidence_due_by is the operational hot path: missing the Stripe-supplied
-- deadline = automatic dispute loss. Hence the dedicated index.

CREATE TABLE IF NOT EXISTS stripe_disputes (
  dispute_id        TEXT PRIMARY KEY,
  payment_intent_id TEXT,                                  -- soft link, no FK
  charge_id         TEXT,
  status            TEXT NOT NULL,                         -- Stripe raw: warning_needs_response, under_review, won, lost, ...
  reason            TEXT,                                  -- Stripe raw: fraudulent, unrecognized, ...
  amount            INTEGER NOT NULL,                      -- cents
  currency          VARCHAR(3) DEFAULT 'usd',
  evidence_due_by   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stripe_disputes ENABLE ROW LEVEL SECURITY;

-- Indexes (Postgres does NOT auto-index FK-like columns).
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_payment_intent_id
  ON stripe_disputes(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_evidence_due_by
  ON stripe_disputes(evidence_due_by);
CREATE INDEX IF NOT EXISTS idx_stripe_disputes_status
  ON stripe_disputes(status);
