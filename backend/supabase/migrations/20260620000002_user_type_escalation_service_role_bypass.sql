-- 20260620000002_user_type_escalation_service_role_bypass.sql
--
-- The prevent_user_type_escalation() trigger (from 20260518000000) blocks ANY
-- user_type change unless the CALLING JWT belongs to an admin. It has NO
-- service_role exemption, so the trusted backend service-role client cannot
-- assign a role to an EXISTING profile: the UPDATE hits the trigger and raises,
-- even though the service key already holds full DB authority. (INSERTs slip
-- through because the trigger is UPDATE-only — which is why the dev role
-- bootstrap appeared to "work after db:reset" for fresh rows but silently
-- failed to upgrade an existing donor row to admin/cbo.)
--
-- Add a service_role bypass, consistent with the existing
-- `auth.role() = 'service_role'` checks already used across this project's RLS
-- policies (e.g. campaigns_all_service_role). This does NOT weaken the guard
-- against a non-admin USER self-escalating via PostgREST: those requests carry
-- the user's publishable-key JWT, never the service_role JWT.

CREATE OR REPLACE FUNCTION public.prevent_user_type_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    -- Trusted backend (service-role key) may assign roles. The service_role JWT
    -- is server-only and never reaches the browser.
    IF coalesce(auth.role(), '') = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    ) THEN
      RAISE EXCEPTION 'Cannot change user_type without admin privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
