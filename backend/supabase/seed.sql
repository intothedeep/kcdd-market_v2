-- Seed data for kcdd-market_v2

-- Insert initial cause areas
INSERT INTO cause_areas (name, description) VALUES
  ('Education', 'Educational technology and resources'),
  ('Health & Wellness', 'Health and wellness technology'),
  ('Economic Development', 'Economic development and workforce technology'),
  ('Community Services', 'Community service and support technology'),
  ('Youth Development', 'Youth development and mentorship technology'),
  ('Arts & Culture', 'Arts, culture, and creativity technology'),
  ('Environment', 'Environmental and sustainability technology'),
  ('Housing', 'Housing and shelter technology');

-- Insert challenge categories
INSERT INTO challenge_categories (name) VALUES
  ('Digital Divide'),
  ('Workforce Development'),
  ('Education Access'),
  ('Healthcare Access'),
  ('Financial Inclusion'),
  ('Community Engagement'),
  ('Environmental Justice'),
  ('Food Security');

-- Insert identity categories
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
  ('Seniors');

-- Create test admin user (password: admin123)
-- You'll need to create this through the Supabase UI or Auth API

-- ============================================================
-- MOCK DATA BLOCK (campaigns-only flow)
-- ============================================================
-- Mock IDs use UUID-shaped strings so they slot into TEXT columns
-- (user_profiles.id, organizations.user_id, campaigns.created_by are TEXT
-- after migration 20260518000000_clerk_user_id_text.sql).
-- Inserts are idempotent via ON CONFLICT so re-running db:reset is safe.
-- requests / fulfillment / payment_transactions intentionally omitted —
-- this branch exercises the campaign donation flow only.

-- STEP M1: user_profiles (3 CBO owners + 3 mock donors)
-- W7-1: org_tier + verification_status set inline so the admin Users tab shows
-- a populated Tier/Status spread instead of blanks.
INSERT INTO user_profiles (id, user_type, email, name, org_tier, verification_status) VALUES
  ('00000000-0000-0000-0002-000000000001', 'cbo',   'amara@connectingroots.org',   'Amara Johnson', 'small_org',  'verified'),
  ('00000000-0000-0000-0002-000000000002', 'cbo',   'lin@kctechbridge.org',        'Lin Chen',      'large_org',  'verified'),
  ('00000000-0000-0000-0002-000000000003', 'cbo',   'devon@digitalfutureskc.org',  'Devon Park',    'small_org',  'verified'),
  ('00000000-0000-0000-0003-000000000001', 'donor', 'donor1@example.com',          'Marcus Tanner', 'individual', 'unverified'),
  ('00000000-0000-0000-0003-000000000002', 'donor', 'donor2@example.com',          'Priya Sharma',  'individual', 'verified'),
  ('00000000-0000-0000-0003-000000000003', 'donor', 'donor3@example.com',          'James Wallace', 'individual', 'unverified')
ON CONFLICT (id) DO NOTHING;

-- STEP M2: organizations (3 CBOs)
INSERT INTO organizations (
  id, user_id, name, mission, email, phone, zipcode,
  logo_emoji, tagline, organization_type, year_founded, website,
  program_description, service_area_description
) VALUES
  (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Connecting Roots KC',
    'Connecting Roots KC bridges the digital divide for youth in Kansas City''s most underserved neighborhoods. We provide refurbished technology, digital literacy training, and mentorship to help young people thrive in the 21st-century economy.',
    'info@connectingroots.org',
    '(816) 555-0101',
    '64130',
    '🌱',
    'Growing digital equity, one youth at a time.',
    'Nonprofit 501(c)(3)',
    2017,
    'https://connectingroots.org',
    'Our flagship Digital Seedlings program serves 200+ youth annually across three KC school districts.',
    'Jackson County, Missouri — primarily ZIP codes 64130, 64128, and 64132.'
  ),
  (
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'KC Tech Bridge',
    'KC Tech Bridge empowers immigrant and refugee communities in the Kansas City metro with the digital tools and skills needed for workforce participation and economic self-sufficiency.',
    'hello@kctechbridge.org',
    '(816) 555-0202',
    '64111',
    '🌉',
    'Connecting communities to opportunity through technology.',
    'Nonprofit 501(c)(3)',
    2019,
    'https://kctechbridge.org',
    'Our WorkReady program pairs each participant with a refurbished laptop and 12 weeks of job-ready digital skills training.',
    'Wyandotte County, KS and Jackson County, MO — ZIP codes 64111, 64112, 66101, 66102.'
  ),
  (
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0002-000000000003',
    'Digital Futures KC',
    'Digital Futures KC delivers technology access and telehealth support to seniors and people with disabilities across the Kansas City metro.',
    'contact@digitalfutureskc.org',
    '(816) 555-0303',
    '64106',
    '💻',
    'Technology for every stage of life.',
    'Nonprofit 501(c)(3)',
    2015,
    'https://digitalfutureskc.org',
    'Our Silver Screens program equips seniors with tablets and one-on-one digital coaching.',
    'Greater Kansas City metro — ZIP codes 64106, 64108, 64110, 64113, 64114.'
  )
ON CONFLICT (id) DO NOTHING;

-- STEP M3: donor_profiles (3 mock donors)
INSERT INTO donor_profiles (
  id, user_id, display_name, name, email, max_per_request, bio, service_area_zipcode
) VALUES
  (
    '00000000-0000-0000-0005-000000000001',
    '00000000-0000-0000-0003-000000000001',
    'Marcus T.',
    'Marcus Tanner',
    'donor1@example.com',
    750.00,
    'KC-area tech professional passionate about closing the digital divide.',
    '64113'
  ),
  (
    '00000000-0000-0000-0005-000000000002',
    '00000000-0000-0000-0003-000000000002',
    'Priya S.',
    'Priya Sharma',
    'donor2@example.com',
    500.00,
    'Software engineer and community advocate.',
    '64111'
  ),
  (
    '00000000-0000-0000-0005-000000000003',
    '00000000-0000-0000-0003-000000000003',
    'James W.',
    'James Wallace',
    'donor3@example.com',
    1200.00,
    'Retired IT director giving back to KC nonprofits.',
    '64106'
  )
ON CONFLICT (id) DO NOTHING;

-- STEP M4: mark orgs as Stripe-Connect-ready so the donate modal does not
-- gate behind "Payments Not Available" in local dev. `acct_test_*` IDs are
-- placeholders that never actually charge; combined with STRIPE_BYPASS_CONNECT=true
-- in backend/.env they let the campaign donate flow render end-to-end.
UPDATE organizations SET
  stripe_account_id = 'acct_test_connecting_roots',
  stripe_charges_enabled = true,
  stripe_onboarding_complete = true,
  stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000001';

UPDATE organizations SET
  stripe_account_id = 'acct_test_kc_tech_bridge',
  stripe_charges_enabled = true,
  stripe_onboarding_complete = true,
  stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000002';

UPDATE organizations SET
  stripe_account_id = 'acct_test_digital_futures',
  stripe_charges_enabled = true,
  stripe_onboarding_complete = true,
  stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000003';

-- STEP M5: campaigns (6 active + 1 pending, spread across the 3 CBOs)
-- After REFB, campaigns table holds only identity + runtime counters + lifecycle
-- stamps + soft-delete. State is DERIVED from campaign_details rows (inserted
-- in the A13-* steps below). No status / approval_status / published_detail_id
-- columns exist anymore.
INSERT INTO campaigns (
  id, organization_id, created_by, slug,
  amount_raised, supporters_count, created_at
) VALUES
  ('00000000-0000-0000-0009-000000000001',
   '00000000-0000-0000-0004-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'laptops-for-roots-afterschool',
   7350.00, 47, NOW()),
  ('00000000-0000-0000-0009-000000000002',
   '00000000-0000-0000-0004-000000000003',
   '00000000-0000-0000-0002-000000000003',
   'digital-futures-mobile-lab',
   18900.00, 121, NOW()),
  ('00000000-0000-0000-0009-000000000003',
   '00000000-0000-0000-0004-000000000002',
   '00000000-0000-0000-0002-000000000002',
   'tech-bridge-senior-cohort-spring-2026',
   0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000004',
   '00000000-0000-0000-0004-000000000002',
   '00000000-0000-0000-0002-000000000002',
   'workforce-computer-lab-tech-bridge',
   4250.00, 19, NOW()),
  ('00000000-0000-0000-0009-000000000005',
   '00000000-0000-0000-0004-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'arts-studio-tablets-roots-teens',
   4200.00, 38, NOW()),
  ('00000000-0000-0000-0009-000000000006',
   '00000000-0000-0000-0004-000000000003',
   '00000000-0000-0000-0002-000000000003',
   'stay-connected-phones-housing-stability',
   6500.00, 73, NOW()),
  ('00000000-0000-0000-0009-000000000007',
   '00000000-0000-0000-0004-000000000001',
   '00000000-0000-0000-0002-000000000001',
   'health-tech-kiosk-roots-community-hub',
   1850.00, 12, NOW())
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for receipt PDFs (local dev only — main's policy says
-- production buckets are created via Supabase Dashboard, not migrations).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tax-documents', 'tax-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- A13 / approval-lifecycle mock data — admin user, campaign_details
-- (the JSONB content store after REFA1 rename), published states, mock
-- notifications. So `pnpm db:reset` yields a UI-visible setup out of the box.
-- ============================================================

