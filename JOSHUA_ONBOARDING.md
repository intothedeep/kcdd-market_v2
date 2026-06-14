# Joshua — PR Series Review & Deployment Guide

Hi Joshua! This document walks you through three stacked PRs from `intothedeep` and what to do to (a) run them locally for review, (b) merge them, and (c) deploy them to Vercel + Supabase Cloud.

You can paste this whole file into Claude or ChatGPT if you want an interactive assistant during deployment — it's written to be self-contained.

---

## 1. What These PRs Do (2-minute version)

Three PRs stacked on top of each other:

| # | Branch | What it does | New commits |
|---|---|---|---|
| 1 | `feat/pnpm-jwt-integration` | Migrate npm → pnpm, wire Clerk JWT into Supabase RLS, server-side amount on `/api/payments/create-intent`, donor-read RLS, `tax-documents` storage bucket, campaigns-only mock seed | 12 |
| 2 | `feat/payment-hardening` | Three payment-hardening tasks: PH-1 (webhook idempotency), PH-2 (payment metadata snapshot), PH-3 (`stripe_disputes` table + dispute webhook handlers) | 5 |
| 3 | `chore/repo-cleanup-and-docs` | Delete superseded root files, rename legacy `docker-compose.yml`, update `README.md` / `CLAUDE.md` / `howtodeploy.prod.md` to reflect current state | 1 |

**No `Co-Authored-By: Claude` trailer on any commit.** Author is `Taek Lim <tio.taek.lim@gmail.com>` (GitHub `intothedeep`) per branch policy.

**Merge order**: PR #1 → PR #2 → PR #3. GitHub auto-updates each PR's base after the previous one merges.

**Out of scope** (intentionally — for separate work later):
- Reconciliation cron (Stripe API ↔ DB diff job)
- CBO dispute notifications
- Stripe Radar early fraud warning handler
- `feat/taek` Phase 8/8.5/9/10 features (in-kind pledges, match alerts, tax cron, public impact page)
- Storage adapter (Supabase → S3 abstraction; `supabase.storage` already covers both)

---

## 2. Prerequisites

### 2.1 Tooling

- Node.js 22.13+ (`node --version`) — pnpm 11.x requires Node 22.13 or newer
- **pnpm 11.1.2 or later** (this PR series requires it):
  ```bash
  corepack enable
  corepack prepare pnpm@11.1.2 --activate
  pnpm --version    # should print 11.1.2 or higher
  ```
- Docker Desktop (for the local Supabase stack)
- **Stripe CLI** (optional for local review, required if you want to test webhooks): https://stripe.com/docs/stripe-cli

### 2.2 External accounts

You will need three accounts. If you don't have them already:

