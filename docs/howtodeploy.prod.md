# Production Deployment Guide

For local development setup, see `howtoexecute.local.md`.

## Overview

This project has three deployable pieces, each going to a different host:

| Piece                                | Local                       | Production                          |
| ------------------------------------ | --------------------------- | ----------------------------------- |
| Frontend (Vite)                      | `pnpm dev` on `:3000`       | Vercel                              |
| Backend API (Express)                | `pnpm dev` on `:4000`       | Vercel Functions / Railway / Render |
| Supabase (Postgres + Auth + Storage) | `pnpm db:start` on `:54321` | `supabase.com` (cloud)              |

**Key principle: same code, different env vars.** You do not need separate scripts or branches for production — only different environment variables.

```
[Local Dev]
Frontend (.env.local)        ─┐
Backend (.env)                ├──→  Local Supabase (Docker)
                              ┘     http://127.0.0.1:54321

[Production]
Frontend (Vercel env vars)   ─┐
Backend (Vercel/Railway env)  ├──→  Cloud Supabase
                              ┘     https://xyz.supabase.co
```

---

## Step 1 — Create the Cloud Supabase Project

1. Sign up at [supabase.com](https://supabase.com)
2. Click **New project** → choose region (`us-east-2` recommended for KC) → set DB password
3. Wait ~2 minutes for the project to provision

### Copy the keys

Dashboard → **Project Settings → API** → copy:

| Key                      | Where it goes           | Notes                        |
| ------------------------ | ----------------------- | ---------------------------- |
| `Project URL`            | both frontend + backend | `https://xyz.supabase.co`    |
| `Publishable key` (anon) | frontend                | safe to expose; RLS-enforced |
| `Service role key`       | backend only            | **never expose to client**   |

### Register Clerk as a Third-Party Auth provider

**Required** — without this, RLS evaluates every request as anonymous in production, and the donor dashboard / CBO profile / notifications all return empty. The local `config.toml` setting does NOT propagate to the cloud.

1. Dashboard → **Authentication → Sign In / Up → Third Party Auth** (label may vary by Dashboard version; may also appear under JWT settings)
2. **+ Add provider → Clerk**
3. Enter your Clerk Frontend API domain — the `iss` claim of your production JWT minus the `https://` prefix (e.g. `clerk.your-app.com` for a production custom domain, or `<slug>.clerk.accounts.dev` if you haven't set one up). Verify by signing in to the production app, copying a JWT via the browser console, and checking `iss` at [jwt.io](https://jwt.io).
4. Save.

Full background: `_docs/clerk-supabase-auth.md`.

---

## Step 2 — Apply Migrations to the Cloud DB

Run once from your local machine:

```bash
cd backend
pnpx supabase login
pnpx supabase link --project-ref xyz
pnpx supabase db push
```

`xyz` is the project ref from your Supabase dashboard URL
(`https://supabase.com/dashboard/project/<ref>`, or the `<ref>` in
`https://<ref>.supabase.co`).

#### How `db push` picks its target (login vs link)

These are **two independent things** — `db push` takes no URL/path argument, so
both must be in place first:

| Step                          | Decides                         | Stored where                                                                 |
| ----------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| `supabase login`              | **who** (which Supabase account) | `~/.supabase/` access token (or `SUPABASE_ACCESS_TOKEN` env). Machine-wide.   |
| `supabase link --project-ref` | **which project** (the target)   | `backend/supabase/.temp/` — **gitignored, per-machine**.                      |

`db push` reads the linked ref from `.temp/`, authenticates with the login
token, then compares local `backend/supabase/migrations/*.sql` against the
remote `supabase_migrations.schema_migrations` table and applies **only the
migrations not yet recorded there** (in filename order).

Because `.temp/` is gitignored, the link is **not shared** — every machine (and
every teammate) must run `login` + `link` once before their first push. CI /
non-interactive: pass `SUPABASE_ACCESS_TOKEN` instead of `login`, and
`link -p <db-password>`.

For any new migrations after the initial push:

```bash
cd backend && pnpx supabase db push
```

> **Never run `pnpm db:reset` against the cloud project.** It wipes all production data. The reset script is local-only.

### Linked vs unlinked state

After `supabase link`, `db push` targets the cloud. `db push` is **remote-only**
— it always targets the linked project and has no local mode. To stop targeting
the cloud:

```bash
cd backend && pnpx supabase unlink
```

After `unlink` there is no linked project, so `db push` simply has no target and
will error until you `link` again — it does **not** fall back to the local
stack. To apply migrations to the **local** Docker DB, use `pnpm db:reset`
(replays all migrations + seed; wipes local data) — never `db push`.

---

## Step 3 — Deploy the Frontend (Vercel)

1. Push your code to GitHub
2. [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Set the project root to `frontend-vite/`
4. Build command auto-detected: `pnpm build`
5. Add **Environment Variables** in the Vercel dashboard:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://your-api.example.com
VITE_APP_NAME=KC Digital Drive Market
VITE_ENVIRONMENT=production
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_ANALYTICS=true
```

6. Deploy

> **Do not commit `.env.production` with real secrets.** Use Vercel's dashboard. The `.env.production` file in the repo, if any, should only contain non-secret defaults.

---

## Step 4 — Deploy the Backend API

The backend is plain Express, so any Node host works. Examples: Vercel Functions, Railway, Render, Fly.io.

### Set production env vars in the host dashboard

```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=4000
ALLOWED_ORIGINS=https://your-frontend.vercel.app
NODE_ENV=production

# Required for payment metadata (PH-2). Without these, IP hashes are reversible
# and the build-version diagnostic shows 'unknown'.
IP_HASH_SALT=                # `openssl rand -hex 32` output. NEVER set this to
                             # the dev fallback in production.
GIT_SHA=${VERCEL_GIT_COMMIT_SHA}   # Vercel auto-injects this. For other
                                   # hosts: use the deploy commit SHA.

# Required for the Slack admin-alert cron registered in vercel.json. See Step 5
# for issuance + verification. Set on the same env as the backend.
SLACK_WEBHOOK_URL=           # Issued in Step 5.1 — leave blank for silent
                             # dev-style fallback (cron still marks rows 'sent').
CRON_SECRET=                 # `openssl rand -hex 32` output. Required — the
                             # /api/cron/flush-slack-queue route returns 401
                             # without it.
APP_URL=https://your-frontend.vercel.app   # Used as the link prefix in Slack
                             # messages. Same hostname as ALLOWED_ORIGINS above.
```

> **`IP_HASH_SALT` 보안 메모**: backend는 도너 IP를 `payment_transactions.metadata.client.ip_hash`에 raw가 아닌 SHA-256 hash 앞 16자로 저장합니다 (`backend/api/helpers/paymentMetadata.js`의 `hashIp`). salt 없이는 공격자가 IPv4 주소 공간(~43억) 전체에 대해 사전 계산된 rainbow table로 IP를 역추정할 수 있습니다. dev에선 코드 fallback `'dev-only-replace-in-prod'`가 동작하지만 **프로덕션 배포 전 반드시 교체**.
>
> **`GIT_SHA` 디버깅 가치**: `metadata.diagnostics.backend_version`에 들어가서 "이 결제는 어느 빌드가 처리했는가"를 추적할 수 있습니다. 특정 빌드부터 영수증이 안 나오는 회귀를 디버깅할 때 metadata만 보면 즉시 어느 커밋의 코드가 실행됐는지 확인 가능. 미설정 시 `"unknown"`이 저장됨.

### Same code, different env vars

The backend code never changes between environments. The only difference is `process.env`:

```js
// server.js (same file in both environments)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Local run:       STRIPE_SECRET_KEY = sk_test_...   (from .env)
// Production run:  STRIPE_SECRET_KEY = sk_live_...   (from Vercel/Railway dashboard)
```

No separate scripts, no `--mode` flag. Just the env vars.

### Set up the Stripe webhook (cloud — test vs live)

Unlike local dev (`stripe listen` CLI), a deployed backend has a public URL, so
you **register a webhook endpoint in the Stripe Dashboard** pointing at it:

```
https://your-api.example.com/api/payments/webhook
```

This app uses **one endpoint + one secret** (`STRIPE_WEBHOOK_SECRET`) for all
events. When adding the endpoint, select these **9 events**:

```
payment_intent.succeeded         payment_intent.payment_failed
charge.refunded                  charge.dispute.created
charge.dispute.funds_withdrawn   charge.dispute.funds_reinstated
charge.dispute.closed            account.updated                      (Connect)
                                 account.application.deauthorized     (Connect)
```

> ⚠️ The two `account.*` events are **Connect events** — enable **"Listen to
> events on Connected accounts"** on the endpoint or they won't be delivered.

**Test mode ≠ Live mode.** Stripe keeps separate keys, endpoints, signing
secrets, and connected accounts per mode; a test secret only verifies test
events. So run a **test cloud deploy** and **production** with different env:

| | Test cloud deploy (Vercel **Preview**) | Production (Vercel **Production**) |
| --- | --- | --- |
| Dashboard mode | Test | **Live** |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
| Webhook endpoint | registered in **Test** at the preview URL | registered in **Live** at the prod URL |
| `STRIPE_WEBHOOK_SECRET` | that test endpoint's `whsec_…` | that live endpoint's `whsec_…` |
| `STRIPE_BYPASS_CONNECT` | `true` (or onboard test connected accounts) | **unset** — orgs complete real Connect onboarding |
| Cards | test card `4242 4242 4242 4242` | real cards (real charges) |

Verify a deploy: make a donation, then Dashboard → Webhooks → your endpoint →
recent deliveries should show `200 OK`; the `payment_transactions` row +
`requests`/campaign totals should update. Going live also requires **activating**
your Stripe account (business details). Deeper dive (idempotency, reconciliation,
per-event handlers): `_docs/stripe-webhook.md`.

---

## Step 5 — Slack notifications (admin alerts)

When organizations submit profile edits, edit already-submitted edits, or
soft-delete their org, the backend enqueues an admin alert into the
`slack_notification_queue` table. A Vercel cron flushes the queue every
5 minutes and POSTs each pending row to a Slack Incoming Webhook.

CBO and donor notifications are unchanged — they continue to fan out
through the in-app `NotificationBell`. Slack is **additive** for admins
only.

### Step 5.1 — Issue a Slack Incoming Webhook

1. Open your Slack workspace → **Apps** → search for **"Incoming Webhooks"**
2. Click **Add to Slack** → choose the channel that will receive admin
   alerts (e.g. `#kcdd-admin`)
3. Copy the generated webhook URL. The format is
   `https://hooks.slack.com/services/<team-id>/<bot-id>/<token>` — a long
   opaque path under `hooks.slack.com`. Treat this URL as a **secret**:
   anyone who has it can post to the channel.

### Step 5.2 — Add env vars in Vercel

Vercel project → **Settings → Environment Variables**:

| Key                 | Value                                       | Notes                                                                |
| ------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `SLACK_WEBHOOK_URL` | URL from Step 5.1                           | Secret. Set on Production env (and Preview if you want preview alerts). |
| `CRON_SECRET`       | output of `openssl rand -hex 32`            | Authenticates the cron request. Must match what Vercel sends.        |
| `APP_URL`           | e.g. `https://kcdd-market.vercel.app`       | Prefix used in Slack message links back to admin pages.              |

> If `SLACK_WEBHOOK_URL` is **missing** on a given environment (common
> on Preview deploys without the secret), the cron still runs but logs
> `[slack:dev]` for each row and marks them `status='sent'` — i.e. the
> queue drains silently. Set the var before relying on prod alerts.
>
> If `CRON_SECRET` is **missing**, the cron route returns `401` and the
> queue never drains. Set this before the first prod deploy.
>
> If `APP_URL` is **missing**, Slack messages still send but the link
> prefix is empty. Slack will render the path-only link, which usually
> still navigates if the workspace has link unfurling for your domain
> configured — but it is much friendlier to set this.

### Step 5.3 — Register the cron

The backend's `backend/api/vercel.json` already contains the cron entry
(this is the Vercel project that owns the `/api/cron/*` route):

```json
{
  "crons": [
    {
      "path": "/api/cron/flush-slack-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

On the next deploy, Vercel reads this file and registers the cron
automatically. Verify in **Vercel dashboard → Project → Cron Jobs**
(also visible under the Functions tab on some dashboard versions).
The cron uses `GET` with `Authorization: Bearer $CRON_SECRET`.

> **Hobby tier note**: a 5-minute schedule is supported on Hobby; tighter
> intervals may require Pro. Do not change `*/5 * * * *` without checking
> the current Vercel pricing page. See `docs/VERCEL_DEPLOYMENT.md` for
> per-tier details.

### Step 5.4 — Smoke test

Manually trigger the cron after the first deploy:

```bash
curl -X POST https://<your-prod-url>/api/cron/flush-slack-queue \
  -H "x-cron-secret: $CRON_SECRET"
```

Expected response:

```json
{ "processed": 0, "sent": 0, "failed": 0 }
```

(Numbers > 0 if there are pending rows in the queue.) The same route
also accepts `GET` with `Authorization: Bearer $CRON_SECRET` — that
is the form Vercel uses when firing the cron.

To test end-to-end: as a CBO owner in prod, submit a profile edit. A
row appears in `slack_notification_queue` with `status='pending'`.
Within 5 minutes, the cron fires and Slack receives the message; the
row flips to `status='sent'`.

---

## Step 6 — Create the first admin user

Production has **no seeded users** — `seed.sql` only runs against the local
Docker stack (`pnpm db:reset`), never on `db push`. The dev convenience
`DEV_ROLE_OVERRIDES` is also fully inert when `NODE_ENV=production`
(`resolveDevRoleOverride()` returns `null`), so you **cannot** mint an admin via
env vars in prod. There is no "mock" admin either: `user_profiles.id` is a real
Clerk user id, so every account must be a genuine Clerk sign-in.

Bootstrap the first admin once, by hand:

1. **Sign in to the production app with Clerk** using the account that should be
   admin. The `POST /api/users/sync` call creates its `user_profiles` row with
   the default `user_type='donor'`.

2. **Find that account's Clerk user id** — Supabase Dashboard → Table editor →
   `user_profiles` (filter by email), or the Clerk Dashboard → Users.

3. **Promote it in Supabase Dashboard → SQL Editor:**

   ```sql
   -- The prevent_user_type_escalation trigger (migration 20260620000002) only
   -- lets a service_role caller change user_type. The SQL Editor connects as
   -- `postgres` (auth.role() is NULL), so set the service_role claim for this
   -- transaction to satisfy the trigger's bypass, then promote.
   SET LOCAL request.jwt.claims = '{"role":"service_role"}';

   UPDATE public.user_profiles
   SET user_type          = 'admin',
       verification_status = 'verified',
       onboarding_complete = true
   WHERE id = 'user_XXXXXXXXXXXXXXXX';   -- the Clerk user id from step 2
   ```

   > Without the `SET LOCAL request.jwt.claims` line the UPDATE fails with the
   > escalation guard. (Alternative for a superuser session:
   > `ALTER TABLE public.user_profiles DISABLE TRIGGER check_user_type_escalation;`
   > … `UPDATE` … then re-`ENABLE TRIGGER`.)

4. **Re-sign-in** (or refresh) the account → `/admin` is now reachable.

This is a **one-time bootstrap**. After the first admin exists, promote any
further admins from the in-app **`/admin` user management** UI — the trigger
permits an existing admin to assign roles, so no more SQL is needed.

---

## How Env Switching Works (Reference)

### Vite frontend — uses mode

Vite automatically loads `.env.<mode>` based on the command:

| Command               | Mode          | Files loaded (priority order)                                      |
| --------------------- | ------------- | ------------------------------------------------------------------ |
| `pnpm dev`            | `development` | `.env.development.local`, `.env.local`, `.env.development`, `.env` |
| `pnpm build`          | `production`  | `.env.production.local`, `.env.local`, `.env.production`, `.env`   |
| `vite --mode staging` | `staging`     | `.env.staging.local`, `.env.local`, `.env.staging`, `.env`         |

Recommended structure:

```
frontend-vite/
├── .env                  # Common defaults (no secrets, OK to commit)
├── .env.local            # Local dev secrets (.gitignore'd)
├── .env.production       # Production build defaults (no secrets)
└── .env.staging          # Optional staging
```

**In practice:**

- **Local**: put local Supabase + Clerk test keys in `.env.local`
- **Production**: use Vercel's Environment Variables dashboard — do not commit real secrets

### Backend Node.js — uses process.env

`dotenv` loads `.env` automatically. To switch:

```json
"scripts": {
  "dev": "node --watch server.js",
  "dev:staging": "NODE_ENV=staging node --watch server.js"
}
```

In production, the host (Vercel/Railway) injects env vars — no `.env` file deployed.

### Do you need `--mode` scripts for production?

**No.** `pnpm build` already runs in production mode by default. You only need extra scripts for **additional environments** like staging or preview:

```json
"build:staging": "tsc && vite build --mode staging"
```

If you only have local + production, the defaults are enough.

### Do you need `cross-env`?

| Team setup      | Need it?        |
| --------------- | --------------- |
| All Mac/Linux   | ❌ Not required |
| Any Windows dev | ✅ Required     |
| Future-proofing | ⚠️ Recommended  |

Mac/Linux: `NODE_ENV=production node server.js` works.
Windows: this syntax fails. `cross-env NODE_ENV=production node server.js` works everywhere.

Install:

```bash
cd backend/api && pnpm add -D cross-env
```

Update scripts:

```json
"dev:staging": "cross-env NODE_ENV=staging node --watch server.js"
```

---

## Deployment Checklist

Before first deploy:

- [ ] Cloud Supabase project created at `supabase.com`
- [ ] `supabase link --project-ref xyz` run from local machine
- [ ] `supabase db push` succeeded against cloud
- [ ] Frontend deployed to Vercel with all `VITE_*` env vars set
- [ ] Backend deployed to host with all secret env vars set
- [ ] `ALLOWED_ORIGINS` in backend matches frontend URL
- [ ] `VITE_API_URL` in frontend matches backend URL
- [ ] Stripe production webhook configured (see `_docs/stripe-webhook.md`)
- [ ] Clerk production keys (`pk_live_*`, `sk_live_*`) in use (not test keys)
- [ ] Clerk `supabase` JWT template created in Clerk Dashboard
- [ ] Clerk registered as Third-Party Auth provider in cloud Supabase Dashboard (see Step 1)
- [ ] `/health` endpoint reachable from frontend (check the live API banner on home page)
- [ ] First admin bootstrapped via SQL (Step 6) — no seeded/mock admin exists in prod

After each deploy:

- [ ] Visit the production URL
- [ ] Sign up a new user → verify it appears in cloud Supabase `user_profiles`
- [ ] Create a test request as CBO → verify in cloud DB
- [ ] Make a small test donation → verify Stripe webhook fires and updates DB
- [ ] Check Vercel + backend host logs for errors