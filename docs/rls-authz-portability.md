# RLS & Authorization Portability — ADR + Gradual Migration Playbook

> **Status:** Option A chosen (keep RLS as-is). Option C documented as the
> deferred migration path. No code change is required by this document — it
> exists so a future move off Supabase can be executed incrementally and
> rollback-safely instead of as a risky big-bang.
>
> **Decision date:** 2026-07-05

---

> **Update — 2026-07-12:** Architecture review re-counted the direct-query
> surface. It has grown from the **~74 `supabase.from(` sites across 7 files**
> cited in the original ADR to **~138 sites across 13 files**, plus 3 browser
> `.rpc()` calls, 12 storage uploads, and 1 realtime subscription. This growth
> **strengthens** the case for the Phase-0 freeze rule: the Option-C migration
> cost is quietly rising each sprint as new features add direct queries.
> The recommendation is unchanged — keep RLS as the sole enforcement layer for
> now. **Do NOT drop RLS before those direct queries are moved behind the
> authenticated Express API.** Dropping policies first would expose PII and the
> payment ledger to unauthenticated reads via the publishable key in the JS
> bundle. See the "Data access / RLS portability posture" convention in
> `CLAUDE.md` (Key Conventions) for the day-to-day freeze rule.

---

## 1. Decision (TL;DR)

- **Now:** keep Postgres Row-Level Security (RLS) exactly as it is (**Option A**).
- **Later (only if a real portability need appears):** follow the phased
  **Option C** cutover below.
- **Never** delete RLS as an end goal. At the end of Option C, RLS is
  *demoted to defense-in-depth*, not removed.

### Why not just remove RLS?

The frontend talks to Postgres **two ways**, and the direct path dominates:

| Path | Key | Count | Guarded by |
| --- | --- | --- | --- |
| Browser → Postgres **directly** (`.from()`, storage, `.rpc()`, realtime) | publishable / anon | **~74 ops** across 7 files + storage in 11 files + 3 rpc + 1 realtime sub (original ADR count; re-counted at ~138 sites across 13 files as of 2026-07-12) | **RLS only** |
| Browser → Express API | service_role (server-side) | ~10 call sites → ~35 routes | `clerkAuth` + hand-written checks |

The anon key ships in the JS bundle. **Deleting RLS today would grant the
entire internet full read/write to every non-service-role-only table.** So
RLS cannot be "removed" — it can only be "replaced" by first routing those ~74
operations through an authenticated API layer. Deleting the SQL policies is the
trivial *last* step, not the work.

### Why the "RLS makes migration hard" fear is overstated

The real Supabase coupling is **not** the 154 RLS policies. It is the single
PostgREST convention that `public.clerk_user_id()` depends on:

```sql
-- backend/supabase/migrations/20260518000000_clerk_user_id_text.sql
current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
```

That `request.jwt.claims` GUC is injected by **PostgREST/Supabase**, not vanilla
Postgres. Consequences:

- **Same-engine move** (Supabase → self-hosted Postgres): schema, RPCs,
  triggers, and RLS policies port **nearly unchanged**. You only need an
  equivalent way to set the JWT-claims GUC per request (self-hosted PostgREST,
  or set the GUC on your own DB connection).
- **Different DB engine** (Postgres → something else): you rewrite tables +
  RPCs + triggers + views **regardless**. RLS policies are the *smallest and
  most mechanical* part to drop.

So the highest-value, portability-enabling work is **consolidating authz behind
the API** (Option C, Phases 1–4). Actually *deleting* RLS (Phase 5) buys almost
nothing and removes your only backstop — hence keep it.

---

## 2. Migration surface (what Option C touches)

Inventory captured 2026-07-05 so future-you knows the size:

- **~74 direct `.from()` operations** in the browser — the load-bearing set:
  - `frontend-vite/src/lib/supabase.ts` — 42 (shared data layer: onboarding,
    dashboards, org profiles, campaigns, questions, documents, impact views)
  - `frontend-vite/src/pages/admin/DashboardPage.tsx` — 24
  - `frontend-vite/src/pages/CampaignPage.tsx` — 3;
    `components/RoleSelectionModal.tsx` — 2; `HomePage`/`RequestsPage`/
    `CheckoutPage` — 1 each
  - _Re-counted 2026-07-12: **~138 sites across 13 files** (growth from new
    features added after the original inventory)._
