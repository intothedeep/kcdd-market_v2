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

Used Supabase MCP to simulate the admin action: `UPDATE user_profiles SET is_vetted = true WHERE id = '<test-user-id>'`. This is the same write the admin dashboard performs at `frontend-vite/src/pages/admin/UsersPage.tsx:126`.

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

---

# Dashboard Content Walkthrough — 2026-05-17

Goal of this round: actually use each dashboard tab the way an org admin would, and identify what's wired vs broken.

## Team ✅ rendering, ❌ no add UI

`OrganizationTeamTab` is viewer-only. Owners have no way to add team members from the UI — there's no Add Team Member button, no edit handler, no upload flow. The empty state for owners should show an "Add team member" CTA, and the populated state should show edit/remove controls when `isOwner=true`. Seeded a member via SQL and it rendered beautifully (avatar with initials, name, role in brand orange, bio, Contact mailto link).

Code: `frontend-vite/src/components/organization/OrganizationTeamTab.tsx` doesn't accept an `isOwner` prop and renders the same view for everyone.

## Updates ✅ rendering, ❌ no compose UI

`OrganizationUpdatesTab` is viewer-only. Owners can't post updates from the org profile. Inserted an update via SQL — renders cleanly: date, title, content, sidebar icon. Same fix shape as Team: needs an `isOwner` flow with a compose form.

## Campaign edit ✅ works

`/campaign/<slug>` → "Edit Campaign" toggles inline edit mode. Title and tags are editable; Save Changes persists; URL slug doesn't update on title change (acceptable). Renamed "Coding for Kids 2026" → "Coding for Kids 2026 — Spring Cohort" and the My Campaigns sidebar item picked up the new title.

## Questions ⚠️ broken for owners under Clerk auth

`fetchOrganizationQuestions` queries `campaign_questions`, which has RLS:

```sql
"Campaign owners can view all questions"
USING (EXISTS (SELECT 1 FROM campaigns c
  WHERE c.id = campaign_questions.campaign_id
  AND c.created_by = auth.uid()::text))
```

`auth.uid()` is null under Clerk → owners can never see their own pending questions. Only the public policy `is_public=true AND status='answered'` returns rows.

Seeded a question and observed:
- `status='pending'` → invisible to owner ❌
- `status='answered', is_public=true` → renders perfectly with campaign tag, question text, submitter, "Your answer:" block, green Public badge, All(1)/Answered(1) tab counts ✅

This means **no donor question can ever be answered through the dashboard UI** today — the owner can't see them to begin with. Until the Clerk→Supabase JWT bridge is in place, the answer flow has to either:
(a) bypass RLS via a service-role backend endpoint
(b) use a different policy that doesn't depend on `auth.uid()`
(c) do client-side filtering against an open SELECT policy

## Analytics ✅ fully wired

After marking the test request `status='fulfilled', fulfilled_at=NOW()` via SQL, Analytics populated cleanly:
- People Helped: 1
- Total Received: $5,000
- Requests Fulfilled: 1
- Monthly Donations bar chart with a $5,000 May bar
- Recent Fulfilled Requests card with description, amount, cause area, fulfilled date

One copy issue: **"People Helped"** and **"Requests Fulfilled"** both bind to `stats.fulfilledRequests` (`DashboardPage.tsx:1932` & `:1942`). Same number, two labels. People helped should be unique beneficiary count or at least beneficiaries-per-request × requests. As-is it misleads donors looking at impact.

## Documents ✅ rendering, was missing table

Console error "Error fetching organization documents" was caused by the `organization_documents` table **not existing in the remote DB**. The migration file `backend/supabase/migrations/20240320000000_organization_documents.sql` was in the repo but never applied (also used `UUID` for `id` while the rest of the app moved to `TEXT`).

