# Local Development Setup Guide

## Steps

1. Install required software
2. Get Clerk keys
3. Write `.env` files (with notes on which step fills each value)
4. Install pnpm packages
5. Start Supabase + get keys + apply DB migrations
6. Get Stripe keys (optional)
7. Start the 3 servers
8. Verify everything is running

---

## Step 1 — Install Required Software

| Software              | Check command                    | Min version |
| --------------------- | -------------------------------- | ----------- |
| Node.js               | `node -v`                        | 22.13+      |
| pnpm                  | `pnpm -v`                        | 11+         |
| Docker (Desktop or Colima) | `docker ps`                 | latest      |
| Supabase CLI          | `cd backend && pnpx supabase -v` | latest      |

**Docker runtime — pick one:**

| Runtime        | How to install       | Socket path                          | Notes                        |
| -------------- | -------------------- | ------------------------------------ | ---------------------------- |
| Docker Desktop | Download from docker.com | `/var/run/docker.sock` (auto)    | GUI app, easiest setup       |
| Colima         | `brew install colima` | `~/.colima/default/docker.sock`     | Lightweight, no GUI required |

> `pnpm db:start` detects which runtime you are using automatically — no manual configuration needed.

**If pnpm is not installed:**

```bash
npm install -g pnpm
```

> Supabase CLI does not need a separate install — it is pulled automatically via pnpm in Step 4.

---

## Step 2 — Get Clerk Keys (Authentication)

