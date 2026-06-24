-- S3 — Tighten wide-open document RLS for a public Cloud deploy.
--
-- On Cloud the browser carries the publishable key, so any USING (true) /
-- WITH CHECK (true) policy is reachable by any caller. Two document tables had
-- such policies:
--
--   * donor_documents  (tax-receipt PII: donor_name, donor_email, amounts)
--   * organization_documents (CBO financials, 501c3 letters, etc.)
--
-- donor_documents was ALREADY effectively hardened earlier in the migration
-- chain (20240325000000_fix_payment_rls.sql dropped the wide-open
-- 20240320010000 policies and added a service-role ALL policy;
-- 20260610000000_donor_read_policies.sql scoped SELECT to
-- user_id = public.clerk_user_id()). The only remaining gap there is admin
-- read access, added below.
--
-- organization_documents still had all five "Anyone can ..." USING (true)
-- policies live — fully replaced below with owner-or-admin scoping, plus a
-- retained public SELECT for rows flagged is_public = true (preserves the
-- original "Anyone can view public org documents" intent; no app page reads
-- non-public org docs anonymously today, but public profile surfaces may).
--
-- Verified ownership columns:
--   donor_documents.user_id          TEXT  Clerk id  (== public.clerk_user_id())
--   organizations.user_id            TEXT  Clerk id  (org owner)
--   organization_documents.organization_id  UUID -> organizations.id
--
-- Verified app access paths that must keep working:
--   - CBO DashboardPage: fetchOrganizationDocuments (SELECT by organization_id),
--     uploadOrganizationDocument (INSERT), updateOrganizationDocument (UPDATE),
--     deleteOrganizationDocument (DELETE) — all from the browser as the org
--     owner -> owner predicate covers these.
--   - admin DashboardPage delete-user cascade: DELETE organization_documents
--     by organization_id from the browser as the admin -> admin predicate
--     covers this.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE so a fresh db:reset replays
-- cleanly after the tables/policies are created upstream.

-- Reusable admin predicate (inlined per-policy; matches the pattern in
-- 20260621000000_campaign_reports_rls_hardening.sql):
--   EXISTS (SELECT 1 FROM public.user_profiles
--           WHERE id = public.clerk_user_id() AND user_type = 'admin')

-- =====================================================================
-- 1. donor_documents — add admin read (owner + service-role already scoped)
-- =====================================================================
DROP POLICY IF EXISTS "Admins read donor documents" ON public.donor_documents;
CREATE POLICY "Admins read donor documents"
  ON public.donor_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- =====================================================================
-- 2. organization_documents — replace wide-open policies
-- =====================================================================

-- Drop the legacy wide-open policies.
DROP POLICY IF EXISTS "Anyone can view public org documents" ON public.organization_documents;
DROP POLICY IF EXISTS "Anyone can read org documents" ON public.organization_documents;
DROP POLICY IF EXISTS "Anyone can insert org documents" ON public.organization_documents;
DROP POLICY IF EXISTS "Anyone can update org documents" ON public.organization_documents;
DROP POLICY IF EXISTS "Anyone can delete org documents" ON public.organization_documents;

-- Public may read only documents explicitly flagged public.
DROP POLICY IF EXISTS "Public reads public org documents" ON public.organization_documents;
CREATE POLICY "Public reads public org documents"
  ON public.organization_documents FOR SELECT
  USING (is_public = true);

-- Org owner (or admin) reads all of the org's documents.
DROP POLICY IF EXISTS "Owner or admin reads org documents" ON public.organization_documents;
CREATE POLICY "Owner or admin reads org documents"
  ON public.organization_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_documents.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- Org owner (or admin) inserts documents for the org.
DROP POLICY IF EXISTS "Owner or admin inserts org documents" ON public.organization_documents;
CREATE POLICY "Owner or admin inserts org documents"
  ON public.organization_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_documents.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- Org owner (or admin) updates the org's documents.
DROP POLICY IF EXISTS "Owner or admin updates org documents" ON public.organization_documents;
CREATE POLICY "Owner or admin updates org documents"
  ON public.organization_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_documents.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_documents.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );

-- Org owner (or admin) deletes the org's documents. Covers the admin
-- delete-user cascade (DELETE by organization_id from the browser).
DROP POLICY IF EXISTS "Owner or admin deletes org documents" ON public.organization_documents;
CREATE POLICY "Owner or admin deletes org documents"
  ON public.organization_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_documents.organization_id
        AND o.user_id = public.clerk_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    )
  );
