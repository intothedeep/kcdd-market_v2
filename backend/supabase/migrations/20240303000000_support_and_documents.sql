-- Migration: Support FAQs, Contact Info, Donor Documents, and Newsletter
-- For Donor Dashboard functionality

-- =============================================
-- 1. SUPPORT FAQS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS support_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  user_type VARCHAR(20) DEFAULT 'all', -- 'donor', 'cbo', or 'all'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_faqs_user_type ON support_faqs(user_type);
CREATE INDEX IF NOT EXISTS idx_support_faqs_active ON support_faqs(is_active);

-- =============================================
-- 2. SUPPORT CONTACT INFO TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS support_contact_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'chat'
  label VARCHAR(100) NOT NULL,
  value VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_contact_info_active ON support_contact_info(is_active);

-- =============================================
-- 3. DONOR DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS donor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'tax_receipt', 'annual_summary', 'quarterly_statement'
  size VARCHAR(20),
  file_url TEXT,
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1-4 for quarterly docs, NULL for annual
  status VARCHAR(20) DEFAULT 'ready', -- 'ready', 'pending', 'processing'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_documents_user_id ON donor_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_donor_documents_year ON donor_documents(year);

-- =============================================
-- 4. NEWSLETTER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(254) NOT NULL UNIQUE,
  source VARCHAR(100) DEFAULT 'footer',
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active);

-- =============================================
-- 5. CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  creator_name VARCHAR(200),
  creator_role VARCHAR(100),
  funding_goal DECIMAL(12, 2) NOT NULL,
  amount_raised DECIMAL(12, 2) DEFAULT 0,
  supporters_count INTEGER DEFAULT 0,
  short_description TEXT,
  story_title VARCHAR(300),
  story_content TEXT,
  contact_email VARCHAR(254) NOT NULL,
  phone VARCHAR(20),
  image_url TEXT,
  logo_url TEXT,
  -- Social media
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  website_url TEXT,
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);

-- =============================================
-- 6. CAMPAIGN QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  submitter_name VARCHAR(200),
  submitter_email VARCHAR(254),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'answered', 'rejected'
  answer TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE,
  answered_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_questions_campaign_id ON campaign_questions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_questions_status ON campaign_questions(status);

-- =============================================
-- 7. RLS POLICIES
-- =============================================

-- Support FAQs (public read)
ALTER TABLE support_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active FAQs" ON support_faqs FOR SELECT USING (is_active = true);

-- Support Contact Info (public read)
ALTER TABLE support_contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active contact info" ON support_contact_info FOR SELECT USING (is_active = true);

-- Donor Documents
ALTER TABLE donor_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own documents" ON donor_documents FOR SELECT USING (true);
CREATE POLICY "Users can manage their own documents" ON donor_documents FOR ALL USING (true);

-- Newsletter Subscriptions
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view subscriptions" ON newsletter_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can update subscriptions" ON newsletter_subscriptions FOR UPDATE USING (true);

-- Campaigns (public read for active)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active campaigns" ON campaigns FOR SELECT USING (status IN ('active', 'pending', 'completed'));
CREATE POLICY "Anyone can manage campaigns" ON campaigns FOR ALL USING (true);

-- Campaign Questions
ALTER TABLE campaign_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public answered questions" ON campaign_questions FOR SELECT USING (is_public = true AND status = 'answered');
CREATE POLICY "Anyone can submit questions" ON campaign_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can manage questions" ON campaign_questions FOR ALL USING (true);

-- =============================================
-- 8. EXTEND DONOR_PROFILES TABLE
-- =============================================
ALTER TABLE donor_profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS name VARCHAR(200),
ADD COLUMN IF NOT EXISTS email VARCHAR(254),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(200),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS max_per_request DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS service_area_zipcode VARCHAR(10);

-- =============================================
-- 9. EXTEND USER_PROFILES TABLE
-- =============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(254),
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wants_updates BOOLEAN DEFAULT FALSE;

-- =============================================
-- 10. DONOR CAUSE AREAS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS donor_cause_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  cause_area_id UUID NOT NULL REFERENCES cause_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cause_area_id)
);

CREATE INDEX IF NOT EXISTS idx_donor_cause_areas_user_id ON donor_cause_areas(user_id);

ALTER TABLE donor_cause_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view donor cause areas" ON donor_cause_areas FOR SELECT USING (true);
CREATE POLICY "Anyone can manage donor cause areas" ON donor_cause_areas FOR ALL USING (true);

-- =============================================
-- 11. EXTEND ORGANIZATIONS TABLE
-- =============================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS slug VARCHAR(200),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_org_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER org_slug_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION generate_org_slug();

-- =============================================
-- 12. UPDATE CAUSE_AREAS FOR TEXT IDS
-- =============================================
-- Allow text IDs for cause areas
ALTER TABLE cause_areas ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE cause_areas ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- Update foreign keys
ALTER TABLE organization_cause_areas ALTER COLUMN cause_area_id TYPE TEXT USING cause_area_id::text;
ALTER TABLE requests ALTER COLUMN cause_area_id TYPE TEXT USING cause_area_id::text;
ALTER TABLE donor_cause_areas ALTER COLUMN cause_area_id TYPE TEXT USING cause_area_id::text;

COMMIT;
