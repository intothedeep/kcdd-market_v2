-- =============================================
-- KC Digital Drive Market - Seed Data
-- =============================================
-- 
-- INSTRUCTIONS:
-- 1. Get your Clerk User ID from the Clerk Dashboard or from your app
--    (It looks like: user_2abc123def456...)
-- 2. Replace 'user_36GywD2buLf2HpGSfhl9etUzCFK' below with your actual ID
-- 3. Run this script in Supabase SQL Editor
--
-- =============================================

-- Set your Clerk User ID here
DO $$
DECLARE
    my_user_id TEXT := 'user_36GywD2buLf2HpGSfhl9etUzCFK';  -- <-- REPLACE THIS
BEGIN
    RAISE NOTICE 'Using user ID: %', my_user_id;
END $$;

-- =============================================
-- 1. CAUSE AREAS
-- =============================================
INSERT INTO cause_areas (id, name, description) VALUES
    ('ca-education', 'Education', 'Supporting students and educators with technology for learning'),
    ('ca-digital-access', 'Digital Access', 'Bridging the digital divide with internet and devices'),
    ('ca-employment', 'Employment', 'Helping job seekers with technology for career advancement'),
    ('ca-senior-services', 'Senior Services', 'Connecting seniors with technology and digital literacy'),
    ('ca-nonprofit-support', 'Nonprofit Support', 'Equipping nonprofits with technology infrastructure'),
    ('ca-small-business', 'Small Business', 'Supporting entrepreneurs and small business owners'),
    ('ca-healthcare', 'Healthcare', 'Technology for health services and telehealth access'),
    ('ca-housing', 'Housing', 'Supporting housing organizations and residents')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. CHALLENGE CATEGORIES
-- =============================================
INSERT INTO challenge_categories (id, name) VALUES
    ('cc-poverty', 'Poverty'),
    ('cc-unemployment', 'Unemployment'),
    ('cc-homelessness', 'Homelessness'),
    ('cc-disability', 'Disability'),
    ('cc-mental-health', 'Mental Health'),
    ('cc-substance-abuse', 'Substance Abuse'),
    ('cc-domestic-violence', 'Domestic Violence'),
    ('cc-immigration', 'Immigration')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. IDENTITY CATEGORIES
-- =============================================
INSERT INTO identity_categories (id, name) VALUES
    ('ic-veterans', 'Veterans'),
    ('ic-seniors', 'Seniors'),
    ('ic-youth', 'Youth'),
    ('ic-women', 'Women'),
    ('ic-lgbtq', 'LGBTQ+'),
    ('ic-immigrants', 'Immigrants'),
    ('ic-disabled', 'People with Disabilities'),
    ('ic-single-parents', 'Single Parents')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. USER PROFILE (for you - the donor)
-- Replace user_36GywD2buLf2HpGSfhl9etUzCFK with your actual Clerk user ID
-- =============================================
INSERT INTO user_profiles (id, user_type, phone, is_vetted, onboarding_complete, wants_updates)
VALUES ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'donor', '(816) 555-0100', true, true, true)
ON CONFLICT (id) DO UPDATE SET
    is_vetted = true,
    onboarding_complete = true;

-- =============================================
-- 5. DONOR PROFILE (for you)
-- =============================================
INSERT INTO donor_profiles (id, user_id, display_name, name, email, bio, max_per_request, service_area_zipcode)
VALUES (
    gen_random_uuid(),
    'user_36GywD2buLf2HpGSfhl9etUzCFK',
    'Joshua',
    'Joshua Madrid',
    'joshua@example.com',
    'Passionate about bridging the digital divide in Kansas City.',
    1000,
    '64108'
)
ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    name = EXCLUDED.name;

