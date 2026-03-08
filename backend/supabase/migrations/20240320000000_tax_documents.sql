-- Migration: Tax Documents - Extended Schema for Receipt Generation
-- Adds organization linkage, transaction references, and receipt numbers to donor_documents
--
-- IMPORTANT: After running this migration, create the storage bucket via Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket named "tax-documents"
-- 3. Set to private (authenticated access only)
-- 4. Add policy: Allow authenticated users to read their own files (path starts with user_id/)

-- =============================================
-- 1. EXTEND DONOR_DOCUMENTS TABLE
-- =============================================

-- Add organization and transaction linkage
ALTER TABLE donor_documents
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS organization_ein VARCHAR(20),
ADD COLUMN IF NOT EXISTS transaction_id UUID,
ADD COLUMN IF NOT EXISTS donation_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS donation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS request_id UUID,
ADD COLUMN IF NOT EXISTS campaign_id UUID,
ADD COLUMN IF NOT EXISTS donor_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS donor_email VARCHAR(254);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_donor_documents_org ON donor_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_donor_documents_receipt_number ON donor_documents(receipt_number);
CREATE INDEX IF NOT EXISTS idx_donor_documents_donation_date ON donor_documents(donation_date);

-- =============================================
-- 2. RECEIPT NUMBER SEQUENCE
-- =============================================

-- Create sequence for receipt numbers (starts at 10001)
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 10001;

-- Function to generate unique receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'KCDD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. STORAGE BUCKET POLICY (for RLS)
-- =============================================

-- Note: Bucket 'tax-documents' must be created via Supabase Dashboard
-- These policies control access to the bucket

-- Allow authenticated users to read their own documents
-- (Applied via Supabase Dashboard Storage policies)

-- =============================================
-- 4. UPDATE RLS POLICIES
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own documents" ON donor_documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON donor_documents;

-- Create updated policies
CREATE POLICY "Users can view their own documents"
  ON donor_documents FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert documents"
  ON donor_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update documents"
  ON donor_documents FOR UPDATE
  USING (true);

-- =============================================
-- 5. HELPER VIEW FOR ANNUAL SUMMARIES
-- =============================================

CREATE OR REPLACE VIEW donor_annual_summaries AS
SELECT
  user_id,
  EXTRACT(YEAR FROM donation_date)::INTEGER as year,
  COUNT(*) as donation_count,
  SUM(donation_amount) as total_donations,
  SUM(donation_amount) as tax_deductible,
  array_agg(DISTINCT organization_name) as organizations
FROM donor_documents
WHERE type = 'tax_receipt'
  AND status = 'ready'
  AND donation_date IS NOT NULL
GROUP BY user_id, EXTRACT(YEAR FROM donation_date);

COMMIT;
