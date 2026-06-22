-- ============================================================
-- Donor-read RLS policies for payment_transactions + donor_documents
-- ============================================================
-- These two tables had only service_role policies, so the donor dashboard
-- (anon key + Clerk JWT) silently got [] for both:
--   - /donor/dashboard "My Donations" — joins payment_transactions
--   - /donor/documents               — reads donor_documents
--
-- The Stripe webhook still writes both tables via service_role; that path
-- is untouched. This migration only adds donor-scoped SELECT, matched on
-- public.clerk_user_id() (defined in 20260518000000_clerk_user_id_text.sql).
--
-- Cherry-picked from feat/taek migrations
--   20260526000000_donor_documents_user_select.sql
--   20260605000200_payment_transactions_donor_read.sql
-- consolidated into a single file to keep the diff minimal on this branch.

DROP POLICY IF EXISTS "Donors read their own payment transactions" ON payment_transactions;
CREATE POLICY "Donors read their own payment transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (donor_id = public.clerk_user_id());

DROP POLICY IF EXISTS "Donors view own documents" ON donor_documents;
CREATE POLICY "Donors view own documents"
  ON donor_documents
  FOR SELECT
  USING (user_id = public.clerk_user_id());
