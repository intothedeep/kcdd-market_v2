-- ============================================================
-- BUG-8: Convert user-ID columns from UUID to TEXT for Clerk compatibility
-- ============================================================
-- Reason: This project authenticates with Clerk, which issues string IDs like
-- "user_3DnElkT9WrqI1pJ5SBKNfoZB73x" — not UUIDs. The original schema was
-- modeled on Supabase Auth (UUID PKs with FK to auth.users). That mismatch caused
-- 22P02 "invalid input syntax for type uuid" when the Stripe webhook tried to
-- store donor_id from a real Clerk session.
--
-- This migration:
--   1. Adds a `public.clerk_user_id()` helper (returns text from JWT 'sub' claim)
--   2. Drops RLS policies and FK constraints that depend on UUID-typed user IDs
--   3. Converts 7 columns from UUID to TEXT
--   4. Removes the FK from user_profiles.id to auth.users(id) — we don't use Supabase Auth
--   5. Re-adds FK constraints between the converted columns
--   6. Re-creates RLS policies using clerk_user_id() instead of auth.uid()
--   7. Re-creates the user_type escalation trigger with the new helper
-- ============================================================

-- 1. Helper: extract Clerk user ID from JWT 'sub' claim as text
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
    ''
  );
$$;

-- 2. Drop user_type escalation trigger (will recreate after column type change)
DROP TRIGGER IF EXISTS check_user_type_escalation ON user_profiles;

-- 2a. Drop dependent view (will recreate at the end without the broken auth.users join)
DROP VIEW IF EXISTS request_details CASCADE;

-- 3. Drop all RLS policies that compare user-ID columns with auth.uid()
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Donors can manage their own profile" ON donor_profiles;
DROP POLICY IF EXISTS "CBOs can manage their own organization" ON organizations;
DROP POLICY IF EXISTS "Anyone can view organizations with vetted users" ON organizations;
DROP POLICY IF EXISTS "Anyone can view open requests from vetted organizations" ON requests;
DROP POLICY IF EXISTS "CBOs can manage their own requests" ON requests;
DROP POLICY IF EXISTS "Donors can view their claimed requests" ON requests;
DROP POLICY IF EXISTS "Donors can update their claimed requests" ON requests;
DROP POLICY IF EXISTS "Users can view history of their requests" ON request_history;
DROP POLICY IF EXISTS "Donors and CBOs can view fulfillment records" ON fulfillment_records;
DROP POLICY IF EXISTS "Donors can create fulfillment records" ON fulfillment_records;
DROP POLICY IF EXISTS "Users can view their own notifications" ON request_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON request_notifications;
DROP POLICY IF EXISTS "Org owners can manage populations" ON organization_populations;
DROP POLICY IF EXISTS "Org owners can manage updates" ON organization_updates;
DROP POLICY IF EXISTS "Org owners can manage team members" ON organization_team_members;

-- 4. Drop FK constraints so column types can change
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE donor_profiles DROP CONSTRAINT IF EXISTS donor_profiles_user_id_fkey;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_user_id_fkey;
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_donor_id_fkey;
ALTER TABLE request_history DROP CONSTRAINT IF EXISTS request_history_changed_by_id_fkey;
ALTER TABLE fulfillment_records DROP CONSTRAINT IF EXISTS fulfillment_records_donor_id_fkey;
-- request_notifications: column was renamed user_id → recipient_id in earlier migration;
-- the constraint name may or may not have been auto-renamed, so try both.
ALTER TABLE request_notifications DROP CONSTRAINT IF EXISTS request_notifications_user_id_fkey;
ALTER TABLE request_notifications DROP CONSTRAINT IF EXISTS request_notifications_recipient_id_fkey;

-- 5. Change column types UUID → TEXT
ALTER TABLE user_profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE donor_profiles ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE organizations ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE requests ALTER COLUMN donor_id TYPE TEXT;
ALTER TABLE request_history ALTER COLUMN changed_by_id TYPE TEXT;
ALTER TABLE fulfillment_records ALTER COLUMN donor_id TYPE TEXT;
ALTER TABLE request_notifications ALTER COLUMN recipient_id TYPE TEXT;

