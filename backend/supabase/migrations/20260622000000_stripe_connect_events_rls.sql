-- 20260622000000_stripe_connect_events_rls.sql
--
-- Supabase linter "RLS Disabled in Public" flagged public.stripe_connect_events
-- on the cloud DB. This is migration drift: the original
-- 20240315000000_stripe_connect.sql DID `ENABLE ROW LEVEL SECURITY` (and
-- 20240325000000_fix_payment_rls.sql swapped the wide-open policies for
-- service-role-only ones), and no migration ever DISABLEs it — yet the cloud
-- environment reports RLS off. Re-assert the intended secure state here,
-- idempotently, so it is correct on every environment (including any fresh
-- `supabase db push`) regardless of prior drift.
--
-- stripe_connect_events is SERVICE-ROLE-ONLY by design: it logs Stripe Connect
-- webhook events (sensitive) for idempotency. The backend webhook writes it with
-- the service (secret) key, which bypasses RLS. There is intentionally NO public
-- (anon / authenticated) access, so the policies below gate every command on
-- auth.role() = 'service_role'. RLS-enabled + service-role-gated (not RLS with
-- zero policies) keeps the linter green while denying all client traffic.

ALTER TABLE public.stripe_connect_events ENABLE ROW LEVEL SECURITY;

-- Drop every historical policy name so this migration is fully idempotent
-- whether the cloud row currently has the old wide-open pair, the 20240325
-- "Deny anon ..." set, or nothing at all.
DROP POLICY IF EXISTS "Anyone can view stripe events"   ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Anyone can insert stripe events" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Deny anon select on stripe_events" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Deny anon insert on stripe_events" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Deny anon update on stripe_events" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Deny anon delete on stripe_events" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Service role only - select" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Service role only - insert" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Service role only - update" ON public.stripe_connect_events;
DROP POLICY IF EXISTS "Service role only - delete" ON public.stripe_connect_events;

CREATE POLICY "Service role only - select" ON public.stripe_connect_events
  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role only - insert" ON public.stripe_connect_events
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role only - update" ON public.stripe_connect_events
  FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role only - delete" ON public.stripe_connect_events
  FOR DELETE USING (auth.role() = 'service_role');

COMMENT ON TABLE public.stripe_connect_events IS
  'Service-role-only: Stripe Connect webhook event idempotency log. RLS enabled; all commands gated on auth.role()=service_role. No public (anon/authenticated) access by design.';
