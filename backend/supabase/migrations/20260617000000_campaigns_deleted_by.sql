-- ============================================================
-- SOFT-DEL.1 — campaigns.deleted_by audit column
-- ============================================================
-- Architect (Post-Wave-2) follow-up R1: soft-delete already records
-- WHEN a campaign was deleted (`deleted_at`), but loses WHO performed
-- the action.  Add a sibling text column that stamps the caller's
-- Clerk user id at soft-delete time, matching the existing
-- `clerk_user_id TEXT` pattern used across the schema.
--
-- Semantics:
--   * Soft-delete  → set `deleted_by = <caller clerk id>`
--   * Restore      → reset both `deleted_at` and `deleted_by` to NULL
--                    (the row is no longer in a deleted state;
--                    restore audit lives in `admin_activity_log`,
--                    not in row-level state).
--
-- No default, no backfill: rows that were soft-deleted before this
-- migration legitimately carry NULL (auditor cannot retroactively
-- attribute action they did not capture at the time).
-- No index: admin-only surface, never filtered or joined on.
-- ============================================================

BEGIN;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL;

COMMIT;
