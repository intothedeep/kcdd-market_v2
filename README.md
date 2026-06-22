# KC Digital Drive Market v3

Full-stack marketplace connecting Kansas City donors with community-based organizations (CBOs) for technology equipment donations. React + Vite frontend, Express.js backend, Supabase database, Clerk authentication, Stripe payments.

## Quick Start

```bash
# Terminal 1 — Supabase full stack (Postgres, Auth, Storage, Studio)
cd backend && pnpm db:start

# Terminal 2 — Express API server (port 4000)
cd backend/api && pnpm dev

# Terminal 3 — Vite frontend (port 3000)
cd frontend-vite && pnpm dev
```

**Access points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/health
- Supabase Studio: http://localhost:54323
- Email testing (Inbucket): http://localhost:54324

**Package manager**: pnpm only (never npm or yarn). Pinned to `pnpm@11.1.2` via the `packageManager` field; CI enforces this via corepack.

---

## Documentation

| File | Purpose |
|---|---|
| **[howtoexecute.local.md](./docs/howtoexecute.local.md)** | Complete local dev setup, troubleshooting, debugging |
| **[howtodeploy.prod.md](./docs/howtodeploy.prod.md)** | Production deployment (Vercel + Supabase Cloud + Stripe) |
| **[CLAUDE.md](./CLAUDE.md)** | Project conventions, architecture, env vars, file structure |
| `_docs/architecture.md` | Architecture decisions (local-only — `_docs/` is gitignored) |
| `_docs/stripe-webhook.md` | Webhook flow + idempotency + reconciliation strategy |
| `_docs/clerk-supabase-auth.md` | How Supabase validates Clerk JWTs (Third-Party Auth) |
| `_docs/debug-payment-flow.md` | Postmortem: BUG-8 → BUG-11 cascade debug walkthrough |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Auth | Clerk (JWT) synced to Supabase via Third-Party Auth |
| Database | Supabase (PostgreSQL 15) with Row-Level Security |
| Payments | Stripe (frontend Elements + backend webhooks + Connect) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Backend | Express.js (payment + request lifecycle handling) |

---

## Environment Variables

Copy `.env.example` files and fill in real values:

```bash
cp frontend-vite/.env.example frontend-vite/.env.local
cp backend/api/.env.example backend/api/.env
```

Production-required additions (see `docs/howtodeploy.prod.md`):
- `IP_HASH_SALT` — `openssl rand -hex 32` (PH-2 payment metadata IP hashing)
- `GIT_SHA` — `VERCEL_GIT_COMMIT_SHA` on Vercel (backend version tracking)
- `CRON_SECRET` — `openssl rand -hex 32` (A6 Slack cron auth; `/api/cron/flush-slack-queue` returns 401 without it)
- `SLACK_WEBHOOK_URL` — Slack Incoming Webhook (optional; unset = dev `[slack:dev]` console fallback, queue still drains)
- `APP_URL` — link prefix in Slack alert bodies (e.g. `https://kcdd-market.vercel.app`)

---

## Project Structure

```
kcdd-market2/
├── frontend-vite/        # React + Vite app (port 3000)
├── backend/
│   ├── api/              # Express server (port 4000)
│   │   ├── server.js
│   │   ├── middleware/clerkAuth.js
│   │   ├── helpers/      # paymentMetadata.js, disputes.js (PH-1~3), slack.js (A6-S1)
│   │   ├── routes/       # users.js
│   │   ├── services/pdfGenerator.js
│   │   └── vercel.json   # crons: /api/cron/flush-slack-queue every 5 min (A6-S3)
│   └── supabase/
│       ├── migrations/   # SQL migrations (run in order)
│       ├── seed.sql      # Mock orgs/donors/campaigns + tax-documents bucket
│       └── config.toml   # Supabase CLI config (Clerk TPA registered)
├── _docs/                # Project documentation (gitignored — local only)
├── docs/                 # Tracked documentation (howto, changelog, branch plan, references)
│   ├── howtoexecute.local.md
│   ├── howtodeploy.prod.md
│   ├── CHANGELOG.feat-post-launch-feedback.md
│   ├── feat-post-launch-feedback.md   # branch entry point — Theme 1-4 definitions + D1-D5
│   └── …                 # plus reference: GITHUB_ACTIONS_GUIDE / MAZE_TESTING / TAX_DOCUMENTS / USER_TYPES / VERCEL_DEPLOYMENT
├── CLAUDE.md             # AI-collaboration project conventions
└── README.md             # This file
```

