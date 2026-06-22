-- Harden campaign_reports RLS — review follow-up to 20260620000003.
--
-- Two gaps in the original policies:
--   1. INSERT used `WITH CHECK (true)`, so a signed-in caller hitting PostgREST
--      directly could forge another user's reporter_id (or any value). Restrict
--      reporter_id to NULL (anonymous report) or the caller's own
--      clerk_user_id(). Anonymous visitors are unaffected (reporter_id NULL).
--   2. The admin UPDATE policy had only USING and no WITH CHECK, so an admin
--      could pass the read gate and then rewrite campaign_id (re-point a report
--      at a different campaign). Mirror the USING predicate in WITH CHECK.
--
-- Idempotent: DROP IF EXISTS + CREATE so a fresh `db reset` replays cleanly
-- after the table is created by 20260620000003.

DROP POLICY IF EXISTS campaign_reports_insert_public ON public.campaign_reports;
CREATE POLICY campaign_reports_insert_public ON public.campaign_reports
  FOR INSERT
  -- Anonymous visitors may report (reporter_id NULL); a signed-in reporter may
  -- only attribute the report to themselves.
  WITH CHECK (reporter_id IS NULL OR reporter_id = public.clerk_user_id());

DROP POLICY IF EXISTS campaign_reports_update_admin ON public.campaign_reports;
CREATE POLICY campaign_reports_update_admin ON public.campaign_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );
