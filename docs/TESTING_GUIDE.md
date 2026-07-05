# KC DIME — Tester QA Guide

Hands-on manual test guide for **QA / release regression** testing. Unlike
`MAZE_TESTING_SCENARIOS.md` (unmoderated remote UX testing), this doc is for a
tester sitting at the app and verifying every flow **works end-to-end** before a
release.

Two things you get here:

1. **Test flows** — the complete map of what to test, grouped by role.
2. **How to test each** — for every flow: setup, steps, and a clear
   Pass/Fail expectation you can check off.

---

## 0. Before you start (shared setup)

### Environment

| Target       | Base URL                          |
| ------------ | --------------------------------- |
| Local dev    | `http://localhost:3000`           |
| Staging/Prod | the Vercel deploy URL             |

Local dev needs 3 terminals (see `docs/howtoexecute.local.md`):

```bash
cd backend && pnpm db:start          # Terminal 1 — Supabase
cd backend/api && pnpm dev           # Terminal 2 — API :4000
cd frontend-vite && pnpm dev         # Terminal 3 — web :3000
```

Health check the API first: open `http://localhost:4000/health` → expect `ok`.

### Test accounts (local, seeded via `DEV_ROLE_OVERRIDES`)

| Role  | Account                     | Lands on            |
| ----- | --------------------------- | ------------------- |
| Admin | `taek.lim.us@gmail.com`     | `/admin`            |
| CBO   | `mysites.victor@gmail.com`  | `/cbo/dashboard`    |
| Donor | `txl25880@ucmo.edu`         | `/donor/dashboard`  |

> A CBO/admin dashboard needs the account to **own an org**. On a fresh
> `db:reset` you may need to reassign an org's `user_id` to the CBO account in
> the live DB (see memory: dev-accounts-and-dashboard-ownership). Reverts on
> next reset.

### Stripe test card (donation flows)

- **Card:** `4242 4242 4242 4242`
- **Expiry:** any future date (`12 / 30`)
- **CVC:** any 3 digits (`123`)
- No real charge — Stripe is in test mode and `STRIPE_BYPASS_CONNECT=true`
  lets checkout complete even if the org has no Stripe Connect account.

Other useful cards: `4000 0000 0000 9995` (declined), `4000 0025 0000 3155`
(3-D Secure challenge).

### How to record a result

For each flow mark **PASS** / **FAIL** and, on fail, capture: URL, what you
clicked, what you expected, what actually happened, plus browser console
(F12 → Console) and Network tab errors. For payment issues also note the
Stripe test-mode dashboard event.

---

## 1. Test flow map

Test in this order — later flows depend on data created by earlier ones.

| #   | Role       | Flow                                          | Priority |
| --- | ---------- | --------------------------------------------- | -------- |
| A1  | Public     | Browse home → campaigns → org profile         | P0       |
| A2  | Public     | Static pages (FAQ, Contact, Legal, Impact)    | P2       |
| B1  | Donor      | Sign up / sign in + onboarding                | P0       |
| B2  | Donor      | Donate to a campaign (Stripe checkout)        | P0       |
| B3  | Donor      | Donation history + receipt                    | P1       |
| B4  | Donor      | Profile + cause-area alert preferences        | P2       |
| C1  | CBO        | Onboard org (become-cbo + setup)              | P0       |
| C2  | CBO        | Create a donation request                     | P0       |
| C3  | CBO        | Create / edit a campaign                       | P0       |
| C4  | CBO        | Edit org profile (logo, cover, team, updates) | P1       |
| C5  | CBO        | Fulfill / deny a claimed request              | P1       |
| C6  | CBO        | Campaign defaults + duplicate campaign        | P2       |
| D1  | Admin      | Approve a pending organization                | P0       |
| D2  | Admin      | Approve / reject a pending campaign edit      | P0       |
| D3  | Admin      | User management + change user role            | P1       |
| D4  | Admin      | Audit log + reconciliation + payment events   | P2       |
| E1  | Cross      | Notifications bell (donor + CBO)              | P1       |
| E2  | Cross      | Mobile nav + responsive layout                | P1       |
| E3  | Cross      | Keyboard / accessibility on donate flow       | P2       |

P0 = must pass to ship. P1 = important. P2 = nice-to-have.

---

## 2. How to test each flow

Each flow uses the same shape: **Setup → Steps → Pass if / Fail if**.

### A1 — Public: browse home → campaigns → org profile  · P0

**Setup:** signed out, start at `/`.
**Steps:**
1. Read hero, click "Browse Requests" (nav or hero CTA) → lands on `/campaigns`.
2. Use the cause-area chip filter; pick a chip → list narrows.
3. Open a campaign card → `/campaign/:slug` shows progress bar, supporters,
   "Updated {time}" badge, story content.
4. From the campaign, click the org chip/name → `/organizations/:id`.

**Pass if:** every navigation resolves, progress bar + supporters render, no
console errors, images load (no broken thumbnails).
**Fail if:** a route 404s, filter returns nothing for a chip that has campaigns,
or any placeholder image is broken.

