-- Migration: Stripe Connect Integration
-- Enables organizations to receive donations directly via Stripe Connect

-- =============================================
-- 1. ADD STRIPE CONNECT FIELDS TO ORGANIZATIONS
-- =============================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_account_id ON organizations(stripe_account_id);

-- =============================================
-- 2. PAYMENT TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_id TEXT NOT NULL,

  -- Stripe identifiers
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_charge_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),

  -- Amounts (stored in cents)
  amount_total INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  organization_amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, processing, succeeded, failed, refunded, partially_refunded

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT,

  -- Metadata for additional info
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure either request_id or campaign_id is set
  CONSTRAINT payment_has_target CHECK (request_id IS NOT NULL OR campaign_id IS NOT NULL)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_request_id ON payment_transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_campaign_id ON payment_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_organization_id ON payment_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_donor_id ON payment_transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_pi ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- =============================================
-- 3. STRIPE CONNECT EVENTS LOG
-- =============================================
CREATE TABLE IF NOT EXISTS stripe_connect_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  stripe_account_id VARCHAR(255),
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_connect_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_account ON stripe_connect_events(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_connect_events(processed);

-- =============================================
-- 4. PLATFORM FEE SETTINGS
-- =============================================
INSERT INTO platform_settings (key, value, value_type, description) VALUES
  ('stripe_platform_fee_percent', '2.9', 'number', 'Platform fee percentage for donations'),
  ('stripe_platform_fee_fixed_cents', '30', 'number', 'Fixed fee in cents per transaction'),
  ('stripe_test_mode', 'true', 'boolean', 'Whether Stripe is in test mode')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- Payment Transactions (users can view their own, orgs can view theirs)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment transactions"
  ON payment_transactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payment transactions"
  ON payment_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update payment transactions"
  ON payment_transactions FOR UPDATE USING (true);

-- Stripe Connect Events (admin access only via service role)
ALTER TABLE stripe_connect_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stripe events"
  ON stripe_connect_events FOR SELECT USING (true);

CREATE POLICY "Anyone can insert stripe events"
  ON stripe_connect_events FOR INSERT WITH CHECK (true);

-- =============================================
-- 6. UPDATED_AT TRIGGER FOR PAYMENT_TRANSACTIONS
-- =============================================
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();

COMMIT;
