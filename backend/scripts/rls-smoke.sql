-- =============================================================================
-- rls-smoke.sql — anon RLS smoke test
-- =============================================================================
--
-- Purpose
--   Anon RLS smoke test for soft-delete + unapproved campaigns hiding.
--   Proves that the `campaigns_select_public_published` policy:
--     (a) hides soft-deleted campaigns (deleted_at IS NOT NULL) from anon, and
--     (b) hides campaigns that lack any approved `campaign_details` row
--         from anon.
--
--   Note on assertion 2 — uses the SECURITY DEFINER helper
--   `public.campaign_has_approved_detail(uuid)` because anon RLS on
--   `campaign_details` is intentionally absent (no SELECT policy granted to
--   anon). A plain `NOT EXISTS (SELECT … FROM campaign_details …)` from anon
--   would always evaluate true (the subquery sees zero rows under RLS), so it
--   cannot distinguish approved vs. unapproved. The helper bypasses RLS
--   internally and mirrors the exact predicate used by the
--   `campaigns_select_public_published` policy, making it the correct anchor.
--
-- How to run
--   psql -v ON_ERROR_STOP=1 -f backend/scripts/rls-smoke.sql "$DATABASE_URL"
--
--   Run against a freshly reset local Supabase database (e.g. after
--   `cd backend && pnpm db:reset`).
--
-- Expected output
--   A single line:
--     NOTICE:  rls-smoke PASS
--   Process exit code: 0.
--
-- Failure semantics
--   Each assertion lives in a `DO $$ ... IF ... THEN RAISE EXCEPTION ... END IF;
--   END $$` block. With `psql -v ON_ERROR_STOP=1`, a RAISE EXCEPTION aborts the
--   script and causes psql to exit non-zero. The raised message identifies which
--   assertion failed:
--     - 'soft-deleted campaigns visible to anon (expected 0, got N)'
--     - 'campaigns visible to anon without approved detail (expected 0, got N)'
--   The `rls-smoke PASS` notice is only emitted after BOTH assertions succeed.
--
-- Constraints
--   - SELECT-only; no INSERT / UPDATE / DELETE / DDL.
--   - Uses `SET LOCAL role TO anon;` inside a transaction so the role change
--     is scoped to this script and reset on commit/abort. An explicit
--     `RESET role;` runs at the end as belt-and-suspenders for any session
--     that may have been left open.
-- =============================================================================

BEGIN;

SET LOCAL role TO anon;

-- Assertion 1 — soft-deleted campaigns must not be visible to anon.
DO $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT count(*) INTO v_count
    FROM campaigns
    WHERE deleted_at IS NOT NULL;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'soft-deleted campaigns visible to anon (expected 0, got %)', v_count;
  END IF;
END $$;

-- Assertion 2 — every campaign visible to anon must have an approved
-- campaign_details row. Uses the SECURITY DEFINER helper
-- `public.campaign_has_approved_detail(uuid)` (defined in migration
-- 20260616000003_campaigns_metadata_only.sql) because anon has no SELECT
-- policy on `campaign_details`; a direct subquery would be blocked by RLS and
-- silently pass. The helper bypasses RLS internally and matches the predicate
-- in the `campaigns_select_public_published` policy.
DO $$
DECLARE
  v_count BIGINT;
BEGIN
  SELECT count(*) INTO v_count
    FROM campaigns c
    WHERE NOT public.campaign_has_approved_detail(c.id);
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'campaigns visible to anon without approved detail (expected 0, got %)', v_count;
  END IF;
END $$;

RESET role;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'rls-smoke PASS';
END $$;
