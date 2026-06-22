-- Migration: tighten RLS on campaigns
-- Branch: feat/post-launch-feedback
-- Phase A, Task A10 (dispatch brief: _docs/00.post-launch-feedback.tasks.md)
--
-- Intent:
--   The original campaigns RLS (20240303000000_support_and_documents.sql)
--   shipped a wide-open `Anyone can manage campaigns` ALL policy. That predates
--   the approval state machine (A1) and the service_role-only state-machine
--   routes committed in A3. With those routes in place, anon/authenticated
--   clients should NEVER mutate campaigns directly except for draft saves.
--
-- Locked decisions:
--   * Public SELECT is limited to approval_status = 'active'.
--   * Org owner + admin can SELECT any status (drafts/pending/rejected) so the
--     CBO dashboard and admin queue work.
--   * Org owner can INSERT a campaign for their own org.
--   * Org owner UPDATE is restricted to approval_status = 'draft'; once
--     submitted, the state-machine routes (service_role) are the only mutation
--     path.
--   * No DELETE policy — DELETE is service_role-only by absence.
--   * Explicit service_role ALL policy mirrors campaign_revisions
--     (20260615000001) to document intent.
--
-- Out of scope:
--   * campaigns table schema (A1 already shipped it).
--   * campaign_revisions policies (set in A2 / 20260615000001).
--   * Any other table's RLS.

BEGIN;

-- =============================================
-- 1. DROP the legacy wide-open policies
-- =============================================
DROP POLICY IF EXISTS "Anyone can manage campaigns" ON campaigns;
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON campaigns;

-- =============================================
-- 2. CREATE tightened policies
-- =============================================

-- 2a. Public read of active campaigns (donor-facing list/detail pages).
--     service_role short-circuit is included so backend reads behave the same
--     even though RLS is bypassed for service_role at the engine level.
CREATE POLICY "campaigns_select_public_active"
  ON campaigns
  FOR SELECT
  USING (
    approval_status = 'active'
    OR auth.role() = 'service_role'
  );

-- 2b. Owner / admin read of any status (CBO dashboard + admin queue).
--     Postgres OR-merges multiple SELECT policies, so this complements 2a
--     without overriding it.
CREATE POLICY "campaigns_select_owner_or_admin"
  ON campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = campaigns.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = public.clerk_user_id()
        AND up.user_type = 'admin'
    )
  );

-- 2c. Org owner can INSERT a campaign for their own org.
CREATE POLICY "campaigns_insert_org_owner"
  ON campaigns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = campaigns.organization_id
        AND o.user_id = public.clerk_user_id()
    )
  );

-- 2d. Org owner can UPDATE their own campaign ONLY while it's a draft.
--     Once submitted (pending_initial_approval / active / pending_edit_approval
--     / rejected / archived), the state-machine routes are the only mutation
--     path; they use service_role and are covered by 2e.
CREATE POLICY "campaigns_update_org_owner_draft_only"
  ON campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = campaigns.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    AND approval_status = 'draft'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = campaigns.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    AND approval_status = 'draft'
  );

-- 2e. Explicit service_role ALL policy. Mirrors campaign_revisions pattern
--     from 20260615000001 to document intent (service_role bypasses RLS at
--     the engine level regardless).
CREATE POLICY "campaigns_all_service_role"
  ON campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