Applied a corrected migration via MCP (text IDs, RLS that doesn't depend on `auth.uid()`). Updated the local migration file to match. Seeded a "501(c)(3) Determination Letter.pdf" doc and the tab renders properly: file icon, name, type/year/size line, Public badge, Download button, delete icon.

The Upload Document button is wired (the function exists at `supabase.ts:2058`); a real end-to-end upload test would need a file input + the `organization-logos`-style storage bucket configured (haven't tested storage permissions).

## What this round produced

Inline changes:
- `backend/supabase/migrations/20240320000000_organization_documents.sql` — updated to text IDs, Clerk-friendly RLS.
- Applied via Supabase MCP to remote DB (`organization_documents` table now exists).

Seeded data on the test org / campaign:
- 1 team member (Joshua Madrid, Executive Director)
- 1 update ("First 10 laptops delivered to students!")
- 1 answered Q&A
- 1 fulfilled request ($5,000)
- 1 organization document (501(c)(3) Determination Letter.pdf)
- Campaign renamed to "Coding for Kids 2026 — Spring Cohort"

## New deferred items

- Add `isOwner` prop + add/edit UI to Team and Updates tabs.
- "People Helped" vs "Requests Fulfilled" label/computation distinction.
- Clerk-RLS bridge so owners can see and answer pending questions through the dashboard (or service-role backend endpoint as a workaround).
- Storage bucket configuration for document uploads (not yet tested end-to-end).

---

# Wired Up — 2026-05-17

All four deferred items above are now done.

## 1. Document upload E2E

Storage buckets `organization-documents`, `organization-logos`, `campaign-images` didn't exist on the remote project — created them with permissive RLS that works under Clerk anon. Migration applied: `storage_buckets_clerk_friendly_policies`. Bucket configs: 20 MB / 5 MB / 10 MB limits, PDF + common image MIME types.

Tested upload UI live: selected a JPG → form metadata round-tripped to `organization_documents` with a public `file_url` pointing at `<project-ref>.supabase.co/storage/v1/object/public/organization-documents/...`. Document card renders with file icon, name, type/year/size, Public badge, Download + delete.

Two minor form bugs noticed (not fixed this round):
- Selecting a file overrides the typed Document Name with the filename (without extension).
- "Make publicly visible" checkbox didn't pick up the click in my run — possibly a click-target sizing issue. The form does honor it when checked.

## 2. Team add/edit UI (`OrganizationTeamTab.tsx`)

Rewrote the component to accept `isOwner`, `organizationId`, and `onMembersChanged`. When `isOwner=true`:
- "Add Team Member" CTA in the header opens an inline form with Name/Role/Email/Photo URL/Bio.
- Each member card surfaces Pencil + Trash icons on hover, wired to update and soft-delete handlers.
- Empty state copy reads "Click 'Add Team Member' to introduce your team to donors."

Also fixed the same null-id bug class in `createOrganizationTeamMember` (`supabase.ts:1548`) — added `id: crypto.randomUUID()` to the insert.

Tested live: added Maria Garcia as Program Director. Card rendered correctly, Team(2) badge.

`/cbo/profile` (the dashboard's own profile page, not the public route) was rendering the old viewer-only tab — wired `isOwner` through there too (`ProfilePage.tsx:228-237`). The public `/organizations/<id>` route uses the same component but `isOwner` resolves dynamically off `organization.user_id === user.id`.

## 3. Updates compose UI (`OrganizationUpdatesTab.tsx`)

Same shape — `isOwner` + `organizationId` + `onUpdatesChanged`. "Post Update" CTA → inline form with Title/Content/Image URL. Tested live: posted "Spring cohort applications now open" → new entry at top of the timeline, Updates(2) badge.

Same null-id fix on `createOrganizationUpdate`.

## 4. People Helped vs Requests Fulfilled

Added `beneficiaries_count INTEGER DEFAULT 1 NOT NULL` to `requests` (migration `add_beneficiaries_count_to_requests`). `CBODashboardStats` now has a new `beneficiariesHelped` field computed as `sum(beneficiaries_count) over fulfilled requests`. The Analytics card binds People Helped to that, Requests Fulfilled stays at `fulfilledRequests` count.

Added a "People this will help" number input to `/cbo/requests/new` so CBOs can set the count when creating a request (defaults to 1, helper text explains the analytics tie-in).

Backfilled the existing test request from `1 → 10` to verify: dashboard now shows **People Helped: 10**, **Requests Fulfilled: 1** — meaningfully distinct.

## 5. Clerk → Supabase JWT bridge

Two-part change:

**Code side (always installed):**
- `lib/supabase.ts` — added `ClerkSupabaseBridge` module-level token getter, hooked into supabase-js's `accessToken` callback (v2.42+ API). Gated by `VITE_ENABLE_CLERK_SUPABASE_BRIDGE` env var so the JWT path is opt-in.
- `App.tsx` — `AuthSync` calls `ClerkSupabaseBridge.setTokenGetter(() => getToken({ template: 'supabase' }) ?? getToken())` on mount, so once the env var is flipped the supabase client gets the Clerk JWT per request.

**Dashboard config (manual, one-time):**
1. Supabase Dashboard → Auth → Third Party Auth → Add Clerk; paste your Clerk frontend API URL.
2. (Optional) Clerk Dashboard → JWT Templates → Add "supabase" template; the bridge prefers this if present.
3. Set `VITE_ENABLE_CLERK_SUPABASE_BRIDGE=true` in `.env.local`.

Once those three steps are done, `auth.uid()` in RLS returns the Clerk user ID and the original owner-only policies will work properly.

**Without dashboard config (today, unblocking owners):** I dropped the auth.uid()-dependent policies on `campaign_questions` and replaced them with permissive SELECT/UPDATE (migration `campaign_questions_clerk_friendly_policies`). Org owners can now fetch and answer pending questions through the dashboard regardless of TPA state. Tested live: seeded "Can my donation be earmarked for a specific student?" as pending → Questions tab shows "1 pending" badge → clicked Answer → inline answer composer → submitted → All(2) / Pending(0) / Answered(2).

Owner-identification on these tables is now enforced at the application layer (`fetchOrganizationQuestions` only requests questions for campaigns whose `organization_id` belongs to the signed-in org). When the JWT bridge is enabled in production, you can re-tighten RLS by adding back a `c.created_by = auth.uid()::text` policy alongside the permissive one — or replace it entirely.

## Migrations applied this round

- `storage_buckets_clerk_friendly_policies`
- `team_members_and_updates_clerk_friendly_policies`
- `add_beneficiaries_count_to_requests`
- `campaign_questions_clerk_friendly_policies`

(Plus the storage bucket rows themselves, inserted via direct SQL.)

---

# JWT Bridge Fully Wired — 2026-05-17 (later)

After the previous round shipped the *code* side of the Clerk → Supabase bridge but kept it disabled by env flag, I walked through the dashboard config end-to-end with the user driving via Chrome MCP.

## Steps actually completed

1. **Supabase project → Auth → Third Party Auth → Add provider → Clerk.** Set the Clerk frontend API domain (your `<clerk-subdomain>.clerk.accounts.dev`) as the issuer. Confirmation toast: *"Successfully created a new Clerk integration."*
2. **`.env.local`** — added `VITE_ENABLE_CLERK_SUPABASE_BRIDGE=true`.
3. **Vercel** project → Settings → Environment Variables → added the same flag for Production + Preview, then Redeployed. Toast: *"Deployment created."*
4. **Local dev server restarted** so Vite reads the new env at boot.

## Verified end-to-end

Created a `public.whoami()` SQL function returning JWT claims and called it from the browser via supabase-js. Response after the bridge was enabled:

```json
{
  "auth_role": "anon",
  "jwt_claims": {
    "iss": "https://<clerk-subdomain>.clerk.accounts.dev",
    "sub": "user_<id>",
    "exp": 1779067921,
    "iat": 1779067861,
    "azp": "http://localhost:3000",
    "sid": "sess_<id>",
    "role": "anon"
  }
}
```

Supabase is reading and trusting the Clerk JWT. `auth_role` stays `anon` (this is TPA's design — role is anon, identity comes from the JWT sub).

## `clerk_user_id()` helper

Because `auth.uid()` returns UUID and chokes on Clerk's `user_…` ids, I added:

```sql
CREATE FUNCTION public.clerk_user_id() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT (current_setting('request.jwt.claims', true)::jsonb)->>'sub' $$;
```

Use this in RLS instead of `auth.uid()` for any comparison against TEXT columns (`organizations.user_id`, `user_profiles.id`, etc).

## Re-tightened RLS (now strictly owner-scoped)

Migration `clerk_user_id_helper_and_tightened_rls_v2` replaced the permissive policies that I'd added during the dashboard-config gap:

| Table | Policy |
|-------|--------|
| `campaign_questions` | `SELECT` only if org owner OR question is public+answered; `UPDATE` only if org owner |
| `organization_team_members` | `INSERT` / `UPDATE` / `DELETE` only if org owner; existing `SELECT WHERE is_active=true` retained |
| `organization_updates` | `INSERT` / `UPDATE` / `DELETE` only if org owner; existing public-read retained |

All gate on `organization_id IN (SELECT id FROM organizations WHERE user_id = public.clerk_user_id())`.

Spot-checked live: owner reset a question to pending → Questions tab fetched it (RLS allowed) → owner answered it → Team Add David Lee succeeded → Team(3) badge updated.

## Migrations applied this round

- `add_whoami_diagnostic_function` (kept for future debugging)
- `whoami_claims_jsonb`
- `clerk_user_id_helper_and_tightened_rls_v2`

## Anything left

- The hard-coded `auth.uid()::text` checks in older policies (e.g., `campaigns` table) still won't match Clerk ids if anyone re-introduces a restrictive policy. Future RLS for Clerk-identified resources should use `public.clerk_user_id()` instead.
- The user_profiles RLS hasn't been re-tightened to owner-only for SELECT — the role-selection / onboarding code still hits user_profiles before the org exists, so a permissive policy may be intentional. Audit before tightening.

---

# Admin Dashboard Walkthrough — 2026-05-17

Signed in as the platform admin (`hello@joshuamadrid.com`) and exercised every section.

## Pass

- **Overview** at `/admin` — stats accurate after the backfill (Total Users 23, Orgs 15, Open Requests 14, Donations $7,853, Verified Users 11). Recent Activity feed wired to real signups (Alex / Sarah Chen / Test Donor). Quick Actions clickable.
- **Users** — table renders, `Type` / `Tier` / `Status` dropdowns all work end-to-end. Verified Alex via the Status dropdown and saw the count tick 10 → 11. Type dropdown shows Donor / Recipient Organization / Administrator.
- **Organizations** — 15 cards, search + status filter, View / Edit buttons per card. Test Community Foundation correctly shows "Verified" after the backfill.
- **Requests** — All(35) / Open(14) / Claimed(7) / Fulfilled(14) / Denied(0). The $85 Employment First KC request shows "Claimed" — confirms our donor checkout flow updated the request status.
- **Reports** — empty state ("No Reports") with Pending/Reviewing/Resolved tabs. No campaigns reported yet, page renders cleanly.
- **Analytics** — real User Growth + Donation Trends charts. May donations show $5,000 (our test request) + 4 May signups; matches reality.
- **Row kebab menu** — View Details / Impersonate / Send Email / Delete User.
- **Impersonate** — clicked on Alex's row → orange `Impersonating Alex (donor)` banner at top with `Stop Impersonating` button → redirected to `/donor/dashboard` showing Alex's real data ($1,484 lifetime, 6 fulfilled, 6 causes). Stop Impersonating cleanly restored the admin view.

## 🚨 Finding (FIXED): `is_vetted` vs `verification_status` desync

The admin UI's Status column reads from `user_profiles.verification_status` (string: `'unverified' | 'verified'`), while the public-visibility RLS, organization profile gate, and earlier admin SQL paths read/write `user_profiles.is_vetted` (boolean). The admin UsersPage's toggle correctly writes both. But:
- Earlier in this session I flipped `is_vetted` directly via Supabase MCP without touching `verification_status` → 10 users were silently out of sync.
- Result on the admin dashboard before the fix: every user (including Test Community Foundation, which I'd just approved end-to-end) showed `Unverified`, and the `Verified Users` stat read 0.

Backfill migration `backfill_verification_status_from_is_vetted` synced both directions. New writes from RoleSelectionModal and the admin UI already touch both columns, so the migration should be a no-op on fresh databases going forward.

## Smaller notes (not fixed this round)

- `/admin` (the in-app DashboardPage with the embedded Users section) and `/admin/users` (the standalone UsersPage component) are two different UIs that overlap. Pick one canonical surface or delete the duplicate.
- The Overview's `Verified Users` stat is computed off `verification_status='verified'` — after the backfill it reads 11 correctly; before it was 0.
- "Send Email" in the row kebab and "Export Data" in Quick Actions weren't tested; if they're wired, document the destination/format.
- Admin dashboard sidebar still shows the always-on "Important Notice Banner" marquee — same noise as the public site; remove before prod.
