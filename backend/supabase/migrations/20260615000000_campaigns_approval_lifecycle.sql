-- Migration: Campaigns approval lifecycle (Phase A, Task A1)
-- Adds the approval state machine columns + edit metadata to `campaigns`.
-- Scope: campaigns table ONLY. Does NOT touch campaign_revisions (A2 lane),
-- requests, RLS policies, or routes.
--
-- Architecture refs:
--   _docs/00.post-launch-feedback.architecture.md  (D1, D5)
--   _docs/00.post-launch-feedback.dispatch.md       (A1 brief)
--
-- Notes:
--   - `published_revision_id` is added as a plain UUID column WITHOUT a FK
--     constraint. The FK to `campaign_revisions(id)` is intentionally deferred
--     to A3 to avoid a circular dependency between A1 and A2 migrations.
--   - RLS is re-confirmed (idempotent ENABLE). No policy changes — RLS
--     tightening is deferred to the A3 PR per architecture doc.

BEGIN;

-- =============================================
-- 1. ADD COLUMNS
-- =============================================
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS first_approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS last_edit_approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS requires_reapproval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_revision_id UUID NULL;

-- =============================================
-- 2. CHECK CONSTRAINT — approval_status enum (6 states, D5 lock)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'campaigns'::regclass
      AND conname  = 'campaigns_approval_status_check'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_approval_status_check
      CHECK (approval_status IN (
        'draft',
        'pending_initial_approval',
        'active',
        'pending_edit_approval',
        'rejected',
        'archived'
      ));
  END IF;
END $$;

-- =============================================
-- 3. BACKFILL existing rows
-- =============================================
-- Every pre-existing campaign is treated as already-approved. The new column
-- defaults to 'draft' for fresh rows, so we flip those legacy rows to 'active'
-- and stamp first_approved_at / last_edit_approved_at to created_at.
UPDATE campaigns
SET approval_status        = 'active',
    first_approved_at      = created_at,
    last_edit_approved_at  = created_at
WHERE approval_status = 'draft';

-- =============================================
-- 4. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_approval_status
  ON campaigns(approval_status);

CREATE INDEX IF NOT EXISTS idx_campaigns_published_revision_id
  ON campaigns(published_revision_id);

-- =============================================
-- 5. RLS RE-CONFIRM (idempotent, NO policy changes)
-- =============================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

COMMIT;
