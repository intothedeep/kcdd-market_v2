-- ============================================================
-- A14.1 — CHECK constraint: campaign_details.content funding_goal typeof
-- ============================================================
-- Architect (2026-06-16) follow-up to A14: while the required-keys
-- constraint (20260616000004) guarantees the three keys exist, it
-- does NOT enforce JSON types. A buggy route could persist
-- `funding_goal = "abc"` (string) which the public detail page's
-- progress bar denominator cannot use as a number.
--
-- This migration narrows enforcement to `funding_goal` ONLY, per
-- user decision (Wave 3 lock 2026-06-16):
--
--   * funding_goal MUST be a JSON number.
--   * title and contact_email type checks are intentionally NOT
--     added here — the formatter is the current guard there.
--
-- All 9 existing seed rows already store `funding_goal` as a JSON
-- number, so the constraint applies cleanly without backfill.
-- ============================================================

BEGIN;

ALTER TABLE campaign_details
  ADD CONSTRAINT campaign_details_content_funding_goal_typeof
  CHECK (
    jsonb_typeof(content->'funding_goal') = 'number'
  );

COMMIT;
