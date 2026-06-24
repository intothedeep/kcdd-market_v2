-- M3 — Create the `tax-documents` storage bucket as a migration.
--
-- The bucket (private, 10 MB, PDF-only) was previously created ONLY in
-- seed.sql:228, and 20240320010000_tax_documents.sql explicitly deferred bucket
-- creation to "the Supabase Dashboard". `supabase db push` to Cloud does NOT
-- run seed.sql, so on a fresh Cloud deploy the bucket is missing and every
-- tax-receipt / annual-summary PDF upload in backend/api/server.js
-- (supabase.storage.from('tax-documents').upload(...)) fails.
--
-- Storage object path convention (server.js): `${donorId}/${receiptNumber}.pdf`
-- — the FIRST path segment is the Clerk donor id (== user_profiles.id ==
-- public.clerk_user_id()). Uploads + signed-URL reads in server.js use the
-- service role; the frontend never touches storage objects directly (it reads
-- the pre-signed file_url stored on the donor_documents row). The owner SELECT
-- policy below is defence-in-depth so a donor hitting Storage with their own
-- Clerk JWT can only list/read objects under their own id prefix.
--
-- Idempotent: ON CONFLICT DO NOTHING on the bucket (local already has it from
-- seed) + DROP POLICY IF EXISTS before each CREATE so the migration no-ops
-- cleanly on local and replays cleanly on a fresh db:reset.

-- 1. Bucket -----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tax-documents', 'tax-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. storage.objects RLS for this bucket ------------------------------------
-- (storage.objects already has RLS enabled by Supabase; we add scoped policies
--  for the tax-documents bucket only.)

-- Donors may read their own receipts: bucket = tax-documents AND the first
-- path segment (storage.foldername(name))[1] equals their Clerk id.
DROP POLICY IF EXISTS "Donors read own tax documents" ON storage.objects;
CREATE POLICY "Donors read own tax documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tax-documents'
    AND (storage.foldername(name))[1] = public.clerk_user_id()
  );

-- Service role manages all tax-documents objects (backend generates + uploads
-- receipts and annual summaries). Covers INSERT/UPDATE/DELETE/SELECT.
DROP POLICY IF EXISTS "Service role manages tax documents" ON storage.objects;
CREATE POLICY "Service role manages tax documents"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tax-documents' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'tax-documents' AND auth.role() = 'service_role');
