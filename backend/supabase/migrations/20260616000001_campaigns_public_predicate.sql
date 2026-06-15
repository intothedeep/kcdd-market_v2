-- Migration: campaigns public SELECT predicate — column rename follow-up
-- Branch: feat/post-launch-feedback
-- Phase REFA, Task REFA2 (follow-up to REFA1 rename migration)
--
-- Intent:
--   REFA1 renamed `campaigns.published_revision_id → published_detail_id`.
--   The public SELECT policy `campaigns_select_public_published` still
--   references the old column name in its USING clause. Postgres updates
--   dependent objects on RENAME COLUMN, so the policy actually still works
--   correctly — but the policy NAME and its purpose are tied to the old
--   `_revision_` lexicon. Drop + recreate to keep names internally consistent
--   with the new `_detail_` vocabulary.
--
-- Predicate semantics are UNCHANGED — this is a cosmetic patch to align
-- names with the new schema. Anon users continue to see exactly the same
-- set of campaigns (those with a published detail row).

BEGIN;

DROP POLICY IF EXISTS "campaigns_select_public_published" ON campaigns;

CREATE POLICY "campaigns_select_public_published"
  ON campaigns
  FOR SELECT
  USING (
    published_detail_id IS NOT NULL
    OR auth.role() = 'service_role'
  );

COMMIT;
