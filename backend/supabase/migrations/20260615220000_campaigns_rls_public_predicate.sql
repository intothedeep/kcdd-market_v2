-- Migration: campaigns RLS — replace public SELECT predicate
-- Branch: feat/post-launch-feedback
-- Phase A, Task A7a (follow-up to A10 / 20260615210000_campaigns_rls_tighten.sql)
--
-- Intent:
--   A10 shipped `campaigns_select_public_active` which limits donor-visible
--   rows to `approval_status = 'active'`. That predicate is wrong for the
--   D-public-page locked decision: the public page renders from
--   `published_revision_id` regardless of approval_status. During the
--   `pending_edit_approval` state (campaign was previously approved, has a new
--   pending edit), `published_revision_id` is unchanged but the campaign
--   currently disappears from public view — that's the bug.
--
-- Locked decision (D-public-page):
--   A campaign is donor-visible iff it has ever been published — i.e., iff
--   `published_revision_id IS NOT NULL`. This covers both `active` and
--   `pending_edit_approval`. During a pending edit donors still see the
--   last-approved snapshot via `published_revision_id`, which is unchanged
--   until the admin approves the new revision.
--
-- Scope:
--   * Drops `campaigns_select_public_active` (A10 variant).
--   * Replaces it with `campaigns_select_public_published`.
--   * All other A10 policies (owner/admin SELECT, owner INSERT, owner UPDATE
--     draft-only, service_role ALL) are unchanged.

BEGIN;

-- =============================================
-- 1. DROP the strict-active variant from A10
-- =============================================
DROP POLICY IF EXISTS "campaigns_select_public_active" ON campaigns;

-- =============================================
-- 2. Re-create public SELECT keyed on published_revision_id
-- =============================================
-- A campaign is donor-visible iff it has ever been approved (i.e., has a
-- published revision). This covers both 'active' and 'pending_edit_approval'
-- — during a pending edit, donors still see the last-approved snapshot via
-- published_revision_id, which is unchanged until admin approves.
CREATE POLICY "campaigns_select_public_published"
  ON campaigns
  FOR SELECT
  USING (
    published_revision_id IS NOT NULL
    OR auth.role() = 'service_role'
  );

COMMIT;
