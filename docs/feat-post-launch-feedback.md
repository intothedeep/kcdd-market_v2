# feat/post-launch-feedback — Branch Plan

**Status**: Planning only. No code yet.
**Base**: `main` @ `59721cb`
**Depends on**: PR series #2/#3/#4 landing in main first (pnpm-jwt, payment hardening, cleanup)

This file is the **entry point** for anyone (next AI session, Joshua, contributor) picking up this branch. It is committed so it survives a fresh clone; the detailed planning artifacts in `_docs/` are gitignored and local-only.

---

## Why this branch exists

Post-launch design review (screenshots in `_docs/temp/`) surfaced four themes of feedback. This branch will deliver them in three phases.

### Theme 1 — Approval & lifecycle state machine (the big one)

- Org signs up → admin approves → org can create campaigns
- Campaign creation → admin approval queue → publish
- Edits **before first approval**: NO re-approval needed
- Edits **after first approval**: trigger re-approval
- Audit: revision history, "what changed" indication on public page, `last_updated_at` timestamp, Slack notifications to admin channel (email dropped 2026-06-17 — volunteer project, free-only)

### Theme 2 — Homepage CTA clarity

- Sign in / Sign up controls more visible on top right
- "Create an Organization" vs "Become a Donor" split needs sharper visual treatment

### Theme 3 — Campaign detail UX

- "Who is asking?" — organization identity more prominent above the fold
- "Campaign Lead" → make this an actual click-through to organization profile
- Outline panel empty state copy needs to encourage CBO to fill it
- Add donate CTA button on campaign list cards

### Theme 4 — CBO productivity

- Duplicate-campaign button OR org-level defaults template so common fields (logo, contact, FAQs) don't need re-entry per campaign

---

## Plan summary

Detailed plan lives in two gitignored files (local-only, machine-specific):

- `_docs/00.post-launch-feedback.tasks.md` — PM phase breakdown, 17 tasks across 3 phases
- `_docs/00.post-launch-feedback.architecture.md` — Architect decisions D1–D5

If you do not have these files (different machine or fresh clone), the executive summary below is sufficient to continue planning.

### Phases

| Phase | Theme | Task count | Dependencies |
|---|---|---|---|
| **A** | Approval & lifecycle (Theme 1) | 8 | architect D1 settled (see below) |
| **B** | UX polish (Themes 2 + 3) | 6 | none — runs in parallel with A |
| **C** | CBO productivity (Theme 4) | 3 | depends on A's revision infra |

### Architect decisions (D1–D5)

| # | Question | Choice | Rationale (one line) |
|---|---|---|---|
| **D1** | Revision storage shape | **Full JSONB snapshot per revision** | Mirrors PH-2 `payment_transactions.metadata` pattern; survives schema drift |
| **D2** | Approval state machine | **Postgres CHECK + trigger** | Single source of truth across webhook, admin UI, future crons |
| **D3** | "What changed" diff UI | **`last_edited_at` + "Edited" badge only; defer real diff** | 90% of trust signal at 5% of build cost; revisit if usage warrants |
| **D4** | Email notification infra | **Hand-rolled JS module** at backend/api/services/campaignStateMachine.js (updated 2026-06-15) | Single-source-of-truth state machine in code; DB-layer CHECK constraint only, no triggers; XState rejected for integration cost |
| **D5** | Schema fields on `campaigns` | **5 columns + new `campaign_revisions` table** | See schema block below |

### Schema additions (D5)

On `campaigns`:

| Column | Type | Drives |
|---|---|---|
| `approval_status` | TEXT CHECK in `(draft, pending_initial_approval, active, pending_edit_approval, rejected, archived)` | Replaces loose VARCHAR(20) status |
| `first_approved_at` | TIMESTAMPTZ NULL | "Has ever been approved" sentinel — gates the re-approval rule |
| `last_approved_at` | TIMESTAMPTZ NULL | Public snapshot timestamp |
| `last_edited_at` | TIMESTAMPTZ NULL | Drives "Edited" badge when `> last_approved_at` |
| `published_revision_id` | UUID FK → campaign_revisions(id) | Public page renders from this; edits don't affect public until approved |

