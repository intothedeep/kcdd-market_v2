-- Migration: Organization Profile Extensions

-- Extend organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tagline VARCHAR(300),
ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS organization_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS year_founded INTEGER,
ADD COLUMN IF NOT EXISTS technology_barriers TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS program_description TEXT,
ADD COLUMN IF NOT EXISTS service_area_description TEXT;

-- Organization populations junction table
CREATE TABLE IF NOT EXISTS organization_populations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  identity_category_id UUID NOT NULL REFERENCES identity_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, identity_category_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_populations_org_id ON organization_populations(organization_id);

-- Organization updates table
CREATE TABLE IF NOT EXISTS organization_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_updates_org_id ON organization_updates(organization_id);

-- Organization team members table
CREATE TABLE IF NOT EXISTS organization_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200),
  bio TEXT,
  photo_url VARCHAR(500),
  email VARCHAR(254),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_team_members_org_id ON organization_team_members(organization_id);

-- RLS Policies
ALTER TABLE organization_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view organization populations" ON organization_populations FOR SELECT USING (true);
CREATE POLICY "Anyone can view published updates" ON organization_updates FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view active team members" ON organization_team_members FOR SELECT USING (is_active = true);

CREATE POLICY "Org owners can manage populations" ON organization_populations FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));
CREATE POLICY "Org owners can manage updates" ON organization_updates FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));
CREATE POLICY "Org owners can manage team members" ON organization_team_members FOR ALL USING (organization_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));
