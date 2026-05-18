-- Migration: Organization Documents
-- For CBO Dashboard document management functionality
-- NOTE: organization_documents.id is TEXT to match the current organizations.id
-- type (also TEXT, since Clerk user IDs are text). Earlier UUID variant existed
-- in the migration history; the applied schema below uses gen_random_uuid()::text.

-- =============================================
-- 1. ORGANIZATION DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organization_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(20),
  file_url TEXT,
  year INTEGER,
  status VARCHAR(20) DEFAULT 'ready',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_documents_org_id ON organization_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_documents_type ON organization_documents(type);
CREATE INDEX IF NOT EXISTS idx_org_documents_year ON organization_documents(year);
CREATE INDEX IF NOT EXISTS idx_org_documents_public ON organization_documents(is_public);

-- =============================================
-- 2. RLS POLICIES
-- =============================================
-- Note: app uses Clerk auth, not Supabase auth, so auth.uid() is null for
-- end users. The policies below permit anon access; gating happens in app
-- code (OrganizationProfilePage and dashboard ownership checks).
ALTER TABLE organization_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public org documents"
  ON organization_documents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can read org documents"
  ON organization_documents FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert org documents"
  ON organization_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update org documents"
  ON organization_documents FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete org documents"
  ON organization_documents FOR DELETE
  USING (true);

-- =============================================
-- 3. UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_org_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS org_documents_updated_at_trigger ON organization_documents;
CREATE TRIGGER org_documents_updated_at_trigger
  BEFORE UPDATE ON organization_documents
  FOR EACH ROW EXECUTE FUNCTION update_org_documents_updated_at();

-- =============================================
-- 4. DOCUMENT TYPE REFERENCE
-- =============================================
-- Common document types for organizations:
-- 'tax_exempt' - Tax Exempt Certificate
-- '501c3' - 501(c)(3) Determination Letter
-- 'annual_report' - Annual Report
-- 'financial_statement' - Financial Statement
-- 'audit_report' - Audit Report
-- 'board_minutes' - Board Minutes
-- 'bylaws' - Organization Bylaws
-- 'insurance' - Insurance Certificate
-- 'other' - Other documents

COMMIT;