### A2 — Public: static pages  · P2

**Setup:** signed out.
**Steps:** visit `/about`, `/faq`, `/contact`, `/impact`, and each
`/legal/*` page (privacy, terms, accessibility, cpsia, do-not-sell, sitemap).
On `/contact` and the footer newsletter, submit the form.
**Pass if:** all pages render, `/impact` shows the 5 hero stats + cause bars +
top orgs, form submits show a success toast.
**Fail if:** any page blank/500s, or `/impact` shows zeros where seed data exists.

### B1 — Donor: sign up / sign in + onboarding  · P0

**Setup:** signed out. For a fresh account use a disposable inbox
(`temp-mail.org`); or sign in as `txl25880@ucmo.edu`.
**Steps:**
1. Click Sign In / Sign Up → Clerk flow → complete email verification.
2. First sign-in: onboarding chooses donor role → lands on `/donor/dashboard`.
**Pass if:** account created, redirected to donor dashboard, no infinite
loading. `user_profiles` row exists (check via Supabase Studio if needed).
**Fail if:** onboarding loops, dashboard shows "not authorized", or sync fails
(watch API terminal for `/api/users/sync` errors).

### B2 — Donor: donate to a campaign  · P0

**Setup:** signed in as donor, on a `/campaign/:slug`.
**Steps:**
1. Click **Donate** → donation modal / donate page opens.
2. Enter an amount (e.g. $25).
3. Enter test card `4242 4242 4242 4242`, `12/30`, `123`. Submit.
4. Wait for success screen.
**Pass if:** success screen shows, campaign `amount_raised` + `supporters_count`
increment (refresh the campaign page), a `payment_transactions` row is written,
CBO gets a notification. Try the **declined** card `4000...9995` → clear error,
no increment.
**Fail if:** amount doesn't move, double-charge, success screen hangs, or a
decline still increments the total.

### B3 — Donor: donation history + receipt  · P1

**Setup:** signed in as donor who has donated (do B2 first).
**Steps:** go to `/donor/donations` (or dashboard "My Donations"). Open a
donation → download the PDF receipt.
**Pass if:** the B2 donation appears with correct amount + org, receipt PDF
downloads and shows donor name, amount, date.
**Fail if:** donation missing, wrong amount, or receipt 404/empty.

### B4 — Donor: profile + cause-area alerts  · P2

**Setup:** signed in as donor, `/donor/profile`.
**Steps:** edit display name / bio, save. Toggle cause-area alert
subscriptions, save.
**Pass if:** changes persist after refresh; subscriptions saved (a new matching
request later produces a `match_alert` notification).
**Fail if:** save silently fails or values reset on refresh.

### C1 — CBO: onboard org  · P0

**Setup:** sign in as a new/non-CBO account (or `mysites.victor@gmail.com`).
**Steps:**
1. Trigger "become a CBO" → `POST /api/users/become-cbo`.
2. Complete `/cbo/setup` (org name, mission, cause areas, tier).
3. Land on `/cbo/dashboard`.
**Pass if:** org created with `pre_eligibility_status` set, dashboard loads,
org appears in admin approval queue (D1).
**Fail if:** setup errors, dashboard shows no org, or become-cbo 500s.

### C2 — CBO: create a donation request  · P0

**Setup:** signed in as CBO owning an org, `/cbo/requests/new`.
**Steps:** fill the request form (device type, quantity, need frequency, etc.),
submit → redirected to `/cbo/requests`.
**Pass if:** request appears in the list as `open`, and shows publicly under
`/requests` (→ redirects to `/campaigns`) / org profile.
**Fail if:** validation blocks a valid form, or the request never appears.

### C3 — CBO: create / edit a campaign  · P0

**Setup:** signed in as CBO owning an org.
**Steps:**
1. Create a campaign (goal, story via rich-text editor, cause areas, image).
2. Submit → campaign is created with `campaign_details` version 1 in
   `pending_initial_approval`.
3. Edit an existing approved campaign → change should create a pending edit.
**Pass if:** new campaign shows pending state to owner; edit produces an entry
in the admin pending-edits queue (D2). Image upload writes a public URL (not a
base64 `data:` string) — upload failures surface an error, not silent success.
**Fail if:** campaign publishes without approval, edit bypasses the queue, or
image upload silently stuffs base64.

### C4 — CBO: edit org profile  · P1

**Setup:** signed in as CBO owner, own `/organizations/:id` (inline edit) or
`/cbo/profile/edit`.
**Steps:** change logo, cover image, mission; add a team member; post an update.
**Pass if:** all persist after refresh, images render from bucket URLs, update
appears on the public profile.
**Fail if:** any upload fails silently or edits don't persist.

### C5 — CBO: fulfill / deny a claimed request  · P1

**Setup:** a request must be **claimed** first (a donor completes a donation
against a request-type target). Signed in as the owning CBO.
**Steps:** open the claimed request → **Fulfill** (method + tracking) or
**Deny** (reason).
**Pass if:** status moves `claimed → fulfilled` (or `→ denied`),
`fulfillment_records` / `request_history` rows written, donor notified.
**Fail if:** status doesn't change or the action errors.

