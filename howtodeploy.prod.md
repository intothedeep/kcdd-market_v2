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

`xyz` is the project ref from your Supabase dashboard URL.

For any new migrations after the initial push:

```bash
cd backend && pnpx supabase db push
```

> **Never run `pnpm db:reset` against the cloud project.** It wipes all production data. The reset script is local-only.

### Linked vs unlinked state

After `supabase link`, `db push` targets the cloud. To go back to local-only work:

```bash
cd backend && pnpx supabase unlink
# now `pnpm db:push` applies to your local Supabase again
```

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

### Set up the Stripe webhook (production)

See `_docs/stripe-webhook.md` for the setup checklist. The production webhook URL points at your deployed backend:

```
https://your-api.example.com/api/payments/webhook
```

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

After each deploy:

- [ ] Visit the production URL
- [ ] Sign up a new user → verify it appears in cloud Supabase `user_profiles`
- [ ] Create a test request as CBO → verify in cloud DB
- [ ] Make a small test donation → verify Stripe webhook fires and updates DB
- [ ] Check Vercel + backend host logs for errors