-- Migration: Rename campaign_revisions -> campaign_details (Phase REFA, Task REFA1)
-- Branch: feat/post-launch-feedback
--
-- USER LOCK 2026-06-15 22:01:
--   - Keep JSONB content (NOT a normalization; just rename).
--   - snapshot         -> content
--   - revision_number  -> version
--   - approval_status  -> status   (ONLY on campaign_details, NOT on campaigns)
--
-- Side effect: closes A12 follow-up by adding the deferred FK
--   campaigns.published_detail_id -> campaign_details(id) ON DELETE SET NULL.
--
-- Scope: this migration touches only the rename, constraint/index renames,
-- the FK, and one new composite index. No data shape changes, no column drops
-- (cleanup is REFA6), no backend / frontend / seed.sql edits (REFA2-5).

BEGIN;

-- =============================================
-- 1. RENAME TABLE
-- =============================================
ALTER TABLE campaign_revisions RENAME TO campaign_details;

-- =============================================
-- 2. RENAME COLUMNS
-- =============================================
ALTER TABLE campaign_details RENAME COLUMN snapshot        TO content;
ALTER TABLE campaign_details RENAME COLUMN revision_number TO version;
ALTER TABLE campaign_details RENAME COLUMN approval_status TO status;

-- =============================================
-- 3. RENAME POLICIES
-- =============================================
ALTER POLICY "revisions_select_owner_or_admin" ON campaign_details
  RENAME TO "details_select_owner_or_admin";
ALTER POLICY "revisions_write_service_role" ON campaign_details
  RENAME TO "details_write_service_role";

-- =============================================
-- 4. RENAME CONSTRAINTS
-- =============================================
-- Named UNIQUE constraint (does NOT auto-rename on table rename).
ALTER TABLE campaign_details
  RENAME CONSTRAINT campaign_revisions_campaign_revnum_unique
  TO campaign_details_campaign_version_unique;

-- Primary key constraint (auto-named campaign_revisions_pkey on table create;
-- Postgres does NOT auto-rename on RENAME TABLE).
ALTER TABLE campaign_details
  RENAME CONSTRAINT campaign_revisions_pkey
  TO campaign_details_pkey;

-- FK from campaign_details.campaign_id -> campaigns(id).
ALTER TABLE campaign_details
  RENAME CONSTRAINT campaign_revisions_campaign_id_fkey
  TO campaign_details_campaign_id_fkey;

-- Auto-named CHECK constraint on the former `approval_status` column.
-- Postgres typically auto-adjusts the prefix on RENAME TABLE, yielding
-- `campaign_details_approval_status_check`. We do the rename inside a
-- DO block so it tolerates either prefix shape and is idempotent.
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'campaign_details'::regclass
    AND contype  = 'c'
    AND conname LIKE '%approval_status_check';

  IF v_conname IS NOT NULL AND v_conname <> 'campaign_details_status_check' THEN
    EXECUTE format(
      'ALTER TABLE campaign_details RENAME CONSTRAINT %I TO campaign_details_status_check',
      v_conname
    );
  END IF;
END $$;

-- =============================================
-- 5. RENAME INDEXES
-- =============================================
ALTER INDEX idx_campaign_revisions_campaign_id_created_at
  RENAME TO idx_campaign_details_campaign_id_created_at;
ALTER INDEX idx_campaign_revisions_pending
  RENAME TO idx_campaign_details_pending;

-- =============================================
-- 6. RENAME campaigns.published_revision_id -> published_detail_id
-- =============================================
ALTER TABLE campaigns
  RENAME COLUMN published_revision_id TO published_detail_id;

ALTER INDEX idx_campaigns_published_revision_id
  RENAME TO idx_campaigns_published_detail_id;

-- =============================================
-- 7. ADD FK CONSTRAINT (closes A12 follow-up)
-- =============================================
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_published_detail_id_fkey
  FOREIGN KEY (published_detail_id)
  REFERENCES campaign_details(id)
  ON DELETE SET NULL;

-- =============================================
-- 8. NEW QUERY-PATTERN INDEX
-- =============================================
-- Supports "approved detail / latest pending detail" lookups:
-- WHERE campaign_id = $1 AND status = $2 ORDER BY version DESC LIMIT 1.
CREATE INDEX IF NOT EXISTS idx_campaign_details_campaign_status_version
  ON campaign_details (campaign_id, status, version DESC);

COMMIT;