- **Clerk** (https://dashboard.clerk.com) — authentication
- **Stripe** (https://dashboard.stripe.com) — payments (test mode is free)
- **Supabase** (https://supabase.com) — only needed for cloud deployment; the local stack runs in Docker

### 2.3 Clerk JWT Template — REQUIRED

This is the single most important Clerk setup step. The PR series will not work without it.

In your Clerk dashboard:

1. Go to **JWT Templates** in the left sidebar.
2. Click **New template**.
3. Choose the **Supabase** preset.
4. Name it **`supabase`** exactly (lowercase, no quotes — this exact string is referenced in code).
5. **Custom Signing Key: OFF** (default — use Clerk's key).
6. Save.

Without this template, `useClerkSupabase` cannot retrieve the JWT, Supabase RLS sees no `clerk_user_id()`, and every donor query returns `[]`. Symptom is "donor dashboard is empty" with no obvious error.

Reference: `_docs/clerk-supabase-auth.md` in the repo has the full Third-Party Auth setup explanation.

---

## 3. Local Setup (for PR Review)

### 3.1 Clone and install

```bash
git clone git@github.com:JoshuaMadrid/kcdd-market_v2.git
cd kcdd-market_v2

# Check out PR #1 first so you can review the whole stack:
git fetch origin
git checkout feat/pnpm-jwt-integration

# Install dependencies in three places:
pnpm install                                    # root (workspace manifest)
cd frontend-vite && pnpm install && cd ..
cd backend && pnpm install && cd ..
cd backend/api && pnpm install && cd ../..
```

Note: pnpm uses content-addressed storage so subsequent `pnpm install` calls in sibling directories are fast.

### 3.2 Environment files

```bash
cp frontend-vite/.env.example frontend-vite/.env.local
cp backend/api/.env.example backend/api/.env
```

Open both and fill in your own keys:

**`frontend-vite/.env.local`**:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_<your Clerk publishable key>
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<from `pnpm db:status`, the "anon key" / "publishable key">
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_<your Stripe publishable key>
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=KC Digital Drive Market
VITE_ENVIRONMENT=development
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_REALTIME=true
```

**`backend/api/.env`**:
```env
STRIPE_SECRET_KEY=sk_test_<your Stripe secret key>
STRIPE_WEBHOOK_SECRET=whsec_<set later when running stripe listen>
STRIPE_BYPASS_CONNECT=true
SUPABASE_URL=http://localhost:54321
SUPABASE_SECRET_KEY=<from `pnpm db:status`, the "service_role key" / "secret key">
CLERK_SECRET_KEY=sk_test_<your Clerk secret key>
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000

# Leave these empty for local — code falls back to safe defaults.
# REQUIRED in production. See section 4.3.
IP_HASH_SALT=
GIT_SHA=
```

> **Why `STRIPE_BYPASS_CONNECT=true`?** The seed data marks the 3 mock orgs as "Stripe-Connect ready" with placeholder `acct_test_*` account IDs that don't really exist on Stripe. Without bypass, every donation 400s with `STRIPE_NOT_CONNECTED`. Never set this in production.

### 3.3 Clerk Third-Party Auth in `config.toml`

`backend/supabase/config.toml` has a placeholder Clerk domain. Replace it with **your** Clerk frontend API domain:

```bash
# Get your Clerk domain — sign in to a local app first, then in browser console:
copy(await window.Clerk.session.getToken({ template: 'supabase' }))
# Paste at https://jwt.io
# Read the "iss" field, strip "https://" — that's your domain
# (e.g. "intense-shrew-12.clerk.accounts.dev")
```

Edit `backend/supabase/config.toml`:
```toml
[auth.third_party.clerk]
enabled = true
domain = "<your-clerk-domain>"      # ← replace
```

Do NOT commit this change — it's environment-specific. You can either keep it as a local-only edit or use a `.local` override file.

### 3.4 Boot the database

```bash
cd backend
pnpm db:start                       # starts the full Supabase stack (Postgres, Auth, Storage, Studio, Inbucket)
pnpm db:reset                       # wipes data, replays all migrations + seed.sql
```

`db:reset` populates:
- 3 mock CBOs (Connecting Roots KC, KC Tech Bridge, Digital Futures KC)
- 3 mock donor profiles
- 7 campaigns (6 active + 1 pending)
- `tax-documents` storage bucket for receipt PDFs
- All taxonomy (cause_areas, challenge_categories, identity_categories)

After `db:reset`, run the CLAUDE.md-mandated RLS validation:

```bash
docker exec -i supabase_db_backend psql -U postgres -c "
SELECT t.tablename, t.rowsecurity AS rls_enabled, COUNT(p.policyname) AS policy_count
FROM pg_tables t LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY rls_enabled DESC, policy_count ASC;
"
```

Expected: every table either has `policy_count ≥ 1`, OR is one of `stripe_events` / `stripe_disputes` (explicit service-role-only — intent documented in their migration comments). Any other table with `rls_enabled=true` and `policy_count=0` is a silent block bug — flag it in PR review.

### 3.5 Three-terminal run

```bash
# Terminal 1 (already running from step 3.4)
cd backend && pnpm db:start

# Terminal 2
cd backend/api && pnpm dev
# Wait for "Server running on http://localhost:4000"
curl http://localhost:4000/health   # → {"status":"ok",...}

# Terminal 3
cd frontend-vite && pnpm dev
# Wait for "Local: http://localhost:3000/"
```

Open http://localhost:3000 — you should see the homepage.

### 3.6 End-to-end smoke test

1. Sign up with a fresh email. Clerk handles the signup. After verification, you land on `/welcome`.
2. Pick "Donor" role.
3. Navigate to `/campaigns` (or click "Browse Campaigns" if visible). You should see 6 active campaign cards + 1 pending.
4. Click a card — you land on `/campaign/<slug>`. The detail page should render with progress bar, story, organization info.
5. Click "Support this campaign" — the donate modal opens with Stripe CardElement.
6. Enter test card: `4242 4242 4242 4242`, any future expiry (e.g. `12/30`), any 3-digit CVC (e.g. `123`), any ZIP.
7. Submit. Watch the backend terminal:
   ```
   Created campaign payment intent: { id: 'pi_...', campaignId: '...', amount: 12, ... }
   Payment succeeded: { paymentIntentId: 'pi_...', amount: 12 }
   Generated receipt: { receiptNumber: 'KCDD-2026-...', ... }
   ```
8. After redirect, visit `/donor/dashboard` "My Donations" tab — your donation should be listed.
9. Visit `/donor/documents` — your receipt PDF should be there, clickable, downloadable.

If any of steps 4–9 fails, check section 6 (Troubleshooting).

### 3.7 Reviewing PR #2 and PR #3

After you've validated PR #1, switch:

```bash
git checkout feat/payment-hardening
pnpm install      # only at root or wherever lockfiles changed
# No DB changes needed unless you want to re-apply 20260611000000_stripe_disputes.sql:
docker exec -i supabase_db_backend psql -U postgres < backend/supabase/migrations/20260611000000_stripe_disputes.sql
```

Verify the `stripe_disputes` table exists:
```bash
docker exec -i supabase_db_backend psql -U postgres -c "\d stripe_disputes"
# Should show 3 indexes + 10 columns
```

For PR #3 (cleanup), just diff the files — no runtime change.

### 3.8 Optional: Stripe webhook + dispute simulation

```bash
# In a new terminal:
stripe listen --forward-to localhost:4000/api/payments/webhook
# Output: > Ready! Your webhook signing secret is whsec_xxx
# Copy that whsec_xxx into backend/api/.env as STRIPE_WEBHOOK_SECRET, then restart the backend.

# In another terminal, simulate a dispute:
stripe trigger charge.dispute.created

# Verify:
docker exec -i supabase_db_backend psql -U postgres -c "SELECT dispute_id, status, reason, evidence_due_by FROM stripe_disputes ORDER BY created_at DESC LIMIT 1;"
# Should show one row with status='warning_needs_response' or similar.

# Verify idempotency (PH-1):
# Trigger any event twice via stripe trigger — DB stripe_events should have 1 row not 2 for the duplicated event_id.
docker exec -i supabase_db_backend psql -U postgres -c "SELECT event_id, event_type, received_at FROM stripe_events ORDER BY received_at DESC LIMIT 5;"
```

---

## 4. Cloud Deployment (Vercel + Supabase Cloud)

Reference document: `howtodeploy.prod.md` at the repo root. This section covers what's specific to the PR series.

### 4.1 Supabase Cloud project

1. Create a new project at https://supabase.com/dashboard.
2. Project Settings → API:
   - Copy **Project URL** → use as `SUPABASE_URL` in backend Vercel env.
   - Copy **service_role secret** → use as `SUPABASE_SECRET_KEY` in backend Vercel env.
   - Copy **anon / publishable key** → use as `VITE_SUPABASE_PUBLISHABLE_KEY` in frontend Vercel env.
3. Authentication → Sign In/Up → **Third Party Auth** → **Add Clerk**:
   - Domain: your Clerk frontend API domain (same as section 3.3).
4. Link locally and push migrations:
   ```bash
   cd backend
   pnpx supabase login                          # opens browser
   pnpx supabase link --project-ref <your-cloud-project-ref>
   pnpx supabase db push                        # pushes all migrations to cloud DB
   ```
   This applies all 14 migrations including the new `20260611000000_stripe_disputes.sql`.
5. (Optional) Run `seed.sql` against the cloud DB:
   - Open Supabase Studio (cloud) → SQL Editor → paste `backend/supabase/seed.sql` → Run. This creates the mock orgs + campaigns + `tax-documents` bucket. Skip if you don't want mock data in cloud.

### 4.2 Vercel — two projects from one repo

Create **two separate Vercel projects**, both pointing at this repo.

#### Frontend Vercel project

- **Root Directory**: `frontend-vite`
- **Framework Preset**: Vite
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Environment Variables**:
  | Variable | Value |
  |---|---|
  | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (from Clerk, production) |
  | `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
  | `VITE_SUPABASE_PUBLISHABLE_KEY` | (from Supabase Cloud Project Settings) |
  | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
  | `VITE_API_URL` | URL of the backend Vercel project (you'll get this after Backend deploys) |
  | `VITE_APP_NAME` | `KC Digital Drive Market` |
  | `VITE_ENVIRONMENT` | `production` |
  | `VITE_ENABLE_PAYMENTS` | `true` |
  | `VITE_ENABLE_REALTIME` | `true` |

#### Backend Vercel project

- **Root Directory**: `backend/api`
- **Framework Preset**: Other
- **Build Command**: (leave blank — serverless)
- **Output Directory**: (leave blank)
- **Environment Variables**:
  | Variable | Value | Notes |
  |---|---|---|
  | `SUPABASE_URL` | same as frontend's | |
  | `SUPABASE_SECRET_KEY` | service_role secret from Supabase | NEVER expose to frontend |
  | `CLERK_SECRET_KEY` | `sk_live_...` from Clerk | |
  | `STRIPE_SECRET_KEY` | `sk_live_...` from Stripe | |
  | `STRIPE_WEBHOOK_SECRET` | set after section 4.4 | |
  | `ALLOWED_ORIGINS` | frontend Vercel URL | comma-separate if multiple |
  | `NODE_ENV` | `production` | |
  | **`IP_HASH_SALT`** | **`openssl rand -hex 32` output** | **REQUIRED — see 4.3** |
  | `GIT_SHA` | `${VERCEL_GIT_COMMIT_SHA}` | Vercel auto-injects; type literally |
  | (do NOT set `STRIPE_BYPASS_CONNECT`) | — | production uses real Connect |

After both projects deploy, copy the Backend URL into the Frontend's `VITE_API_URL` and redeploy the frontend once.

### 4.3 Critical production env vars introduced by this PR series

#### `IP_HASH_SALT` — REQUIRED

What it does: salt for SHA-256 hashing of donor IPs into `payment_transactions.metadata.client.ip_hash`. We hash IPs (not store them raw) to comply with privacy expectations while still allowing duplicate-payment detection or abuse investigation.

Generate:
```bash
openssl rand -hex 32
# Output: 64-character hex string — paste this as the IP_HASH_SALT value
```

**Why it's required**: without a real salt, the code falls back to the literal string `'dev-only-replace-in-prod'`. An attacker who knows the fallback value (it's in the open-source repo) can pre-compute the SHA-256 of every IPv4 address (~4.3B entries, fits in a few hundred GB) and reverse our `ip_hash` values back to raw IPs. With a proper random salt, that attack becomes infeasible because the attacker doesn't know the salt.

Where it's used: `backend/api/helpers/paymentMetadata.js` → `hashIp()`.

#### `GIT_SHA` — RECOMMENDED

What it does: stamped into `payment_transactions.metadata.diagnostics.backend_version` on every donation. Lets you trace "which build processed this payment" — invaluable when debugging a regression that appeared on a specific deploy.

On Vercel: set the value to literally `${VERCEL_GIT_COMMIT_SHA}` — Vercel substitutes the deployment's commit SHA at runtime.

On other hosts: set to your deploy commit SHA via your CI variable.

If unset, the field stores `"unknown"` (functional but useless for debugging).

### 4.4 Stripe Webhook (production)

In the Stripe Dashboard:

1. Developers → Webhooks → **Add endpoint**.
2. URL: `https://<your-backend-vercel-url>/api/payments/webhook`
3. Events to listen for — **make sure to include all of these**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created` ← PH-3 (new in this PR series)
   - `charge.dispute.funds_withdrawn` ← PH-3
   - `charge.dispute.funds_reinstated` ← PH-3
   - `charge.dispute.closed` ← PH-3
   - (if you use Stripe Connect) `account.updated`, `transfer.created`
4. Click **Add endpoint**, then click the new endpoint to reveal its **Signing secret** (`whsec_...`).
5. Copy that into the Backend Vercel project as `STRIPE_WEBHOOK_SECRET`.
6. **Redeploy** the backend (so the new env var takes effect).

### 4.5 First production donation — verification

Use a real card and donate $1 (or your minimum) to confirm end-to-end:

1. Sign in on the production frontend.
2. Go to `/campaigns`, pick a campaign, click "Support".
3. Use a real card. Submit.
4. Check:
   - **Stripe Dashboard** → Payments shows the charge.
   - **Backend Vercel logs** show: `Created campaign payment intent`, `Payment succeeded`, `Generated receipt`.
   - **Supabase Studio** SQL Editor:
     ```sql
     SELECT
       stripe_payment_intent_id,
       status,
       metadata->'client'->>'ip_hash' AS ip_hash,
       metadata->'diagnostics'->>'backend_version' AS git_sha,
       metadata->'lifecycle' AS lifecycle
     FROM payment_transactions
     ORDER BY created_at DESC LIMIT 1;
     ```
     `ip_hash` should be a 16-char hex string (NOT `null`), `git_sha` should be the actual commit SHA (NOT `"unknown"`), `lifecycle` should have 2 entries: `intent_created` and `payment_intent.succeeded`.
   - **Frontend** `/donor/dashboard` shows the donation, `/donor/documents` lets you download the receipt PDF.
   - **Supabase Storage** → `tax-documents` bucket has the PDF file at `<your-clerk-user-id>/KCDD-2026-XXXXXX.pdf`.

---

## 5. After Merge — Recommended Cleanup

Once all three PRs are merged into main:

```bash
# In intothedeep's local clone (you don't need to do this on your side, Joshua)
git checkout main
git pull origin main
git branch -d feat/pnpm-jwt-integration feat/payment-hardening chore/repo-cleanup-and-docs
git push origin --delete feat/pnpm-jwt-integration feat/payment-hardening chore/repo-cleanup-and-docs
```

Branches can also be deleted via GitHub's "Delete branch" button on each merged PR.

---

## 6. Troubleshooting

### "Donor dashboard is empty after I donate"

Most likely the Clerk JWT isn't reaching Supabase. Check in order:

1. **Clerk JWT template named `supabase` exists?** (Section 2.3)
2. **`backend/supabase/config.toml` Clerk domain matches your Clerk app?** (Section 3.3)
3. **Browser console** — open DevTools, log in, run:
   ```js
   await window.Clerk.session.getToken({ template: 'supabase' })
   ```
   Should return a long JWT, not `null` or an error.
4. **PostgREST test** — using the token from step 3:
   ```bash
   APIKEY=$(pnpx supabase status | awk '/anon key/ {print $NF}')   # from backend/
   TOKEN="<paste from step 3>"
   curl -s "http://localhost:54321/rest/v1/user_profiles?select=id" \
     -H "apikey: $APIKEY" -H "Authorization: Bearer $TOKEN" | head -c 200
   ```
   Should return JSON with your row, NOT `[]` and NOT a 401. If 401, Supabase isn't accepting the Clerk JWT — domain mismatch.

### "Webhook is double-processing payments"

The PH-1 fix should prevent this. Verify:
```bash
docker exec -i supabase_db_backend psql -U postgres -c "SELECT event_id, COUNT(*) FROM stripe_events GROUP BY event_id HAVING COUNT(*) > 1;"
# Should return 0 rows
```
If you see duplicates, the `stripe_events` insert isn't running. Check `backend/api/server.js` around the webhook handler entry point — the dedup block should run AFTER `stripe.webhooks.constructEvent()` and BEFORE `switch(event.type)`.

### "Receipt PDF download is 404"

Check that the `tax-documents` storage bucket exists:
```bash
docker exec -i supabase_db_backend psql -U postgres -c "SELECT id, name, public FROM storage.buckets;"
```
Should show a row `tax-documents | tax-documents | f`. If missing, the seed didn't run — re-run `pnpm db:reset` from the `backend/` directory.

### "Dispute event doesn't update `payment_transactions.status`"

Check that the dispute event was actually received:
```bash
docker exec -i supabase_db_backend psql -U postgres -c "SELECT event_id, event_type, received_at FROM stripe_events ORDER BY received_at DESC LIMIT 5;"
```
If the dispute event isn't in `stripe_events`, the webhook didn't fire — check Stripe Dashboard → Webhook attempts, or `stripe listen` terminal output.

If the event is in `stripe_events` but `payment_transactions.status` is unchanged, check that the `payment_intent_id` on the dispute matches an existing `payment_transactions` row. Disputes triggered via `stripe trigger charge.dispute.created` use random PI IDs that won't match anything in your DB — that's expected during testing.

### "`pnpm db:reset` fails partway through"

Most common cause: a tracked dependency was removed (e.g. you deleted `seed.sql` content). Run:
```bash
docker exec -i supabase_db_backend psql -U postgres -c "SELECT 1;"
# If this fails too, the DB container is unhealthy:
pnpm db:stop && pnpm db:start
```

### "Vercel deploy succeeds but backend returns 500 on every request"

Most likely an env var is missing. Check Vercel logs for the actual error. Common missing vars on first deploy:
- `IP_HASH_SALT` — backend boots but `payment_transactions` INSERT fails when computing `ip_hash`.
- `SUPABASE_SECRET_KEY` — should be the `service_role` value, NOT the publishable key.
- `STRIPE_WEBHOOK_SECRET` — required for webhook signature verification; will 400 every webhook.

---

## 7. What's Different from Before — Operations Surfaces

This PR series introduces three new operational surfaces you should know about:

### 7.1 `stripe_events` table — webhook idempotency

Every webhook delivery now writes one row to `stripe_events`. PK on `event_id` deduplicates Stripe retries. Useful for:
- Verifying Stripe is actually reaching the backend (check `received_at`)
- Investigating "did this webhook fire?" questions

Query:
```sql
SELECT event_type, COUNT(*), MAX(received_at)
FROM stripe_events
GROUP BY event_type
ORDER BY MAX(received_at) DESC;
```

### 7.2 `payment_transactions.metadata` JSONB

Every donation has a structured metadata blob. Useful for debugging payment issues:
```sql
SELECT
  stripe_payment_intent_id,
  metadata->'lifecycle' AS lifecycle,
  metadata->'diagnostics'->>'backend_version' AS deployed_sha,
  metadata->'target' AS target
FROM payment_transactions
WHERE stripe_payment_intent_id = 'pi_xxx';
```

`lifecycle` is a time-ordered array of events (`intent_created`, `payment_intent.succeeded`, `charge.dispute.created`, etc.) — you can see exactly where a donation got stuck.

### 7.3 `stripe_disputes` table

Chargebacks land here. Important columns:
- `dispute_id` (PK)
- `payment_intent_id` (soft link to `payment_transactions`)
- `status` (Stripe's raw value: `warning_needs_response`, `won`, `lost`, etc.)
- `evidence_due_by` — **critical for operations**: if this passes without evidence submission, the dispute is automatically lost.

Recommended cron query (for future ops dashboard):
```sql
SELECT dispute_id, payment_intent_id, amount, evidence_due_by
FROM stripe_disputes
WHERE status = 'warning_needs_response'
  AND evidence_due_by < NOW() + INTERVAL '72 hours'
ORDER BY evidence_due_by ASC;
```

This service-role-only table has no public RLS policies — backend writes via service role, admin reads via backend. If you build an admin dispute dashboard later, it queries through the backend (not directly from frontend with anon key).

---

## 8. Contact

Questions during review? `intothedeep` (Taek Lim) — tio.taek.lim@gmail.com.

Or comment directly on the PRs and tag `@intothedeep`.

Thanks for reviewing!
