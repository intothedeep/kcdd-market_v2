-- Migration: campaigns becomes metadata-only (Phase REFB)
-- Branch: feat/post-launch-feedback
--
-- Lineage:
--   A1  (20260615000000) — added approval_status + lifecycle stamps to campaigns
--   A2  (20260615000001) — campaign_revisions (later renamed to campaign_details)
--   A10 (20260615210000) — tightened campaigns RLS (includes
--                          campaigns_update_org_owner_draft_only which references
--                          approval_status)
--   A11 (20260615220000) — campaigns_select_public_published predicate
--   REFA1-REFA6 (20260616000000-02) — rename to campaign_details, drop content
--                                     columns from campaigns
--   REFB (this)         — drop approval_status / status / published_detail_id
--                         from campaigns. State is now DERIVED from
--                         campaign_details rows. Add soft-delete column.
--
-- Final surviving columns on campaigns after this migration:
--   id, organization_id, created_by, slug,
--   amount_raised, supporters_count,
--   first_approved_at, last_edited_at, last_edit_approved_at, requires_reapproval,
--   created_at, updated_at,
--   deleted_at  (NEW)
--
-- Ordering rationale:
--   1. Add deleted_at first so the new SELECT policy can reference it.
--   2. Define a SECURITY DEFINER helper to test "has an approved detail" without
--      triggering campaign_details RLS, which itself joins back to campaigns
--      and would cause infinite recursion (42P17) on policy evaluation.
--   3. Replace the public SELECT policy (drops dependency on
--      campaigns.published_detail_id).
--   4. Drop the org-owner UPDATE policy (depends on campaigns.approval_status).
--   5. Drop FK / CHECK / indexes / columns once nothing references them.

BEGIN;

-- =============================================
-- 1. ADD soft-delete column + partial index
-- =============================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_active
  ON campaigns(id) WHERE deleted_at IS NULL;

-- =============================================
-- 2. HELPER — public.campaign_has_approved_detail()
-- =============================================
-- Encapsulates "EXISTS approved campaign_details row" as a SECURITY DEFINER
-- function. Required because the equivalent EXISTS subquery in an RLS USING
-- clause re-enters campaign_details' own RLS policy, which JOINs campaigns,
-- which re-enters this campaigns policy → infinite recursion (42P17).
-- SECURITY DEFINER runs the inner SELECT with the function owner's
-- privileges, bypassing the recursion. The function is STABLE (no writes,
-- depends only on table contents within the txn) and marked LEAKPROOF=false
-- by default — fine for an internal RLS helper.
CREATE OR REPLACE FUNCTION public.campaign_has_approved_detail(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaign_details
    WHERE campaign_id = p_campaign_id
      AND status = 'approved'
  );
$$;

-- Make the helper callable from RLS contexts (anon + authenticated).
REVOKE ALL ON FUNCTION public.campaign_has_approved_detail(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.campaign_has_approved_detail(UUID) TO anon, authenticated, service_role;

-- =============================================
-- 3. REWRITE public SELECT policy on campaigns
-- =============================================
-- Old predicate keyed on `published_detail_id IS NOT NULL`. After REFB the
-- column is gone; donor-visible state is "at least one approved campaign_details
-- row exists". Also require deleted_at IS NULL so soft-deleted campaigns vanish
-- from the public surface.
DROP POLICY IF EXISTS "campaigns_select_public_published" ON campaigns;

CREATE POLICY "campaigns_select_public_published"
  ON campaigns
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      public.campaign_has_approved_detail(id)
      OR auth.role() = 'service_role'
    )
  );

-- =============================================
-- 4. DROP the org-owner UPDATE policy
-- =============================================
-- Rationale: CBO no longer mutates the campaigns row directly. Editorial
-- content lives in campaign_details; the state-machine routes (service_role)
-- own all mutations. Without an UPDATE policy, anon / authenticated cannot
-- UPDATE campaigns — exactly what we want.
DROP POLICY IF EXISTS "campaigns_update_org_owner_draft_only" ON campaigns;

-- =============================================
-- 5. DROP FK + CHECK + INDEXES + COLUMNS
-- =============================================
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_published_detail_id_fkey;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_approval_status_check;
DROP INDEX IF EXISTS idx_campaigns_approval_status;
DROP INDEX IF EXISTS idx_campaigns_published_detail_id;

ALTER TABLE campaigns DROP COLUMN IF EXISTS approval_status;
ALTER TABLE campaigns DROP COLUMN IF EXISTS status;
ALTER TABLE campaigns DROP COLUMN IF EXISTS published_detail_id;

COMMIT;
