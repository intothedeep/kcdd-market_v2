-- Storage image bucket provisioning (T1+T2).
--
-- The frontend uploads to FIVE storage buckets that were never created as
-- migrations (they only ever existed as manually-created Dashboard buckets, or
-- not at all). On a fresh Cloud `supabase db push` (which does NOT run seed.sql)
-- these buckets are missing, so every image upload silently fell back to a
-- base64 data: URL stuffed into the DB column. This migration provisions the
-- buckets + scoped storage.objects RLS so real uploads succeed.
--
--   organization-images    public  5 MB   image/png,jpeg,webp,gif   authenticated write
--   organization-logos     public  5 MB   image/png,jpeg,webp,gif   authenticated write
--   profile-pictures       public  5 MB   image/png,jpeg,webp,gif   authenticated write
--   campaign-images        public  5 MB   image/png,jpeg,webp,gif   authenticated write
--   organization-documents private 10 MB  application/pdf,png,jpeg  owner-or-admin
--
-- The existing `tax-documents` bucket (20260623000100_tax_documents_bucket.sql)
-- is INTENTIONALLY UNTOUCHED here — neither its row nor its policies are
-- modified by this migration.
--
-- Idempotency:
--   * Bucket insert uses ON CONFLICT (id) DO NOTHING — NEVER DO UPDATE, because
--     Cloud may already have manually-created buckets we must not clobber.
--   * Every policy is preceded by DROP POLICY IF EXISTS so the migration
--     replays cleanly on db:reset and can be re-piped without error.
--
-- Path conventions:
--   * Public image buckets: flat filenames (e.g. `logos/<orgId>_<ts>.png`,
--     `campaign-<userId>-<ts>.png`). Public read; any authenticated user writes.
--     UPDATE policy is required because the app uses `upsert: true`.
--   * organization-documents: `${organizationId}/...` (supabase.ts:2528), so the
--     FIRST path segment (storage.foldername(name))[1] is the org UUID. Owner is
--     `organizations.user_id = clerk_user_id()`; admins are
--     user_profiles.user_type = 'admin'.

-- ===========================================================================
-- 1. Buckets
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('organization-images',    'organization-images',    true,  5242880,  ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('organization-logos',     'organization-logos',     true,  5242880,  ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('profile-pictures',       'profile-pictures',       true,  5242880,  ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('campaign-images',        'campaign-images',        true,  5242880,  ARRAY['image/png','image/jpeg','image/webp','image/gif']),
  ('organization-documents', 'organization-documents', false, 10485760, ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- ===========================================================================
-- 2. Public image buckets — public read, authenticated write (4 policies each)
-- ===========================================================================

-- ---- organization-images --------------------------------------------------
DROP POLICY IF EXISTS "organization-images public read" ON storage.objects;
CREATE POLICY "organization-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-images');

DROP POLICY IF EXISTS "organization-images authenticated insert" ON storage.objects;
CREATE POLICY "organization-images authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'organization-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "organization-images authenticated update" ON storage.objects;
CREATE POLICY "organization-images authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'organization-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'organization-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "organization-images authenticated delete" ON storage.objects;
CREATE POLICY "organization-images authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'organization-images' AND auth.role() = 'authenticated');

-- ---- organization-logos ---------------------------------------------------
DROP POLICY IF EXISTS "organization-logos public read" ON storage.objects;
CREATE POLICY "organization-logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-logos');

DROP POLICY IF EXISTS "organization-logos authenticated insert" ON storage.objects;
CREATE POLICY "organization-logos authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "organization-logos authenticated update" ON storage.objects;
CREATE POLICY "organization-logos authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "organization-logos authenticated delete" ON storage.objects;
CREATE POLICY "organization-logos authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'organization-logos' AND auth.role() = 'authenticated');

-- ---- profile-pictures -----------------------------------------------------
DROP POLICY IF EXISTS "profile-pictures public read" ON storage.objects;
CREATE POLICY "profile-pictures public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "profile-pictures authenticated insert" ON storage.objects;
CREATE POLICY "profile-pictures authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profile-pictures authenticated update" ON storage.objects;
CREATE POLICY "profile-pictures authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profile-pictures authenticated delete" ON storage.objects;
CREATE POLICY "profile-pictures authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

-- ---- campaign-images ------------------------------------------------------
DROP POLICY IF EXISTS "campaign-images public read" ON storage.objects;
CREATE POLICY "campaign-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-images');

DROP POLICY IF EXISTS "campaign-images authenticated insert" ON storage.objects;
CREATE POLICY "campaign-images authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "campaign-images authenticated update" ON storage.objects;
CREATE POLICY "campaign-images authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "campaign-images authenticated delete" ON storage.objects;
CREATE POLICY "campaign-images authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-images' AND auth.role() = 'authenticated');

-- ===========================================================================
-- 3. organization-documents — private, owner-or-admin (SELECT/INSERT/UPDATE/DELETE)
-- ===========================================================================
-- Predicate (inlined per command, matches 20260623000200_documents_rls_hardening.sql):
--   bucket = organization-documents
--   AND ( org owner (organizations.user_id = clerk_user_id() for the org whose
--         UUID is the first path segment) OR caller is an admin )

DROP POLICY IF EXISTS "organization-documents owner or admin read" ON storage.objects;
CREATE POLICY "organization-documents owner or admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'organization-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = public.clerk_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = public.clerk_user_id() AND user_type = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "organization-documents owner or admin insert" ON storage.objects;
CREATE POLICY "organization-documents owner or admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = public.clerk_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = public.clerk_user_id() AND user_type = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "organization-documents owner or admin update" ON storage.objects;
CREATE POLICY "organization-documents owner or admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'organization-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = public.clerk_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = public.clerk_user_id() AND user_type = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'organization-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = public.clerk_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = public.clerk_user_id() AND user_type = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "organization-documents owner or admin delete" ON storage.objects;
CREATE POLICY "organization-documents owner or admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'organization-documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = ((storage.foldername(name))[1])::uuid
          AND o.user_id = public.clerk_user_id()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = public.clerk_user_id() AND user_type = 'admin'
      )
    )
  );
