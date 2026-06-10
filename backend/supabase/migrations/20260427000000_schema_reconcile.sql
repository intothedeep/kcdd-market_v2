-- Schema Reconciliation Migration
-- Fixes column name mismatches between initial migration, backend, and frontend types.
-- This migration is safe to apply on a fresh local DB or existing data.

-- 1. organizations: rename logo → logo_url (types already expect logo_url)
ALTER TABLE organizations RENAME COLUMN logo TO logo_url;

-- 2. request_notifications: rename user_id → recipient_id, read → is_read
ALTER TABLE request_notifications RENAME COLUMN user_id TO recipient_id;
ALTER TABLE request_notifications RENAME COLUMN "read" TO is_read;

-- Update RLS policies referencing the old column names
DROP POLICY IF EXISTS "Users can view their own notifications" ON request_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON request_notifications;

CREATE POLICY "Users can view their own notifications"
  ON request_notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON request_notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- 3. donor_profiles: add columns that frontend types expect
ALTER TABLE donor_profiles
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS email VARCHAR(254),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS max_per_request DECIMAL(10,2) DEFAULT 1000.00,
  ADD COLUMN IF NOT EXISTS service_area_zipcode VARCHAR(10),
  ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- 4. Taxonomy tables: add is_active and description columns
ALTER TABLE cause_areas
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE challenge_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE identity_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 5. requests: add payment_intent_id (for idempotency) and refunded_at
ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- 6. Stripe event idempotency table (service role only — no public RLS policies)
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- 7. Prevent unauthorized user_type escalation
CREATE OR REPLACE FUNCTION prevent_user_type_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    -- Only admins can change user_type
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    ) THEN
      RAISE EXCEPTION 'Cannot change user_type without admin privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_user_type_escalation ON user_profiles;
CREATE TRIGGER check_user_type_escalation
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_user_type_escalation();