- **Storage** direct uploads across **11 files** (12 as of 2026-07-12 recount)
  (`organization-logos`, `profile-pictures`, `campaign-images`, …)
- **Browser `.rpc()`** — 3: `set_user_type` (`admin/DashboardPage.tsx:3068`,
  `admin/UsersPage.tsx:174`), `create_campaign_with_detail` (`supabase.ts:1073`)
- **Realtime** — `postgres_changes` subscription (`supabase.ts:111-130`)
- **RLS SQL** — **154 `CREATE POLICY`** across **31 migration files**;
  `public.clerk_user_id()` and `public.is_admin()`
  (`20260620000001_user_profiles_admin_rls.sql:18`, SECURITY DEFINER)
- **SECURITY DEFINER RPCs encoding money/trust invariants** — must be preserved
  or faithfully re-implemented before any are dropped:
  `process_payment_succeeded/failed/charge_refunded/dispute_closed`,
  `create_campaign_with_detail`, `set_user_type`, `append_lifecycle`,
  `increment_campaign_amount`, `set_donor_cause_areas`,
  `campaign_has_approved_detail`

### Anchor files

- `frontend-vite/src/lib/supabase.ts` — browser data client (init ~L50-80) + 42 direct ops
- `frontend-vite/src/lib/api.ts` — thin Clerk-JWT authed API wrapper (the pattern to expand)
- `backend/api/server.js` — ~35 inline routes; needs service/repository extraction
- `backend/api/middleware/clerkAuth.js` — JWT verification, the API-side authz entry point
- `backend/supabase/migrations/20260518000000_clerk_user_id_text.sql` — `clerk_user_id()`, the Supabase-coupling linchpin

---

## 3. Option C — phased, rollback-safe cutover (deferred)

Keep RLS **enabled the entire time** as the backstop. A bug in any new endpoint
then fails **closed** (DB refuses the row) instead of leaking. Ship one resource
per PR (matches the repo's atomic / incremental / rollback-safe rule).

- **Phase 0 — Confirm the trigger.** If there is no concrete plan to leave
  Supabase, **stay on Option A**. Do not start Phases 1+ for a hypothetical
  (KISS/YAGNI). Revisit only when a real portability mandate exists.

- **Phase 1 — Backend seam (no behavior change).** Extract `services/` +
  `repositories/` from `server.js` (controllers → services → repositories, per
  `.claude/CLAUDE.md`). Express authorization predicates as **pure functions**
  (`canEditCampaign`, `canViewRequest`, `isAdmin`) — the functional core.

- **Phase 2 — Cut over reads/writes, resource by resource** (RLS still on):
  campaigns → organizations → dashboards/impact → onboarding →
  questions/documents → admin. Each resource: add API endpoints → repoint the
  `supabase.ts` helper to `api.*` → delete the direct `.from()` calls.
  Re-implement each resource's RLS predicate (owner-scoping, admin, and the
  read-side filters: "public sees only vetted orgs / approved campaign details")
  in the service layer **before** relying on it.

- **Phase 3 — Storage + realtime.** Move uploads to API-issued **signed URLs**;
  replace the `postgres_changes` subscription (polling, or an API-driven
  channel).

- **Phase 4 — Remove the browser data client.** Delete the anon-key Supabase
  **data** client. From here the anon key no longer grants table access. Keep
  only genuinely-public unauthenticated reads, if any.

- **Phase 5 — RLS disposition.** **Recommended: keep policies as
  belt-and-suspenders.** If you must simplify, collapse per-table policies to a
  blanket `service_role`-only stance but leave RLS **ENABLED**. Never run
  `DISABLE ROW LEVEL SECURITY` on a table reachable by any non-service key.

---

## 4. Guardrails (apply now and forever)

- **Never expose `SUPABASE_SECRET_KEY` (service_role) to the browser** — it
  bypasses RLS entirely. Server-only (`clerkAuth` + service client in
  `server.js`).
- `clerk_user_id()` → `request.jwt.claims` GUC is the **single Supabase-specific
  coupling point**. On a self-hosted-Postgres port, replace *this*, not the 154
  policies.
- SECURITY DEFINER RPCs hold money/trust invariants in SQL. Preserve or
  faithfully re-implement them in the service layer before dropping any.
- New-table migrations must still follow the RLS checklist in the root
  `CLAUDE.md` ("Adding a new DB table") while Option A is in force.
