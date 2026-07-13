-- ============================================================
-- Impact views (donor + platform)
-- ============================================================
-- Donor views are per-user scoped via `user_id = public.clerk_user_id()`.
-- They use SECURITY INVOKER (default) so that the caller's RLS context
-- applies to the underlying payment_transactions and related tables.
-- The `user_id` column name was chosen to match the `.eq('user_id', userId)`
-- filter issued by fetchDonorImpactData in frontend-vite/src/lib/supabase.ts.
--
-- Platform views expose aggregate-only data (no donor_id, no raw rows).
-- They use `security_invoker = off` (SECURITY DEFINER) to query the underlying
-- tables as the view-owner, bypassing row-level RLS. This is safe because no
-- sensitive per-donor or per-transaction data is surfaced — only aggregates.
-- ============================================================

-- ----------------------------------------------------------
-- 1. donor_impact_summary
--    Queried: .from('donor_impact_summary').select('*').eq('user_id', userId).single()
--    Columns used downstream: total_donated, lives_impacted, organizations_helped, months_active
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW donor_impact_summary
WITH (security_invoker = on)
AS
SELECT
  pt.donor_id                                                       AS user_id,
  -- total_donated: sum of amount_total (stored in cents) converted to dollars
  COALESCE(SUM(pt.amount_total) FILTER (WHERE pt.status = 'succeeded'), 0) / 100.0
                                                                    AS total_donated,
  -- lives_impacted: distinct fulfilled requests this donor paid for
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'fulfilled')       AS lives_impacted,
  -- organizations_helped: distinct orgs across succeeded transactions
  COUNT(DISTINCT pt.organization_id) FILTER (WHERE pt.status = 'succeeded')
                                                                    AS organizations_helped,
  -- months_active: distinct calendar months with at least one succeeded transaction
  COUNT(DISTINCT TO_CHAR(pt.created_at AT TIME ZONE 'UTC', 'YYYY-MM'))
    FILTER (WHERE pt.status = 'succeeded')                         AS months_active
FROM payment_transactions pt
LEFT JOIN requests r ON r.id = pt.request_id
WHERE pt.donor_id = public.clerk_user_id()
GROUP BY pt.donor_id;


-- ----------------------------------------------------------
-- 2. donor_impact_by_cause
--    Queried: .from('donor_impact_by_cause')
--             .select('amount, percentage, cause_area:cause_areas(name)')
--             .eq('user_id', userId)
--             .order('percentage', { ascending: false })
--    Columns used: amount, percentage, cause_area_id (FK for Supabase join to cause_areas)
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW donor_impact_by_cause
WITH (security_invoker = on)
AS
WITH per_cause AS (
  SELECT
    pt.donor_id,
    r.cause_area_id,
    SUM(pt.amount_total) FILTER (WHERE pt.status = 'succeeded') AS cause_cents
  FROM payment_transactions pt
  INNER JOIN requests r ON r.id = pt.request_id
  WHERE pt.donor_id = public.clerk_user_id()
    AND r.cause_area_id IS NOT NULL
    AND pt.status = 'succeeded'
  GROUP BY pt.donor_id, r.cause_area_id
),
totals AS (
  SELECT donor_id, SUM(cause_cents) AS total_cents FROM per_cause GROUP BY donor_id
)
SELECT
  pc.donor_id                                      AS user_id,
  pc.cause_area_id,
  pc.cause_cents / 100.0                           AS amount,
  CASE
    WHEN t.total_cents > 0
    THEN ROUND((pc.cause_cents * 100.0 / t.total_cents)::numeric, 2)
    ELSE 0
  END                                              AS percentage
FROM per_cause pc
INNER JOIN totals t ON t.donor_id = pc.donor_id;


-- ----------------------------------------------------------
-- 3. donor_monthly_donations
--    Queried: .from('donor_monthly_donations').select('month, amount')
--             .eq('user_id', userId).order('year', { ascending: true })
--    Columns used: month (display label e.g. "Jan 2026"), amount (dollars), year (sort key)
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW donor_monthly_donations
WITH (security_invoker = on)
AS
SELECT
  pt.donor_id                                                        AS user_id,
  EXTRACT(YEAR FROM pt.created_at AT TIME ZONE 'UTC')::int          AS year,
  TO_CHAR(pt.created_at AT TIME ZONE 'UTC', 'Mon YYYY')             AS month,
  SUM(pt.amount_total) / 100.0                                       AS amount
