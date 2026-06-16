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
INSERT INTO user_profiles (id, user_type, is_vetted, email, name) VALUES
  ('00000000-0000-0000-0002-000000000001', 'cbo',   true,  'amara@connectingroots.org',   'Amara Johnson'),
  ('00000000-0000-0000-0002-000000000002', 'cbo',   true,  'lin@kctechbridge.org',        'Lin Chen'),
  ('00000000-0000-0000-0002-000000000003', 'cbo',   true,  'devon@digitalfutureskc.org',  'Devon Park'),
  ('00000000-0000-0000-0003-000000000001', 'donor', false, 'donor1@example.com',          'Marcus Tanner'),
  ('00000000-0000-0000-0003-000000000002', 'donor', false, 'donor2@example.com',          'Priya Sharma'),
  ('00000000-0000-0000-0003-000000000003', 'donor', false, 'donor3@example.com',          'James Wallace')
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
     'image_url', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
     'logo_url', 'https://example.com/img/connecting-roots-logo.png',
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
     'image_url', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80',
     'logo_url', 'https://example.com/img/digital-futures-logo.png',
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
     'image_url', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'
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
     'image_url', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1200&q=80',
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
     'logo_url', 'https://example.com/img/connecting-roots-logo.png'
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
     'logo_url', 'https://example.com/img/connecting-roots-logo.png'
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
     'image_url', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
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

COMMIT;
