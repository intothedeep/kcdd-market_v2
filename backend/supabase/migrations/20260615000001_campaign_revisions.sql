-- Migration: campaign_revisions table
-- Branch: feat/post-launch-feedback
-- Phase A, Task A2 (dispatch brief: _docs/00.post-launch-feedback.dispatch.md)
-- Locked decisions:
--   D1 — snapshot is full row JSONB (not patch / diff).
--   D5 — append-only revision log, UNIQUE(campaign_id, revision_number).
-- Out of scope: campaigns table changes (A1), routes, FK on campaigns.published_revision_id (A3).

BEGIN;

-- =============================================
-- 1. CREATE TABLE campaign_revisions
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_by TEXT NOT NULL,
  change_summary TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending_initial_approval'
    CHECK (approval_status IN (
      'pending_initial_approval',
      'pending_edit_approval',
      'approved',
      'rejected'
    )),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_revisions_campaign_revnum_unique
    UNIQUE (campaign_id, revision_number)
);

-- =============================================
-- 2. INDEXES
-- =============================================
-- History lookup: revisions per campaign, newest first.
CREATE INDEX IF NOT EXISTS idx_campaign_revisions_campaign_id_created_at
  ON campaign_revisions (campaign_id, created_at DESC);

-- Admin pending-edits queue (hot path, partial index).
CREATE INDEX IF NOT EXISTS idx_campaign_revisions_pending
  ON campaign_revisions (approval_status)
  WHERE approval_status IN ('pending_initial_approval', 'pending_edit_approval');

-- =============================================
-- 3. RLS
-- =============================================
ALTER TABLE campaign_revisions ENABLE ROW LEVEL SECURITY;

-- SELECT: org owner of the parent campaign OR admin user.
-- This codebase keys organizations.user_id and user_profiles.id by TEXT
-- (Clerk user ID), reconciled by 20260518000000_clerk_user_id_text.sql.
-- We use public.clerk_user_id() rather than auth.uid() so that TEXT = TEXT
-- comparisons hold. service_role bypasses RLS implicitly; the explicit write
-- policy below documents intent.
CREATE POLICY "revisions_select_owner_or_admin"
  ON campaign_revisions
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM campaigns c
      JOIN organizations o ON o.id = c.organization_id
      WHERE c.id = campaign_revisions.campaign_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = public.clerk_user_id()
        AND up.user_type = 'admin'
    )
  );

-- INSERT / UPDATE / DELETE: service_role only (backend routes write here).
CREATE POLICY "revisions_write_service_role"
  ON campaign_revisions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 4. BACKFILL
-- =============================================
-- Seed one revision per existing campaign so every campaign owns rev #1.
-- snapshot = to_jsonb(c.*): full row, schema-drift safe (D1 lock).
-- changed_by falls back to 'system' when campaigns.created_by is NULL.
-- approval_status = 'approved' because existing rows pre-date the workflow.
INSERT INTO campaign_revisions (
  campaign_id,
  revision_number,
  snapshot,
  changed_by,
  approval_status,
  approved_by,
  approved_at,
  created_at
)
SELECT
  c.id,
  1,
  to_jsonb(c.*),
  COALESCE(c.created_by, 'system'),
  'approved',
  'system',
  c.created_at,
  c.created_at
FROM campaigns c
ON CONFLICT (campaign_id, revision_number) DO NOTHING;

-- Backfill campaigns.published_revision_id to point at the seed revision.
-- Without this, every legacy campaign keeps published_revision_id = NULL
-- after the migration, and the public-page render path (planned for A7)
-- would have no snapshot to read.
UPDATE campaigns c
SET published_revision_id = r.id
FROM campaign_revisions r
WHERE r.campaign_id = c.id
  AND r.revision_number = 1
  AND c.published_revision_id IS NULL;

COMMIT;
