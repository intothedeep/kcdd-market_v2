-- 20260625000000_set_user_type_rpc.sql
-- Safe admin-grants-admin RPC. Centralizes guards + in-transaction audit so the
-- role change and its admin_activity_log row can never diverge.
--   1. caller must be admin                   -> ERRCODE 42501
--   2. p_new_type must be a valid role         -> ERRCODE 22023
--   3. cannot demote the LAST admin            -> ERRCODE P0001, message 'LAST_ADMIN: ...'
--   4. an admin cannot demote THEMSELVES       -> ERRCODE P0001, message 'SELF_DEMOTE: ...'
--   row-not-found                              -> ERRCODE P0002
-- FUNCTION (not a table): new-table RLS checklist does NOT apply. SECURITY
-- DEFINER runs as owner (bypasses RLS for UPDATE + audit INSERT); JWT preserved
-- so clerk_user_id()/is_admin() resolve to the calling admin; the
-- prevent_user_type_escalation trigger sees the admin JWT and permits the change.
CREATE OR REPLACE FUNCTION public.set_user_type(
  p_target_id TEXT,
  p_new_type  TEXT
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row       public.user_profiles;
  v_old_type  TEXT;
  v_caller    TEXT := public.clerk_user_id();
  v_admin_cnt INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins may change user roles' USING ERRCODE = '42501';
  END IF;

  IF p_new_type NOT IN ('donor', 'cbo', 'admin') THEN
    RAISE EXCEPTION 'Invalid user_type: %', p_new_type USING ERRCODE = '22023';
  END IF;

  SELECT user_type INTO v_old_type
  FROM public.user_profiles WHERE id = p_target_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_target_id USING ERRCODE = 'P0002';
  END IF;

  IF v_old_type = 'admin' AND p_new_type <> 'admin' THEN
    IF p_target_id = v_caller THEN
      RAISE EXCEPTION 'SELF_DEMOTE: you cannot remove your own admin access' USING ERRCODE = 'P0001';
    END IF;
    SELECT count(*) INTO v_admin_cnt FROM public.user_profiles WHERE user_type = 'admin';
    IF v_admin_cnt <= 1 THEN
      RAISE EXCEPTION 'LAST_ADMIN: cannot demote the last remaining admin' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF v_old_type = p_new_type THEN
    SELECT * INTO v_row FROM public.user_profiles WHERE id = p_target_id;
    RETURN v_row;
  END IF;

  UPDATE public.user_profiles
  SET user_type = p_new_type::public.user_type_enum, updated_at = now()
  WHERE id = p_target_id
  RETURNING * INTO v_row;

  INSERT INTO public.admin_activity_log (admin_id, action, entity_type, entity_id, details)
  VALUES (v_caller, 'user_role_changed', 'user', p_target_id,
          jsonb_build_object('before', v_old_type, 'after', p_new_type));

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.set_user_type(TEXT, TEXT) IS
  'Admin-only role change with last-admin + self-demote guards and in-transaction admin_activity_log audit (action=user_role_changed). SECURITY DEFINER; gated by is_admin() + EXECUTE grant. Not a table -> no RLS policy needed.';

REVOKE ALL ON FUNCTION public.set_user_type(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_type(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_user_type(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_type(TEXT, TEXT) TO service_role;
