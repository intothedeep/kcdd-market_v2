# Org Signup UX Findings

Test date: 2026-05-17
Test path: Homepage → "For Organizations" → Sign Up → Role Selection → Org Onboarding → CBO Dashboard
Test account: `test+clerk_test@example.com` (Clerk dev test pattern, verification code `424242`)

## 🚨 Critical bug — blocks every org from completing signup

**Symptom:** Submit on the final onboarding step shows "Failed to save. Please try again." The org is never created.

**Root cause:** Postgres error `23502` — `null value in column "id" of relation "organizations" violates not-null constraint`.

The upsert in `frontend-vite/src/lib/supabase.ts:233` does not supply an `id`, and the DB column has no default (`gen_random_uuid()` / `uuid_generate_v4()`).

**Two fix options:**

1. **App-side** (fastest, no migration): add `id: crypto.randomUUID()` to the upsert object in `saveOrganizationOnboarding`. Note: this also conflicts with `onConflict: 'user_id'` — re-runs will create a new id on every retry. Better to either select the existing id first or use `onConflict: 'user_id', ignoreDuplicates: false` while including id only on insert.
2. **DB-side** (cleaner): migration to set `default gen_random_uuid()` on `organizations.id`.

**Secondary bug at same call site:** Line 244 references `data.zipcode` but `zipcode` is not in the function's `data` parameter type. TS may or may not catch this depending on `noImplicitAny`/strict settings, but it's runtime-undefined.

## Friction points (ordered by impact)

### 1. "For Organizations" opens Sign In, not Sign Up
A first-time org clicks the button and sees a Sign In modal. The "Sign up" link is small text at the bottom. Most new orgs will bounce or get confused.

**Fix:** Use `<SignUpButton mode="modal">` for "For Organizations" (or split into "Sign In" + "Register Your Org").

### 2. Signup form has no org context
Even though "For Organizations" was clicked, the Clerk signup form is identical to the donor form. No org name field, no indication the user is in the org flow.

**Fix:** Either (a) pre-set user_type=cbo in the Clerk metadata when the org button is clicked, then skip role selection, or (b) at least change the modal heading copy.

### 3. Role selection appears post-signup
After signup, user has to pick "I want to give" vs "I need support" — even though they entered through "For Organizations". This is a redundant step for the org path.

