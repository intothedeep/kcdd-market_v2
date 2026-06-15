-- ============================================================
-- notifications — in-app notification inbox (v0)
-- ============================================================
-- Branch: feat/post-launch-feedback
-- Phase A, Tasks A9 + A4a (dispatch brief:
-- _docs/00.post-launch-feedback.tasks.md)
--
-- Locked decisions:
--   D4 — in-app notifications only for v0. No realtime, no email,
--        no push. Polling is the client transport.
--   A4a (architect 2026-06-15) — schema additions for payload-free
--        routing:
--          * link_url      — click-through target the inbox renders.
--          * entity_type   — domain bucket, e.g. 'campaign',
--                            'campaign_revision'.
--          * entity_id     — UUID of the referenced entity so the
--                            inbox does not need to read payload.
--          * dedupe_key    — synthesized
--                            'kind:entity_id:revision_number' to
--                            gate duplicate emits at INSERT time.
--
-- Out of scope (deferred / explicit non-goals):
--   * No `severity` column — architect deferred until UX surfaces it.
--   * No realtime channel, no email/SMS fan-out.
--   * No legacy `request_notifications` column — that lives on the
--     old table; this is a separate inbox table.
--   * Backend state-machine module, route handlers, frontend
--     inbox component, tests — all separate dispatches.
--
-- RLS model:
--   * Recipient (matched via public.clerk_user_id() — TEXT, set by
--     20260518000000_clerk_user_id_text.sql) can SELECT their own
--     rows and UPDATE their own rows. Column-level restriction to
--     `read_at`-only updates is enforced by the backend route, not
--     by RLS (Postgres RLS cannot scope WITH CHECK to a column set).
--   * Writes (INSERT/UPDATE/DELETE) are reserved to service_role —
--     the state-machine module is the only writer.
--   * service_role bypasses RLS implicitly; the explicit ALL policy
--     documents intent and keeps psql-level inspection honest.

BEGIN;

-- =============================================
-- 1. CREATE TABLE notifications
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_clerk_user_id  TEXT NOT NULL,
  kind                     TEXT NOT NULL,
  payload                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  link_url                 TEXT,                                   -- A4a: click-through target
  entity_type              TEXT,                                   -- A4a: e.g. 'campaign', 'campaign_revision'
  entity_id                UUID,                                   -- A4a: payload-free routing
  dedupe_key               TEXT,                                   -- A4a: 'kind:entity_id:revision_number'
  read_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES
-- =============================================
-- Inbox query: recipient's rows, newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at
  ON notifications (recipient_clerk_user_id, created_at DESC);

-- Unread count / unread inbox filter (partial index, hot path).
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications (recipient_clerk_user_id)
  WHERE read_at IS NULL;

-- Dedup gate: prevents duplicate emits per recipient + dedupe_key.
-- Partial UNIQUE so legacy / dedupe-key-less rows do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_recipient_dedupe_key
  ON notifications (recipient_clerk_user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- =============================================
-- 3. RLS
-- =============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: recipient (TEXT match) or service_role.
CREATE POLICY "notifications_select_owner"
  ON notifications
  FOR SELECT
  USING (
    recipient_clerk_user_id = public.clerk_user_id()
    OR auth.role() = 'service_role'
  );

-- UPDATE: recipient may mark-as-read on their own rows. RLS cannot
-- restrict WITH CHECK to a specific column (read_at); the backend
-- route is the column-level gate.
CREATE POLICY "notifications_update_owner_read_at"
  ON notifications
  FOR UPDATE
  USING (
    recipient_clerk_user_id = public.clerk_user_id()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    recipient_clerk_user_id = public.clerk_user_id()
    OR auth.role() = 'service_role'
  );

-- INSERT / UPDATE / DELETE: service_role only. State-machine module
-- is the sole writer. This policy is additive to the UPDATE policy
-- above; service_role bypasses RLS implicitly either way.
CREATE POLICY "notifications_write_service_role"
  ON notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
