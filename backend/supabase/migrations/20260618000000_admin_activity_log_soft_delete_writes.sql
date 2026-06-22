-- =============================================================================
-- W4-B (Phase A8) — Tighten admin_activity_log RLS
-- =============================================================================
-- The table was created in 20240310000000_platform_settings.sql with two
-- wide-open policies (anyone SELECT + anyone INSERT). The audit log only
-- becomes meaningful once writes are self-attributed (admin INSERTs own
-- rows) and reads are admin-only. This migration replaces both policies.
-- =============================================================================

-- 1) Drop wide-open policies
DROP POLICY IF EXISTS "Anyone can view admin activity" ON admin_activity_log;
DROP POLICY IF EXISTS "Anyone can insert admin activity" ON admin_activity_log;

-- 2) Admin-only SELECT
CREATE POLICY "Admin can view admin_activity_log"
ON admin_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = clerk_user_id()
      AND user_profiles.user_type = 'admin'
  )
);

-- 3) Self-attribution INSERT (admin can only insert own rows)
CREATE POLICY "Admin can insert own admin_activity_log"
ON admin_activity_log FOR INSERT
WITH CHECK (
  clerk_user_id() = admin_id
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = clerk_user_id()
      AND user_profiles.user_type = 'admin'
  )
);