New table `campaign_revisions`:
```
id, campaign_id, snapshot JSONB, created_by TEXT, created_at TIMESTAMPTZ,
review_status TEXT, reviewed_by TEXT, reviewed_at TIMESTAMPTZ, review_note TEXT
```

Service-role-only (PH-3 `stripe_disputes` pattern). Indexes on:
- `campaigns(approval_status)` — admin queue
- `campaigns(published_revision_id)` — public page JOIN
- `campaign_revisions(campaign_id, created_at DESC)` — history page
- `campaign_revisions(review_status) WHERE review_status = 'pending'` — partial index for hot admin path

### Implementation order

1. D5 (schema migration) — adds all 5 columns + `campaign_revisions` + backfill (`first_approved_at = created_at` for existing rows + seed revision row per existing campaign)
2. D2 (CHECK + trigger) — same migration block as D5
3. D1 (backend revision writes) — `/api/campaigns/edit` route snapshots into `campaign_revisions`
4. D3 (badge UI) can run after the state machine ships. D4 (state machine JS module) now BLOCKS A3 backend route work — implement D4 first, then unlock A3+A6 in parallel.
5. Admin pending-edits queue UI — downstream of D2 + D5
6. Tighten `campaigns` RLS in the same PR as D5 (currently wide open per `20240303000000_support_and_documents.sql:154-157`)

---

## Stakeholder decisions still open

Before Phase A starts, confirm with the human stakeholder:

1. **D4 RESOLVED 2026-06-17** — admin notifications pivot to Slack Incoming Webhook (free tier, batching via `dedupe_key` + 5-min cron flush). CBO/donor stay in-app only via existing NotificationBell. Email dropped (volunteer project, free-only constraint). Details in `_docs/00.post-launch-feedback.tasks.md` "Phase A6 — Slack 알림" section.
2. **Rejection workflow** — what happens after admin rejects an edit? Default proposal: `approval_status` reverts to `approved`, `review_note` surfaced to CBO.
3. **Public page during pending state** — show OLD approved revision while new edit awaits review? Architect assumes yes (via `published_revision_id`). Confirm.

---

## How to continue this branch

### Next session checklist

1. Read this file first.
2. If `_docs/00.post-launch-feedback.tasks.md` and `_docs/00.post-launch-feedback.architecture.md` exist on your machine, read them for the detailed task tracker. If not, the executive summary above is enough.
3. Confirm stakeholder decisions on the three open items above.
4. **First implementation task** (after stakeholder OK): write the D5 + D2 migration file at `backend/supabase/migrations/<YYYYMMDDHHMMSS>_campaign_approval_lifecycle.sql` with the 5 new columns, `campaign_revisions` table, transition trigger, indexes, RLS tightening, and backfill — all in one transaction. Apply via `docker exec ... psql` per CLAUDE.md. Verify via the RLS validation query.

### What NOT to do this branch

- No changes to `requests` lifecycle (campaigns only this round)
- No real diff UI (`last_edited_at` badge only — D3 deferred until usage data warrants)
- No locking / multi-editor coordination (`is_locked`, `editor_id` rejected in D5)
- No donor-side notification expansion (admin-side only)
- No refactor of campaigns table itself (additive migration only)

### Commit policy

- No `Co-Authored-By: Claude` trailer on commits (branch policy continued from `feat/payment-hardening`)
- Git author: `Taek Lim <tio.taek.lim@gmail.com>`
- All migrations follow CLAUDE.md "Adding a new DB table" checklist (CREATE TABLE + ENABLE RLS + policies OR explicit service-role-only intent comment + indexes)
