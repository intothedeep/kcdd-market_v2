-- ============================================================
-- A14 — CHECK constraint: campaign_details.content required keys
-- ============================================================
-- Architect (2026-06-15) flagged the only real weakness of the JSONB
-- content store in Design A: the column schema accepts any shape,
-- so a malformed insert/update could land an "approved" detail row
-- that the public campaign page cannot render.
--
-- This migration adds a minimal CHECK constraint that enforces the
-- three keys the public detail page needs to render at minimum:
--
--   * title          — page heading
--   * funding_goal   — progress bar denominator
--   * contact_email  — required for public contact UI
--
-- Note on `slug`: identity lives on `campaigns.slug` (campaign-level,
-- never changes per detail revision), so it is intentionally NOT a
-- required content key.
--
-- All 9 existing seed rows (5 approved v1 + 1 pending v2 + 2 pending
-- v1 + 1 soft-deleted approved) already carry these three keys, so
-- the constraint applies cleanly without backfill.
-- ============================================================

BEGIN;

ALTER TABLE campaign_details
  ADD CONSTRAINT campaign_details_content_required_keys
  CHECK (
    content ? 'title'
    AND content ? 'funding_goal'
    AND content ? 'contact_email'
  );

COMMIT;
