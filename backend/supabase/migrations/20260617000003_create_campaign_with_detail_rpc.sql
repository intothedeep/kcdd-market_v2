-- Migration: create_campaign_with_detail RPC (Hotfix H3-E)
-- Branch: feat/post-launch-feedback
--
-- Goal: Make createCampaign atomic. Currently the frontend performs two
-- separate INSERTs (campaigns then campaign_details). If the second insert
-- fails (e.g. the A14 CHECK on campaign_details.content rejects a missing
-- required key, or funding_goal isn't numeric), an orphan campaigns row
-- is left behind. The RPC wraps both inserts in a single transaction.
--
-- Decision: Option B (RPC + SECURITY DEFINER), locked by architect.
-- Mirrors the H3-A pattern. SECURITY DEFINER requires an explicit
-- ownership guard so callers cannot create campaigns on orgs they do not
-- own (org-spoof vector if guard is omitted).
--
-- Org-owner guard: organizations.user_id (TEXT, Clerk user id) must match
-- the caller's clerk_user_id(). Uses the existing public.clerk_user_id()
-- helper from 20260518000000_clerk_user_id_text.sql.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_campaign_with_detail(
  p_organization_id UUID,
  p_slug TEXT,
  p_created_by TEXT,
  p_content JSONB,
  p_change_summary TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id TEXT;
  v_campaign_id UUID;
  v_detail_id UUID;
BEGIN
  v_caller_id := public.clerk_user_id();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  -- Ownership guard: caller must own the org. Without this guard,
  -- SECURITY DEFINER becomes an org-spoof vector — any authenticated
  -- user could mint a campaign attached to an arbitrary organization_id.
  IF NOT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_organization_id
      AND user_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'not_organization_owner' USING ERRCODE = '42501';
  END IF;

  -- created_by is recorded as the caller's clerk id, not whatever the
  -- client passes. Defense in depth: clients cannot impersonate other
  -- users on the audit trail.
  INSERT INTO campaigns (
    organization_id,
    slug,
    created_by
  ) VALUES (
    p_organization_id,
    p_slug,
    v_caller_id
  )
  RETURNING id INTO v_campaign_id;

  INSERT INTO campaign_details (
    campaign_id,
    version,
    status,
    content,
    changed_by,
    change_summary
  ) VALUES (
    v_campaign_id,
    1,
    'pending_initial_approval',
    p_content,
    v_caller_id,
    p_change_summary
  )
  RETURNING id INTO v_detail_id;

  RETURN jsonb_build_object(
    'campaign_id', v_campaign_id,
    'detail_id', v_detail_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_campaign_with_detail(UUID, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_campaign_with_detail(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated, service_role;

COMMIT;
