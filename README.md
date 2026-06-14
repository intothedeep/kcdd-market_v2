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
| **[howtoexecute.local.md](./howtoexecute.local.md)** | Complete local dev setup, troubleshooting, debugging |
| **[howtodeploy.prod.md](./howtodeploy.prod.md)** | Production deployment (Vercel + Supabase Cloud + Stripe) |
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

Production-required additions (see `howtodeploy.prod.md`):
- `IP_HASH_SALT` — `openssl rand -hex 32` (PH-2 payment metadata IP hashing)
- `GIT_SHA` — `VERCEL_GIT_COMMIT_SHA` on Vercel (backend version tracking)

---

## Project Structure

```
kcdd-market2/
├── frontend-vite/        # React + Vite app (port 3000)
├── backend/
│   ├── api/              # Express server (port 4000)
│   │   ├── server.js
│   │   ├── middleware/clerkAuth.js
│   │   ├── helpers/      # paymentMetadata.js, disputes.js (PH-1~3)
│   │   ├── routes/       # users.js
│   │   └── services/pdfGenerator.js
│   └── supabase/
│       ├── migrations/   # SQL migrations (run in order)
│       ├── seed.sql      # Mock orgs/donors/campaigns + tax-documents bucket
│       └── config.toml   # Supabase CLI config (Clerk TPA registered)
├── _docs/                # Project documentation (gitignored — local only)
├── howtoexecute.local.md # Local dev guide
├── howtodeploy.prod.md   # Production deployment guide
├── CLAUDE.md             # AI-collaboration project conventions
└── README.md             # This file

# Deprecated (kept for reference, do not use):
backend/x_docker-compose.yml.legacy
backend/x_volumes/
```

The local Supabase stack runs via the Supabase CLI (`pnpm db:start`), NOT the legacy `x_docker-compose.yml.legacy`.

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

This branch family extends `main` with the pnpm + Clerk JWT bridge integration and payment hardening:

- `feat/pnpm-jwt-integration` — pnpm migration, Clerk JWT bridge, RLS reconcile, server-side amount on `create-intent`, campaigns-only mock seed
- `feat/payment-hardening` — `stripe_events` idempotency wiring, `payment_transactions.metadata` snapshot + lifecycle, `stripe_disputes` table + dispute webhook handlers

Phase 8 / 8.5 / 9 / 10 features from `feat/taek` (in-kind pledges, match alerts, tax cron, public impact page) are intentionally NOT included here — see `_docs/tasks.md` "Backlog — Later work" for the deferred items.

---

## Security & Conventions

- **Amount handling**: Backend always reads `amount` from DB (`requests.amount` or `campaigns`), never from client body
- **Webhook idempotency**: `stripe_events` PK on `event_id` prevents double-processing of Stripe retries
- **Payment metadata**: every `payment_transactions` row has a `metadata` JSONB snapshot (stripe / lifecycle / target / client / diagnostics). IP is hashed (SHA-256 + salt), never stored raw
- **PII**: Never store card data, raw IP, session tokens, or PAN — Stripe Elements handles all card I/O client-side
- **RLS**: Every public table has explicit policies; service-role-only tables document the intent in their migration (e.g. `stripe_events`, `stripe_disputes`)

---

**License**: MIT
**Version**: 3.0.0