-- =============================================
-- 6. CBO USER PROFILES (Organization Admins)
-- =============================================
INSERT INTO user_profiles (id, user_type, phone, is_vetted, onboarding_complete, wants_updates) VALUES
    ('cbo-user-1', 'cbo', '(816) 555-0101', true, true, true),
    ('cbo-user-2', 'cbo', '(816) 555-0102', true, true, true),
    ('cbo-user-3', 'cbo', '(816) 555-0103', true, true, true),
    ('cbo-user-4', 'cbo', '(816) 555-0104', true, true, true),
    ('cbo-user-5', 'cbo', '(816) 555-0105', true, true, false),
    ('cbo-user-6', 'cbo', '(816) 555-0106', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. ORGANIZATIONS (CBOs)
-- =============================================
INSERT INTO organizations (id, user_id, name, website, mission, email, phone, address, zipcode, ein, logo_emoji) VALUES
    (
        'org-kc-youth-education',
        'cbo-user-1',
        'KC Youth Education',
        'https://kcyoutheducation.org',
        'Empowering Kansas City youth through technology and education programs.',
        'contact@kcyoutheducation.org',
        '(816) 555-0201',
        '1200 Main Street, Kansas City, MO',
        '64105',
        '12-3456789',
        '📚'
    ),
    (
        'org-digital-bridge-kc',
        'cbo-user-2',
        'Digital Bridge KC',
        'https://digitalbridgekc.org',
        'Connecting underserved communities to the internet and digital resources.',
        'info@digitalbridgekc.org',
        '(816) 555-0202',
        '450 Grand Blvd, Kansas City, MO',
        '64106',
        '23-4567890',
        '🌐'
    ),
    (
        'org-senior-tech-connect',
        'cbo-user-3',
        'Senior Tech Connect',
        'https://seniortechconnect.org',
        'Helping seniors stay connected through technology education and support.',
        'hello@seniortechconnect.org',
        '(816) 555-0203',
        '789 Oak Street, Kansas City, MO',
        '64108',
        '34-5678901',
        '👴'
    ),
    (
        'org-employment-first-kc',
        'cbo-user-4',
        'Employment First KC',
        'https://employmentfirstkc.org',
        'Preparing job seekers with technology skills and equipment for career success.',
        'jobs@employmentfirstkc.org',
        '(816) 555-0204',
        '321 Commerce Drive, Kansas City, MO',
        '64111',
        '45-6789012',
        '💼'
    ),
    (
        'org-entrepreneurship-hub',
        'cbo-user-5',
        'Entrepreneurship Hub',
        'https://entrepreneurshiphub.org',
        'Supporting small business owners and entrepreneurs with technology resources.',
        'support@entrepreneurshiphub.org',
        '(816) 555-0205',
        '567 Innovation Way, Kansas City, MO',
        '64112',
        '56-7890123',
        '🚀'
    ),
    (
        'org-community-action-network',
        'cbo-user-6',
        'Community Action Network',
        'https://communityactionnetwork.org',
        'Building stronger communities through technology access and digital equity.',
        'info@communityactionnetwork.org',
        '(816) 555-0206',
        '890 Community Lane, Kansas City, KS',
        '66101',
        '67-8901234',
        '🏢'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. ORGANIZATION CAUSE AREAS (Many-to-Many)
-- =============================================
INSERT INTO organization_cause_areas (organization_id, cause_area_id) VALUES
    ('org-kc-youth-education', 'ca-education'),
    ('org-kc-youth-education', 'ca-digital-access'),
    ('org-digital-bridge-kc', 'ca-digital-access'),
    ('org-digital-bridge-kc', 'ca-housing'),
    ('org-senior-tech-connect', 'ca-senior-services'),
    ('org-senior-tech-connect', 'ca-healthcare'),
    ('org-employment-first-kc', 'ca-employment'),
    ('org-employment-first-kc', 'ca-digital-access'),
    ('org-entrepreneurship-hub', 'ca-small-business'),
    ('org-entrepreneurship-hub', 'ca-employment'),
    ('org-community-action-network', 'ca-nonprofit-support'),
    ('org-community-action-network', 'ca-digital-access')
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. REQUESTS - Open (waiting for donors)
-- =============================================
INSERT INTO requests (id, organization_id, cause_area_id, description, amount, urgency, zipcode, status, created_at) VALUES
    (
        'req-open-1',
        'org-kc-youth-education',
        'ca-education',
        'Laptop for high school student preparing for college applications',
        450.00,
        'high',
        '64105',
        'open',
        NOW() - INTERVAL '2 days'
    ),
    (
        'req-open-2',
        'org-digital-bridge-kc',
        'ca-digital-access',
        'Internet hotspot device for family of 5 without home internet',
        120.00,
        'high',
        '64106',
        'open',
        NOW() - INTERVAL '1 day'
    ),
    (
        'req-open-3',
        'org-senior-tech-connect',
        'ca-senior-services',
        'Tablet with large display for senior citizen with vision impairment',
        320.00,
        'medium',
        '64108',
        'open',
        NOW() - INTERVAL '3 days'
    ),
    (
        'req-open-4',
        'org-employment-first-kc',
        'ca-employment',
        'Webcam and headset for remote job interviews',
        85.00,
        'high',
        '64111',
        'open',
        NOW() - INTERVAL '12 hours'
    ),
    (
        'req-open-5',
        'org-entrepreneurship-hub',
        'ca-small-business',
        'Printer/scanner combo for home-based craft business',
        199.00,
        'medium',
        '64112',
        'open',
        NOW() - INTERVAL '4 days'
    ),
    (
        'req-open-6',
        'org-community-action-network',
        'ca-nonprofit-support',
        'Refurbished desktop computer for volunteer coordinator',
        350.00,
        'low',
        '66101',
        'open',
        NOW() - INTERVAL '5 days'
    ),
    (
        'req-open-7',
        'org-kc-youth-education',
        'ca-education',
        'Chromebook for middle school student doing online homework',
        280.00,
        'medium',
        '64105',
        'open',
        NOW() - INTERVAL '6 hours'
    ),
    (
        'req-open-8',
        'org-digital-bridge-kc',
        'ca-digital-access',
        'WiFi router and setup for community center',
        150.00,
        'medium',
        '64106',
        'open',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. REQUESTS - Claimed by you (in progress)
-- Replace user_36GywD2buLf2HpGSfhl9etUzCFK with your actual Clerk user ID
-- =============================================
INSERT INTO requests (id, organization_id, cause_area_id, donor_id, description, amount, urgency, zipcode, status, created_at, claimed_at, donor_note) VALUES
    (
        'req-claimed-1',
        'org-senior-tech-connect',
        'ca-senior-services',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Tablet for senior citizen attending virtual doctor appointments',
        280.00,
        'high',
        '64108',
        'claimed',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '3 days',
        'Happy to help! Will ship by end of week.'
    ),
    (
        'req-claimed-2',
        'org-employment-first-kc',
        'ca-employment',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Laptop for single mother starting coding bootcamp',
        550.00,
        'high',
        '64111',
        'claimed',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '2 days',
        'Great cause - ordering today!'
    ),
    (
        'req-claimed-3',
        'org-community-action-network',
        'ca-nonprofit-support',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Computer monitors for nonprofit office expansion',
        350.00,
        'medium',
        '66101',
        'claimed',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '1 day',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. REQUESTS - Fulfilled by you (completed)
-- Replace user_36GywD2buLf2HpGSfhl9etUzCFK with your actual Clerk user ID
-- =============================================
INSERT INTO requests (id, organization_id, cause_area_id, donor_id, description, amount, urgency, zipcode, status, created_at, claimed_at, fulfilled_at, donor_note) VALUES
    (
        'req-fulfilled-1',
        'org-kc-youth-education',
        'ca-education',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Laptop for remote learning student in 10th grade',
        450.00,
        'high',
        '64105',
        'fulfilled',
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '10 days',
        'Sent a refurbished Dell laptop - hope it helps!'
    ),
    (
        'req-fulfilled-2',
        'org-digital-bridge-kc',
        'ca-digital-access',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Internet hotspot for family of 4 with school-age children',
        120.00,
        'medium',
        '64106',
        'fulfilled',
        NOW() - INTERVAL '21 days',
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '18 days',
        'Included 3 months prepaid service'
    ),
    (
        'req-fulfilled-3',
        'org-employment-first-kc',
        'ca-employment',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Webcam and headset kit for job interviews',
        85.00,
        'high',
        '64111',
        'fulfilled',
        NOW() - INTERVAL '28 days',
        NOW() - INTERVAL '27 days',
        NOW() - INTERVAL '25 days',
        NULL
    ),
    (
        'req-fulfilled-4',
        'org-entrepreneurship-hub',
        'ca-small-business',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Printer for small business owner starting bakery',
        199.00,
        'medium',
        '64112',
        'fulfilled',
        NOW() - INTERVAL '35 days',
        NOW() - INTERVAL '34 days',
        NOW() - INTERVAL '30 days',
        'Good luck with the bakery!'
    ),
    (
        'req-fulfilled-5',
        'org-kc-youth-education',
        'ca-education',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'Chromebook for 8th grader with online classes',
        280.00,
        'medium',
        '64105',
        'fulfilled',
        NOW() - INTERVAL '42 days',
        NOW() - INTERVAL '41 days',
        NOW() - INTERVAL '38 days',
        'Included a carrying case too'
    ),
    (
        'req-fulfilled-6',
        'org-senior-tech-connect',
        'ca-senior-services',
        'user_36GywD2buLf2HpGSfhl9etUzCFK',
        'iPad for senior learning to video call grandchildren',
        350.00,
        'low',
        '64108',
        'fulfilled',
        NOW() - INTERVAL '50 days',
        NOW() - INTERVAL '49 days',
        NOW() - INTERVAL '45 days',
        'Set up FaceTime before shipping'
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 12. DONOR CAUSE AREA PREFERENCES
-- Replace user_36GywD2buLf2HpGSfhl9etUzCFK with your actual Clerk user ID
-- =============================================
INSERT INTO donor_cause_areas (user_id, cause_area_id) VALUES
    ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'ca-education'),
    ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'ca-digital-access'),
    ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'ca-employment'),
    ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'ca-senior-services'),
    ('user_36GywD2buLf2HpGSfhl9etUzCFK', 'ca-small-business')
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify the data was inserted correctly
-- =============================================

-- Check cause areas
-- SELECT * FROM cause_areas;

-- Check organizations
-- SELECT id, name, email, logo_emoji FROM organizations;

-- Check all requests with status counts
-- SELECT status, COUNT(*) as count FROM requests GROUP BY status;

-- Check your donations
-- SELECT r.description, r.amount, r.status, o.name as organization
-- FROM requests r
-- JOIN organizations o ON r.organization_id = o.id
-- WHERE r.donor_id = 'user_36GywD2buLf2HpGSfhl9etUzCFK';

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Seed data inserted successfully!';
    RAISE NOTICE '📊 Created: 8 cause areas, 6 organizations, 17 requests';
    RAISE NOTICE '💡 Remember to replace user_36GywD2buLf2HpGSfhl9etUzCFK with your actual Clerk user ID';
END $$;

