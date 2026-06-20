-- 20260620000000_campaign_details_public_read.sql
--
-- BUGFIX: public campaign list renders empty for anon/donor users.
--
-- Post-REFA/REFB, all displayable campaign content (title, funding_goal,
-- story_content, ...) lives in campaign_details.content; the campaigns table
-- is metadata-only. The public list query (getActiveCampaigns) therefore
-- embeds campaign_details via `!inner`, which is RLS-filtered per row.
--
-- The refactor added a public read policy to `campaigns`
-- (campaigns_select_public_published: deleted_at IS NULL AND has approved
-- detail) but never added the matching public read policy to
-- `campaign_details`. So anon/donor users read 0 detail rows, the inner join
-- drops every campaign, and the list shows nothing.
--
-- Fix: allow public SELECT of APPROVED detail rows belonging to a
-- non-deleted campaign — mirroring the campaigns public policy exactly.
-- Pending (pending_initial_approval / pending_edit_approval) and rejected
-- detail rows stay restricted to owner/admin/service_role via the existing
-- details_select_owner_or_admin policy. RLS policies are OR-combined, so this
-- is purely additive and does not loosen the draft/review path.

CREATE POLICY details_select_public_approved
  ON public.campaign_details
  FOR SELECT
  TO public
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = campaign_details.campaign_id
        AND c.deleted_at IS NULL
    )
  );
