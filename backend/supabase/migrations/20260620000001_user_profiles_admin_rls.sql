-- Admin RLS on user_profiles
--
-- Widens visibility/update reach so admins can SELECT/UPDATE any profile (the
-- admin UsersPage does an unfiltered SELECT * FROM user_profiles; previously
-- only self-view + vetted-view policies existed, so it returned only the
-- admin's own row).
--
-- NOTE: a naive `EXISTS (SELECT 1 FROM user_profiles me ...)` inside a policy
-- ON user_profiles re-evaluates the table's own RLS policies on the inner
-- query, which can recurse. We isolate the admin check in a SECURITY DEFINER
-- helper that bypasses RLS for that single lookup. clerk_user_id() itself is
-- safe (it only reads the JWT 'sub' claim, never the table).
--
-- NOTE: the prevent_user_type_escalation trigger still gates actual user_type
-- mutation to admin JWTs. These policies only broaden which rows an admin may
-- see and update; they do not bypass that trigger.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = public.clerk_user_id() AND user_type = 'admin'
  );
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (public.is_admin());
