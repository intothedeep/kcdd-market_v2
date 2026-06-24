-- Initial Database Schema for KCDD Market v2
-- Based on Django models from v1

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type_enum AS ENUM ('admin', 'cbo', 'donor');
CREATE TYPE request_status_enum AS ENUM ('open', 'claimed', 'fulfilled', 'denied');
CREATE TYPE urgency_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE program_region_metro_enum AS ENUM ('all_kc_metro', 'kc_metro_mo', 'kc_metro_ks');
CREATE TYPE county_enum AS ENUM ('cass_mo', 'clay_mo', 'jackson_mo', 'lafayette_mo', 'platte_mo', 'ray_mo', 'johnson_ks', 'leavenworth_ks', 'wyandotte_ks');

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type_enum NOT NULL DEFAULT 'donor',
  phone VARCHAR(20),
  is_vetted BOOLEAN DEFAULT FALSE,
  vetting_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donor Profiles
CREATE TABLE donor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  location VARCHAR(200),
  bio TEXT,
  profile_visibility VARCHAR(20) DEFAULT 'public',
  allow_leaderboard BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cause Areas
CREATE TABLE cause_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Categories
CREATE TABLE challenge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identity Categories
CREATE TABLE identity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(200) NOT NULL,
  website VARCHAR(200),
  mission TEXT NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  zipcode VARCHAR(10) NOT NULL,
  ein VARCHAR(12),
  logo VARCHAR(200),
  logo_emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Cause Areas (Many-to-Many)
CREATE TABLE organization_cause_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cause_area_id UUID NOT NULL REFERENCES cause_areas(id) ON DELETE CASCADE,
  UNIQUE(organization_id, cause_area_id)
);

-- Requests
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cause_area_id UUID NOT NULL REFERENCES cause_areas(id) ON DELETE RESTRICT,
  donor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  urgency urgency_enum NOT NULL DEFAULT 'medium',
  zipcode VARCHAR(10) NOT NULL,
  program_region_metro program_region_metro_enum,
  program_region_county county_enum,
  status request_status_enum NOT NULL DEFAULT 'open',
  donor_note TEXT,
  denial_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE
);

-- Request Challenge Categories (Many-to-Many)
CREATE TABLE request_challenge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  challenge_category_id UUID NOT NULL REFERENCES challenge_categories(id) ON DELETE CASCADE,
  UNIQUE(request_id, challenge_category_id)
);

-- Request Identity Categories (Many-to-Many)
CREATE TABLE request_identity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  identity_category_id UUID NOT NULL REFERENCES identity_categories(id) ON DELETE CASCADE,
  UNIQUE(request_id, identity_category_id)
);

-- Request History (Audit Log)
CREATE TABLE request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  changed_by_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  old_status request_status_enum,
  new_status request_status_enum NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fulfillment Records
CREATE TABLE fulfillment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  fulfillment_method VARCHAR(100),
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_by_cbo BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications
CREATE TABLE request_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_user_profiles_is_vetted ON user_profiles(is_vetted);
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_zipcode ON organizations(zipcode);
CREATE INDEX idx_donor_profiles_user_id ON donor_profiles(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_organization_id ON requests(organization_id);
CREATE INDEX idx_requests_donor_id ON requests(donor_id);
CREATE INDEX idx_requests_cause_area_id ON requests(cause_area_id);
CREATE INDEX idx_requests_urgency ON requests(urgency);
CREATE INDEX idx_requests_zipcode ON requests(zipcode);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_request_history_request_id ON request_history(request_id);
CREATE INDEX idx_fulfillment_records_request_id ON fulfillment_records(request_id);
CREATE INDEX idx_fulfillment_records_donor_id ON fulfillment_records(donor_id);
CREATE INDEX idx_request_notifications_user_id ON request_notifications(user_id);
CREATE INDEX idx_request_notifications_read ON request_notifications(read);

-- Create view for request details with organization info
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
  o.id as organization_id,
  o.name as organization_name,
  o.logo as organization_logo,
  o.logo_emoji as organization_logo_emoji,
  up.is_vetted as organization_vetted,
  ca.id as cause_area_id,
  ca.name as cause_area_name,
  d.id as donor_id,
  du.email as donor_email
FROM requests r
INNER JOIN organizations o ON r.organization_id = o.id
INNER JOIN user_profiles up ON o.user_id = up.id
INNER JOIN cause_areas ca ON r.cause_area_id = ca.id
LEFT JOIN user_profiles d ON r.donor_id = d.id
LEFT JOIN auth.users du ON d.id = du.id;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_cause_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_identity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view vetted user profiles" ON user_profiles
  FOR SELECT USING (is_vetted = true);

-- Donor Profiles Policies
CREATE POLICY "Donors can manage their own profile" ON donor_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view public donor profiles" ON donor_profiles
  FOR SELECT USING (profile_visibility = 'public');

-- Organizations Policies
CREATE POLICY "CBOs can manage their own organization" ON organizations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can view organizations with vetted users" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = organizations.user_id AND is_vetted = true
    )
  );

-- Requests Policies
CREATE POLICY "Anyone can view open requests from vetted organizations" ON requests
  FOR SELECT USING (
    status = 'open' AND
    EXISTS (
      SELECT 1 FROM organizations o
      INNER JOIN user_profiles up ON o.user_id = up.id
      WHERE o.id = requests.organization_id AND up.is_vetted = true
    )
  );

CREATE POLICY "CBOs can manage their own requests" ON requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = requests.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Donors can view their claimed requests" ON requests
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "Donors can update their claimed requests" ON requests
  FOR UPDATE USING (donor_id = auth.uid());

-- Cause Areas (public read)
ALTER TABLE cause_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cause areas" ON cause_areas FOR SELECT USING (true);

-- Challenge Categories (public read)
ALTER TABLE challenge_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenge categories" ON challenge_categories FOR SELECT USING (true);

-- Identity Categories (public read)
ALTER TABLE identity_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view identity categories" ON identity_categories FOR SELECT USING (true);

-- Request History Policies
CREATE POLICY "Users can view history of their requests" ON request_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = request_history.request_id 
      AND (o.user_id = auth.uid() OR r.donor_id = auth.uid())
    )
  );

-- Fulfillment Records Policies
CREATE POLICY "Donors and CBOs can view fulfillment records" ON fulfillment_records
  FOR SELECT USING (
    donor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM requests r
      INNER JOIN organizations o ON r.organization_id = o.id
      WHERE r.id = fulfillment_records.request_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Donors can create fulfillment records" ON fulfillment_records
  FOR INSERT WITH CHECK (donor_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON request_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON request_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donor_profiles_updated_at BEFORE UPDATE ON donor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, user_type, created_at, updated_at)
  VALUES (NEW.id, 'donor', NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;

