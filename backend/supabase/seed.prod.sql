-- seed.prod.sql — production-safe seed (Wave 10)
--
-- Loads ONLY the essential lookup taxonomy that the app needs to function but
-- that NO migration creates: cause_areas / challenge_categories /
-- identity_categories live only in seed.sql (lines 4-36). After `supabase db
-- push` these three lookup tables are EMPTY, which breaks the CBO onboarding
-- form, campaign cause-area chips, and the request_details view (INNER JOIN
-- cause_areas). This file seeds them and nothing else.
--
-- Everything else in seed.sql is MOCK / DEV data and must NOT land in a real
-- production DB where real users would see it: organizations, campaigns,
-- campaign_details, donor_profiles, the mock admin@kcdd.local row, rows keyed to
-- dev Clerk IDs, and acct_test_* Stripe placeholders.
--
-- Other bootstrap data is already applied by migrations during `db push`:
--   - platform_settings + support_faqs defaults  -> 20240310000000_platform_settings.sql
--   - tax-documents storage bucket               -> 20260605000000_* + 20260623000100_*
--
-- Idempotent: all three tables have UNIQUE(name), so ON CONFLICT (name) DO
-- NOTHING makes this safe to run more than once.
--
-- Load against Cloud (db push does NOT run seed files):
--   * Supabase Dashboard -> SQL Editor -> paste this file -> Run, OR
--   * psql "postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres" \
--       -f backend/supabase/seed.prod.sql
--
-- For a DEMO / staging project where you WANT the marketplace pre-filled with
-- the mock orgs + campaigns, load the full backend/supabase/seed.sql instead.

-- Cause areas (8)
INSERT INTO cause_areas (name, description) VALUES
  ('Education', 'Educational technology and resources'),
  ('Health & Wellness', 'Health and wellness technology'),
  ('Economic Development', 'Economic development and workforce technology'),
  ('Community Services', 'Community service and support technology'),
  ('Youth Development', 'Youth development and mentorship technology'),
  ('Arts & Culture', 'Arts, culture, and creativity technology'),
  ('Environment', 'Environmental and sustainability technology'),
  ('Housing', 'Housing and shelter technology')
ON CONFLICT (name) DO NOTHING;

-- Challenge categories (8)
INSERT INTO challenge_categories (name) VALUES
  ('Digital Divide'),
  ('Workforce Development'),
  ('Education Access'),
  ('Healthcare Access'),
  ('Financial Inclusion'),
  ('Community Engagement'),
  ('Environmental Justice'),
  ('Food Security')
ON CONFLICT (name) DO NOTHING;

-- Identity categories (10)
INSERT INTO identity_categories (name) VALUES
  ('Black/African American'),
  ('Hispanic/Latinx'),
  ('Asian American'),
  ('Native American'),
  ('LGBTQ+'),
  ('Women'),
  ('Veterans'),
  ('Disability'),
  ('Youth'),
  ('Seniors')
ON CONFLICT (name) DO NOTHING;