### C6 — CBO: campaign defaults + duplicate  · P2

**Setup:** signed in as CBO owner.
**Steps:** set org defaults at `/cbo/campaign-defaults` (creator name, contact,
cause areas, FAQs), save. Create a **new** campaign → confirm the form is
prefilled. Then **Duplicate** an existing campaign.
**Pass if:** defaults persist and prefill a new campaign form; duplicate creates
a new pending campaign copying content.
**Fail if:** defaults don't prefill or duplicate errors.

### D1 — Admin: approve a pending organization  · P0

**Setup:** signed in as admin (`taek...`), `/admin/organizations`.
**Steps:** find a pending org (from C1) → review → **Approve** (or reject).
**Pass if:** org status flips, org becomes publicly visible, an
`admin_activity_log` row is written, action shows in `/admin/audit-log`.
**Fail if:** approval doesn't change visibility or no audit row.

### D2 — Admin: approve / reject a pending campaign edit  · P0

**Setup:** signed in as admin, `/admin/campaigns`.
**Steps:** open the pending-edits queue → use the **diff viewer** to compare
proposed vs current → Approve or Reject.
**Pass if:** approve publishes the new `campaign_details` version + "Updated
{time}" badge updates on the public page; reject keeps the old version. Both log
to audit.
**Fail if:** diff is wrong/empty, approve doesn't publish, or reject still
publishes.

### D3 — Admin: user management + change role  · P1

**Setup:** signed in as admin, `/admin/users`.
**Steps:** open a user → change `user_type` (e.g. donor → cbo) via the confirm
dialog. Try to **demote yourself** and **demote the last admin** — both must be
blocked with a clear toast.
**Pass if:** role changes via `set_user_type` RPC + `user_role_changed` audit
row; self-demote → `SELF_DEMOTE` error toast; last-admin → `LAST_ADMIN` error
toast.
**Fail if:** either guard is bypassed or a valid change fails.

### D4 — Admin: audit log + reconciliation + payment events  · P2

**Setup:** signed in as admin.
**Steps:** `/admin/audit-log` — filter by action + entity type. In the admin
dashboard, run **Reconciliation** (default last 24h) and open **Payment
Events** (filter by paymentIntentId / eventType).
**Pass if:** audit filters work, reconciliation run completes with
matched/discrepancy counts, payment events list the B2 donation.
**Fail if:** reconciliation errors, a >31-day window doesn't 400 with
`WINDOW_TOO_LARGE`, or events are empty after a donation.

### E1 — Cross: notifications bell  · P1

**Setup:** trigger events first (B2 donation → CBO notif; C5 fulfill → donor
notif).
**Steps:** open the NotificationsBell for each role; mark read.
**Pass if:** relevant notifications appear (campaign + request types), unread
count updates, mark-read persists.
**Fail if:** no notification for a real event or count is stuck.

### E2 — Cross: mobile nav + responsive  · P1

**Setup:** narrow the browser below `md` (768px) or use device emulation
(F12 → device toolbar).
**Steps:** open the bottom-sheet nav via the bottom-left FAB **and** the top-nav
hamburger (both drive one sheet). Swipe-to-dismiss the sheet; edge-swipe to open
the sidebar. Check dashboards render the sidebar as a left drawer.
**Pass if:** nav items mirror the signed-in state, sheet opens/closes both ways,
desktop layout (≥768px) is unchanged.
**Fail if:** FAB and hamburger open different sheets, desktop layout shifts, or
a dashboard sidebar overlaps content.

### E3 — Cross: keyboard / accessibility on donate  · P2

**Setup:** signed-in donor on a campaign.
**Steps:** using **only the keyboard** (Tab / Enter / Space), reach the Donate
button, open the modal, fill the card, submit.
**Pass if:** focus order is logical, focus is visible, the modal traps focus and
Esc closes it, checkout completes without a mouse.
**Fail if:** any control is unreachable, focus is lost/invisible, or the modal
doesn't trap focus. (Also run `pnpm test:a11y` in `frontend-vite/`.)

---

## 3. Regression smoke (5-minute pre-release pass)

The minimum P0 set to run before any deploy:

1. Home loads → open a campaign (A1).
2. Donor donates $25 with test card → total increments (B2).
3. CBO creates a campaign → shows pending (C3).
4. Admin approves an org and a campaign edit (D1, D2).
5. Sign out / sign in each role lands on the right dashboard (B1/C1).

If all 5 pass, the core marketplace loop is healthy.

---

## 4. Known test-mode caveats

- `STRIPE_BYPASS_CONNECT=true` (dev) lets donations complete without org Stripe
  onboarding — do **not** rely on this to test the real Connect gate.
- On production the same donation 400s with `STRIPE_NOT_CONNECTED` until the org
  finishes Connect — test that path only on staging with a connected test org.
- `db:reset` wipes all data and re-seeds; re-run org-ownership reassignment after.
- Campaign over-funding is a **soft cap** (goes over goal, never blocks) — not a bug.