**Fix:** Pre-select role from entry point (intent passed through Clerk's `unsafeMetadata` or URL param).

### 4. Onboarding modal is dismissible mid-flow
The X button and "Skip for now" both let users exit before the org row is created. On `/cbo/dashboard` they then see a "Set Up Organization" CTA that just reopens the same broken modal — a circular dead-end.

**Fix:** Either (a) make the modal non-dismissible until step 1 succeeds, or (b) accept partial saves and resume from where they left off.

### 5. Form state doesn't persist on reopen
Closing the modal after filling fields, then clicking "Set Up Organization" again, reopens the modal with all fields blank. Org loses 30+ seconds of typing.

**Fix:** Persist form state to `sessionStorage` or to a draft row in the DB.

### 6. Skip for now appears broken on final step
On step 2 (Cause Areas), clicking "Skip for now" leaves the modal in place with the error still showing. Behavior is identical to a failed submit.

**Fix:** "Skip for now" on the last step should bypass the save and close the modal; right now it appears to call the same broken path.

## Visual / minor

- **Large empty colored panel** on the left half of the onboarding modal (green on step 1, lime on step 2) is wasted space. Add an illustration, helper copy, or org examples.
- **Cause-area selected state** (outlined → solid white) has weak contrast. Use brand color fill.
- **Account Approval notice** is good copy and well-placed.
- **"Important Notice Banner"** marquee at the top of every page is placeholder text — should be removed or replaced before prod.

## What worked well

- Email verification via Clerk is smooth, supports `+clerk_test` dev pattern.
- Multi-step onboarding (profile → causes) breaks input nicely.
- EIN field is properly labeled with format hint `XX-XXXXXXX`.
- Approval-process notice sets correct expectations.
- The CBO dashboard's empty state correctly detects no-org and shows a "Set Up Organization" CTA.

## Code references

- Org button in nav: `frontend-vite/src/components/Navbar.tsx` — currently uses `SignInButton mode="modal"`
- Onboarding modal: `frontend-vite/src/components/OnboardingModal.tsx:132` (handleSubmit)
- DB upsert (root cause): `frontend-vite/src/lib/supabase.ts:201-254` (saveOrganizationOnboarding)
- Role selection modal: `frontend-vite/src/components/RoleSelectionModal.tsx`
- CBO dashboard empty state: `frontend-vite/src/pages/cbo/DashboardPage.tsx`

---

# End-to-End Test Pass — 2026-05-17

Driven through the full org lifecycle: signup → onboarding → campaign creation → admin approval → public visibility → donor checkout.

## Phase 1 — CBO sidebar pages (✅ all pass)

| Route / Tab | Result |
|------|--------|
| `/cbo/dashboard` | Stats render, filters work |
| `/cbo/profile` | Shows the org row we created (`Test Community Foundation`) with mission |
| `/cbo/profile/edit` | Form loads with prefilled name + mission |
| `/cbo/setup` | Loads, "Start Setup" button visible |
| `/cbo/requests` | Empty state with Create CTA |
| `/cbo/requests/new` | Form loads, all required fields present |
| Sidebar: Questions | Empty state, 4 sub-tabs (All/Pending/Answered/Dismissed) |
| Sidebar: Analytics | Stats cards + Monthly Donations chart placeholder |
| Sidebar: Documents | Empty state with upload CTA |
| Sidebar: Settings | Org info card with Edit button |
| Sidebar: My Campaigns | New/Pending/Completed cards + Quick Tips |

Console errors found (both non-blocker):
- `Error fetching organization documents` — query returns empty for new orgs; logs an error instead of silent empty result
- `Error fetching Stripe status: Failed to fetch` — expected when backend at `:4000` isn't running

## Phase 2 — Create real campaign (✅ pass, after preemptive fix)

Created request: `$5,000` for "10 refurbished laptops for our youth coding program" — High urgency, Children & Families. Landed in CBO dashboard table.

**Fix applied during test:** `createNewRequest` in `frontend-vite/src/lib/supabase.ts:749` had the same null-id bug as org onboarding. Added `id: crypto.randomUUID()` to the insert (caught before first submit attempt by code-reading the path).

## Phase 3 — Pre-approval visibility blocked (✅ pass)

While `is_vetted=false`:
- `/requests` (Browse Campaigns) — Test Community Foundation absent from 10 visible campaigns ✓
- `/organizations/<id>` from anon session — initially rendered the full profile (mission, contact email, request count) ❌

**🚨 Security finding (FIXED):** RLS policy `"Anyone can view organizations with vetted users"` uses `auth.uid()`, which is null because the app authenticates via Clerk, not Supabase Auth — so the policy never matches an "owner" and the second policy's `is_vetted=true` filter doesn't fire correctly under the anon role. The profile route returned the org row regardless.

Fix at `frontend-vite/src/pages/organizations/OrganizationProfilePage.tsx:253-266`: added client-side guard — if `!isVetted && !isViewerTheOwner`, set "Organization not found" error. Re-tested: anon user now correctly sees the not-found page. Owner still sees their own profile.

**Followup recommended (out of scope here):** investigate why Supabase RLS isn't gating effectively for the Clerk-authenticated case. Likely needs either a JWT bridge from Clerk → Supabase, or moving the gate into a Postgres function / RPC. The client-side check is defense-in-depth, not a substitute for proper RLS.

## Phase 4 — Admin approval (✅ pass)

Used Supabase MCP to simulate the admin action: `UPDATE user_profiles SET is_vetted = true WHERE id = 'user_3DsC7vptwUi02SCF8iYd2PqLAog'`. This is the same write the admin dashboard performs at `frontend-vite/src/pages/admin/UsersPage.tsx:126`.

## Phase 5 — Post-approval visibility (✅ pass)

After flipping `is_vetted`:
- `/organizations/<id>` from anon → full profile renders with **"Verified Organization" badge** in Community Impact card ✓
- `/requests` (Browse Campaigns) — still doesn't show the new row. **This is by design**: the page reads from a separate `campaigns` table, not `requests`. The CBO "+ New Request" path writes to `requests` while the public Browse page renders `campaigns`. These are two parallel concepts in the schema. Worth a UX clarification but not a bug.

## Phase 6 — Donor smoke test (✅ pass, after Clerk routing fix)

Signed up `donor+clerk_test@example.com` as donor:
- Verification step → blank page ❌
- Role selection → donor card → onboarding modal → `/donor/dashboard` ✓
- Browsed verified org's profile → clicked Support on the request → `/checkout/<id>` ✓
- Checkout correctly shows "Payments Not Available" because the org hasn't completed Stripe Connect onboarding ✓

**Bug fixed during test:** `/sign-up/verify-email-address` was a blank page because the route was registered as `path="/sign-up"` (exact), not `/sign-up/*` (catch-all). Clerk's `routing="path"` mode requires sub-route matching.

Fix at `frontend-vite/src/routes/index.tsx:112-113`:
```diff
-<Route path={routes.signIn} element={<SignIn .../>} />
-<Route path={routes.signUp} element={<SignUp .../>} />
+<Route path={`${routes.signIn}/*`} element={<SignIn .../>} />
+<Route path={`${routes.signUp}/*`} element={<SignUp .../>} />
```

This would have affected any user signing up via the page route (not the modal). Forgot-password and second-factor routes would have been silently broken too.

## Fixes applied during this run

1. **`createNewRequest` — null id** (`frontend-vite/src/lib/supabase.ts:759-764`): added `id: crypto.randomUUID()` to the insert.
2. **Unvetted org profile leak** (`frontend-vite/src/pages/organizations/OrganizationProfilePage.tsx:253-266`): added isVetted/isOwner gate.
3. **Clerk path routing** (`frontend-vite/src/routes/index.tsx:112-113`): made sign-in/sign-up routes catch-all.

## Deferred / out-of-scope issues

- Supabase RLS not gating effectively under Clerk auth (needs JWT bridge or refactor — design call)
- `requests` vs `campaigns` table duality — terminology and routing UX is confusing; consider unifying or clearly separating in nav
- `Error fetching organization documents` logged for empty-result case — should be silent
- `Error fetching Stripe status` — noisy when backend at `:4000` is down in dev; consider gracefully degrading
- "Important Notice Banner" placeholder marquee on every page — remove before prod
- Donor onboarding form has a left-side empty colored panel — same wasted real estate as org onboarding
- "Phone (Optional)" field on donor onboarding placed under Website — odd grouping
- Pre-existing TS errors in supabase.ts (`never` types) — generated types are stale

---

# CBO Interior Deep Dive — 2026-05-17

## Pass

- Filter tabs on dashboard (All / Open / In Progress / Fulfilled) actually filter the table.
- +New Campaign opens a real 7-step wizard (Basic Info → Cause Areas → Funding → Media & Social → Your Story → FAQs → Review). Distinct from the simpler "+New Request" path under `/cbo/requests/new`.
- Campaign create succeeded end-to-end (no equivalent of the org null-id bug here). Lands on `/campaign/<slug>` with a "Pending Approval" badge.
- Org Profile edit save round-trips correctly: typed EIN `12-3456789`, saw "Profile saved successfully!", reloaded, value persisted, and surfaced as "EIN: 12-3456789" in the public profile sidebar.
- Public Profile sidebar correctly shows "Verified Organization" + EIN after the approval flip + edit.
- Profile tabs (About / Campaigns / Updates / Team) all render their empty / populated states without errors.

## 🚨 Fix applied: pending campaigns leaked to public Browse page

`getActiveCampaigns(limit, includePending = true)` defaulted to `true`, so every pending/unapproved campaign was being rendered on `/requests`. The comment said "for testing/preview" — but the only caller (`RequestsPage.tsx:63`) was the public page.

Fix at `frontend-vite/src/lib/supabase.ts:894`: changed default to `false`. Verified:
- Before fix: `/requests` showed 11 campaigns including our pending "Coding for Kids 2026".
- After fix: `/requests` shows 9 campaigns; our pending one is hidden (and 2 other previously-leaking pending ones too).

If we ever want admins to see pending campaigns, callers should pass `true` explicitly.

## Unwired row dropdown menu items (frontend-vite/src/pages/cbo/DashboardPage.tsx)

These `<DropdownMenuItem>` elements have **no onClick handlers** — they look interactive but do nothing:

| Line | Items |
|------|-------|
| 289–294 | Customize Columns: Description, Cause Area, Urgency, Status, Amount, Date |
| 385–387 | Row kebab: Edit, View Details, Delete |
| 552–555 | Campaign card kebab: Edit Campaign, View Analytics, Share, Delete |
| 414–416 | Rows-per-page selector: 10, 20, 50 |

Either wire them up (View Details should open a detail modal/page; Edit should navigate to edit; Delete should soft-delete; Customize Columns should toggle column visibility) or remove the menus until they work. The Delete menu items are particularly risky as placeholder UI — a future implementation that wires Delete to a real call without a confirmation modal could destroy data silently.

## Cross-role route leak

A signed-in **donor** can navigate to `/cbo/dashboard` and sees the "Set Up Organization" empty state. `ProtectedRoute` only checks signed-in status, not `user_type`. Same applies in reverse for CBOs hitting `/donor/*`. Add a `user_type`-aware guard or redirect.

## UX trap on Create Campaign step 3

The `Funding Goal` field shows `$ 5,000` as placeholder text, which visually looks like a pre-filled default. Clicking Next without typing produces "Please enter a funding goal". Either pre-fill the field with `5000` or use placeholder copy that clearly reads as guidance (e.g., `e.g., 5000`).

## Story Headline forgotten on Review

The Review step shows `Story Title: Not set` because the headline field on the Your Story step is separate from the rich-text body and is optional with placeholder text. The body content I entered was saved fine, but a user could think they wrote a title when they didn't. Consider renaming "Story Headline" → "Headline (optional)" with a visible "(optional)" label.

## Fixes applied in this run

1. **Pending campaign leak** — `frontend-vite/src/lib/supabase.ts:894` — `includePending` default false.

## Still deferred

- Wire (or remove) the dashboard dropdown placeholder items.
- Role-aware route guards (`ProtectedRoute` checks `user_type` and redirects).
- Funding Goal placeholder UX trap.
- Story Headline label clarity.
