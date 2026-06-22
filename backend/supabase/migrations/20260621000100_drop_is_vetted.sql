-- 20260621000100_drop_is_vetted.sql
--
-- Phase C of the is_vetted -> verification_status unification.
-- 20260621000000 (Phase A) repointed the organizations + requests public-SELECT
-- policies and the request_details view onto verification_status='verified'.
-- It missed one more gating object: the user_profiles public-read policy
-- "Anyone can view vetted user profiles" (origin 20240101000000:232) still
-- USING (is_vetted = true). Swap it here, then drop the now-dead column + index.
--
-- Ordering: runs AFTER 20260621000000 (whose backfill synced verification_status
-- from is_vetted). Idempotent via IF EXISTS / DROP+CREATE.

-- Swap the last is_vetted-gated policy (public read of vetted users' profiles —
-- needed by the public org profile embed + the organizations RLS EXISTS subquery).
DROP POLICY IF EXISTS "Anyone can view vetted user profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view vetted user profiles" ON public.user_profiles
  FOR SELECT USING (verification_status = 'verified');

DROP INDEX IF EXISTS idx_user_profiles_is_vetted;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS is_vetted;
