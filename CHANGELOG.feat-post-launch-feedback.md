# Changelog — `feat/post-launch-feedback`

Everything this branch ships on top of `main`, grouped by theme. **79 commits** from `main` to current HEAD. Each row: **task** (commit refs) — **what** changed — **why**.

PR: [#6](https://github.com/JoshuaMadrid/kcdd-market_v2/pull/6) — title: `feat: post-launch feedback + H1-H7 hotfix + Wave 4-5 + Phase A6`

---

## 1. Foundations (rebased from closed PRs #2 / #3 / #4)

| Task | What | Why |
|---|---|---|
| **pnpm + Clerk JWT bridge** (`b37c86c`, `def67d4`, `2c96d8c`, `6c07fd2`, `af31f4c`, `a9d8354`) | Migrated lockfiles to pnpm 11 with `packageManager` pin + Clerk JWT bridged into Supabase via Third-Party Auth (`clerkAuth` middleware on every donor-touching route, `useClerkSupabase` rewrite, server-side amount enforcement on `create-intent`) | npm/yarn drift between teammates + CI; users could spoof donation amounts via client-side body |
| **Campaigns-only mock seed** (`8860a8e`, `71fa3a0`) | 3 orgs + 3 donors + 7 campaigns + `tax-documents` Storage bucket seeded for local-only dev | Original seed pulled in unrelated phases; we wanted minimal viable data |
| **Payment hardening PH-1/2/3** (`b578482`, `0ed9e3f`, `1e0bd52`, `210c727`, `5fc2e28`, `483d9a4`) | `stripe_events` idempotency at webhook entry; `payment_transactions.metadata` JSONB snapshot + lifecycle; `stripe_disputes` table + 4 dispute webhook handlers; donor RLS on `payment_transactions` + `donor_documents`; `IP_HASH_SALT` / `GIT_SHA` env vars documented | Stripe retries could double-process; donors had no read access to their own ledger; disputes left as silent gaps; donor IPs needed un-reversible hashing |
| **CI + onboarding** (`d16e323`, `b2bb1a8`, `9975014`, `6a473fc`, `0767acf`, `28eb1ba`, `be69c99`, `7b52194`, `c649f77`, `af5f53e`, `5fe4c15`) | CI migrated to pnpm + Node 22, action versions pinned, prettier baseline, `JOSHUA_ONBOARDING.md` added, `backend/pnpm-workspace.yaml` removed (was breaking subdir installs), legacy repo files cleaned | Setup friction for new contributors + CI install instability |
| **Branch plan** (`5e650bc`, `d9f7537`, `dc188b4`, `b81e240`) | `feat-post-launch-feedback.md` branch entry point + CLAUDE.md sync + howto docs + `.env.example` templates + `_docs/` ignored | Documents that survive fresh clones vs local-only PM scratch |

---

## 2. Theme 1 — Campaign Approval Lifecycle (Waves 1-3)

Donors and CBOs needed an admin-mediated content-review pipeline rather than direct edits.

| Task | What | Why |
|---|---|---|
| **State machine + revision history (A1-A3)** (`b7f5c31`, `b934c20`, `dd315a2`, `d288078`, `42b4896`) | New `campaign_revisions` table (later renamed to `campaign_details`), backend `submit-edit` / `approve` / `reject` routes, in-app `notifications` table for the inbox bell | Replaces ad-hoc "edit and hope an admin notices"; gives traceability + soft rollback |
| **Admin pending-edits queue UI (A4 + A5)** (`0c85db7`, `13a72dc`) | Admin queue page + revision preview + jsondiffpatch diff viewer | Admins were eyeballing two raw JSON blobs; diffs made approve/reject fast |
| **Public page from snapshot (A7)** (`f572258`, `e315741`) | Public campaign page reads from `published_revision_id` snapshot + sitemap + `Last-Modified` header | Visitors should see the approved version, not an in-flight draft |
| **RLS tightening (A10)** (`a18f5ad`) | `campaigns` policies dropped wide-open ALL; edits scoped to drafts | Wide-open ALL silently let CBOs edit each other's campaigns |
| **REFA/REFB schema refactor** (`98c5523`, `f9c382d`, `9208737`, `5bec9e5`) | `campaigns` → metadata-only; content moves to versioned `campaign_details.content` JSONB; derived state; soft-delete column; A14 CHECK requires `title` + `funding_goal` + `contact_email` in content | Pre-refactor schema spread content across the campaigns row, made revisions impossible to snapshot cleanly |
| **Soft-delete + restore** (`39110ab`) | CBO can soft-delete own campaigns from the kebab menu; admin can restore | Hard-delete was destroying donation history; soft-delete preserves audit + can reverse |
| **Wave 3 audit** (`45034ff`) | `campaigns.deleted_by` audit column + anon RLS smoke test + `funding_goal` typeof CHECK in JSONB | Compliance asked who deleted what; typeof drift was crashing the donate modal |
| **Impersonation banner copy** (`955ad11`) | Banner copy clarifies it's UI-only preview, data context unchanged | Admins thought they could test as users; the impersonation was front-end only |

---

## 3. Hotfix Series H1-H7

After self-review of PR #5 → #6 produced 7 cumulative finding waves before merge.

| Series | Commits | What | Why |
|---|---|---|---|
| **H1 — Security** | `f64510c` | clerkAuth prod-gate JWT bypass (CRITICAL); create-campaign-intent unauth + client-trusted donorId (CRITICAL); become-cbo no role gate; CampaignPage slug PostgREST `.or()` injection | Missing `CLERK_SECRET_KEY` in prod silently dropped to unverified decode; anonymous attacker could attribute donations to victims polluting Stripe immutable metadata; donor could self-promote to admin |
| **H2 — Schema-drift** | `6ccabfe` | `supabase.ts` `createCampaign` 2-step; `getActiveCampaigns` filter; `updateCampaignMetadata` whitelist; DashboardPage derived status | Post-REFB, several call sites still read dropped columns and rendered blank cards |
| **H3 — Concurrency + audit** | `a662f3e` | `append_lifecycle` SECURITY DEFINER RPC; 4 per-handler RPCs (`process_payment_*`) atomic side-effect + `stripe_events` INSERT; partial-dispute supporters_count; `create_campaign_with_detail` RPC; DashboardPage dead filter removal | Lost-update race on concurrent webhook lifecycle entries; dedup-before-sideeffect hole in Stripe retries |
| **H4 — Auth UX** | `9e9a677` | `SupabaseAuthRefreshError` instead of silent anon fallback; `useUserType` / `useRealUserType` cache-first via authStore; `ProtectedAdminRoute` null-as-loading; dup `registerClerkTokenGetter` removed | Silent anon mask was hiding real RLS errors as "empty data"; userType-on-error → 'donor' default → admin self-demote on transient blip |
| **H5 — PR #6 security review** | `8e13797` | 6 of 7 findings: payment routes Authorization header restoration (3 frontend sites → `lib/api.ts`); DOMPurify `sanitizeStoryHtml` on `CampaignPage`; Connect + Documents routes auth + ownership guards. 7th (anon EXECUTE) accepted as 1-bit info leak with backlog mitigation | All donations were 401 in production after H1 added auth (frontend hadn't migrated); CBO-authored prose was unsanitized XSS surface; IDOR on tax receipts |
| **H6 — Pre-merge cleanup** | `816ddb4`, `4696a76` | `pnpm format` + lint pass; `RequestDetailPage.tsx:225` XSS gap (2nd `dangerouslySetInnerHTML` site H5-B missed) | CI Code Quality job was failing on accumulated format drift; same threat model as H5-B uncovered a missed site |
| **H7 — CI workspace fix** | `9a1df88` | Re-deleted `backend/pnpm-workspace.yaml` (commit `10b9c76` had silently re-added it for supabase build approval, breaking CI install) | `backend/package.json` already has `pnpm.onlyBuiltDependencies` — the workspace file was redundant + reintroduced the same bug `7b52194` fixed earlier |

---

## 4. Wave 4 — Phase A remainder + Theme 2 + Theme 3 + Cleanup

8 sub-themes + 6-fix polish commit.

### Theme 1 remainder (Phase A7 + A8)

| Task | What | Why |
|---|---|---|
| **W4-A — "Updated {time}" badge** (`f5c0490`) | Public CampaignPage shows relative-time badge when `last_edit_approved_at` is more than 60 s past `first_approved_at` (60 s threshold filters backfill artifacts) | Visitors had no signal that the org had recently revised the campaign |
| **W4-B — Admin audit log surfacing + RLS** (`053cf05`) | New `/admin/audit-log` page reads `admin_activity_log` with action + entity_type filters and `sinceIso` cursor pagination. Backfilled 4 missing log call sites (approve / reject / restore / user verify). Migration tightens wide-open RLS to admin-only SELECT + self-attribution INSERT (`clerk_user_id() = admin_id`) | Only `settings_updated` logged; rest were audit blind spots. Old RLS allowed anyone to read + write |

### Theme 2 — Homepage CTA clarity

| Task | What | Why |
|---|---|---|
| **W4-C — Navbar CTA clarity** (`8a94884`) | Dropped ambiguous "For Organizations" duplicate of Sign in; kept "Sign in" (outline) + "Sign up" (filled, Heart icon) | "For Organizations" used the same SignInButton modal as Sign in — no actual routing difference, just labeling noise |
| **W4-D — Hero split CTA** (`f4ac6f1`) | "Browse Requests" + "Learn More" → "Browse requests & donate" (filled primary) + "For organizations" (outline → `/about`). Stacks vertically on mobile | Donor and org paths were both vague; mobile users got overlap |

### Theme 3 — Campaign detail UX

| Task | What | Why |
|---|---|---|
| **W4-E — Org identity chip** (`750eab8`) | Above-the-fold logo + name + "View organization profile →" chip on CampaignPage. In-place JSX, no new component file. Links to `/organizations/:slug` | First pixels gave no "who is asking" signal |
| **W4-F — Campaign Lead click affordance** (`b6b3fa7`) | Existing sidebar Creator block already wrapped in `<Link>` but lacked hover affordance. Added `group-hover:underline` + Avatar ring + "View organization profile →" micro-copy | Visitors didn't realize the block was clickable |
| **W4-G — Outline empty state split** (`6fa637c`) | `outline.length > 0` → existing nav; `empty + isOwner` → dashed nudge box with "Edit campaign" CTA; `empty + !isOwner` → `null` (hide section entirely) | "Add headings (H1-H6) to your story" appeared to visitors too — meaningless to them, weak nudge to owners |
| **W4-H — Card Donate CTA** (`341c5d5`) | Full-width "Donate" button in CardFooter. Outer Link → div refactor (avoid nested anchor); inner Link wraps only image+title+desc | Cards required a click-through to detail before donating; multiple anchors needed restructure |

### Cleanup

| Task | What | Why |
|---|---|---|
| **YELLOW polish 6-pack** (`045ea4b`) | Architect verify across W4-* surfaced 6 polish items, bundled into one commit: handleDeleteUser audit logging, `#for-organizations` anchor, dead `hover:text-[#ea580c]` class removed, outline orphan heading wrap, card org-name affordance restoration, copy unification | Each was non-blocking but worth a single sweep before next phase |

---

## 5. Wave 5 — Theme 4 (CBO productivity)

Architect picked Path A + B both; 3 briefs.

| Task | What | Why |
|---|---|---|
| **W5-A1 — Duplicate campaign** (`729b23e`) | CBO Dashboard kebab menu adds "Duplicate". `duplicateCampaign(source, createdBy)` helper reuses `create_campaign_with_detail` RPC; new campaign enters `pending_initial_approval` per architect lock (no fast-track) | Iterating CBOs wanted to re-run a successful campaign without re-entering 60% of the same fields |
| **W5-B1 — Defaults schema + page** (`114e01a`) | Migration `20260618000001_organization_default_campaign_template.sql` adds `default_campaign_template JSONB` to `organizations`. New page `/cbo/campaign-defaults` lets owners set creator_name / creator_role / contact_email / cause_area_ids / faqs | Logo / social / phone / email already lived on `organizations`; this captures the 5 fields that were per-campaign duplication tax |
| **W5-B2 — Form prefill** (`a209fa1`) | `CampaignForm` mount fetches defaults + prefills 5 target fields. `dirtyFields: Set<string>` guards each branch so user-edited fields are never overwritten. Cause area UUID → name translation via parallel `fetchCauseAreas()` so the submit pipeline stays unchanged | Otherwise prefill would clobber user edits on Clerk token refresh; submit handler had reverse-lookup by name, not UUID |
| **Y-W5-A1-1 — Type strict** (`bae4063`) | New `CampaignWithDerivedStatus` export; `duplicateCampaign` signature uses it + `Awaited<ReturnType<typeof createCampaign>>` instead of `any` / `unknown` | Strict types catch shape drift at compile time |

---

## 6. Phase A6 — Slack admin alerts (pivot from email)

Originally Resend email; pivoted to Slack to (a) stay free for the volunteer project and (b) batch "1 person edits 5x in 5 min" spam.

| Task | What | Why |
|---|---|---|
| **Email scrub** (`b8968dc`) | Removed all email-feature scope: donor `Email Notifications` placeholder UI; admin Settings card renamed "Email Notifications" → "Admin Notifications"; `feat-post-launch-feedback.md` D4 lock pivot; STALE NOTE on 4 historical `_docs/` files | "Free vendor + auto batching" needed; admin Slack channel cheaper than Resend tier + naturally dedupes |
| **A6-S1 — Queue + helper + cron** (`5c5c57b`, `5ce7073`) | Migration `20260619000000_slack_notification_queue.sql` with **partial UNIQUE `(dedupe_key) WHERE status='pending'`** (the batching primitive). `backend/api/helpers/slack.js` with `enqueueSlackAlert` (upsert last-write-wins), `postToSlack` (3-attempt exponential backoff 1s/4s/16s), `formatPayload` (Block Kit). `GET/POST /api/cron/flush-slack-queue` with `x-cron-secret` / `Bearer` auth. Dev fallback when `SLACK_WEBHOOK_URL` unset | Without the partial UNIQUE, 5 edits = 5 messages; with it, 5 edits = 1 row UPSERT |
| **A6-S2 — Trigger wiring** (`18246f8`) | server.js calls `enqueueSlackAlert` at 3 admin trigger points: submit-edit initial (dedupe by campaign), submit-edit edit (dedupe by `campaign + user` — collapses "same user edits 5x" into 1 message), owner soft-delete. Approve / reject / restore excluded (admin self-action). All wrapped in try/catch so Slack failure never breaks the route | The dedupe key shape is the spam-fix mechanism |
| **A6-S3 — Vercel cron + prod docs** (`cad741d`) | `backend/api/vercel.json` adds `crons` entry firing the flush route every 5 min in prod. `howtodeploy.prod.md` Step 5 walks through Slack webhook issuance + env vars (`SLACK_WEBHOOK_URL`, `CRON_SECRET`, `APP_URL`) + Vercel dashboard verification | Vercel cron isn't local — operator needs explicit steps. Production needs a real webhook URL and the cron secret |

---

## 7. Docs + Test Prep (last mile)

| Task | What | Why |
|---|---|---|
| **README + howto polish + seed extension** (`4e65de0`) | README Branch State paragraph rewritten for `feat/post-launch-feedback` + Quick Start fresh-clone `pnpm approve-builds --all` callout + 2 doc table rows + 2 Security & Conventions bullets. `howtoexecute.local.md` got a "Testing Slack admin alerts locally" section. `seed.sql` got 1 UPDATE for Connecting Roots `default_campaign_template` + 4 INSERTs for `admin_activity_log` | Branch State was naming closed branches; tester couldn't exercise the new features end-to-end without mock data |
| **post-A6 howto polish** (`9670f11`) | `howtoexecute.local.md` Step 9 "What to try after the servers are up" — donor signup, admin role-swap via Supabase Studio, CBO prefill on Connecting Roots, end-to-end approval cycle. `howtodeploy.prod.md` Step 4 env block cross-refs `SLACK_WEBHOOK_URL` / `CRON_SECRET` / `APP_URL`. `backend/api/.env.example` lists Slack vars with cross-refs. `.gitignore` permanently blocks `backend/pnpm-workspace.yaml` (regenerated by pnpm 11 build approval hook; commits would re-break CI) | Next person to clone needs a concrete test recipe, not a feature list |

---

## Net statistics

- **79 commits** ahead of `main`
- **97+ files** changed (frontend / backend / migrations / docs / config)
- **+22k / −17k lines** at PR diff
- **5 phases** of work: Foundations → Theme 1 → H1-H7 hotfix → Wave 4 / 5 → Phase A6
- **Architect verifications**: every Wave + every H series pre-push
- **CI status**: GREEN through every push; secret-scan false positive resolved once via amend (`cad741d`)

---

## What does NOT ship on this branch (deferred)

- Email notifications (any channel) — out of scope as of 2026-06-17 user lock
- In-kind pledge tracking, match alerts cron, tax cron, public impact page — Phase 8 / 8.5 / 9 / 10 from `feat/taek`, intentionally deferred per `_docs/x_tasks.md` "Backlog — Later work"
- Pattern B impersonation (backend-proxied) — left in architect-deferred backlog; current impersonation banner clarifies it is UI-only

---

## Next steps after merge

1. Merge PR #6 with **rebase-merge** to preserve per-commit history (debugging trail for H1-H7 is valuable)
2. Set prod env vars: `IP_HASH_SALT` (`openssl rand -hex 32`), `GIT_SHA` (`${VERCEL_GIT_COMMIT_SHA}`), `SLACK_WEBHOOK_URL`, `CRON_SECRET`, `APP_URL`
3. Verify Vercel registers the Slack cron (Dashboard → Functions → Crons)
4. Smoke test in prod: trigger a campaign edit, wait 5 minutes, confirm Slack message lands
