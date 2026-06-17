-- Phase C / Theme 4 — CBO productivity
-- Adds JSONB column for per-org default campaign field values used to
-- prefill the new-campaign form (W5-B2).
--
-- Schema shape (frontend-typed as OrganizationDefaults):
--   {
--     creator_name?: string,
--     creator_role?: string,
--     contact_email?: string,
--     cause_area_ids?: UUID[],
--     faqs?: Array<{ question, answer }>
--   }
--
-- No new table => no RLS additions needed. organizations already has
-- owner-only UPDATE policy from the initial schema.

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS default_campaign_template JSONB NULL;

COMMENT ON COLUMN organizations.default_campaign_template IS
  'Phase C / Theme 4 — CBO-set defaults prefilled into new campaign form. See W5-B1.';