-- STEP A13-1: Admin user_profile.
-- Schema note: user_profiles.name (VARCHAR(200)) — there is no full_name
-- column; the existing seed (M1) uses `name`, so we match.
INSERT INTO user_profiles (id, user_type, email, name, created_at)
VALUES (
  '00000000-0000-0000-0001-000000000001',
  'admin',
  'admin@kcdd.local',
  'KCDD Admin',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- STEP A13-2a: Approved campaign_detail v1 for the 5 "previously approved"
-- campaigns (1, 2, 4, 5, 7). Campaign 7 will then get an additional pending
-- v2 below. Content is built literally per-row because the campaigns table
-- no longer carries the content columns (REFA6).
INSERT INTO campaign_details (
  campaign_id, version, content, changed_by,
  status, approved_by, approved_at, change_summary, created_at
) VALUES
  ('00000000-0000-0000-0009-000000000001',
   1,
   jsonb_build_object(
     'title', 'Laptops for the Roots After-School Program',
     'creator_name', 'Amara Johnson',
     'creator_role', 'Program Director',
     'funding_goal', 12000.00,
     'short_description', 'Help us put 25 refurbished laptops into the hands of middle-schoolers in our weekday after-school cohort.',
     'story_title', 'Why this matters',
     'story_content', '<h2>Why this matters</h2><p>Last semester, 18 of our 25 enrolled students had to share a single shelf of Chromebooks. Homework went home unfinished, and our retention dropped from 82% to 64% in the spring.</p><p>With <strong>$12,000</strong> we can buy 25 refurbished Lenovo ThinkPads, accessory bundles, and a year of break/fix support.</p>',
     'contact_email', 'campaigns@connectingroots.org',
     'phone', '+1-816-555-0111',
     'image_url', '/demo-images/cover-camp-1.svg',
     'logo_url', '/demo-images/logo-connecting-roots.svg',
     'facebook_url', 'https://facebook.com/connectingrootskc',
     'instagram_url', 'https://instagram.com/connectingrootskc'
   ),
   '00000000-0000-0000-0002-000000000001',
   'approved',
   '00000000-0000-0000-0001-000000000001',
   NOW() - INTERVAL '7 days',
   NULL,
   NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0009-000000000002',
   1,
   jsonb_build_object(
     'title', 'Digital Futures Mobile Lab',
     'creator_name', 'Devon Park',
     'creator_role', 'Executive Director',
     'funding_goal', 45000.00,
     'short_description', 'A retrofitted van + 15 workstations brings basic computer skills to underserved Northland neighborhoods.',
     'story_title', 'A classroom on wheels',
     'story_content', '<h2>A classroom on wheels</h2><p>Our fixed-site classes have a 4-month waitlist while seniors in the Northland tell us they cannot reach our downtown office. This mobile lab — a 2018 Ford Transit retrofitted with 15 laptop stations and Starlink uplink — will bring 6 weekly classes to 4 community centers north of the river.</p>',
     'contact_email', 'campaigns@digitalfutureskc.org',
     'phone', '+1-816-555-0133',
     'image_url', '/demo-images/cover-camp-2.svg',
     'logo_url', '/demo-images/logo-digital-futures.svg',
     'instagram_url', 'https://instagram.com/digitalfutureskc'
   ),
   '00000000-0000-0000-0002-000000000003',
   'approved',
   '00000000-0000-0000-0001-000000000001',
   NOW() - INTERVAL '7 days',
   NULL,
   NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0009-000000000004',
   1,
   jsonb_build_object(
     'title', 'Workforce Computer Lab — Tech Bridge',
     'creator_name', 'Lin Chen',
     'creator_role', 'Programs Lead',
     'funding_goal', 18000.00,
     'short_description', 'Outfit a 12-station job-readiness lab for adults transitioning out of shelters and re-entry programs.',
     'story_title', 'A doorway to a paycheck',
     'story_content', '<p>Our partners refer 80–90 adults a year who need entry-level digital skills. We currently rent lab time at the library — limited to 2 hours per week. A dedicated 12-station lab unlocks evening and weekend training.</p>',
     'contact_email', 'campaigns@kctechbridge.org',
     'phone', '+1-816-555-0122',
     'image_url', '/demo-images/cover-camp-3.svg'
   ),
   '00000000-0000-0000-0002-000000000002',
   'approved',
   '00000000-0000-0000-0001-000000000001',
   NOW() - INTERVAL '7 days',
   NULL,
   NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0009-000000000005',
   1,
   jsonb_build_object(
     'title', 'Arts Studio Tablets for Roots Teens',
     'creator_name', 'Amara Johnson',
     'creator_role', 'Program Director',
     'funding_goal', 5000.00,
     'short_description', '10 iPad + Apple Pencil bundles for our Saturday teen arts studio.',
     'story_title', 'Where pencils meet pixels',
     'story_content', '<p>Our Saturday teens have been making zines for 3 years. Half now ask about digital art and beat production. Hardware is the only thing standing between them and a portfolio they can take to art school.</p>',
     'contact_email', 'campaigns@connectingroots.org',
     'phone', '+1-816-555-0111',
     'image_url', '/demo-images/cover-camp-4.svg',
     'facebook_url', 'https://facebook.com/connectingrootskc'
   ),
   '00000000-0000-0000-0002-000000000001',
   'approved',
   '00000000-0000-0000-0001-000000000001',
   NOW() - INTERVAL '7 days',
   NULL,
   NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0009-000000000007',
   1,
   jsonb_build_object(
     'title', 'Health-Tech Kiosk at the Roots Community Hub',
     'creator_name', 'Amara Johnson',
     'creator_role', 'Program Director',
     'funding_goal', 9200.00,
     'short_description', 'A telehealth kiosk + Bluetooth BP cuff station in our lobby — open to neighbors during business hours.',
     'story_title', 'Closing the last appointment-mile',
     'story_content', '<p>Our community hub already hosts 200+ visits per month. A self-serve telehealth booth lets neighbors talk to a nurse without a doctor visit.</p>',
     'contact_email', 'campaigns@connectingroots.org',
     'phone', '+1-816-555-0111',
     'logo_url', '/demo-images/logo-connecting-roots.svg'
   ),
   '00000000-0000-0000-0002-000000000001',
   'approved',
   '00000000-0000-0000-0001-000000000001',
   NOW() - INTERVAL '7 days',
   NULL,
   NOW() - INTERVAL '7 days')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- STEP A13-2b: Stamp first_approved_at / last_edit_approved_at for
-- campaigns 1, 2, 4, 5. State is now derived from campaign_details rows
-- (their v1 detail is already status='approved' above), so no
-- approval_status / published_detail_id columns to set.
UPDATE campaigns
SET
  first_approved_at = NOW() - INTERVAL '7 days',
  last_edit_approved_at = NOW() - INTERVAL '7 days'
WHERE id IN (
  '00000000-0000-0000-0009-000000000001',
  '00000000-0000-0000-0009-000000000002',
  '00000000-0000-0000-0009-000000000004',
  '00000000-0000-0000-0009-000000000005'
);

-- STEP A13-2c: Campaign 7 (Health-Tech Kiosk) — v1 is already
-- status='approved' above, so derived state will be ACTIVE once we stamp
-- the lifecycle timestamps. Then we insert a pending v2 below; the
-- derived state will flip to PENDING_EDIT_APPROVAL because v2 is the
-- latest detail row.
UPDATE campaigns
SET
  first_approved_at = NOW() - INTERVAL '7 days',
  last_edit_approved_at = NOW() - INTERVAL '7 days'
WHERE id = '00000000-0000-0000-0009-000000000007';

INSERT INTO campaign_details (
  campaign_id, version, content, changed_by,
  status, change_summary, created_at
) VALUES
  ('00000000-0000-0000-0009-000000000007',
   2,
   jsonb_build_object(
     'title', 'Health-Tech Kiosk at the Roots Community Hub — Updated',
     'creator_name', 'Amara Johnson',
     'creator_role', 'Program Director',
     'funding_goal', 9200.00,
     'short_description', 'A telehealth kiosk + Bluetooth BP cuff station in our lobby — open to neighbors during business hours.',
     'story_title', 'Closing the last appointment-mile',
     'story_content', '<p>Our community hub already hosts 200+ visits per month. A self-serve telehealth booth lets neighbors talk to a nurse without a doctor visit.</p>',
     'contact_email', 'campaigns@connectingroots.org',
     'phone', '+1-816-555-0111',
     'logo_url', '/demo-images/logo-connecting-roots.svg'
   ),
   '00000000-0000-0000-0002-000000000001',
   'pending_edit_approval',
   'Renamed to clarify scope; raised funding goal',
   NOW() - INTERVAL '2 hours')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- Derived state for campaign 7 is now PENDING_EDIT_APPROVAL because the
-- v2 detail above is the latest row with status='pending_edit_approval'.
-- Only stamp last_edited_at to reflect the edit timestamp.
UPDATE campaigns
SET last_edited_at = NOW() - INTERVAL '2 hours'
WHERE id = '00000000-0000-0000-0009-000000000007';

-- STEP A13-2d: Campaigns 3 + 6 — pending_initial_approval (no published detail).
INSERT INTO campaign_details (
  campaign_id, version, content, changed_by,
  status, change_summary, created_at
) VALUES
  ('00000000-0000-0000-0009-000000000003',
   1,
   jsonb_build_object(
     'title', 'Tech Bridge Senior Cohort (Spring 2026)',
     'creator_name', 'Lin Chen',
     'creator_role', 'Programs Lead',
     'funding_goal', 8500.00,
     'short_description', 'Funding 30 tablets + accessibility kits for our spring cohort serving adults 65+.',
     'story_title', 'Reaching the last mile',
     'story_content', '<p>Our spring cohort opens in February. Hardware lead time means we need committed funding by January 15.</p>',
     'contact_email', 'campaigns@kctechbridge.org',
     'phone', '+1-816-555-0122'
   ),
   '00000000-0000-0000-0002-000000000002',
   'pending_initial_approval',
   'Initial submission',
   NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000006',
   1,
   jsonb_build_object(
     'title', 'Stay-Connected Phones for Housing Stability',
     'creator_name', 'Devon Park',
     'creator_role', 'Executive Director',
     'funding_goal', 6500.00,
     'short_description', '50 prepaid smartphones + 6-month service for clients transitioning out of shelter into permanent housing.',
     'story_title', 'A working phone IS housing stability',
     'story_content', '<p>Caseworkers report 3 in 10 housing placements fail in the first 90 days because clients cannot be reached for utility setup, employer call-backs, or appointments. A phone changes that.</p>',
     'contact_email', 'campaigns@digitalfutureskc.org',
     'phone', '+1-816-555-0133',
     'image_url', '/demo-images/cover-camp-5.svg',
     'instagram_url', 'https://instagram.com/digitalfutureskc'
   ),
   '00000000-0000-0000-0002-000000000003',
   'pending_initial_approval',
   'Initial submission',
   NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- Derived state for campaigns 3 and 6 is now PENDING_INITIAL_APPROVAL
-- because their only detail row above has status='pending_initial_approval'
-- and no approved row exists. Stamp last_edited_at only.
UPDATE campaigns
SET last_edited_at = NOW() - INTERVAL '1 day'
WHERE id IN (
  '00000000-0000-0000-0009-000000000003',
  '00000000-0000-0000-0009-000000000006'
);

-- STEP A13-3: Notifications. 3 unread campaign_edit_pending for the admin
-- (campaigns 3, 6, and 7's v2), plus 1 already-read campaign_first_approved
-- for the CBO of campaign 1 so the bell shows mixed read/unread state.
-- ON CONFLICT clause matches the partial unique index
-- idx_notifications_recipient_dedupe_key (WHERE dedupe_key IS NOT NULL).
INSERT INTO notifications (
  recipient_clerk_user_id, kind, payload, link_url,
  entity_type, entity_id, dedupe_key, read_at, created_at
)
SELECT
  '00000000-0000-0000-0001-000000000001',
  'campaign_edit_pending',
  jsonb_build_object(
    'campaign_id', d.campaign_id,
    'campaign_title', d.content->>'title',
    'detail_id', d.id
  ),
  '/admin/pending-edits/' || d.campaign_id,
  'campaign_detail',
  d.id,
  'campaign_edit_pending:' || d.id || ':' || d.version,
  NULL,
  d.created_at
FROM campaign_details d
WHERE d.status IN ('pending_initial_approval', 'pending_edit_approval')
ON CONFLICT (recipient_clerk_user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING;

INSERT INTO notifications (
  recipient_clerk_user_id, kind, payload, link_url,
  entity_type, entity_id, dedupe_key, read_at, created_at
)
SELECT
  c.created_by,
  'campaign_first_approved',
  jsonb_build_object(
    'campaign_id', c.id,
    'campaign_title', d.content->>'title'
  ),
  '/campaign/' || c.slug,
  'campaign',
  c.id,
  'campaign_first_approved:' || c.id || ':1',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '7 days'
FROM campaigns c
JOIN campaign_details d
  ON d.campaign_id = c.id AND d.version = 1
WHERE c.id = '00000000-0000-0000-0009-000000000001'
ON CONFLICT (recipient_clerk_user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING;

-- ============================================================
-- STEP REFB — soft-delete demo
-- ============================================================
-- One additional campaign that WOULD be donor-visible (has an approved
-- detail) but was soft-deleted 2 days ago. Used to verify:
--   * anon SELECT FROM campaigns still returns 5 (the soft-deleted
--     row is filtered by the public RLS predicate `deleted_at IS NULL`)
--   * admin/owner SELECT can still see it (no deleted_at filter on
--     their policies — intentional, so undelete UI can list it)
INSERT INTO campaigns (
  id, organization_id, created_by, slug,
  amount_raised, supporters_count, created_at, deleted_at
) VALUES (
  '00000000-0000-0000-0009-000000000008',
  '00000000-0000-0000-0004-000000000001',
  '00000000-0000-0000-0002-000000000001',
  'archived-laptops-pilot-2025',
  500.00, 5,
  NOW() - INTERVAL '90 days',
  NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO campaign_details (
  id, campaign_id, version, status,
  content, change_summary,
  changed_by, approved_by, approved_at, created_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0009-000000000008',
  1,
  'approved',
  jsonb_build_object(
    'title', 'Archived Laptops Pilot (2025)',
    'creator_name', 'Amara Johnson',
    'creator_role', 'Program Director',
    'funding_goal', 2000,
    'short_description', 'Pilot ended successfully — kept here for soft-delete demo.',
    'story_title', 'Wrap report',
    'story_content', '<p>Closed out the 2025 pilot. Archived 2026-06.</p>',
    'contact_email', 'campaigns@connectingroots.org',
    'phone', '+1-816-555-0111',
    'image_url', NULL,
    'logo_url', NULL,
    'facebook_url', NULL, 'twitter_url', NULL,
    'instagram_url', NULL, 'linkedin_url', NULL,
    'youtube_url', NULL, 'tiktok_url', NULL,
    'website_url', NULL,
    'cause_area_ids', ARRAY[]::text[]
  ),
  'Pilot completed; archived',
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0001-000000000001',
  NOW() - INTERVAL '85 days',
  NOW() - INTERVAL '85 days'
) ON CONFLICT (campaign_id, version) DO NOTHING;

UPDATE campaigns
SET first_approved_at = NOW() - INTERVAL '85 days',
    last_edit_approved_at = NOW() - INTERVAL '85 days'
WHERE id = '00000000-0000-0000-0009-000000000008';

-- ============================================================
-- STEP W5-B1 — default_campaign_template (Wave 5 prefill demo)
-- ============================================================
-- Exercises organizations.default_campaign_template (added in
-- 20260618000001_organization_default_campaign_template.sql). Shape
-- matches frontend OrganizationDefaults type. Picked Connecting Roots
-- because its v1 campaign #1 detail already validates these strings.
-- cause_area_ids is looked up by name so this stays robust against
-- the auto-generated UUIDs of the cause_areas seed at the top of this file.
UPDATE organizations
SET default_campaign_template = jsonb_build_object(
  'creator_name', 'Amara Johnson',
  'creator_role', 'Program Director',
  'contact_email', 'campaigns@connectingroots.org',
  'cause_area_ids', (
    SELECT COALESCE(array_agg(id::text), ARRAY[]::text[])
    FROM cause_areas
    WHERE name IN ('Education', 'Youth Development')
  )
)
WHERE id = '00000000-0000-0000-0004-000000000001';

-- ============================================================
-- STEP W4-B1 — admin_activity_log (audit page non-empty out of the box)
-- ============================================================
-- 4 rows referencing REAL seeded ids: admin = ...0001-000000000001,
-- campaigns = ...0009-000000000001 / 0007 / 0008.
-- Service-role seed bypasses RLS; the W4-B self-attribution policy still
-- holds for real admin writes from the app.
INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, details, created_at) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    'approve_campaign_initial',
    'campaign',
    '00000000-0000-0000-0009-000000000001',
    jsonb_build_object(
      'campaign_title', 'Laptops for the Roots After-School Program',
      'detail_version', 1,
      'note', 'Initial approval — content + funding goal verified.'
    ),
    NOW() - INTERVAL '7 days'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'approve_campaign_initial',
    'campaign',
    '00000000-0000-0000-0009-000000000007',
    jsonb_build_object(
      'campaign_title', 'Health-Tech Kiosk at the Roots Community Hub',
      'detail_version', 1
    ),
    NOW() - INTERVAL '7 days'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'reject_campaign_edit',
    'campaign',
    '00000000-0000-0000-0009-000000000007',
    jsonb_build_object(
      'campaign_title', 'Health-Tech Kiosk at the Roots Community Hub — Updated',
      'detail_version', 2,
      'reason', 'Funding goal increase needs board sign-off; resubmit with attached minutes.'
    ),
    NOW() - INTERVAL '1 hour'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'soft_delete_campaign',
    'campaign',
    '00000000-0000-0000-0009-000000000008',
    jsonb_build_object(
      'campaign_title', 'Archived Laptops Pilot (2025)',
      'reason', 'Owner-initiated archive after pilot wrap-up.',
      'restorable_until', (NOW() + INTERVAL '28 days')::text
    ),
    NOW() - INTERVAL '2 days'
  );

-- ============================================================
-- STEP M6 — 2 additional CBOs + 6 campaigns + org logos/covers
-- ============================================================
-- Same idempotent ON CONFLICT pattern as the rest of seed.sql.
-- Campaign id 8 is taken by the REFB soft-delete demo, so these use 9..14.

-- M6-1: 2 new CBO owners (W7-1: org_tier + verification_status inline)
INSERT INTO user_profiles (id, user_type, email, name, org_tier, verification_status) VALUES
  ('00000000-0000-0000-0002-000000000004', 'cbo', 'maya@northlandcode.org',         'Maya Okafor',  'large_org', 'verified'),
  ('00000000-0000-0000-0002-000000000005', 'cbo', 'samuel@heartlanddevicebank.org', 'Samuel Reyes', 'small_org', 'unverified')
ON CONFLICT (id) DO NOTHING;

-- M6-2: 2 new organizations (slug auto-generated by trigger from name)
INSERT INTO organizations (
  id, user_id, name, mission, email, phone, zipcode,
  logo_emoji, tagline, organization_type, year_founded, website,
  program_description, service_area_description
) VALUES
  (
    '00000000-0000-0000-0004-000000000004',
    '00000000-0000-0000-0002-000000000004',
    'Northland Code Coalition',
    'Northland Code Coalition brings hands-on coding and STEM education to youth in Kansas City''s Northland and surrounding rural districts, where access to computer science classes is limited or nonexistent.',
    'info@northlandcode.org',
    '(816) 555-0404',
    '64154',
    '⌨️',
    'Every kid north of the river deserves a keyboard.',
    'Nonprofit 501(c)(3)',
    2020,
    'https://northlandcode.org',
    'Our After-School Algorithms program runs weekly CS clubs at 6 Northland middle schools, serving 140 students a year.',
    'Clay and Platte Counties, Missouri — ZIP codes 64154, 64155, 64158, 64118.'
  ),
  (
    '00000000-0000-0000-0004-000000000005',
    '00000000-0000-0000-0002-000000000005',
    'Heartland Device Bank',
    'Heartland Device Bank collects, refurbishes, and redistributes donated computers and tablets to families, students, and nonprofits across the greater Kansas City region.',
    'info@heartlanddevicebank.org',
    '(913) 555-0505',
    '66061',
    '♻️',
    'One refurbished device. One open door.',
    'Nonprofit 501(c)(3)',
    2016,
    'https://heartlanddevicebank.org',
    'Our Refurb-to-Home pipeline wiped, repaired, and placed 1,800 devices last year through a network of 40 partner agencies.',
    'Johnson County, KS and the wider KC metro — ZIP codes 66061, 66062, 66210, 64108.'
  )
ON CONFLICT (id) DO NOTHING;

-- M6-3: Stripe-Connect-ready for the 2 new orgs (local dev donate flow)
UPDATE organizations SET
  stripe_account_id = 'acct_test_northland_code',
  stripe_charges_enabled = true, stripe_onboarding_complete = true, stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000004';
UPDATE organizations SET
  stripe_account_id = 'acct_test_heartland_device',
  stripe_charges_enabled = true, stripe_onboarding_complete = true, stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000005';

-- M6-4: logo + cover images for ALL 5 orgs (logo_url / cover_image_url were null
-- → public profile + cards looked empty). Logos via ui-avatars; covers via Unsplash.
UPDATE organizations SET
  logo_url        = '/demo-images/logo-connecting-roots-kc.svg',
  cover_image_url = '/demo-images/cover-org-connecting-roots-kc.svg'
WHERE id = '00000000-0000-0000-0004-000000000001';
UPDATE organizations SET
  logo_url        = '/demo-images/logo-kc-tech-bridge.svg',
  cover_image_url = '/demo-images/cover-org-kc-tech-bridge.svg'
WHERE id = '00000000-0000-0000-0004-000000000002';
UPDATE organizations SET
  logo_url        = '/demo-images/logo-digital-futures-kc.svg',
  cover_image_url = '/demo-images/cover-org-digital-futures-kc.svg'
WHERE id = '00000000-0000-0000-0004-000000000003';
UPDATE organizations SET
  logo_url        = '/demo-images/logo-northland-code-coalition.svg',
  cover_image_url = '/demo-images/cover-org-northland-code-coalition.svg'
WHERE id = '00000000-0000-0000-0004-000000000004';
UPDATE organizations SET
  logo_url        = '/demo-images/logo-heartland-device-bank.svg',
  cover_image_url = '/demo-images/cover-org-heartland-device-bank.svg'
WHERE id = '00000000-0000-0000-0004-000000000005';

-- M6-5: 6 campaigns (3 per new org)
INSERT INTO campaigns (id, organization_id, created_by, slug, amount_raised, supporters_count, created_at) VALUES
  ('00000000-0000-0000-0009-000000000009','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','northland-cs-club-laptops',          3200.00,  24, NOW()),
  ('00000000-0000-0000-0009-000000000010','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','robotics-kits-northland-middle',     5600.00,  41, NOW()),
  ('00000000-0000-0000-0009-000000000011','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','summer-code-camp-scholarships-2026', 1500.00,  11, NOW()),
  ('00000000-0000-0000-0009-000000000012','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','refurb-to-home-500-devices',         22400.00, 168, NOW()),
  ('00000000-0000-0000-0009-000000000013','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','student-hotspot-lending-library',    3900.00,  52, NOW()),
  ('00000000-0000-0000-0009-000000000014','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','repair-bench-tools-volunteer-corps', 2750.00,  22, NOW())
ON CONFLICT (id) DO NOTHING;

-- M6-6: approved v1 detail for each campaign (status='approved' + parent not
-- soft-deleted ⇒ visible via campaigns_select_public_published + the new
-- details_select_public_approved policy from 20260620000000).
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000009', 1, jsonb_build_object(
     'title','CS Club Laptops for Northland Middle Schoolers',
     'creator_name','Maya Okafor','creator_role','Executive Director','funding_goal',8000.00,
     'short_description','20 refurbished laptops so our weekly coding clubs stop sharing one cart between three schools.',
     'story_title','Three schools, one laptop cart',
     'story_content','<p>Our after-school CS clubs rotate a single 10-laptop cart between three middle schools. Kids code one week, then wait two. With 20 dedicated laptops every club meets weekly.</p>',
     'contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404',
     'image_url','/demo-images/cover-camp-6.svg'
   ), '00000000-0000-0000-0002-000000000004','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0009-000000000010', 1, jsonb_build_object(
     'title','Robotics Kits for Northland Middle',
     'creator_name','Maya Okafor','creator_role','Executive Director','funding_goal',9000.00,
     'short_description','15 classroom robotics kits to launch a competitive FIRST LEGO League team in each of our clubs.',
     'story_title','From clubs to competition',
     'story_content','<p>Our coders are ready for the next step. Robotics kits let them build, program, and compete — and every competition season we turn away kids for lack of hardware.</p>',
     'contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404',
     'image_url','/demo-images/cover-camp-7.svg'
   ), '00000000-0000-0000-0002-000000000004','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0009-000000000011', 1, jsonb_build_object(
     'title','Summer Code Camp Scholarships 2026',
     'creator_name','Maya Okafor','creator_role','Executive Director','funding_goal',6000.00,
     'short_description','Fund 30 full scholarships to our 2-week summer code camp for students who could not otherwise attend.',
     'story_title','A summer that changes a trajectory',
     'story_content','<p>Two weeks of full-day coding, robotics, and a showcase project. Last year every scholarship student finished; 40% enrolled in a school CS course in the fall.</p>',
     'contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404',
     'image_url','/demo-images/cover-camp-8.svg'
   ), '00000000-0000-0000-0002-000000000004','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0009-000000000012', 1, jsonb_build_object(
     'title','Refurb-to-Home: 500 Devices for KC Families',
     'creator_name','Samuel Reyes','creator_role','Founder & Director','funding_goal',40000.00,
     'short_description','Parts, labor, and logistics to wipe, repair, and place 500 donated laptops into homes this year.',
     'story_title','A device is the difference',
     'story_content','<p>Donated machines arrive in bins. Turning them into a working, wiped, warrantied laptop in a family''s home costs about $80 in parts and labor. Your gift moves 500 of them.</p>',
     'contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505',
     'image_url','/demo-images/cover-camp-9.svg'
   ), '00000000-0000-0000-0002-000000000005','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0009-000000000013', 1, jsonb_build_object(
     'title','Student Hotspot Lending Library',
     'creator_name','Samuel Reyes','creator_role','Founder & Director','funding_goal',7000.00,
     'short_description','100 LTE hotspots + a year of data, lent out like library books to students without home internet.',
     'story_title','The homework gap is a connectivity gap',
     'story_content','<p>A refurbished laptop is half the answer. The other half is getting online. A lending library of 100 hotspots keeps students connected through the school year.</p>',
     'contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505',
     'image_url','/demo-images/cover-camp-10.svg'
   ), '00000000-0000-0000-0002-000000000005','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0009-000000000014', 1, jsonb_build_object(
     'title','Repair Bench Tools for the Volunteer Corps',
     'creator_name','Samuel Reyes','creator_role','Founder & Director','funding_goal',5000.00,
     'short_description','Outfit 6 volunteer repair stations with toolkits, anti-static gear, and diagnostic software.',
     'story_title','Volunteers are our engine',
     'story_content','<p>120 volunteers refurbished 1,800 devices last year sharing two toolkits. Six proper repair benches doubles our throughput without adding staff.</p>',
     'contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505',
     'image_url','/demo-images/cover-camp-11.svg'
   ), '00000000-0000-0000-0002-000000000005','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- M6-7: lifecycle stamps so derived state = ACTIVE for all 6
UPDATE campaigns
SET first_approved_at = NOW() - INTERVAL '6 days', last_edit_approved_at = NOW() - INTERVAL '6 days'
WHERE id IN (
  '00000000-0000-0000-0009-000000000009','00000000-0000-0000-0009-000000000010','00000000-0000-0000-0009-000000000011',
  '00000000-0000-0000-0009-000000000012','00000000-0000-0000-0009-000000000013','00000000-0000-0000-0009-000000000014'
);


-- ============================================================
-- STEP M7 — 15 additional pending_initial_approval campaigns (W7-4)
-- ============================================================
-- 3 pending campaigns per org (5 orgs × 3 = 15), so the admin "Pending
-- Reviews" queue is non-trivial. Reserved id range ...0009-...020 .. ...034
-- (ids 1..14 are taken). Mirrors STEP A13-2d: campaigns row + a single v1
-- campaign_details with status='pending_initial_approval' and NO approved row,
-- so derived state = PENDING_INITIAL_APPROVAL → visible in admin queue, hidden
-- from the public approved list. Idempotent via ON CONFLICT.

INSERT INTO campaigns (id, organization_id, created_by, slug, amount_raised, supporters_count, created_at) VALUES
  ('00000000-0000-0000-0009-000000000020','00000000-0000-0000-0004-000000000001','00000000-0000-0000-0002-000000000001','pending-roots-after-school-tablets',     0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000021','00000000-0000-0000-0004-000000000001','00000000-0000-0000-0002-000000000001','pending-roots-family-wifi-stipends',      0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000022','00000000-0000-0000-0004-000000000001','00000000-0000-0000-0002-000000000001','pending-roots-mentor-laptop-fund',        0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000023','00000000-0000-0000-0004-000000000002','00000000-0000-0000-0002-000000000002','pending-bridge-coding-chromebooks',       0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000024','00000000-0000-0000-0004-000000000002','00000000-0000-0000-0002-000000000002','pending-bridge-accessible-workstations',  0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000025','00000000-0000-0000-0004-000000000002','00000000-0000-0000-0002-000000000002','pending-bridge-night-class-hotspots',     0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000026','00000000-0000-0000-0004-000000000003','00000000-0000-0000-0002-000000000003','pending-futures-job-seeker-laptops',      0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000027','00000000-0000-0000-0004-000000000003','00000000-0000-0000-0002-000000000003','pending-futures-shelter-phone-program',   0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000028','00000000-0000-0000-0004-000000000003','00000000-0000-0000-0002-000000000003','pending-futures-digital-literacy-lab',    0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000029','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','pending-northland-stem-tablet-carts',     0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000030','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','pending-northland-girls-who-code',        0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000031','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','pending-northland-rural-bus-wifi',        0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000032','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','pending-heartland-senior-tablet-drive',   0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000033','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','pending-heartland-partner-agency-kits',   0.00, 0, NOW()),
  ('00000000-0000-0000-0009-000000000034','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','pending-heartland-mobile-repair-van',     0.00, 0, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000020', 1, jsonb_build_object('title','After-School Tablets for Roots Scholars','creator_name','Amara Johnson','creator_role','Executive Director','funding_goal', 4200.00,'short_description','40 tablets for our after-school digital literacy block.','story_title','Homework needs hardware','story_content','<p>Our after-school program turns away students who have no device at home. 40 tablets closes that gap this term.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000021', 1, jsonb_build_object('title','Family Wi-Fi Stipends','creator_name','Amara Johnson','creator_role','Executive Director','funding_goal', 6000.00,'short_description','6 months of home internet for 25 families.','story_title','Connectivity is the new utility','story_content','<p>A device is useless without a connection. We are funding 6-month internet stipends for 25 families.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000022', 1, jsonb_build_object('title','Mentor Laptop Fund','creator_name','Amara Johnson','creator_role','Executive Director','funding_goal', 3500.00,'short_description','Refurbished laptops for our volunteer mentor corps.','story_title','Equip the mentors','story_content','<p>Our mentors run sessions on personal phones. Ten refurbished laptops lets them teach properly.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000023', 1, jsonb_build_object('title','Coding Chromebooks Cohort','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 5200.00,'short_description','30 Chromebooks for the spring coding cohort.','story_title','Build before you can run','story_content','<p>Our spring coding cohort needs 30 Chromebooks to start on time.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000024', 1, jsonb_build_object('title','Accessible Workstations','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 7800.00,'short_description','Adaptive workstations for learners with disabilities.','story_title','Access for every learner','story_content','<p>Adaptive keyboards, switches, and screen readers open our lab to learners with disabilities.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000025', 1, jsonb_build_object('title','Night-Class Hotspots','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 2900.00,'short_description','20 hotspots so adult night-class learners can finish coursework at home.','story_title','Learning after the shift ends','story_content','<p>Our adult learners study after work. 20 hotspots let them finish coursework from home.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000026', 1, jsonb_build_object('title','Job-Seeker Laptop Bank','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 6400.00,'short_description','Loaner laptops for clients in our job-readiness track.','story_title','A laptop is a paycheck away','story_content','<p>Clients in our job-readiness track need a laptop to apply, interview, and onboard remotely.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000027', 1, jsonb_build_object('title','Shelter Phone Program','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 5500.00,'short_description','Prepaid phones + service for clients leaving shelter.','story_title','Reachable means housed','story_content','<p>Clients leaving shelter lose housing placements when caseworkers cannot reach them. Phones fix that.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000028', 1, jsonb_build_object('title','Digital Literacy Lab','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 9200.00,'short_description','Build out a 12-seat digital literacy training lab.','story_title','One room, many futures','story_content','<p>A dedicated 12-seat lab lets us run structured digital literacy classes year-round.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000029', 1, jsonb_build_object('title','STEM Tablet Carts','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 8800.00,'short_description','Two mobile tablet carts for rotating Northland CS clubs.','story_title','Computer science on wheels','story_content','<p>Two mobile tablet carts let our CS clubs rotate across six schools without permanent labs.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000030', 1, jsonb_build_object('title','Girls Who Code Hardware','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 4600.00,'short_description','Laptops + robotics kits for a new Girls Who Code chapter.','story_title','Represent in the room','story_content','<p>A new Girls Who Code chapter needs 15 laptops and robotics kits to launch this fall.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000031', 1, jsonb_build_object('title','Rural Bus Wi-Fi','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 7100.00,'short_description','Wi-Fi routers on activity buses for long rural routes.','story_title','Homework on the ride home','story_content','<p>Our rural students ride 50+ minutes home. Bus Wi-Fi turns that into homework time.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000032', 1, jsonb_build_object('title','Senior Tablet Drive','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 5000.00,'short_description','60 simplified tablets for isolated seniors.','story_title','Connection at any age','story_content','<p>60 simplified tablets help isolated seniors reach telehealth, family, and benefits portals.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000033', 1, jsonb_build_object('title','Partner Agency Device Kits','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 12000.00,'short_description','Bulk refurbished kits for 10 partner agencies.','story_title','Multiply through partners','story_content','<p>Ten partner agencies can place devices faster than we can alone. We supply the refurbished kits.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0009-000000000034', 1, jsonb_build_object('title','Mobile Repair Van','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 15000.00,'short_description','Outfit a mobile repair van for on-site device service.','story_title','Bring the bench to them','story_content','<p>A mobile repair van brings device service to neighborhoods that cannot reach our shop.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'pending_initial_approval', 'Initial submission', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- Derived state for the 15 above is PENDING_INITIAL_APPROVAL (only a pending
-- detail, no approved row). Stamp last_edited_at; leave first_approved_at NULL.
UPDATE campaigns
SET last_edited_at = NOW() - INTERVAL '1 day'
WHERE id IN (
  '00000000-0000-0000-0009-000000000020','00000000-0000-0000-0009-000000000021','00000000-0000-0000-0009-000000000022',
  '00000000-0000-0000-0009-000000000023','00000000-0000-0000-0009-000000000024','00000000-0000-0000-0009-000000000025',
  '00000000-0000-0000-0009-000000000026','00000000-0000-0000-0009-000000000027','00000000-0000-0000-0009-000000000028',
  '00000000-0000-0000-0009-000000000029','00000000-0000-0000-0009-000000000030','00000000-0000-0000-0009-000000000031',
  '00000000-0000-0000-0009-000000000032','00000000-0000-0000-0009-000000000033','00000000-0000-0000-0009-000000000034'
);

-- ============================================================
-- STEP W7-1 — backfill org_tier / verification_status on existing rows
-- ============================================================
-- M1/M6-1 set these inline for fresh db:reset runs, but on an already-seeded DB
-- the ON CONFLICT DO NOTHING skips the INSERT, so existing rows keep the
-- column DEFAULT. This idempotent UPDATE forces the intended spread + gives the
-- admin user a tier/status too.
UPDATE user_profiles SET org_tier = 'small_org',  verification_status = 'verified'   WHERE id = '00000000-0000-0000-0002-000000000001';
UPDATE user_profiles SET org_tier = 'large_org',  verification_status = 'verified'   WHERE id = '00000000-0000-0000-0002-000000000002';
UPDATE user_profiles SET org_tier = 'small_org',  verification_status = 'verified'   WHERE id = '00000000-0000-0000-0002-000000000003';
UPDATE user_profiles SET org_tier = 'large_org',  verification_status = 'verified'   WHERE id = '00000000-0000-0000-0002-000000000004';
UPDATE user_profiles SET org_tier = 'small_org',  verification_status = 'unverified' WHERE id = '00000000-0000-0000-0002-000000000005';
UPDATE user_profiles SET org_tier = 'individual', verification_status = 'unverified' WHERE id = '00000000-0000-0000-0003-000000000001';
UPDATE user_profiles SET org_tier = 'individual', verification_status = 'verified'   WHERE id = '00000000-0000-0000-0003-000000000002';
UPDATE user_profiles SET org_tier = 'individual', verification_status = 'unverified' WHERE id = '00000000-0000-0000-0003-000000000003';
UPDATE user_profiles SET org_tier = 'large_org',  verification_status = 'verified'   WHERE id = '00000000-0000-0000-0001-000000000001';

-- ============================================================
-- STEP M8 — 5 campaign_reports (W7-11) covering all 4 statuses
-- ============================================================
-- Mix of anonymous (reporter_id NULL, email only) and signed-in reporters.
-- References existing seeded campaigns + donor ids. Idempotent via ON CONFLICT.
INSERT INTO campaign_reports (id, campaign_id, reporter_id, reporter_email, reason, description, status, admin_notes, resolved_by, resolved_at, created_at) VALUES
  ('00000000-0000-0000-000a-000000000001', '00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0003-000000000001', 'donor1@example.com', 'misleading', 'Funding goal seems higher than the stated need.', 'pending',   NULL, NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-000a-000000000002', '00000000-0000-0000-0009-000000000002', NULL, 'concerned.visitor@example.com', 'inappropriate', 'A photo in the story looks unrelated to the cause.', 'reviewing', 'Looking into the image source.', NULL, NULL, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-000a-000000000003', '00000000-0000-0000-0009-000000000004', '00000000-0000-0000-0003-000000000002', 'donor2@example.com', 'spam', 'Same campaign text posted under several orgs.', 'resolved',  'Verified original; not spam. Closed.', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-000a-000000000004', '00000000-0000-0000-0009-000000000005', NULL, 'anon-reporter@example.com', 'fraud', 'Org could not be found in the 501c3 lookup.', 'dismissed', 'Org confirmed registered under a parent EIN. Dismissed.', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-000a-000000000005', '00000000-0000-0000-0009-000000000007', NULL, NULL, 'other', 'Contact email on the campaign bounces.', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- STEP M9 — 10 pending-edit campaigns w/ multi-version history (W7-12)
-- ============================================================
-- 2 pending-EDIT campaigns per org (5 orgs × 2 = 10). A pending-edit campaign
-- is an already-APPROVED campaign with a NEWER detail version awaiting
-- approval (status='pending_edit_approval'). Mirrors STEP A13-2c (campaign 7)
-- but with RICHER history: each reaches version 3 or 4 — versions 1..(N-1)
-- are 'approved' (admin approver), latest version N is 'pending_edit_approval'.
-- Distribution: odd-last-digit ids (035,037,039,041,043) end at v3;
-- even (036,038,040,042,044) end at v4 → "version 3-4 for each".
-- Reserved id range ...0009-...035 .. ...044 (1..34 are taken by M1/M7).
-- Derived state = PENDING_EDIT_APPROVAL (approved history + latest pending):
-- appears in admin pending queue AND in the public approved list (it has
-- approved details). Idempotent via ON CONFLICT.

INSERT INTO campaigns (id, organization_id, created_by, slug, amount_raised, supporters_count, created_at) VALUES
  ('00000000-0000-0000-0009-000000000035','00000000-0000-0000-0004-000000000001','00000000-0000-0000-0002-000000000001','edit-roots-stem-saturday-studio',      3200.00,  41, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000036','00000000-0000-0000-0004-000000000001','00000000-0000-0000-0002-000000000001','edit-roots-family-device-library',     6750.00,  88, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000037','00000000-0000-0000-0004-000000000002','00000000-0000-0000-0002-000000000002','edit-bridge-adult-coding-track',       4900.00,  53, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000038','00000000-0000-0000-0004-000000000002','00000000-0000-0000-0002-000000000002','edit-bridge-vr-career-lab',            8100.00, 120, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000039','00000000-0000-0000-0004-000000000003','00000000-0000-0000-0002-000000000003','edit-futures-reentry-laptop-bank',     2750.00,  37, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000040','00000000-0000-0000-0004-000000000003','00000000-0000-0000-0002-000000000003','edit-futures-telehealth-tablets',      5400.00,  72, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000041','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','edit-northland-robotics-league',       3900.00,  49, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000042','00000000-0000-0000-0004-000000000004','00000000-0000-0000-0002-000000000004','edit-northland-mobile-cs-lab',         8900.00, 134, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000043','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','edit-heartland-refurb-scale-up',       1500.00,  22, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0009-000000000044','00000000-0000-0000-0004-000000000005','00000000-0000-0000-0002-000000000005','edit-heartland-rural-device-routes',   7300.00, 101, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- ---- 035 (org1) -> v3 (v1,v2 approved; v3 pending) -------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000035', 1, jsonb_build_object('title','STEM Saturday Studio','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 4000.00,'short_description','10 iPad bundles for our Saturday STEM studio.','story_title','Where pencils meet pixels','story_content','<p>Our Saturday teens build zines. 10 iPads let them move into digital art.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '25 days', 'Initial submission', NOW() - INTERVAL '26 days'),
  ('00000000-0000-0000-0009-000000000035', 2, jsonb_build_object('title','STEM Saturday Studio','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 5200.00,'short_description','14 iPad + Pencil bundles for our Saturday STEM studio.','story_title','Where pencils meet pixels','story_content','<p>Our Saturday teens build zines. 14 iPad + Pencil bundles let them move into digital art and beat production.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '15 days', 'Raised goal; added Apple Pencils', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0009-000000000035', 3, jsonb_build_object('title','STEM Saturday Studio (Spring Expansion)','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 6800.00,'short_description','20 iPad + Pencil bundles + a second Saturday cohort.','story_title','Where pencils meet pixels','story_content','<p>Demand doubled. 20 iPad + Pencil bundles let us open a second Saturday cohort for digital art and beat production.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 036 (org1) -> v4 (v1,v2,v3 approved; v4 pending) ----------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000036', 1, jsonb_build_object('title','Family Device Library','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 7000.00,'short_description','A lending library of 30 laptops for families.','story_title','Borrow a device, build a future','story_content','<p>Like a book library, but for laptops. Families borrow what they need.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '27 days', 'Initial submission', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0009-000000000036', 2, jsonb_build_object('title','Family Device Library','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 8500.00,'short_description','A lending library of 40 laptops + hotspots for families.','story_title','Borrow a device, build a future','story_content','<p>Like a book library, but for laptops. Families borrow a laptop and a hotspot together.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '18 days', 'Added hotspots to the lending bundle', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0009-000000000036', 3, jsonb_build_object('title','Family Device Library','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 9800.00,'short_description','50 laptops + hotspots, with weekend pickup hours.','story_title','Borrow a device, build a future','story_content','<p>Like a book library, but for laptops. 50 bundles, now with weekend pickup so working parents can reach us.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '7 days', 'Scaled to 50 bundles; added weekend hours', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0009-000000000036', 4, jsonb_build_object('title','Family Device Library (Citywide)','creator_name','Amara Johnson','creator_role','Program Director','funding_goal', 12500.00,'short_description','75 bundles across three neighborhood branches.','story_title','Borrow a device, build a future','story_content','<p>We are taking the lending library citywide — 75 bundles across three neighborhood branches with weekend pickup.</p>','contact_email','campaigns@connectingroots.org','phone','+1-816-555-0101'), '00000000-0000-0000-0002-000000000001', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 037 (org2) -> v3 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000037', 1, jsonb_build_object('title','Adult Coding Track','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 5000.00,'short_description','25 Chromebooks for our adult coding track.','story_title','Code your second act','story_content','<p>Adults retraining into tech need a real keyboard. 25 Chromebooks gets the track running.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '25 days', 'Initial submission', NOW() - INTERVAL '26 days'),
  ('00000000-0000-0000-0009-000000000037', 2, jsonb_build_object('title','Adult Coding Track','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 6200.00,'short_description','30 Chromebooks + a part-time TA stipend.','story_title','Code your second act','story_content','<p>Adults retraining into tech need a real keyboard and support. 30 Chromebooks plus a TA stipend keeps no one behind.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '15 days', 'Added TA stipend; +5 devices', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0009-000000000037', 3, jsonb_build_object('title','Adult Coding Track (Evening Section)','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 7600.00,'short_description','40 Chromebooks across day + new evening section.','story_title','Code your second act','story_content','<p>Shift workers asked for evenings. 40 Chromebooks lets us run both a day and an evening section with TA support.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 038 (org2) -> v4 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000038', 1, jsonb_build_object('title','VR Career Lab','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 8000.00,'short_description','6 VR headsets for hands-on career simulations.','story_title','Try the job before you train','story_content','<p>VR lets learners try welding, nursing, and logistics before committing to a track.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '27 days', 'Initial submission', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0009-000000000038', 2, jsonb_build_object('title','VR Career Lab','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 9600.00,'short_description','8 VR headsets + a charging cart.','story_title','Try the job before you train','story_content','<p>VR lets learners try welding, nursing, and logistics. 8 headsets and a charging cart keep the lab always ready.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '18 days', 'Added charging cart; +2 headsets', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0009-000000000038', 3, jsonb_build_object('title','VR Career Lab','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 11200.00,'short_description','10 headsets + a licensed simulation library.','story_title','Try the job before you train','story_content','<p>10 headsets plus a licensed simulation library opens dozens of careers to explore in VR.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '7 days', 'Added simulation license library', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0009-000000000038', 4, jsonb_build_object('title','VR Career Lab (Partner Schools)','creator_name','Lin Chen','creator_role','Programs Lead','funding_goal', 14000.00,'short_description','12 headsets shared on rotation with 4 partner schools.','story_title','Try the job before you train','story_content','<p>Four partner schools want in. 12 headsets on a rotation schedule plus the simulation library reaches hundreds more learners.</p>','contact_email','campaigns@kctechbridge.org','phone','+1-816-555-0122'), '00000000-0000-0000-0002-000000000002', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 039 (org3) -> v3 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000039', 1, jsonb_build_object('title','Re-entry Laptop Bank','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 4500.00,'short_description','Loaner laptops for clients leaving incarceration.','story_title','A laptop is a paycheck away','story_content','<p>Re-entry clients job-hunt online from day one. Loaner laptops make that possible.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '25 days', 'Initial submission', NOW() - INTERVAL '26 days'),
  ('00000000-0000-0000-0009-000000000039', 2, jsonb_build_object('title','Re-entry Laptop Bank','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 5400.00,'short_description','Loaner laptops + a resume-software license.','story_title','A laptop is a paycheck away','story_content','<p>Re-entry clients job-hunt online from day one. Laptops plus resume software get them interview-ready faster.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '15 days', 'Added resume-software license', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0009-000000000039', 3, jsonb_build_object('title','Re-entry Laptop Bank (Coaching Add-On)','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 6900.00,'short_description','Laptops, resume software, and 1:1 digital coaching.','story_title','A laptop is a paycheck away','story_content','<p>Hardware alone is not enough. We are adding 1:1 digital coaching so re-entry clients can actually land the job.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 040 (org3) -> v4 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000040', 1, jsonb_build_object('title','Telehealth Tablets','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 6000.00,'short_description','30 tablets for clients to attend telehealth visits.','story_title','See the doctor from the shelter','story_content','<p>Clients miss appointments they cannot travel to. Tablets bring the visit to them.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '27 days', 'Initial submission', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0009-000000000040', 2, jsonb_build_object('title','Telehealth Tablets','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 7200.00,'short_description','36 tablets + prepaid data for telehealth visits.','story_title','See the doctor from the shelter','story_content','<p>Clients miss appointments they cannot travel to. 36 tablets with prepaid data bring the visit to them anywhere.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '18 days', 'Added prepaid data plans', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0009-000000000040', 3, jsonb_build_object('title','Telehealth Tablets','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 8600.00,'short_description','45 tablets, data, and a private telehealth booth.','story_title','See the doctor from the shelter','story_content','<p>45 tablets with data plus a private booth give clients a confidential space for telehealth visits.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '7 days', 'Added private telehealth booth', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0009-000000000040', 4, jsonb_build_object('title','Telehealth Tablets (Two Sites)','creator_name','Devon Park','creator_role','Executive Director','funding_goal', 10800.00,'short_description','60 tablets and booths across two shelter sites.','story_title','See the doctor from the shelter','story_content','<p>A second shelter site asked to join. 60 tablets, data, and two private booths double our telehealth reach.</p>','contact_email','campaigns@digitalfutureskc.org','phone','+1-816-555-0133'), '00000000-0000-0000-0002-000000000003', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 041 (org4) -> v3 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000041', 1, jsonb_build_object('title','Northland Robotics League','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 5000.00,'short_description','4 robotics kits for our new after-school league.','story_title','Build, break, build again','story_content','<p>4 robotics kits launch an after-school league at two Northland schools.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '25 days', 'Initial submission', NOW() - INTERVAL '26 days'),
  ('00000000-0000-0000-0009-000000000041', 2, jsonb_build_object('title','Northland Robotics League','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 6100.00,'short_description','6 robotics kits + competition registration fees.','story_title','Build, break, build again','story_content','<p>6 robotics kits and tournament fees let our league actually compete this season.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '15 days', 'Added competition fees; +2 kits', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0009-000000000041', 3, jsonb_build_object('title','Northland Robotics League (Four Schools)','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 7500.00,'short_description','10 kits across four schools + travel to regionals.','story_title','Build, break, build again','story_content','<p>Two more schools joined. 10 kits plus travel funds send our league to the regional tournament.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 042 (org4) -> v4 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000042', 1, jsonb_build_object('title','Mobile CS Lab','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 9000.00,'short_description','A tablet cart that rotates CS clubs across schools.','story_title','Computer science on wheels','story_content','<p>One mobile cart lets a CS club rotate across schools with no permanent lab.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '27 days', 'Initial submission', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0009-000000000042', 2, jsonb_build_object('title','Mobile CS Lab','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 10500.00,'short_description','Two tablet carts covering six schools.','story_title','Computer science on wheels','story_content','<p>Demand outgrew one cart. Two carts let CS clubs rotate across six schools.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '18 days', 'Scaled to two carts / six schools', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0009-000000000042', 3, jsonb_build_object('title','Mobile CS Lab','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 12000.00,'short_description','Two carts + a part-time roving instructor.','story_title','Computer science on wheels','story_content','<p>Two carts plus a roving instructor means every rotation gets real teaching, not just hardware.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '7 days', 'Added roving instructor stipend', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0009-000000000042', 4, jsonb_build_object('title','Mobile CS Lab (County-Wide)','creator_name','Maya Okafor','creator_role','Founder','funding_goal', 15500.00,'short_description','Three carts + instructor covering the whole county.','story_title','Computer science on wheels','story_content','<p>The district asked us to go county-wide. Three carts and a full-time instructor reach every middle school.</p>','contact_email','campaigns@northlandcode.org','phone','+1-816-555-0404'), '00000000-0000-0000-0002-000000000004', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 043 (org5) -> v3 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000043', 1, jsonb_build_object('title','Refurbishing Scale-Up','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 3000.00,'short_description','Tools to double our monthly refurbishing output.','story_title','More benches, more devices','story_content','<p>New bench tools let our volunteers refurbish twice as many donated devices each month.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '25 days', 'Initial submission', NOW() - INTERVAL '26 days'),
  ('00000000-0000-0000-0009-000000000043', 2, jsonb_build_object('title','Refurbishing Scale-Up','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 3900.00,'short_description','Bench tools + bulk SSDs for faster refurbs.','story_title','More benches, more devices','story_content','<p>Bench tools plus bulk SSDs cut refurb time per device, so volunteers ship more each shift.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '15 days', 'Added bulk SSD purchase', NOW() - INTERVAL '16 days'),
  ('00000000-0000-0000-0009-000000000043', 3, jsonb_build_object('title','Refurbishing Scale-Up (Second Shift)','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 5200.00,'short_description','Tools, SSDs, and a second volunteer shift.','story_title','More benches, more devices','story_content','<p>Adding a second evening volunteer shift, with the tools and SSDs to match, triples our monthly output.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- ---- 044 (org5) -> v4 ------------------------------------------------------
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000044', 1, jsonb_build_object('title','Rural Device Routes','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 8000.00,'short_description','Fuel + kits to run monthly rural delivery routes.','story_title','We bring the device to you','story_content','<p>Rural neighbors cannot reach our shop. Monthly delivery routes bring refurbished devices to them.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '27 days', 'Initial submission', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0009-000000000044', 2, jsonb_build_object('title','Rural Device Routes','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 9400.00,'short_description','Two monthly routes covering four counties.','story_title','We bring the device to you','story_content','<p>One route was not enough. Two monthly routes now cover four rural counties.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '18 days', 'Added second county route', NOW() - INTERVAL '19 days'),
  ('00000000-0000-0000-0009-000000000044', 3, jsonb_build_object('title','Rural Device Routes','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 10900.00,'short_description','Routes + on-site setup help at each stop.','story_title','We bring the device to you','story_content','<p>We now stay to help set up each device on-site, so no neighbor is left with a box they cannot open.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'approved', '00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '7 days', 'Added on-site setup assistance', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0009-000000000044', 4, jsonb_build_object('title','Rural Device Routes (Weekly)','creator_name','Samuel Reyes','creator_role','Director','funding_goal', 13800.00,'short_description','Weekly routes across six counties with setup help.','story_title','We bring the device to you','story_content','<p>Going weekly across six counties, with on-site setup at every stop, keeps rural neighbors connected year-round.</p>','contact_email','campaigns@heartlanddevicebank.org','phone','+1-913-555-0505'), '00000000-0000-0000-0002-000000000005', 'pending_edit_approval', NULL, NULL, 'Raised goal / expanded story — awaiting re-approval', NOW() - INTERVAL '1 day')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- Derived state for the 10 above is PENDING_EDIT_APPROVAL: they have approved
-- history (v1..N-1) AND the latest detail row is pending_edit_approval. Stamp
-- first_approved_at (v1 approval), last_edit_approved_at (last APPROVED
-- version's approval), last_edited_at (the pending edit), requires_reapproval.
UPDATE campaigns SET first_approved_at = NOW() - INTERVAL '25 days', last_edit_approved_at = NOW() - INTERVAL '15 days', last_edited_at = NOW() - INTERVAL '1 day', requires_reapproval = true WHERE id IN (
  '00000000-0000-0000-0009-000000000035','00000000-0000-0000-0009-000000000037','00000000-0000-0000-0009-000000000039','00000000-0000-0000-0009-000000000041','00000000-0000-0000-0009-000000000043'
);
UPDATE campaigns SET first_approved_at = NOW() - INTERVAL '27 days', last_edit_approved_at = NOW() - INTERVAL '7 days', last_edited_at = NOW() - INTERVAL '1 day', requires_reapproval = true WHERE id IN (
  '00000000-0000-0000-0009-000000000036','00000000-0000-0000-0009-000000000038','00000000-0000-0000-0009-000000000040','00000000-0000-0000-0009-000000000042','00000000-0000-0000-0009-000000000044'
);

-- ============================================================
-- STEP M10 — 3 COMPLETE public org profiles (rich detail page)
-- ============================================================
-- Fills empty profile fields + team members + updates + populations
-- + cause areas for 3 of the 5 seeded orgs so their public
-- /organizations/:id page renders rich for donors/anon.
--   Connecting Roots KC   — 00000000-0000-0000-0004-000000000001
--   Digital Futures KC    — 00000000-0000-0000-0004-000000000003
--   Heartland Device Bank — 00000000-0000-0000-0004-000000000005
-- Idempotent: organizations UPDATEs are naturally re-runnable;
-- team_members/updates use deterministic ids (0000000b range) with
-- ON CONFLICT (id) DO NOTHING; populations/cause_areas rely on their
-- natural UNIQUE(organization_id, target) constraints. cause_areas /
-- identity_categories are referenced BY NAME (auto-generated ids are
-- not stable across reset). Re-runnable; never run as part of db:reset
-- alongside an existing dataset without conflict.

-- M10-1: organizations — fill empty public-profile fields.
-- Keeps existing mission / tagline / logo_url / cover_image_url /
-- website / program_description / service_area_description (STEP M6).
UPDATE organizations SET
  description = 'Connecting Roots KC bridges the digital divide for immigrant and refugee families across the Kansas City metro. Since 2014 we have paired refurbished laptops with multilingual digital-literacy coaching, helping new arrivals navigate school portals, telehealth, job applications, and citizenship paperwork. Technology is the root system beneath every other kind of opportunity — and we make sure no family is left without one.',
  city = 'Kansas City',
  state = 'MO',
  ein = '47-2018553',
  organization_size = '11-25 employees',
  technology_barriers = 'Many of the families we serve arrive without any home computer and rely on a single phone for everything from homework to immigration appointments. Donated laptops, tablets, and reliable internet hotspots let us put a real device in each household and run our weekly multilingual digital-literacy classes.',
  facebook_url = 'https://facebook.com/connectingrootskc',
  instagram_url = 'https://instagram.com/connectingrootskc',
  linkedin_url = 'https://linkedin.com/company/connecting-roots-kc',
  social_links = jsonb_build_object(
    'facebook',  'https://facebook.com/connectingrootskc',
    'instagram', 'https://instagram.com/connectingrootskc',
    'linkedin',  'https://linkedin.com/company/connecting-roots-kc'
  )
WHERE id = '00000000-0000-0000-0004-000000000001';

UPDATE organizations SET
  description = 'Digital Futures KC equips young people on Kansas City''s east side with the hardware, mentorship, and confidence to pursue careers in technology. Our labs run year-round coding bootcamps, hardware-repair apprenticeships, and a paid internship pipeline that places graduates with local tech employers. We believe a young person''s zip code should never decide whether they get to build the future.',
  city = 'Kansas City',
  state = 'MO',
  ein = '47-3309871',
  organization_size = '26-50 employees',
  technology_barriers = 'Our bootcamps are only as strong as the machines students learn on. We need modern laptops capable of running development environments, plus monitors and networking gear for our two community labs, so every student trains on the kind of hardware they will use on the job.',
  facebook_url = 'https://facebook.com/digitalfutureskc',
  instagram_url = 'https://instagram.com/digitalfutureskc',
  linkedin_url = 'https://linkedin.com/company/digital-futures-kc',
  social_links = jsonb_build_object(
    'facebook',  'https://facebook.com/digitalfutureskc',
    'instagram', 'https://instagram.com/digitalfutureskc',
    'linkedin',  'https://linkedin.com/company/digital-futures-kc'
  )
WHERE id = '00000000-0000-0000-0004-000000000003';

UPDATE organizations SET
  description = 'Heartland Device Bank is the metro''s technology recycler with a conscience. We collect retired computers and tablets from businesses and individuals, securely wipe and refurbish them, and redistribute them to families, students, and nonprofits across the greater Kansas City region. Every device we place keeps electronics out of the landfill and puts a working computer into the hands of someone who needs one.',
  city = 'Overland Park',
  state = 'KS',
  ein = '48-1276640',
  organization_size = '6-10 employees',
  technology_barriers = 'We can refurbish almost anything, but we depend on a steady stream of donated laptops, desktops, and tablets to keep our Refurb-to-Home pipeline full. Replacement parts — RAM, SSDs, chargers, and batteries — let our volunteer technicians bring older machines back to life instead of scrapping them.',
  facebook_url = 'https://facebook.com/heartlanddevicebank',
  instagram_url = 'https://instagram.com/heartlanddevicebank',
  linkedin_url = 'https://linkedin.com/company/heartland-device-bank',
  social_links = jsonb_build_object(
    'facebook',  'https://facebook.com/heartlanddevicebank',
    'instagram', 'https://instagram.com/heartlanddevicebank',
    'linkedin',  'https://linkedin.com/company/heartland-device-bank'
  )
WHERE id = '00000000-0000-0000-0004-000000000005';

-- M10-2: organization_team_members — 3 per org. Deterministic ids:
--   0000000b-0000-0000-000c-0000000000NN  (NN 01..09)
INSERT INTO organization_team_members
  (id, organization_id, name, role, bio, photo_url, email, display_order, is_active)
VALUES
  -- Connecting Roots KC
  ('0000000b-0000-0000-000c-000000000001','00000000-0000-0000-0004-000000000001',
   'Amara Diallo','Executive Director',
   'Amara founded Connecting Roots KC after a decade of resettlement casework, determined to close the technology gap she saw holding families back.',
   '/demo-images/logo-amara-diallo.svg',
   'amara@connectingrootskc.org',1,true),
  ('0000000b-0000-0000-000c-000000000002','00000000-0000-0000-0004-000000000001',
   'Luis Mendoza','Director of Programs',
   'Luis runs our multilingual digital-literacy curriculum and trains the volunteer coaches who sit beside families at every class.',
   '/demo-images/logo-luis-mendoza.svg',
   'luis@connectingrootskc.org',2,true),
  ('0000000b-0000-0000-000c-000000000003','00000000-0000-0000-0004-000000000001',
   'Priya Nair','Refurbishment Lead',
   'Priya leads the intake bench, wiping and rebuilding every donated laptop before it reaches a family.',
   '/demo-images/logo-priya-nair.svg',
   'priya@connectingrootskc.org',3,true),
  -- Digital Futures KC
  ('0000000b-0000-0000-000c-000000000004','00000000-0000-0000-0004-000000000003',
   'Marcus Bell','Founder & CEO',
   'A self-taught engineer from the east side, Marcus started Digital Futures KC to build the on-ramp into tech he never had growing up.',
   '/demo-images/logo-marcus-bell.svg',
   'marcus@digitalfutureskc.org',1,true),
  ('0000000b-0000-0000-000c-000000000005','00000000-0000-0000-0004-000000000003',
   'Jasmine Carter','Lead Instructor',
   'Jasmine designs and teaches our coding bootcamp, mentoring students from their first line of code to their first job offer.',
   '/demo-images/logo-jasmine-carter.svg',
   'jasmine@digitalfutureskc.org',2,true),
  ('0000000b-0000-0000-000c-000000000006','00000000-0000-0000-0004-000000000003',
   'Daniel Okeke','Partnerships Manager',
   'Daniel builds the employer relationships that turn our graduates into paid interns and full-time hires.',
   '/demo-images/logo-daniel-okeke.svg',
   'daniel@digitalfutureskc.org',3,true),
  -- Heartland Device Bank
  ('0000000b-0000-0000-000c-000000000007','00000000-0000-0000-0004-000000000005',
   'Samuel Reyes','Executive Director',
   'Samuel turned a garage refurbishing hobby into a regional device bank that has placed thousands of computers across the metro.',
   '/demo-images/logo-samuel-reyes.svg',
   'samuel@heartlanddevicebank.org',1,true),
  ('0000000b-0000-0000-000c-000000000008','00000000-0000-0000-0004-000000000005',
   'Grace Liu','Operations Manager',
   'Grace manages intake, secure data-wiping, and the logistics of getting refurbished devices to forty partner agencies.',
   '/demo-images/logo-grace-liu.svg',
   'grace@heartlanddevicebank.org',2,true),
  ('0000000b-0000-0000-000c-000000000009','00000000-0000-0000-0004-000000000005',
   'Tom Becker','Lead Technician',
   'Tom heads the volunteer repair bench, coaxing life back into machines other recyclers would scrap.',
   '/demo-images/logo-tom-becker.svg',
   'tom@heartlanddevicebank.org',3,true)
ON CONFLICT (id) DO NOTHING;

-- M10-3: organization_updates — 3 published per org. Deterministic ids:
--   0000000b-0000-0000-000d-0000000000NN  (NN 01..09); staggered created_at.
INSERT INTO organization_updates
  (id, organization_id, title, content, image_url, is_published, created_at)
VALUES
  -- Connecting Roots KC
  ('0000000b-0000-0000-000d-000000000001','00000000-0000-0000-0004-000000000001',
   '50 Families Connected This Spring',
   'Thanks to a wave of laptop donations, we placed devices with 50 immigrant and refugee families this spring and ran our largest digital-literacy cohort yet.',
   '/demo-images/cover-5.svg',
   true, NOW() - INTERVAL '7 days'),
  ('0000000b-0000-0000-000d-000000000002','00000000-0000-0000-0004-000000000001',
   'New Saturday Digital-Literacy Class',
   'We have added a Saturday morning class in Swahili and Dari so working parents can join. Volunteer coaches make it possible — reach out if you can help.',
   '/demo-images/cover-1.svg',
   true, NOW() - INTERVAL '21 days'),
  ('0000000b-0000-0000-000d-000000000003','00000000-0000-0000-0004-000000000001',
   'Partnering With Three New Schools',
   'Connecting Roots KC is now embedded in three more KCPS schools, helping newcomer students and parents log in to school portals with confidence.',
   '/demo-images/cover-6.svg',
   true, NOW() - INTERVAL '45 days'),
  -- Digital Futures KC
  ('0000000b-0000-0000-000d-000000000004','00000000-0000-0000-0004-000000000003',
   'Spring Bootcamp Graduates 28 Students',
   'Our spring coding bootcamp graduated 28 students — and 19 have already started paid internships with local tech employers. We could not be prouder.',
   '/demo-images/cover-1.svg',
   true, NOW() - INTERVAL '10 days'),
  ('0000000b-0000-0000-000d-000000000005','00000000-0000-0000-0004-000000000003',
   'Second Community Lab Opens',
   'We cut the ribbon on our second east-side community lab this month, doubling the number of students who can train on professional-grade hardware.',
   '/demo-images/cover-2.svg',
   true, NOW() - INTERVAL '30 days'),
  ('0000000b-0000-0000-000d-000000000006','00000000-0000-0000-0004-000000000003',
   'Hardware-Repair Apprenticeship Launches',
   'A new paid apprenticeship teaches students to diagnose and repair laptops — a marketable skill and a way to keep our own labs running.',
   '/demo-images/cover-3.svg',
   true, NOW() - INTERVAL '55 days'),
  -- Heartland Device Bank
  ('0000000b-0000-0000-000d-000000000007','00000000-0000-0000-0004-000000000005',
   '1,800 Devices Placed Last Year',
   'Our Refurb-to-Home pipeline wiped, repaired, and placed 1,800 devices last year through a network of 40 partner agencies. On to 2,000 this year.',
   '/demo-images/cover-4.svg',
   true, NOW() - INTERVAL '5 days'),
  ('0000000b-0000-0000-000d-000000000008','00000000-0000-0000-0004-000000000005',
   'Corporate Donation: 200 Laptops',
   'A local employer retired its fleet and donated 200 laptops to Heartland Device Bank. Our volunteer bench is busy turning them into home computers.',
   '/demo-images/cover-5.svg',
   true, NOW() - INTERVAL '24 days'),
  ('0000000b-0000-0000-000d-000000000009','00000000-0000-0000-0004-000000000005',
   'Certified Data-Wiping Now Standard',
   'Every device that leaves our shop is now wiped to a certified data-sanitization standard, so donors and recipients can trust their information is gone for good.',
   '/demo-images/cover-2.svg',
   true, NOW() - INTERVAL '50 days')
ON CONFLICT (id) DO NOTHING;

-- M10-4: organization_populations — 2-3 per org. identity_categories
-- referenced BY NAME (ids auto-generated). Natural UNIQUE(org, category)
-- makes this idempotent.
INSERT INTO organization_populations (organization_id, identity_category_id)
SELECT v.org_id, ic.id
FROM (VALUES
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Hispanic/Latinx'),
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Black/African American'),
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Youth'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Youth'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Black/African American'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Asian American'),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Seniors'),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Veterans'),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Disability')
) AS v(org_id, cat_name)
JOIN identity_categories ic ON ic.name = v.cat_name
ON CONFLICT (organization_id, identity_category_id) DO NOTHING;

-- M10-5: organization_cause_areas — 2-3 per org. cause_areas referenced
-- BY NAME; cause_area_id is TEXT (uuid cast to text). Natural
-- UNIQUE(org, cause_area_id) makes this idempotent.
INSERT INTO organization_cause_areas (organization_id, cause_area_id)
SELECT v.org_id, ca.id::text
FROM (VALUES
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Education'),
  ('00000000-0000-0000-0004-000000000001'::uuid, 'Community Services'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Education'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Youth Development'),
  ('00000000-0000-0000-0004-000000000003'::uuid, 'Economic Development'),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Community Services'),
  ('00000000-0000-0000-0004-000000000005'::uuid, 'Environment')
) AS v(org_id, ca_name)
JOIN cause_areas ca ON ca.name = v.ca_name
ON CONFLICT (organization_id, cause_area_id) DO NOTHING;



-- ============================================================
-- STEP M11 — 6th COMPLETE CBO + profile + 2 approved campaigns
-- ============================================================
-- A fully-populated 6th organization so an admin (or any CBO owner) lands
-- on a non-empty /cbo/dashboard: org row + Stripe-connect-ready + complete
-- public profile (description / location / EIN / size / socials), 3 team
-- members, 3 published updates, 3 populations, 3 cause areas, and 2 approved
-- campaigns. Mirrors STEP M6 (org + campaigns) and STEP M10 (rich profile).
--
-- Reserved id ranges (verified collision-free at authoring time):
--   owner user_profiles : 00000000-0000-0000-0002-000000000006
--   organization        : 00000000-0000-0000-0004-000000000006
--   team members        : 0000000e-0000-0000-000c-0000000000NN  (NN 01..03)
--   updates             : 0000000e-0000-0000-000d-0000000000NN  (NN 01..03)
--   campaigns           : 00000000-0000-0000-0009-000000000045 / ...046
--                          (existing 0009 ids run 001..044)
--
-- cause_areas / identity_categories referenced BY NAME (auto-generated ids
-- are not reset-stable). Idempotent: ON CONFLICT (id) DO NOTHING on rows
-- with deterministic ids; natural UNIQUE(org, target) on populations /
-- cause_areas; ON CONFLICT (campaign_id, version) on campaign_details.
--
-- NOTE: this seeds the org under the mock owner ...0002-...006. In the live
-- dev DB the org is then reassigned to the real admin (taek) Clerk id via a
-- dev-specific UPDATE that is intentionally NOT in this file — see the
-- task report / docs for the reassignment snippet to re-apply after db:reset.

-- M11-1: mock CBO owner
INSERT INTO user_profiles (id, user_type, email, name, org_tier, verification_status) VALUES
  ('00000000-0000-0000-0002-000000000006', 'cbo', 'tariq@kcconnecthub.org', 'Tariq Hassan', 'large_org', 'verified')
ON CONFLICT (id) DO NOTHING;

-- M11-2: organization (slug auto-generated by trigger from name)
INSERT INTO organizations (
  id, user_id, name, mission, email, phone, zipcode,
  logo_emoji, tagline, organization_type, year_founded, website,
  program_description, service_area_description
) VALUES
  (
    '00000000-0000-0000-0004-000000000006',
    '00000000-0000-0000-0002-000000000006',
    'KC Connect Hub',
    'KC Connect Hub closes the digital divide across Kansas City by pairing refurbished devices with home internet access and one-on-one digital navigation, so every resident can work, learn, and access care online.',
    'info@kcconnecthub.org',
    '(816) 555-0606',
    '64108',
    '🔌',
    'Plug every neighbor into opportunity.',
    'Nonprofit 501(c)(3)',
    2018,
    'https://kcconnecthub.org',
    'Our Connect & Coach program places a refurbished laptop, a year of subsidized internet, and a trained digital navigator with 600 households a year across the urban core.',
    'Jackson County, Missouri and the KC urban core — ZIP codes 64108, 64109, 64110, 64127, 64128.'
  )
ON CONFLICT (id) DO NOTHING;

-- M11-3: Stripe-Connect-ready (local dev donate flow)
UPDATE organizations SET
  stripe_account_id = 'acct_test_kc_connect_hub',
  stripe_charges_enabled = true, stripe_onboarding_complete = true, stripe_details_submitted = true
WHERE id = '00000000-0000-0000-0004-000000000006';

-- M11-4: logo + cover image
UPDATE organizations SET
  logo_url        = '/demo-images/logo-kc-connect-hub.svg',
  cover_image_url = '/demo-images/cover-org-kc-connect-hub.svg'
WHERE id = '00000000-0000-0000-0004-000000000006';

-- M11-5: complete public-profile fields (M10 style)
UPDATE organizations SET
  description = 'KC Connect Hub is Kansas City''s digital-equity hub, founded in 2018 on the belief that internet access and a working device are basic infrastructure for modern life. We refurbish donated laptops and tablets, subsidize home internet, and pair every household with a trained digital navigator who sits beside them as they set up email, apply for jobs, schedule telehealth visits, and help their kids log into school. From the urban core outward, we make sure no neighbor is left offline.',
  city = 'Kansas City',
  state = 'MO',
  ein = '47-5561029',
  organization_size = '11-25 employees',
  technology_barriers = 'The families we serve often share a single phone for an entire household. A steady supply of donated laptops, tablets, and LTE hotspots — plus replacement chargers, batteries, and SSDs for our refurbishment bench — lets us put a real device and a real connection into every home we coach.',
  facebook_url = 'https://facebook.com/kcconnecthub',
  instagram_url = 'https://instagram.com/kcconnecthub',
  linkedin_url = 'https://linkedin.com/company/kc-connect-hub',
  social_links = jsonb_build_object(
    'facebook',  'https://facebook.com/kcconnecthub',
    'instagram', 'https://instagram.com/kcconnecthub',
    'linkedin',  'https://linkedin.com/company/kc-connect-hub'
  )
WHERE id = '00000000-0000-0000-0004-000000000006';

-- M11-6: organization_team_members — 3. Deterministic ids: 0000000e-...-000c-...NN
INSERT INTO organization_team_members
  (id, organization_id, name, role, bio, photo_url, email, display_order, is_active)
VALUES
  ('0000000e-0000-0000-000c-000000000001','00000000-0000-0000-0004-000000000006',
   'Tariq Hassan','Executive Director',
   'Tariq founded KC Connect Hub after years as a public-library tech aide, where he watched residents turned away from jobs and benefits for lack of a device and a connection.',
   '/demo-images/logo-tariq-hassan.svg',
   'tariq@kcconnecthub.org',1,true),
  ('0000000e-0000-0000-000c-000000000002','00000000-0000-0000-0004-000000000006',
   'Rosa Martinez','Director of Digital Navigation',
   'Rosa builds and leads our team of bilingual digital navigators who coach families one-on-one from first login to confident daily use.',
   '/demo-images/logo-rosa-martinez.svg',
   'rosa@kcconnecthub.org',2,true),
  ('0000000e-0000-0000-000c-000000000003','00000000-0000-0000-0004-000000000006',
   'James Whitfield','Refurbishment Manager',
   'James runs the intake bench, securely wiping and rebuilding every donated laptop and tablet before it ships to a household.',
   '/demo-images/logo-james-whitfield.svg',
   'james@kcconnecthub.org',3,true)
ON CONFLICT (id) DO NOTHING;

-- M11-7: organization_updates — 3 published. Deterministic ids: 0000000e-...-000d-...NN
INSERT INTO organization_updates
  (id, organization_id, title, content, image_url, is_published, created_at)
VALUES
  ('0000000e-0000-0000-000d-000000000001','00000000-0000-0000-0004-000000000006',
   '600 Households Connected This Year',
   'We hit a milestone this quarter: 600 households now have a refurbished device, subsidized home internet, and a digital navigator on call. Thank you to every donor who made it possible.',
   '/demo-images/cover-5.svg',
   true, NOW() - INTERVAL '6 days'),
  ('0000000e-0000-0000-000d-000000000002','00000000-0000-0000-0004-000000000006',
   'New Telehealth Navigation Clinic',
   'Our navigators now run a weekly walk-in clinic helping residents set up and join telehealth visits — no more missed appointments because the video link would not load.',
   '/demo-images/cover-1.svg',
   true, NOW() - INTERVAL '20 days'),
  ('0000000e-0000-0000-000d-000000000003','00000000-0000-0000-0004-000000000006',
   'Corporate Laptop Drive: 150 Devices',
   'A local employer retired its laptop fleet and donated 150 machines to KC Connect Hub. Our refurbishment bench is busy turning them into home computers for waitlisted families.',
   '/demo-images/cover-5.svg',
   true, NOW() - INTERVAL '40 days')
ON CONFLICT (id) DO NOTHING;

-- M11-8: organization_populations — 3 by-name (UNIQUE(org, category) idempotent)
INSERT INTO organization_populations (organization_id, identity_category_id)
SELECT v.org_id, ic.id
FROM (VALUES
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Hispanic/Latinx'),
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Black/African American'),
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Seniors')
) AS v(org_id, cat_name)
JOIN identity_categories ic ON ic.name = v.cat_name
ON CONFLICT (organization_id, identity_category_id) DO NOTHING;

-- M11-9: organization_cause_areas — 3 by-name (UNIQUE(org, cause_area_id) idempotent)
INSERT INTO organization_cause_areas (organization_id, cause_area_id)
SELECT v.org_id, ca.id::text
FROM (VALUES
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Education'),
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Community Services'),
  ('00000000-0000-0000-0004-000000000006'::uuid, 'Economic Development')
) AS v(org_id, ca_name)
JOIN cause_areas ca ON ca.name = v.ca_name
ON CONFLICT (organization_id, cause_area_id) DO NOTHING;

-- M11-10: 2 campaigns (ids ...045 / ...046, collision-free above ...044)
INSERT INTO campaigns (id, organization_id, created_by, slug, amount_raised, supporters_count, created_at) VALUES
  ('00000000-0000-0000-0009-000000000045','00000000-0000-0000-0004-000000000006','00000000-0000-0000-0002-000000000006','connect-hub-200-home-laptops',      9800.00,  72, NOW()),
  ('00000000-0000-0000-0009-000000000046','00000000-0000-0000-0004-000000000006','00000000-0000-0000-0002-000000000006','connect-hub-digital-navigator-corps',4300.00,  38, NOW())
ON CONFLICT (id) DO NOTHING;

-- M11-11: approved v1 detail for each campaign (derived state = ACTIVE)
INSERT INTO campaign_details (campaign_id, version, content, changed_by, status, approved_by, approved_at, change_summary, created_at) VALUES
  ('00000000-0000-0000-0009-000000000045', 1, jsonb_build_object(
     'title','200 Home Laptops for KC Families',
     'creator_name','Tariq Hassan','creator_role','Executive Director','funding_goal',16000.00,
     'short_description','Refurbish and place 200 laptops into homes on our digital-navigation waitlist this year.',
     'story_title','A device ends the waitlist',
     'story_content','<p>Hundreds of families are on our waitlist with no computer at home. Every refurbished laptop — about $80 in parts and labor — moves one of them off the list and online for good.</p>',
     'contact_email','campaigns@kcconnecthub.org','phone','+1-816-555-0606',
     'image_url','/demo-images/cover-camp-12.svg'
   ), '00000000-0000-0000-0002-000000000006','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0009-000000000046', 1, jsonb_build_object(
     'title','Grow the Digital Navigator Corps',
     'creator_name','Tariq Hassan','creator_role','Executive Director','funding_goal',9000.00,
     'short_description','Fund stipends and training for 8 bilingual digital navigators who coach families one-on-one.',
     'story_title','Hardware is half the answer',
     'story_content','<p>A laptop and a connection only matter if someone shows you how to use them. Eight trained, bilingual navigators let us coach hundreds more households from first login to confident daily use.</p>',
     'contact_email','campaigns@kcconnecthub.org','phone','+1-816-555-0606',
     'image_url','/demo-images/cover-camp-13.svg'
   ), '00000000-0000-0000-0002-000000000006','approved','00000000-0000-0000-0001-000000000001', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days')
ON CONFLICT (campaign_id, version) DO NOTHING;

-- M11-12: lifecycle stamps so derived state = ACTIVE for both campaigns
UPDATE campaigns
SET first_approved_at = NOW() - INTERVAL '5 days', last_edit_approved_at = NOW() - INTERVAL '5 days'
WHERE id IN (
  '00000000-0000-0000-0009-000000000045','00000000-0000-0000-0009-000000000046'
);

COMMIT;