-- 6. Re-add FK constraints (referencing user_profiles only; no more auth.users)
ALTER TABLE donor_profiles
  ADD CONSTRAINT donor_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE requests
  ADD CONSTRAINT requests_donor_id_fkey
  FOREIGN KEY (donor_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE request_history
  ADD CONSTRAINT request_history_changed_by_id_fkey
  FOREIGN KEY (changed_by_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE fulfillment_records
  ADD CONSTRAINT fulfillment_records_donor_id_fkey
  FOREIGN KEY (donor_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE request_notifications
  ADD CONSTRAINT request_notifications_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 7. Re-create RLS policies using clerk_user_id() helper

-- user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (public.clerk_user_id() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (public.clerk_user_id() = id);

-- donor_profiles
CREATE POLICY "Donors can manage their own profile" ON donor_profiles
  FOR ALL USING (user_id = public.clerk_user_id());

-- organizations
CREATE POLICY "CBOs can manage their own organization" ON organizations
  FOR ALL USING (user_id = public.clerk_user_id());

CREATE POLICY "Anyone can view organizations with vetted users" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = organizations.user_id AND is_vetted = true
    )
  );

-- requests
CREATE POLICY "Anyone can view open requests from vetted organizations" ON requests
  FOR SELECT USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM organizations o
      INNER JOIN user_profiles up ON o.user_id = up.id
      WHERE o.id = requests.organization_id AND up.is_vetted = true
    )
  );

CREATE POLICY "CBOs can manage their own requests" ON requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = requests.organization_id AND user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "Donors can view their claimed requests" ON requests
  FOR SELECT USING (donor_id = public.clerk_user_id());

CREATE POLICY "Donors can update their claimed requests" ON requests
  FOR UPDATE USING (donor_id = public.clerk_user_id());

-- request_history
CREATE POLICY "Users can view history of their requests" ON request_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = request_history.request_id
      AND (o.user_id = public.clerk_user_id() OR r.donor_id = public.clerk_user_id())
    )
  );

-- fulfillment_records
CREATE POLICY "Donors and CBOs can view fulfillment records" ON fulfillment_records
  FOR SELECT USING (
    donor_id = public.clerk_user_id() OR
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = fulfillment_records.request_id AND o.user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "Donors can create fulfillment records" ON fulfillment_records
  FOR INSERT WITH CHECK (donor_id = public.clerk_user_id());

-- request_notifications
CREATE POLICY "Users can view their own notifications" ON request_notifications
  FOR SELECT USING (recipient_id = public.clerk_user_id());

CREATE POLICY "Users can update their own notifications" ON request_notifications
  FOR UPDATE USING (recipient_id = public.clerk_user_id());

-- organization_populations / updates / team_members (from 20240202)
CREATE POLICY "Org owners can manage populations" ON organization_populations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "Org owners can manage updates" ON organization_updates
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = public.clerk_user_id()
    )
  );

CREATE POLICY "Org owners can manage team members" ON organization_team_members
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = public.clerk_user_id()
    )
  );

-- 8. Re-create user_type escalation prevention trigger using new helper
CREATE OR REPLACE FUNCTION prevent_user_type_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = public.clerk_user_id() AND user_type = 'admin'
    ) THEN
      RAISE EXCEPTION 'Cannot change user_type without admin privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_user_type_escalation
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_user_type_escalation();

-- 9. Re-create request_details view
-- Notes vs the original (in 20240101_initial_schema.sql):
--   - `o.logo` was renamed to `o.logo_url` by the reconcile migration; corrected here
--   - removed the LEFT JOIN to auth.users (we don't use Supabase Auth)
--   - donor_email is therefore dropped from the view; nothing in the codebase reads it
CREATE OR REPLACE VIEW request_details AS
SELECT
  r.id,
  r.description,
  r.amount,
  r.urgency,
  r.status,
  r.zipcode,
  r.program_region_metro,
  r.program_region_county,
  r.donor_note,
  r.created_at,
  r.updated_at,
  r.claimed_at,
  r.fulfilled_at,
  o.id AS organization_id,
  o.name AS organization_name,
  o.logo_url AS organization_logo,
  o.logo_emoji AS organization_logo_emoji,
  up.is_vetted AS organization_vetted,
  ca.id AS cause_area_id,
  ca.name AS cause_area_name,
  d.id AS donor_id
FROM requests r
INNER JOIN organizations o ON r.organization_id = o.id
INNER JOIN user_profiles up ON o.user_id = up.id
INNER JOIN cause_areas ca ON r.cause_area_id = ca.id
LEFT JOIN user_profiles d ON r.donor_id = d.id;
