# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Branch state (as of 2026-06-17)**: This CLAUDE.md describes the current branch
> `feat/post-launch-feedback` (PR #6 — OPEN, CLEAN, MERGEABLE, all CI GREEN).
> 79 commits ahead of `main`, structured across 7 phases — full per-commit
> task/what/why table in `docs/CHANGELOG.feat-post-launch-feedback.md`.
>
> **Inherits from closed PRs** (rebased into this branch): pnpm + Clerk JWT
> bridge + payment hardening PH-1/2/3 (`stripe_events` idempotency,
> `payment_transactions.metadata` snapshot, `stripe_disputes` + dispute
> webhook handlers), CI + onboarding, branch plan docs.
>
> **New on this branch**:
> - **Theme 1** (Waves 1-3 + W4-A/B): campaign approval state machine,
>   REFA/REFB schema refactor (`campaign_revisions` → `campaign_details`,
>   campaigns metadata-only, derived state, soft-delete + `deleted_by` audit),
>   admin pending-edits queue + diff viewer, "Updated {time}" badge on
>   public CampaignPage, `/admin/audit-log` page + `admin_activity_log`
>   RLS tightening (self-attribution INSERT).
> - **Theme 2 + 3** (W4-C ~ W4-H + cleanup): Navbar + Hero CTA clarity,
>   above-the-fold org chip, Campaign Lead affordance, owner-only outline
>   empty-state CTA, card Donate button, plus 6-pack YELLOW polish.
> - **Theme 4 / Wave 5** (W5-A1 + W5-B1 + W5-B2): CBO Duplicate campaign,
>   `organizations.default_campaign_template` JSONB + `/cbo/campaign-defaults`
>   page, CampaignForm prefill.
> - **Phase A6** (S1+S2+S3): Slack admin alerts (queue + helper + cron route
>   + trigger wiring + Vercel cron config). Email feature scrubbed entirely.
> - **Hotfix series H1-H7**: security, schema-drift, concurrency, auth UX,
>   PR #6 security review, pre-merge cleanup, CI workspace fix.
>
> Phase 8 / 8.5 / 9 / 10 features (in-kind pledges, match alerts, tax cron,
> public impact page) from `feat/taek` remain intentionally OUT of scope —
> see `docs/CHANGELOG.feat-post-launch-feedback.md` "What does NOT ship" for
> the deferred items.

## Project Overview

KC Digital Drive Market v3 — a full-stack marketplace for technology equipment donations between donors and community-based organizations (CBOs). Built with React + Vite (frontend) and Express.js (backend), using Supabase for the database and Clerk for authentication.

## Development Commands

## Package Manager

**Always use `pnpm`** for this project — never `npm` or `yarn`.

packageManager field is set to pnpm@11.1.2 in all package.json files. CI enforces this via corepack.

### Local Development (3 terminals)

```bash
# Terminal 1: Supabase full stack (Postgres, Auth, Storage, Studio, etc.)
cd backend && pnpm db:start

# Terminal 2: Express API server (port 4000)
cd backend/api && pnpm dev

# Terminal 3: Vite frontend (port 3000)
cd frontend-vite && pnpm dev
```

> `pnpm db:start` runs the full Supabase stack via the Supabase CLI (managed by `backend/supabase/config.toml`).

### Frontend (`frontend-vite/`)

```bash
pnpm dev             # Dev server on port 3000
pnpm build           # tsc && vite build
pnpm lint            # ESLint
pnpm lint:fix        # Auto-fix lint issues
pnpm format          # Prettier
pnpm type-check      # TypeScript validation
pnpm test:a11y       # Accessibility tests (axe-core)
```

### Backend (`backend/api/`)

```bash
pnpm start           # Run server (port 4000)
pnpm dev             # Auto-reload with node --watch
pnpm lint            # ESLint
```

### Database (Supabase CLI)

```bash
cd backend && pnpm db:reset         # Reset local DB (wipes data, re-runs all migrations + seed)
cd backend && pnpm db:push          # Push migrations to the linked REMOTE project (requires `supabase link`)
cd backend && pnpm db:start         # Start local Supabase stack
cd backend && pnpm db:stop          # Stop local Supabase stack
cd backend && pnpm db:status        # Show keys + URLs
```

> `pnpm db:push` is **remote-only** — it requires `pnpx supabase link --project-ref ...` first and pushes to the cloud project, not the local stack. For the local Docker stack there is no incremental "apply" command; the canonical path is `pnpm db:reset` (wipes data, replays everything including seed). When you need to apply a single new migration without losing local data (e.g. policy fix on a populated DB), pipe the migration file directly into the local Postgres:
>
> ```bash
> docker exec -i supabase_db_backend psql -U postgres < backend/supabase/migrations/<file>.sql
> ```
>
> The file still lives under `backend/supabase/migrations/`, so the next `db:reset` (and any teammate's reset) replays it cleanly.

> **Supabase CLI usage rule** — never install the Supabase CLI globally (no `brew install supabase`, no `npm i -g supabase`, no `supabase ...` calls relying on PATH). The CLI is pinned in `backend/package.json` devDependencies and invoked exclusively via `pnpx supabase ...` (or the `pnpm db:*` scripts above). For commands the scripts do not cover (e.g. `pnpx supabase link --project-ref xyz`, `pnpx supabase login`, `pnpx supabase migration new <name>`), run `pnpx supabase ...` from the `backend/` directory. This keeps the CLI version locked across all machines and matches CI behavior.

### Local Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/health
- Supabase Studio: http://localhost:54323
- Email testing (Inbucket): http://localhost:54324

## Architecture

### Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Auth**: Clerk (JWT) synced to Supabase via custom hook
- **Database**: Supabase (PostgreSQL 15) with Row-Level Security
- **Payments**: Stripe (frontend Elements + backend webhooks)
- **State**: Zustand (installed; stores added in Phase 5)
- **Forms**: React Hook Form + Zod validation
- **Backend**: Express.js (payment + request lifecycle handling)

### Directory Structure

```
frontend-vite/src/
├── App.tsx              # Root with Clerk + Supabase + Router providers
├── config/index.ts      # Centralized config for all env vars + feature flags
├── routes/index.tsx     # All React Router v6 route definitions
├── layouts/             # MainLayout (wraps pages with Navbar)
├── pages/
│   ├── organizations/   # Public org profiles (inline-editable for owners)
│   ├── donor/           # Donor dashboard, profile (cause-area alerts), donations
│   ├── cbo/             # CBO dashboard, requests, profile management
│   ├── admin/           # Admin dashboard, UserDetailPage, vetting/users/audit/requests sub-pages
│   ├── legal/           # privacy, terms, accessibility, cpsia, do-not-sell, sitemap
│   ├── RequestsPage.tsx                            # Tabs: Requests + Campaigns (?tab= URL state)
│   ├── CampaignPage.tsx, CampaignDonatePage.tsx   # Campaign feature pages
│   ├── FaqPage.tsx, ContactPage.tsx               # Static info pages
│   ├── WelcomePage.tsx, PaymentSuccess/Cancel.tsx
├── components/
│   ├── ui/              # 24 shadcn/ui components (Radix-based)
│   ├── home/            # HeroSection, BentoGridSection, ContentBlockSection, FeaturesSection, StatsSection, etc.
│   ├── campaigns/       # CampaignCard (progress bar + supporters + integrated donate modal)
│   ├── organization/    # Profile tabs + AddTeamMemberDialog, PostUpdateDialog (owner CRUD)
│   ├── requests/        # FulfillDialog, DenyDialog, AcceptPledgeDialog, ConfirmReceiptDialog, InKindPledgeDialog
│   ├── notifications/   # NotificationsBell, NotificationsList
│   ├── CampaignDonateModal.tsx # In-page Stripe donation flow for campaigns
│   ├── Footer.tsx       # Site footer with newsletter subscribe
│   ├── NoticeBanner.tsx # Top-of-page announcement bar
│   ├── AdminRoute.tsx   # /admin guard (uses useRealUserType for impersonation safety)
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useClerkSupabase.ts   # Syncs Clerk user → Supabase user_profiles
│   └── useNotifications.ts   # In-app notification feed (Phase 5)
├── stores/              # Zustand stores (Phase 5)
├── lib/
│   ├── supabase.ts      # Supabase client + all DB helper functions
│   ├── stripe.ts        # Stripe Promise init + createPaymentIntent
│   ├── api.ts           # Authenticated fetch wrapper for backend API (Phase 4)
│   └── utils.ts         # Helpers (cn, formatCurrency, etc.)
└── types/database.ts    # TypeScript types matching DB schema

backend/
├── api/
│   ├── server.js                       # Express server: payments + Stripe Connect + webhook (Vercel serverless export)
│   ├── middleware/clerkAuth.js         # Clerk JWT verification (@clerk/backend)
│   ├── helpers/
│   │   ├── paymentMetadata.js          # PH-2: hashIp + buildPaymentMetadata + appendLifecycle
│   │   └── disputes.js                 # PH-3: upsertDispute for stripe_disputes table
│   ├── services/pdfGenerator.js        # PDF donation receipts (pdfkit)
│   └── routes/
│       └── users.js                    # POST /become-cbo, /sync (bypasses RLS trigger)
└── supabase/
    ├── migrations/      # SQL migration files (run in order)
    ├── config.toml      # Supabase CLI config (Clerk registered as third-party auth)
    └── seed.sql         # Mock orgs/donors/campaigns + tax-documents bucket + cause-area taxonomy

_docs/                                 # Project documentation (gitignored — local only)
├── plan.md                            # Feature roadmap; branch + Backlog sections at end
├── tasks.md                           # Branch task tracking + Backlog "Later work"
├── architecture.md                    # Architecture decisions
├── stripe-webhook.md                  # Webhook flow + PH-1 idempotency implementation record
├── clerk-supabase-auth.md             # Clerk Third-Party Auth setup for Supabase RLS
├── debug-payment-flow.md              # Postmortem: BUG-8 → BUG-11 cascade
├── auth-strategy-decision.md          # Why Clerk + Supabase TPA over alternatives
├── glossary.ko.md                     # Korean glossary of project terms
├── 00.tasks.md                        # feat/pnpm-jwt-integration task tracker (CLOSED)
├── 00.payment-hardening.tasks.md      # feat/payment-hardening task tracker (CLOSED)
├── pnpm-jwt-integration-plan.md       # Original integration plan (CLOSED)
└── archive/                           # Old planning docs, feat/taek merge artifacts
```

The `docs/` folder holds tracked user-facing docs: `docs/howtoexecute.local.md` (local dev guide), `docs/howtodeploy.prod.md` (production deployment), `docs/CHANGELOG.feat-post-launch-feedback.md`, `docs/feat-post-launch-feedback.md` (branch entry point), plus reference material (Vercel, GitHub Actions, etc.). `_docs/` remains gitignored for local PM scratch.

### Authentication Flow

1. User signs in via Clerk
2. `useClerkSupabase` hook calls backend `POST /api/users/sync` to create/update Supabase `user_profiles` (server-side bypasses RLS trigger)
3. Supabase client is initialized with a Clerk `accessToken` getter; every query carries the Clerk JWT so RLS policies see `clerk_user_id()`
4. Frontend uses the **publishable key** for data queries (`VITE_SUPABASE_PUBLISHABLE_KEY`, formerly `anon`); RLS enforces access
5. Backend uses the **secret key** (`SUPABASE_SECRET_KEY`, formerly `service_role`) for webhook/admin operations

### Payment Flow

1. Donor initiates donation → frontend calls `POST /api/payments/create-intent` with `requestId` + Clerk JWT header
2. Backend resolves `donorId` from JWT, reads canonical `amount` from DB (never from client body) → creates Stripe PaymentIntent with metadata
3. Frontend renders Stripe CardElement for card entry
4. On success, Stripe sends webhook → `POST /api/payments/webhook`
5. Backend verifies signature, checks idempotency via `stripe_events` table, updates `requests` (status=claimed, donor_id, payment_intent_id), notifies CBO via `request_notifications`

### Request Lifecycle

```
open → claimed (via Stripe webhook on payment_intent.succeeded)
claimed → fulfilled (CBO action: POST /api/requests/fulfill)
claimed → denied (CBO action: POST /api/requests/deny)
open → denied (CBO action: POST /api/requests/deny)
claimed → open (automatic: on charge.refunded webhook)
```

### Database Schema (key tables)

Core:

- `user_profiles` — Clerk user ID (TEXT) + `user_type` (donor/cbo/admin) + `org_tier` (individual/small_org/large_org) + `verification_status` (unverified/verified); `id` is no longer FK-bound to `auth.users` after `20260518000000_clerk_user_id_text.sql`
- `donor_profiles` — donor-specific data (display_name, bio, max_per_request, cause-area match preferences)
- `organizations` — CBO profiles (logo_url, mission, cover_image_url, social_links, `ages_served`, `pre_eligibility_status`, `default_campaign_template` JSONB). **Wave 5 / W5-B1** (`20260618000001_organization_default_campaign_template.sql`): nullable JSONB with shape `{ creator_name?, creator_role?, contact_email?, cause_area_ids?: UUID[], faqs?: [{question, answer}] }`. Drives new-campaign form prefill via `CampaignForm` mount-time fetch (W5-B2). Owner-managed via `/cbo/campaign-defaults` page (W5-B1)
- `requests` — equipment donation requests with status enum + payment_intent_id + Phase 8 form-depth fields (`donation_type`, `device_type_breakdown`, `need_frequency`, etc.)
- `request_notifications` — in-app notification log (recipient_id, is_read, supports `match_alert` type)
- `fulfillment_records` — tracks completed donations with method + tracking
- `request_history` — audit log of status transitions
- `in_kind_pledges` — Phase 8.5 device pledges (donor commits a physical device instead of cash); status `pending|accepted|rejected`
- `donor_cause_areas` — Phase 9 donor opt-in to cause-area match alerts (junction; trigger inserts notifications on matching requests)

Campaigns (from main):

- `campaigns` — fundraising campaigns by orgs (funding_goal, amount_raised, supporters_count, story_content, `cause_area_ids: TEXT[]` for chip filter)
- `campaign_questions` — visitor-submitted FAQs awaiting org review

Payments / Stripe Connect:

- `payment_transactions` — full ledger of donations including fee splits + `metadata` JSONB snapshot (PH-2: stripe / lifecycle / target / client / diagnostics sections)
- `stripe_events`, `stripe_connect_events` — webhook event idempotency. PH-1 wires `stripe_events` INSERT at webhook entry so Stripe retries (network failure, our 5xx) hit the PK conflict and return `{received: true, duplicate: true}` instead of double-processing side effects
- `stripe_disputes` — PH-3 dispute lifecycle (`dispute_id PK, payment_intent_id, status, reason, amount, evidence_due_by, ...`). Service-role-only (no public RLS policies — intent documented in migration `20260611000000_stripe_disputes.sql`). Webhook handlers in `server.js` for `charge.dispute.created` / `funds_withdrawn` / `funds_reinstated` / `closed` upsert by `dispute_id` (idempotent under PH-1 replay)
- `platform_settings` — platform fee configuration

Documents:

- `organization_documents` — CBO-uploaded files (501c3, financials, etc.)
- `donor_documents`, `tax_documents` — donor-facing receipts and annual summaries (PDF)

Misc:

- `support_faqs`, `support_contact_info` — donor dashboard help content
- `newsletter_subscriptions` — footer signup form
- `organization_updates`, `organization_team_members`, `organization_populations` — public profile content
- `admin_activity_log` — admin action audit. **W4-B**: RLS tightened from wide-open SELECT/INSERT to admin-only SELECT (via `user_profiles.user_type = 'admin'`) + self-attribution INSERT (`clerk_user_id() = admin_id`) in `20260618000000_admin_activity_log_soft_delete_writes.sql`. Surfaced via `/admin/audit-log` page (filters by action + entity_type, `sinceIso` cursor pagination). 5 admin write sites log here: campaign approve / reject / restore / user verify-unverify (+ legacy `settings_updated`)
- `slack_notification_queue` — **Phase A6 / A6-S1**: admin Slack alert batching queue. Columns: `(id PK, dedupe_key TEXT, channel TEXT, payload JSONB, status pending/sent/failed, queued_at, sent_at, attempt_count, last_error)`. **Partial UNIQUE index on `(dedupe_key) WHERE status='pending'`** is the dedupe primitive — "1 user edits same campaign 5x in 5 min" collapses to one row via UPSERT. Service-role-only (no public RLS policies — intent in COMMENT). `20260619000000_slack_notification_queue.sql`

Junction tables: `organization_cause_areas`, `request_challenge_categories`, `request_identity_categories`.

All tables use RLS; migrations are in `backend/supabase/migrations/`.

**Important column-name reconciliations:**

- `organizations.logo_url` (was `logo`; reconciled in `20260427000000_schema_reconcile.sql`)
- `request_notifications.recipient_id` (was `user_id`; reconciled in the same migration)
- `request_notifications.is_read` (was `read`)
- `user_profiles.id` is **TEXT** (Clerk user ID) since `20260518000000_clerk_user_id_text.sql`; no FK to `auth.users`
- `donor_cause_areas.donor_id` (NOT `user_id`; standardized during the 2026-05-18 merge)
- `user_profiles.org_tier` + `verification_status` added in `20260524000000_admin_user_tier_columns.sql` (origin/main referenced them but never created the columns)
- `campaigns.cause_area_ids: TEXT[]` added in `20260525000000_campaign_cause_area_ids.sql` (same origin/main gap)
- `donor_documents.campaign_id` + `donor_name` + `donor_email` added in `20260605000000_phase9b_tax_receipts.sql`; same migration creates the `tax-documents` Storage bucket
- `request_notifications.campaign_id` added in `20260605000100_increment_campaign_amount_rpc.sql` (table is now campaign-aware in addition to request-aware)
- `payment_transactions` RLS extended to allow donors to read their own rows in `20260605000200_payment_transactions_donor_read.sql` (was service-role-only)

**Read-only views**:
- **Per-donor (RLS'd via `clerk_user_id()`)** — auto-derived from `payment_transactions` + `fulfillment_records`:
  - `donor_impact_summary` — total_donated, lives_impacted, organizations_helped, months_active
  - `donor_impact_by_cause` — per-cause-area split with percentage
  - `donor_monthly_donations` — month × amount for chart
  - `donor_impact_stories` — recent fulfilled-request narratives
- **Platform-wide (anon-readable; `security_invoker = off`, aggregate-only)** — Phase 10:
  - `platform_impact_summary` — total_donated, total_donors, total_organizations, requests_fulfilled, active_campaigns
  - `platform_impact_by_cause` — cause-area split across all donors
  - `platform_top_organizations` — top 10 orgs by amount received

**Audit tables (service-role writes only):**
- `annual_summary_runs` — one row per cron invocation; admin-readable via RLS

**Postgres RPCs:**
- `increment_campaign_amount(p_campaign_id UUID, p_amount NUMERIC)` — SECURITY DEFINER, service_role only; atomic UPDATE of `campaigns.amount_raised` + `supporters_count`. Called by the Stripe webhook on `payment_intent.succeeded` for campaign donations.
- `set_donor_cause_areas(p_donor_id TEXT, p_cause_area_ids UUID[])` — Phase 9 Batch A; replaces a donor's cause-area subscriptions in a single transaction.
- `append_lifecycle(p_id UUID, p_entry JSONB)` — Phase H3; atomic JSONB array append on `payment_transactions.metadata.lifecycle`. Closes lost-update race on concurrent webhook lifecycle entries.
- `process_payment_succeeded / process_payment_failed / process_charge_refunded / process_dispute_closed` — Phase H3; each is a per-handler RPC that atomically applies the side effect (lifecycle append + status update) AND inserts into `stripe_events`. PK conflict (23505) on duplicate event maps to `{duplicate: true}` so the dedup-before-sideeffect hole in Stripe retries is closed.
- `create_campaign_with_detail(p_organization_id UUID, p_content JSONB, p_created_by TEXT)` — Phase H3 / Theme 1; SECURITY DEFINER. Atomic insert of `campaigns` row + `campaign_details(version=1, status='pending_initial_approval')`. Owner gate: `organizations.user_id = clerk_user_id()` (no role bypass — admins also blocked, but admin UI doesn't create campaigns today). Re-used by Wave 5 `duplicateCampaign` helper.

**Public routes (no auth):**
- `/impact` — Phase 10 public impact dashboard (PublicImpactPage).
- `/`, `/about`, `/faq`, `/contact`, `/requests`, `/campaign/:slug`, `/legal/*` — existing public routes.

## Environment Variables

**Frontend (`frontend-vite/.env.local`):**

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=KC Digital Drive Market
VITE_ENVIRONMENT=development
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_REALTIME=true
```

**Backend (`backend/api/.env`):**

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BYPASS_CONNECT=true       # dev only — skip Stripe Connect destination charges
SUPABASE_URL=
SUPABASE_SECRET_KEY=
CLERK_SECRET_KEY=
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000

# Payment metadata (PH-2). Dev fallback exists; PRODUCTION must set IP_HASH_SALT.
IP_HASH_SALT=                    # `openssl rand -hex 32` — salts SHA-256 IP hash
GIT_SHA=                         # backend version stamp in payment_transactions.metadata.diagnostics

# Slack admin alerts (Phase A6). See docs/howtoexecute.local.md "Testing Slack
# admin alerts locally" + docs/howtodeploy.prod.md Step 5.
CRON_SECRET=                     # REQUIRED — `openssl rand -hex 32`. Without it,
                                 # /api/cron/flush-slack-queue returns 401
SLACK_WEBHOOK_URL=               # OPTIONAL — unset = dev mode (console.log
                                 # `[slack:dev]`, queue still marks `sent`)
APP_URL=http://localhost:3000    # OPTIONAL — link prefix in Slack messages

# Dev role bootstrap (dev only). CSV of `email:role` (admin|cbo|donor).
# On /api/users/sync the backend fetches the email via the Clerk API and, for
# the listed accounts, force-sets user_type + onboarding_complete + verification_status.
# Inert when NODE_ENV=production (see prod-safety note below). DO NOT set in prod.
DEV_ROLE_OVERRIDES="taek.lim.us@gmail.com:admin,txl25880@ucmo.edu:donor,mysites.victor@gmail.com:cbo"
```

`STRIPE_BYPASS_CONNECT=true` lets the `/api/payments/create-intent` route create test-mode PaymentIntents against the platform account instead of requiring each organization to have a connected Stripe account (`stripe_account_id` + `stripe_charges_enabled`). Without it, every donation 400s with `code: STRIPE_NOT_CONNECTED` until the org completes Connect onboarding. Never set in production.

`IP_HASH_SALT` MUST be set in production (32+ bytes from `openssl rand -hex 32`). Without it, the code fallback (`'dev-only-replace-in-prod'`) is used and donor IP hashes become reversible via rainbow table. `GIT_SHA` is recommended; on Vercel set it to `${VERCEL_GIT_COMMIT_SHA}` so `payment_transactions.metadata.diagnostics.backend_version` traces which build processed each payment.

`DEV_ROLE_OVERRIDES` is **dev-only and inert in production** by two independent layers: (1) a `NODE_ENV !== 'production'` hard guard in `resolveDevRoleOverride()` (`backend/api/routes/users.js`) returns `null` in prod, so the entire override block — `user_type`, `onboarding_complete`, `verification_status` — is skipped; (2) defense-in-depth: never add `DEV_ROLE_OVERRIDES` to the production env (e.g. Vercel project vars) — even if set, layer (1) ignores it. It exists only so designated dev accounts land straight in their dashboard after sign-in (no onboarding banner, owner-vetted org stays public), and it re-applies after `pnpm db:reset`.

All frontend env vars are accessed through `frontend-vite/src/config/index.ts`.

## Key Conventions

- **Path alias**: `@/` maps to `frontend-vite/src/` — use this for all imports
- **Component library**: Use existing shadcn/ui components from `src/components/ui/` before creating new ones
- **Config**: All feature flags and environment access go through `src/config/index.ts`
- **TypeScript**: Strict mode — `noUnusedLocals` and `noUnusedParameters` enforced
- **Supabase queries**: Use helpers from `src/lib/supabase.ts`; never use service role key in frontend
- **Amount handling**: Never trust `amount` from client body — always read from DB in backend
- **Notifications**: Insert into `request_notifications` with `recipient_id` (not `user_id`)
- **Migrations**: Never edit existing migration files — always add a new migration file

## Adding a new DB table — required workflow

Any migration in `backend/supabase/migrations/` that introduces a new table must include all of the following in the **same** migration file. Splitting these across multiple migrations historically caused BUG-12 (RLS enabled with zero policies → silent block of all non-service-role traffic). See `_docs/debug-payment-flow.md` for the full case study.

Checklist for any new-table migration:

- [ ] `CREATE TABLE`
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] `CREATE POLICY` for SELECT (public, or owner-scoped)
- [ ] `CREATE POLICY` for INSERT / UPDATE / DELETE (owner-scoped via `public.clerk_user_id()`)
- [ ] Indexes on FK columns (Postgres does NOT auto-index FKs)

After the user runs `pnpm db:push` (or `db:reset`), Claude must automatically run this validation query and report any table with `rls_enabled = true` and `policy_count = 0`:

```bash
docker exec -i supabase_db_backend psql -U postgres -c "
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY rls_enabled DESC, policy_count ASC;
"
```

Result interpretation:

- `rls_enabled = true` + `policy_count ≥ 1` → safe
- `rls_enabled = true` + `policy_count = 0` → **silent block, fix before reporting done**, unless the table is explicitly service-role-only (e.g. `stripe_events`) — in that case the migration must contain a comment stating this intent

This validation is not optional. It runs every time a migration touches a table, whether the user asks for it or not.

## Documentation

Tracked docs live in `docs/` (git tracked, team-shareable). Local PM scratch lives in `_docs/` (gitignored).

| File                                            | Contents                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `README.md` (root)                              | Project entry point, Quick Start, doc index, security conventions                                     |
| `docs/howtoexecute.local.md`                    | Complete local dev setup, troubleshooting, "Testing Slack admin alerts locally" recipe                |
| `docs/howtodeploy.prod.md`                      | Production deployment (Vercel + Supabase Cloud + Stripe + Step 5 Slack notifications)                 |
| `docs/CHANGELOG.feat-post-launch-feedback.md`   | Per-commit task/what/why for everything between `main` and current HEAD (team-shareable)              |
| `docs/feat-post-launch-feedback.md`             | Branch entry point — Theme 1-4 definitions, D1-D5 architect decisions                                 |
| `docs/VERCEL_DEPLOYMENT.md`                     | Vercel-specific deep dive (cost, tiers, deployment internals)                                         |
| `docs/GITHUB_ACTIONS_GUIDE.md`                  | CI workflow reference                                                                                 |
| `docs/MAZE_TESTING_SCENARIOS.md`                | User-testing scripts for Maze.com                                                                     |
| `docs/USER_TYPES_AND_STAGES.md`                 | User roles + lifecycle stages baseline                                                                |
| `docs/TAX_DOCUMENTS.md`                         | IRS compliance reasoning for donation receipts                                                        |
| `_docs/00.post-launch-feedback.tasks.md`        | Current PM task tracker (this branch). Phase 로드맵 + dispatch briefs + YELLOW follow-ups            |
| `_docs/00.post-launch-feedback.architecture.md` | Theme 1 D1-D5 architect lock                                                                          |
| `_docs/stripe-webhook.md`                       | Stripe webhook flow + idempotency + reconciliation                                                    |
| `_docs/clerk-supabase-auth.md`                  | Clerk JWT → Supabase Third-Party Auth setup                                                           |
| `_docs/debug-payment-flow.md`                   | Postmortem: BUG-8 → BUG-11 cascade. Symptom-by-symptom debug walkthrough                              |
| `_docs/auth-strategy-decision.md`               | Why Clerk + Supabase TPA over alternatives                                                            |
| `_docs/architecture.md`                         | General architecture decisions                                                                        |
| `_docs/glossary.ko.md`                          | Korean glossary of project terms                                                                      |

**Phases 1–10 are complete.** Current branch ships Theme 1-4 of post-launch feedback work — see `docs/CHANGELOG.feat-post-launch-feedback.md` for the full per-commit breakdown.

Most recently merged from `origin/main` (2026-05-18): full homepage design system (Hero/Bento/Stats/Footer), Stripe Connect + platform fees, campaigns feature with rich-text editor, admin redesign + user management, FAQ/Contact/Legal pages, Vercel serverless backend, PDF receipt pipeline.

Post-merge Phase 9 + 10 work (2026-06-05/06):
- **Batch B — tax receipts pipeline** wired up. `donor_documents` got the `campaign_id` / `donor_name` / `donor_email` columns the webhook had been INSERTing into nothing; created the `tax-documents` Storage bucket (private, 10 MB, PDF-only) and its RLS policies (donors read their own, service role writes).
- **Batch C — impact reports**: `payment_transactions` seeded with 10 mock transactions across 3 donors so the donor_impact_* views populate. RLS added so donors can read their own `payment_transactions` (was service-role-only, which silently killed campaign donations on /donor/dashboard "My Donations").
- **Batch D — annual summary cron**: `POST /api/cron/generate-annual-summaries?year=YYYY` (header `x-cron-secret: $CRON_SECRET`) iterates donors with succeeded transactions in the given year and generates one PDF annual summary per donor via the existing pdfGenerator. Audit table `annual_summary_runs` records every run. Idempotent per (donor, year) via upsert on `donor_documents`. Filters out the literal `'anonymous'` donor_id sentinel.
- **Phase 10 — Public Impact page** at `/impact`. Three new public views (`platform_impact_summary`, `platform_impact_by_cause`, `platform_top_organizations`) marked `security_invoker = off` and `GRANT SELECT TO anon, authenticated`. Aggregate-only — no donor_id, transaction_id, or amount_total exposed. New page shows 5 hero stats, cause-area split bars, top-10 orgs list, and CTAs back to /requests and /campaigns.
- **Campaign donation increment bug** fixed: added `increment_campaign_amount(uuid, numeric)` SECURITY DEFINER RPC; webhook now actually moves `campaigns.amount_raised` / `supporters_count`. `request_notifications.campaign_id` column added so CBO sees campaign-donation alerts in the same NotificationsBell.

Vercel cron deployment wiring landed in Phase A6 (`backend/api/vercel.json` `crons` array → `/api/cron/flush-slack-queue` every 5 min). Homepage StatsSection → live `platform_impact_summary` polish remains backlog.

## File Naming Conventions

- **`x_` prefix** marks a file or folder as **deprecated / unused**. Treat it as read-only history — do not edit, link to, or rely on it. Examples: `x_docs/` (legacy v3 setup docs, kept for archival only). When something becomes deprecated, rename it with the `x_` prefix instead of deleting, so it's visually flagged and easy to find later if needed.
- **`_` prefix** (e.g. `_docs/`, `_scripts/`) marks a folder as **project-meta** — documentation, scripts, or tooling that lives alongside code but isn't part of the runtime build.
- **`z_` prefix** marks a file as **personal scratch** — gitignored via `z_*` in `.gitignore`, never committed. Use for ad-hoc test scripts, throwaway queries, or local-only notes. Sorts to the bottom of file listings so it stays out of the way.

## CI/CD

GitHub Actions in `.github/workflows/`:

- `frontend-ci.yml` — lint, type-check, a11y tests on PRs
- `backend-ci.yml` — lint and quality checks
- `pr-checks.yml` — PR label validation

Production deploys frontend to Vercel, backend as Express server, database on Supabase Cloud.

## git

- use intothedeep(tio.taek.lim@gmail.com) for github commits

## Answer

- answer in Korean
