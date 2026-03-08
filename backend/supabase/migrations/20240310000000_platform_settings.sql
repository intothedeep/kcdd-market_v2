-- Migration: Platform Settings and Admin Configuration
-- For Admin Dashboard functionality

-- =============================================
-- 1. PLATFORM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  value_type VARCHAR(20) DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- Insert default settings
INSERT INTO platform_settings (key, value, value_type, description) VALUES
  ('platform_name', 'KC Digital Drive', 'string', 'The display name of the platform'),
  ('support_email', 'support@kcdd.org', 'string', 'Main support email address'),
  ('admin_email', 'admin@kcdd.org', 'string', 'Admin contact email'),
  ('maintenance_mode', 'false', 'boolean', 'Whether the platform is in maintenance mode'),
  ('notify_new_users', 'true', 'boolean', 'Send notifications for new user registrations'),
  ('notify_new_requests', 'true', 'boolean', 'Send notifications for new donation requests'),
  ('notify_donations_completed', 'true', 'boolean', 'Send notifications when donations are completed'),
  ('notify_weekly_summary', 'false', 'boolean', 'Send weekly summary reports')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 2. ADMIN ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id TEXT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'user', 'organization', 'request', 'campaign', 'report', 'settings'
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);

-- =============================================
-- 3. RLS POLICIES
-- =============================================

-- Platform Settings (admin only, but allow public read for some settings)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view platform settings" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can manage platform settings" ON platform_settings FOR ALL USING (true);

-- Admin Activity Log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view admin activity" ON admin_activity_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert admin activity" ON admin_activity_log FOR INSERT WITH CHECK (true);

-- =============================================
-- 4. INSERT DEFAULT FAQS IF NOT EXISTS
-- =============================================
INSERT INTO support_faqs (question, answer, category, user_type, sort_order, is_active) VALUES
  ('How do I verify an organization?', 'Navigate to Organizations, find the organization, and use the dropdown to change their verification status to "Verified" or "Premium". You can also click View to see full details and change status from the modal.', 'verification', 'all', 1, true),
  ('How do I handle a reported campaign?', 'Go to Reports, review the reported campaign details, then use the Actions menu to mark as reviewing, resolve, or dismiss the report. Add admin notes when resolving to document your decision.', 'reports', 'all', 2, true),
  ('How do I export platform data?', 'From the Overview page, click "Export Data" in Quick Actions. This will download separate CSV files for users, organizations, and requests with the current date.', 'data', 'all', 3, true),
  ('How do I change a user''s role or tier?', 'Go to Users section, find the user in the table, and click on their Tier or Status badge to see a dropdown with options. Select the new tier or status to update immediately.', 'users', 'all', 4, true),
  ('What does maintenance mode do?', 'When maintenance mode is enabled from Settings, the platform displays a maintenance page to visitors while admins can still access the dashboard. Use this during updates or major changes.', 'settings', 'all', 5, true),
  ('How do I view organization details?', 'In the Organizations section, click the View button on any organization card. This opens a modal with full details including contact info, mission, verification status, and options to edit or change status.', 'organizations', 'all', 6, true)
ON CONFLICT DO NOTHING;

COMMIT;