FROM payment_transactions pt
WHERE pt.donor_id = public.clerk_user_id()
  AND pt.status = 'succeeded'
GROUP BY
  pt.donor_id,
  EXTRACT(YEAR FROM pt.created_at AT TIME ZONE 'UTC'),
  TO_CHAR(pt.created_at AT TIME ZONE 'UTC', 'Mon YYYY');


-- ----------------------------------------------------------
-- 4. donor_impact_stories
--    Queried: .from('donor_impact_stories').select('*')
--             .eq('user_id', userId).order('created_at', { ascending: false }).limit(4)
--    Columns used: description, organization_name, created_at
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW donor_impact_stories
WITH (security_invoker = on)
AS
SELECT
  pt.donor_id          AS user_id,
  r.description,
  o.name               AS organization_name,
  pt.created_at
FROM payment_transactions pt
INNER JOIN requests r ON r.id = pt.request_id
INNER JOIN organizations o ON o.id = pt.organization_id
WHERE pt.donor_id = public.clerk_user_id()
  AND pt.status = 'succeeded'
  AND r.status = 'fulfilled';


-- ----------------------------------------------------------
-- 5. platform_impact_summary  (Phase 10 spec — aggregate only)
--    active_campaigns counts from campaigns directly (deleted_at IS NULL = not soft-deleted).
--    security_invoker = off so anon can read without donor-scoped payment_transactions RLS.
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW platform_impact_summary
WITH (security_invoker = off)
AS
SELECT
  COALESCE(SUM(pt.amount_total) FILTER (WHERE pt.status = 'succeeded'), 0) / 100.0
                                             AS total_donated,
  COUNT(DISTINCT pt.donor_id) FILTER (WHERE pt.status = 'succeeded')
                                             AS total_donors,
  COUNT(DISTINCT pt.organization_id) FILTER (WHERE pt.status = 'succeeded')
                                             AS total_organizations,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'fulfilled')
                                             AS requests_fulfilled,
  (SELECT COUNT(*) FROM campaigns WHERE deleted_at IS NULL)
                                             AS active_campaigns
FROM payment_transactions pt
LEFT JOIN requests r ON r.id = pt.request_id;

GRANT SELECT ON platform_impact_summary TO anon, authenticated;


-- ----------------------------------------------------------
-- 6. platform_impact_by_cause  (Phase 10 spec — aggregate only)
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW platform_impact_by_cause
WITH (security_invoker = off)
AS
WITH per_cause AS (
  SELECT
    r.cause_area_id,
    SUM(pt.amount_total) FILTER (WHERE pt.status = 'succeeded') AS cause_cents
  FROM payment_transactions pt
  INNER JOIN requests r ON r.id = pt.request_id
  WHERE r.cause_area_id IS NOT NULL
    AND pt.status = 'succeeded'
  GROUP BY r.cause_area_id
),
total AS (
  SELECT SUM(cause_cents) AS grand_total FROM per_cause
)
SELECT
  pc.cause_area_id,
  ca.name                                          AS cause_name,
  pc.cause_cents / 100.0                           AS total_donated,
  CASE
    WHEN t.grand_total > 0
    THEN ROUND((pc.cause_cents * 100.0 / t.grand_total)::numeric, 2)
    ELSE 0
  END                                              AS percentage
FROM per_cause pc
CROSS JOIN total t
INNER JOIN cause_areas ca ON ca.id = pc.cause_area_id
ORDER BY total_donated DESC;

GRANT SELECT ON platform_impact_by_cause TO anon, authenticated;


-- ----------------------------------------------------------
-- 7. platform_top_organizations  (Phase 10 spec — top 10 orgs by amount received)
-- ----------------------------------------------------------
CREATE OR REPLACE VIEW platform_top_organizations
WITH (security_invoker = off)
AS
SELECT
  o.id                                             AS organization_id,
  o.name,
  o.logo_url,
  SUM(pt.amount_total) FILTER (WHERE pt.status = 'succeeded') / 100.0
                                                   AS total_received,
  COUNT(DISTINCT pt.donor_id) FILTER (WHERE pt.status = 'succeeded')
                                                   AS donor_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'fulfilled')
                                                   AS requests_fulfilled
FROM organizations o
INNER JOIN payment_transactions pt ON pt.organization_id = o.id
LEFT JOIN requests r ON r.id = pt.request_id
GROUP BY o.id, o.name, o.logo_url
ORDER BY total_received DESC
LIMIT 10;

GRANT SELECT ON platform_top_organizations TO anon, authenticated;
