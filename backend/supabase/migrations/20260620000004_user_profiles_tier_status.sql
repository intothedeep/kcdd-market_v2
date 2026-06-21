-- W7-1: add org_tier + verification_status to user_profiles.
-- The admin Users tab (UsersPage.tsx / DashboardPage.tsx) reads and writes
-- user_profiles.org_tier + .verification_status, and RoleSelectionModal sets
-- them on signup — but the columns never existed on this branch's schema, so
-- the Tier/Status cells rendered blank and admin .update() calls silently
-- targeted nothing. Add them as nullable TEXT with CHECK constraints + sensible
-- defaults so new rows get a tier/status automatically.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS org_tier text NOT NULL DEFAULT 'individual'
    CHECK (org_tier IN ('individual','small_org','large_org')),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','verified'));