1. Sign up at [clerk.com](https://clerk.com) and create a new app
2. Go to Dashboard > **API Keys** and copy:
   - `Publishable key` (pk_test_...) → used in frontend `.env`
   - `Secret key` (sk_test_...) → used in backend `.env`
3. **Create the `supabase` JWT template** (required — payment + admin flows fail without it):
   - Fast path: open <https://dashboard.clerk.com/last-active?path=jwt-templates>
   - Or navigate: Dashboard → app → left sidebar → **Configure** → **JWT Templates**
   - Click **+ New template** → select the **Supabase** preset
   - **Name field must be exactly `supabase`** (lowercase) — frontend code calls `getToken({ template: 'supabase' })`
   - **Custom signing key: leave OFF** (default). This project uses the new third-party auth pattern with the new Supabase CLI keys (`sb_publishable_*` / `sb_secret_*`); Clerk's default signing key is sufficient. Only enable if you later see RLS errors related to `auth.uid()` — at that point fill it with the Supabase `JWT_SECRET`.
   - Click **Apply changes** (Save)
4. **Register Clerk as a Third-Party Auth provider in Supabase** (required — otherwise RLS treats every request as anonymous, frontend queries return `[]` for any per-user data):
   - Open `backend/supabase/config.toml` and verify this block exists (already added):
     ```toml
     [auth.third_party.clerk]
     enabled = true
     domain = "<your-clerk-frontend-api-domain>"
     ```
   - The `domain` must match the `iss` claim of your JWT (`https://<domain>` minus the `https://`). For dev it's usually `<slug>.clerk.accounts.dev`. To verify: copy a JWT via the browser console (`copy(await window.Clerk.session.getToken({ template: 'supabase' }))`), paste into [jwt.io](https://jwt.io), check the `iss` claim.
   - Full explanation: `_docs/clerk-supabase-auth.md`.
5. Hard-refresh the browser (`Cmd+Shift+R`) after the above, so the Clerk SDK clears any cached token error state.

> Skipping step 3 produces a runtime error: `clerk.browser.js ... ie.create` thrown from `CheckoutPage.tsx` when a user tries to donate. The Network response will read `"No JWT template exists with name: supabase"`.
> Skipping step 4 makes the frontend appear to work but any RLS-protected query (donor dashboard, CBO profile, notifications) returns `[]`. See the Common Issues section for full diagnostics.

---

## Step 3 — Write Environment Variable Files

### Frontend `frontend-vite/.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...        # from Step 2
VITE_SUPABASE_URL=http://localhost:54321       # fixed local value
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...      # fill in Step 5
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...        # fill in Step 6 (optional)
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=KC Digital Drive Market
VITE_ENVIRONMENT=development
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_ANALYTICS=false
```

### Backend `backend/api/.env`

```env
SUPABASE_URL=http://localhost:54321            # fixed local value
SUPABASE_SECRET_KEY=sb_secret_...             # fill in Step 5
CLERK_SECRET_KEY=sk_test_...                   # from Step 2
STRIPE_SECRET_KEY=sk_test_...                  # fill in Step 6 (optional)
STRIPE_WEBHOOK_SECRET=whsec_...                # fill in Step 6 (optional)
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

---

## Step 4 — Install Packages

```bash
# Supabase CLI (backend/)
cd backend && pnpm add supabase --save-dev --allow-build=supabase

# Backend API
cd backend/api && pnpm install

# Frontend
cd frontend-vite && pnpm install
```

---

## Step 5 — Start Supabase Locally and Get Keys

Start Docker Desktop first, then:

```bash
cd backend && pnpm db:start
```

> **Do not use `pnpx supabase start` directly.** On Colima, the vector container requires a Docker socket symlink that `pnpm db:start` creates automatically. Running `pnpx supabase start` without it will fail. See the vector socket error section at the bottom of this doc.

After startup, the full output looks like this (v2.98.2+):

```
╭──────────────────────────────────────╮
│ 🔧 Development Tools                 │
├─────────┬────────────────────────────┤
│ Studio  │ http://127.0.0.1:54323     │
│ Mailpit │ http://127.0.0.1:54324     │
│ MCP     │ http://127.0.0.1:54321/mcp │
╰─────────┴────────────────────────────╯

╭─────────────────────────────────────────────────╮
│ 🌐 APIs                                         │
├─────────────┬───────────────────────────────────┤
│ Project URL │ http://127.0.0.1:54321            │
│ REST        │ http://127.0.0.1:54321/rest/v1    │
│ GraphQL     │ http://127.0.0.1:54321/graphql/v1 │
╰─────────────┴───────────────────────────────────╯

╭───────────────────────────────────────────────────────────────╮
│ ⛁ Database                                                    │
├─────┬─────────────────────────────────────────────────────────┤
│ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
╰─────┴─────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_...                             │
│ Secret      │ sb_secret_...                                  │
╰─────────────┴────────────────────────────────────────────────╯

╭───────────────────────────────────────────────────────────────────────────────╮
│ 📦 Storage (S3)                                                               │
├────────────┬──────────────────────────────────────────────────────────────────┤
│ URL        │ http://127.0.0.1:54321/storage/v1/s3                             │
│ Access Key │ (auto-generated)                                                 │
│ Secret Key │ (auto-generated)                                                 │
│ Region     │ local                                                            │
╰────────────┴──────────────────────────────────────────────────────────────────╯
```

> Since Supabase CLI v2, keys use the `sb_publishable_*` / `sb_secret_*` format instead of the old JWT (`eyJ...`) format. URLs use `127.0.0.1` not `localhost`.

You may also see this warning during startup — it is safe to ignore:
```
WARN: no files matched pattern: supabase/seed.sql
```
Seed data runs on `pnpm db:reset`, not on `pnpm db:start`.

| Output key    | Where to paste                                         | Role                                                            |
| ------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `Publishable` | `frontend-vite/.env` → `VITE_SUPABASE_PUBLISHABLE_KEY` | Regular queries with RLS enforced                               |
| `Secret`      | `backend/api/.env` → `SUPABASE_SECRET_KEY`             | Bypasses RLS, admin-level access (**never expose to frontend**) |

If you lose the keys:

```bash
cd backend && pnpm db:status
```

Then apply DB migrations:

```bash
cd backend && pnpm db:push
```

---

## Step 6 — Get Stripe Keys (Optional)

> Auth, request browsing, and CBO/admin features all work without payments.

### Install Stripe CLI

The Stripe CLI is a Go binary — **it cannot be installed via pnpm**. Use brew:

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Get Keys

1. Sign up at [stripe.com](https://stripe.com) and enable test mode
2. Go to Dashboard > Developers > **API Keys** and copy:
   - `Publishable key` → `VITE_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. Start local webhook forwarding in a separate terminal:

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copy the printed `whsec_...` value → `STRIPE_WEBHOOK_SECRET`

> Keep this terminal running during development. Webhooks will not be delivered if it is closed.

### Test Card Numbers

Use these inside the Stripe CardElement on `/checkout/:requestId`:

| Field      | Value                                              |
| ---------- | -------------------------------------------------- |
| Card no.   | `4242 4242 4242 4242` (success)                    |
| MM / YY    | Any future date (e.g. `12 / 34`)                   |
| CVC        | Any 3 digits (e.g. `123`)                          |
| ZIP        | Any 5 digits (e.g. `12345`)                        |

Other scenarios:

| Scenario           | Card number              |
| ------------------ | ------------------------ |
| Card declined      | `4000 0000 0000 0002`    |
| 3D Secure required | `4000 0025 0000 3155`    |
| Insufficient funds | `4000 0000 0000 9995`    |

Full list: <https://stripe.com/docs/testing#cards>

### Security — Do Not Commit or Share Keys

`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are secrets even in test mode. Never:

- Paste them into chat tools, AI assistants, screenshots, or PRs
- Commit `.env` files (already in `.gitignore` — keep it that way)
- Share in Slack/email without an expiry plan

If a key leaks, rotate immediately:

- Secret key: Stripe Dashboard → Developers → API keys → **Roll key**
- Webhook signing secret: Webhook endpoint detail page → **Roll signing secret**

Then update `backend/api/.env` with the new values and restart the API.

---

## Step 7 — Start the Servers

Open 3 terminals and run each:

```bash
# Terminal 1 — Supabase (skip if already started in Step 5)
cd backend && pnpm db:start
```

```bash
# Terminal 2 — Backend API (port 4000)
cd backend/api && pnpm dev
```

```bash
# Terminal 3 — Frontend (port 3000)
cd frontend-vite && pnpm dev
```

---

## Step 8 — Verify Everything is Running

| Service         | URL                                  | How to verify                    |
| --------------- | ------------------------------------ | -------------------------------- |
| Frontend        | <http://localhost:3000>              | Open in browser                  |
| Backend API     | <http://localhost:4000/health>       | Should return `{"status":"ok"}`  |
| Supabase Studio | <http://127.0.0.1:54323>            | Inspect DB tables                |
| Email testing   | <http://127.0.0.1:54324>            | Check signup confirmation emails |

---

> For production deployment (cloud Supabase, Vercel, etc.), see `howtodeploy.prod.md`.

---

## Reset the Database

```bash
cd backend && pnpm db:reset
```

Wipes all data and re-applies all migrations + seed data from scratch.
Mock data (3 organizations, 16 requests, 3 donors, etc.) is also re-seeded.

### Expected output

```
Resetting local database...
Recreating database...
Initialising schema...
Seeding globals from roles.sql...
Skipping migration 99-realtime.sql... (file name must match pattern "<timestamp>_name.sql")
Applying migration 20240101000000_initial_schema.sql...
NOTICE (42710): extension "uuid-ossp" already exists, skipping
WARNING (25P01): there is no transaction in progress
Applying migration 20240202000000_organization_profile.sql...
Applying migration 20260427000000_schema_reconcile.sql...
NOTICE (00000): trigger "check_user_type_escalation" for relation "user_profiles" does not exist, skipping
Seeding data from supabase/seed.sql...
WARNING (25P01): there is no transaction in progress
Restarting containers...
Finished supabase db reset on branch <branch>.
```

### Warning/notice reference (all safe to ignore)

| Message                                                                 | Cause                                                                                      | Risk |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| `NOTICE: extension "uuid-ossp" already exists, skipping`                | Extension already installed inside Supabase; `IF NOT EXISTS` skips it                      | None |
| `WARNING: there is no transaction in progress`                          | `COMMIT;` at the end of seed.sql runs unnecessarily in auto-commit mode                    | None |
| `NOTICE: trigger "check_user_type_escalation" does not exist, skipping` | `DROP TRIGGER IF EXISTS` runs before the trigger is created; `IF EXISTS` prevents an error | None |
| `Skipping migration 99-realtime.sql...`                                 | Filename doesn't match the `<timestamp>_name.sql` pattern; intentionally excluded          | None |

### db reset vs db push

| Command                  | Behavior                                                          | When to use                                                      |
| ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm db:reset` | Full DB wipe → re-run all migrations → re-seed                    | Re-seeding mock data, fixing migration conflicts, starting clean |
| `pnpm db:push`  | Apply only new migration files in order (existing data preserved) | After adding a new migration while keeping existing data         |

> **Warning**: `db reset` deletes all data. Only use it when losing local test data is acceptable.

---

## Restart Reference

| What changed                   | Supabase        | Backend API    | Frontend   |
| ------------------------------ | --------------- | -------------- | ---------- |
| `frontend-vite/.env` edited    | ❌              | ❌             | ✅ restart |
| `backend/api/.env` edited      | ❌              | ✅ restart     | ❌         |
| Frontend code changed          | ❌              | ❌             | auto (HMR) |
| Backend code changed           | ❌              | auto (--watch) | ❌         |
| `supabase/migrations/` changed | ✅ `db push`    | ❌             | ❌         |
| `supabase/config.toml` changed | ✅ stop → start | ❌             | ❌         |

**Restart backend:**

```bash
cd backend/api && pnpm dev
```

**Restart frontend:**

```bash
cd frontend-vite && pnpm dev
```

---

## Common Issues

**Docker won't start**
→ Open Docker Desktop app first, then retry

**Lost Supabase keys after `supabase start`**
→ Run `cd backend && pnpm db:status`, then copy `Publishable` → `VITE_SUPABASE_PUBLISHABLE_KEY` and `Secret` → `SUPABASE_SECRET_KEY`

**Port conflict (3000, 4000, 54321)**
→ Run `lsof -i :<port>` to find the process, then kill it

**Backend `Cannot find module` error**
→ Re-run `cd backend/api && pnpm install`

**Frontend type errors**
→ Run `cd frontend-vite && pnpm type-check` to locate the error

**Payment error in browser console — `clerk.browser.js ... ie.create` thrown from `CheckoutPage.tsx`**

This is **not** a Stripe error — it is the Clerk SDK failing to mint a JWT before the backend is even called.

Diagnose: open DevTools → **Network** tab → click "Donate" → find the failed request (filter `tokens` or `clerk`) → look at the response body. Common cases:

| Response message                                  | Fix                                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `No JWT template exists with name: supabase`      | Create the `supabase` JWT template in Clerk Dashboard (see Step 2.3)                  |
| `Unauthenticated`                                 | Session expired — sign out and back in                                                 |
| `Failed to fetch` / CORS                          | Add `http://localhost:3000` to Clerk's allowed origins (Dashboard → Domains)           |

Same root cause shows up on `/cbo/setup` submit (calls `POST /api/users/become-cbo` which also needs the JWT).

> The Clerk template's **Custom signing key** option should stay OFF — see Step 2.3. Only enable it if you later see Supabase RLS errors (e.g. `auth.uid()` returns null in a policy that should pass).

**`ERR_PNPM_IGNORED_BUILDS` — build script blocked**

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: chromedriver, esbuild
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

pnpm v10+ blocks package build scripts by default for security. The allowlist is already configured in `frontend-vite/package.json`, so reinstalling should fix it:

```bash
cd frontend-vite && pnpm install
```

If the same error appears after adding a new package, add the package name to `pnpm.allowedBuildScripts` in `frontend-vite/package.json`.

---

## `pnpx supabase start` — Docker Image Pull Failure

If you see `unexpected status from HEAD request` or an image pull failure, follow these steps:

### Step 1 — Check Docker is running

```bash
docker ps
```

If the list prints without error, Docker is fine.

### Step 2 — Test registry access

```bash
docker pull public.ecr.aws/supabase/postgres:15.8.1.085
```

- If it succeeds, it was a temporary network issue — re-run `pnpm db:start`
- If it fails, continue to Step 3

### Step 3 — Restart Colima (M-series Mac)

```bash
colima stop
colima start
```

Also check Docker context:

```bash
docker context ls
docker context use colima
```

### Step 4 — Clean restart

```bash
cd backend && pnpm db:stop
docker system prune -af
cd backend && pnpm db:start
```

> `docker system prune -af` removes all unused images and containers. The next start will re-pull images, which takes time.

### Step 5 — Update Supabase CLI

```bash
cd backend && pnpm add supabase@latest --save-dev --allow-build=supabase
```

### Step 6 — Repeated failures on M-series Mac

```bash
colima delete
colima start --cpu 4 --memory 8
```

### Additional checks

```bash
# DNS issue check (VPN / corporate network)
nslookup public.ecr.aws

# Check Docker registry mirror / containerd config
docker info | grep -A5 "Registry Mirrors"

# Check if images are already downloaded
docker images | grep supabase
```

> Once images are present, subsequent `supabase start` runs are fast.

---

## `pnpm db:start` — Vector Container Socket Error (Colima only)

> **Docker Desktop users**: this error does not occur. `/var/run/docker.sock` is created automatically by Docker Desktop.

### Symptom

```
failed to start docker container "supabase_vector_backend": error while creating mount source path
'/Users/<name>/.colima/default/docker.sock': mkdir ... operation not supported
```

### Cause

Colima places its Docker socket at `~/.colima/default/docker.sock` instead of the standard `/var/run/docker.sock`. The `vector` container tries to mount the standard path, which does not exist on Colima.

`analytics = false` in `config.toml` **no longer stops the vector container** in Supabase CLI v2.98.2+. The symlink is the only reliable fix.

### Fix

`pnpm db:start` handles this automatically:

```bash
cd backend && pnpm db:start
```

The script checks if `/var/run/docker.sock` exists before creating the symlink:
- **Docker Desktop** → socket already exists → skips symlink → starts Supabase
- **Colima** → socket missing → creates symlink → starts Supabase (sudo password required once per reboot)

> The Supabase CLI is pinned to `2.98.2` in `devDependencies` to prevent unexpected breakage from version upgrades.
