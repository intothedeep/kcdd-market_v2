-- Add email + name to user_profiles so we always have contact info for a
-- signed-up user, even when they bail out before completing role selection
-- and we never get a chance to write a donor_profiles or organizations row.
-- Email is captured from Clerk's primaryEmailAddress at the first upsert.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email VARCHAR(254),
  ADD COLUMN IF NOT EXISTS name VARCHAR(200);

-- Backfill from donor_profiles where available
UPDATE user_profiles up
SET email = COALESCE(up.email, dp.email),
    name = COALESCE(up.name, dp.display_name, dp.name)
FROM donor_profiles dp
WHERE dp.user_id = up.id
  AND (up.email IS NULL OR up.name IS NULL);

-- Backfill from organizations where available
UPDATE user_profiles up
SET email = COALESCE(up.email, o.email),
    name = COALESCE(up.name, o.name)
FROM organizations o
WHERE o.user_id = up.id
  AND (up.email IS NULL OR up.name IS NULL);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
