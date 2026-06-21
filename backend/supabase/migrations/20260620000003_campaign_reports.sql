-- W7-11: campaign_reports — visitor "report this campaign" flow + admin review queue.
-- The frontend fetchCampaignReports() queried a table that was never created
-- (cast `as any`, so it compiled but errored at runtime → returned []). This
-- migration creates it with the full new-table checklist (CLAUDE.md):
-- CREATE TABLE + ENABLE RLS + SELECT/INSERT/UPDATE policies + FK indexes,
-- all in the same file.

CREATE TABLE IF NOT EXISTS public.campaign_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  reporter_id    text NULL,
  reporter_email text NULL,
  reason         text NOT NULL CHECK (reason IN ('fraud','inappropriate','spam','misleading','other')),
  description    text NULL,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  admin_notes    text NULL,
  resolved_by    text NULL,
  resolved_at    timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_reports ENABLE ROW LEVEL SECURITY;

-- SELECT: admin-only. Reports are sensitive (may identify reporters / allege
-- fraud), so only admins read them.
CREATE POLICY campaign_reports_select_admin ON public.campaign_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- INSERT: public. The "report this campaign" affordance is available to
-- anonymous visitors (reporter_id NULL, optional reporter_email).
CREATE POLICY campaign_reports_insert_public ON public.campaign_reports
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: admin-only (triage: status / admin_notes / resolved_by / resolved_at).
CREATE POLICY campaign_reports_update_admin ON public.campaign_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- FK + filter indexes (Postgres does not auto-index FKs).
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON public.campaign_reports (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_status      ON public.campaign_reports (status);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_created_at  ON public.campaign_reports (created_at DESC);
