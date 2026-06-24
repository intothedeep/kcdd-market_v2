-- ============================================================================
-- Unify is_vetted → verification_status (DB lane, Phase A)
-- ----------------------------------------------------------------------------
-- Backfill verification_status from the legacy is_vetted boolean, then swap the
-- two public-visibility RLS predicates and the request_details view from
-- `is_vetted = true` to `verification_status = 'verified'`. The is_vetted column
-- is left ALIVE here — a later migration (Phase C) drops it once all writers and
-- readers are migrated.
-- ============================================================================

-- 1. Backfill (MUST run first, before predicates start reading verification_status)
UPDATE public.user_profiles
SET verification_status = 'verified'
WHERE is_vetted = true AND verification_status <> 'verified';

-- 2. organizations public-visibility policy
DROP POLICY IF EXISTS "Anyone can view organizations with vetted users" ON organizations;

CREATE POLICY "Anyone can view organizations with vetted users" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = organizations.user_id AND verification_status = 'verified'
    )
  );

-- 3. requests open-visibility policy
DROP POLICY IF EXISTS "Anyone can view open requests from vetted organizations" ON requests;

CREATE POLICY "Anyone can view open requests from vetted organizations" ON requests
  FOR SELECT USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM organizations o
      INNER JOIN user_profiles up ON o.user_id = up.id
      WHERE o.id = requests.organization_id AND up.verification_status = 'verified'
    )
  );

-- 4. request_details view — identical column list to 20260518000000, only
--    `up.is_vetted AS organization_vetted` becomes the boolean expression
--    `(up.verification_status = 'verified') AS organization_vetted`.
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
  (up.verification_status = 'verified') AS organization_vetted,
  ca.id AS cause_area_id,
  ca.name AS cause_area_name,
  d.id AS donor_id
FROM requests r
INNER JOIN organizations o ON r.organization_id = o.id
INNER JOIN user_profiles up ON o.user_id = up.id
INNER JOIN cause_areas ca ON r.cause_area_id = ca.id
LEFT JOIN user_profiles d ON r.donor_id = d.id;
