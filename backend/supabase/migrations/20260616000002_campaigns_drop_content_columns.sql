-- Migration: Drop content columns from campaigns (Phase REFA, Task REFA6)
-- Branch: feat/post-launch-feedback
--
-- Lineage:
--   REFA1 (20260616000000_campaign_details_rename.sql) — renamed campaign_revisions -> campaign_details
--     (snapshot -> content, revision_number -> version, approval_status -> status),
--     and campaigns.published_revision_id -> published_detail_id with FK to campaign_details.
--   REFA3/REFA4 — backend + frontend rewires to read/write content via campaign_details only.
--   REFA5         — seed.sql stripped of content columns in the campaigns INSERT block.
--   REFA6 (this)  — final cleanup. Drop the now-unused content columns from campaigns.
--                   Authoritative content now lives ONLY in campaign_details.content (JSONB).
--
-- Surviving columns on campaigns after this migration:
--   id, organization_id, created_by, slug,
--   amount_raised, supporters_count, status,
--   created_at, updated_at,
--   approval_status, first_approved_at, last_edited_at, last_edit_approved_at,
--   requires_reapproval, published_detail_id
--
-- Idempotent — every DROP uses IF EXISTS. Re-running this migration after a partial
-- run (or on a schema where some columns were already removed) is safe.
-- `cause_area_ids` is not present in current schema; IF EXISTS no-ops it harmlessly.

BEGIN;

ALTER TABLE campaigns DROP COLUMN IF EXISTS title;
ALTER TABLE campaigns DROP COLUMN IF EXISTS creator_name;
ALTER TABLE campaigns DROP COLUMN IF EXISTS creator_role;
ALTER TABLE campaigns DROP COLUMN IF EXISTS funding_goal;
ALTER TABLE campaigns DROP COLUMN IF EXISTS short_description;
ALTER TABLE campaigns DROP COLUMN IF EXISTS story_title;
ALTER TABLE campaigns DROP COLUMN IF EXISTS story_content;
ALTER TABLE campaigns DROP COLUMN IF EXISTS contact_email;
ALTER TABLE campaigns DROP COLUMN IF EXISTS phone;
ALTER TABLE campaigns DROP COLUMN IF EXISTS image_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS logo_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS facebook_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS twitter_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS linkedin_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS youtube_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS tiktok_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS website_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS cause_area_ids;

COMMIT;
