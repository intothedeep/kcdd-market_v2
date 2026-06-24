-- Phase A6 / A6-S1 — Slack notification queue
-- Service-role-only writes (enqueueSlackAlert helper). NO public RLS policies
-- by design (matches stripe_events pattern documented in CLAUDE.md).
--
-- Dedupe strategy: dedupe_key UNIQUE WHERE status='pending'. Multiple
-- enqueue calls for the same (event, entity, actor) UPSERT to a single
-- pending row that the 5-min cron flushes.

CREATE TABLE IF NOT EXISTS slack_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'admin',
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  attempt_count INT NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_slack_queue_status_queued
  ON slack_notification_queue (status, queued_at);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_slack_queue_pending_dedupe
  ON slack_notification_queue (dedupe_key) WHERE status = 'pending';

ALTER TABLE slack_notification_queue ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE slack_notification_queue IS
  'A6-S1 / Phase A6 — Slack notification batching queue. Service-role-only writes (enqueueSlackAlert), no public RLS policies (matches stripe_events pattern per CLAUDE.md). 5-min cron flush.';