The local Supabase stack runs via the Supabase CLI (`pnpm db:start`), managed by `backend/supabase/config.toml`.

---

## Database Commands

```bash
cd backend
pnpm db:start        # Start local Supabase stack
pnpm db:stop         # Stop stack
pnpm db:status       # Show keys + URLs
pnpm db:reset        # Wipe + replay all migrations + seed
pnpm db:push         # Push to REMOTE project (requires `pnpx supabase link` first)
```

For applying a single new migration without losing local data:
```bash
docker exec -i supabase_db_backend psql -U postgres < backend/supabase/migrations/<file>.sql
```

See [CLAUDE.md](./CLAUDE.md) "Adding a new DB table — required workflow" for the RLS validation checklist that runs after every migration.

---

## Branch State

Current branch: **`feat/post-launch-feedback`** — post-launch UX + ops hardening. PR #6 has the full description; per-commit task/what/why is in `docs/CHANGELOG.feat-post-launch-feedback.md`.

- **Theme 1 — Campaign approval lifecycle** (Waves 1-3 + W4-A/B): `campaign_details` versioned JSONB store, derived states (PENDING_INITIAL / PENDING_EDIT / ACTIVE / SOFT_DELETED), admin approval queue + diff viewer, owner soft-delete + restore, public "Updated {time}" badge (W4-A), `/admin/audit-log` page + `admin_activity_log` RLS tightening (W4-B)
- **Theme 2 — Homepage CTA clarity** (W4-C/D): navbar Sign in/Sign up split, hero "Browse requests & donate" + "For organizations" split CTA
- **Theme 3 — Campaign detail UX** (W4-E/F/G/H): above-the-fold org identity chip, Campaign Lead click affordance, owner-only outline empty-state CTA, card Donate button
- **Theme 4 — Wave 5 CBO productivity** (W5-A1/B1/B2): CBO Duplicate campaign action, `organizations.default_campaign_template` JSONB + `/cbo/campaign-defaults` page, new-campaign form prefill
- **Phase A6 — Slack admin alerts** (S1/S2/S3): `slack_notification_queue` (partial UNIQUE on `dedupe_key WHERE status='pending'` as the batching primitive) + `enqueueSlackAlert` helper + `/api/cron/flush-slack-queue` route + Vercel cron config. Dev mode (no `SLACK_WEBHOOK_URL`) logs `[slack:dev]` and still flips rows to `sent`. Email feature scrubbed
- **Hotfix series H1-H7**: security, schema drift, concurrency, auth UX, PR #6 security review, pre-merge cleanup, CI workspace fix

Inherits everything from `feat/payment-hardening` (PH-1/2/3 idempotency + metadata + disputes) and `feat/pnpm-jwt-integration` (pnpm + Clerk JWT bridge + campaigns-only mock seed). Phase 8 / 8.5 / 9 / 10 features (in-kind pledges, match alerts, tax cron, public impact page) remain backlog — see "What does NOT ship on this branch" in `docs/CHANGELOG.feat-post-launch-feedback.md`.

---

## Security & Conventions

- **Amount handling**: Backend always reads `amount` from DB (`requests.amount` or `campaigns`), never from client body
- **Webhook idempotency**: `stripe_events` PK on `event_id` prevents double-processing of Stripe retries
- **Payment metadata**: every `payment_transactions` row has a `metadata` JSONB snapshot (stripe / lifecycle / target / client / diagnostics). IP is hashed (SHA-256 + salt), never stored raw
- **PII**: Never store card data, raw IP, session tokens, or PAN — Stripe Elements handles all card I/O client-side
- **RLS**: Every public table has explicit policies; service-role-only tables document the intent in their migration (e.g. `stripe_events`, `stripe_disputes`)
- **Admin audit log**: `admin_activity_log` enforces self-attribution — admin rows are INSERT-able only when `clerk_user_id() = admin_id`. SELECT is restricted to `user_type = 'admin'`. Wide-open dev policies from `20240310000000_platform_settings.sql` were replaced in `20260618000000_admin_activity_log_soft_delete_writes.sql`
- **Slack admin alerts**: queue-based via `slack_notification_queue` (PK + `dedupe_key UNIQUE WHERE status='pending'`). Webhook URL never logged. Dev fallback (`[slack:dev]` console line) keeps local flows testable without a real workspace. Local recipe: `docs/howtoexecute.local.md` → Testing Slack admin alerts locally. Prod setup: `docs/howtodeploy.prod.md` Step 5

---

**License**: MIT
**Version**: 3.0.0
