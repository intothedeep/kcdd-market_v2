-- M2 — Drop the obsolete auth.users → user_profiles trigger.
--
-- 20240101000000_initial_schema.sql:346-358 created handle_new_user()
-- (SECURITY DEFINER) + trigger on_auth_user_created AFTER INSERT ON auth.users,
-- which inserted a row into user_profiles for every new Supabase auth user.
--
-- This app uses Clerk, not Supabase Auth: user_profiles.id became TEXT (Clerk
-- user id) in 20260518000000_clerk_user_id_text.sql, and POST /api/users/sync
-- (service role) is the canonical creator/updater of user_profiles. The trigger
-- was never dropped, so any auth.users INSERT on Cloud (e.g. a stray Supabase
-- Auth session) would fire handle_new_user() and write an orphan user_profiles
-- row keyed by the auth UUID instead of a Clerk id — a runtime hazard.
--
-- Idempotent: IF EXISTS guards mean this no-ops cleanly on environments where
-- the trigger/function were already absent.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
