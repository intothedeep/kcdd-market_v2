-- Migration: Organization Documents
-- For CBO Dashboard document management functionality

-- =============================================
-- 1. ORGANIZATION DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organization_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by TEXT NOT NULL, -- Clerk user ID
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'tax_exempt', '501c3', 'annual_report', 'financial_statement', 'other'
  size VARCHAR(20),
  file_url TEXT,
  year INTEGER,
  status VARCHAR(20) DEFAULT 'ready', -- 'ready', 'pending', 'processing'
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- Whether donors/public can see this document
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
ALTER TABLE organization_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view public organization documents
CREATE POLICY "Anyone can view public org documents"
  ON organization_documents FOR SELECT
  USING (is_public = true);

-- Service role has full access for backend operations
CREATE POLICY "Service role manages org documents"
  ON organization_documents FOR ALL
  USING (auth.role() = 'service_role');

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

CREATE TRIGGER org_documents_updated_at_trigger
  BEFORE UPDATE ON organization_documents
  FOR EACH ROW EXECUTE FUNCTION update_org_documents_updated_at();

-- =============================================
-- 4. DOCUMENT TYPE ENUM (for reference)
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
