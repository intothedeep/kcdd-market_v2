# User Types & Lifecycle Stages

> KC DIME platform user documentation — covers all user types, their lifecycle stages, and what each can access at every step.

---

## User Types

| Type | DB Value | Display Label | Description |
|------|----------|---------------|-------------|
| Donor | `donor` | Donor | Individuals who want to give and support organizations |
| Recipient Org | `cbo` | Recipient Organization | Organizations seeking technology support |
| Admin | `admin` | Administrator | Platform administrators (set manually in DB) |

---

## Lifecycle Stages (All User Types)

### Stage 1: Anonymous (Not Signed In)

**What they see:**
- Homepage with hero, stats, feature sections
- Navbar: Homepage, Browse Requests, About Us, "For Organizations", "Login"
- Both "For Organizations" and "Login" open the Clerk sign-in modal
- Can view the public requests page (`/requests`)
- Can view the about page (`/about`)
- Can view organization profiles (`/organizations/:id`)
- Can view campaign pages (`/campaign/:slug`)

**Cannot:**
- Access any dashboard
- Donate or claim requests
- Create requests or campaigns

---

### Stage 2: Signed Up (Clerk Authenticated, No Supabase Profile)

**Trigger:** User completes Clerk sign-up/sign-in for the first time.

**What happens:**
- `useClerkSupabase()` queries `user_profiles` for the Clerk userId
- No profile found → `needsRoleSelection = true`
- **Role Selection Modal** appears (cannot be dismissed)
- User redirected to homepage if not already there

**Modal options:**
- "I want to give" → sets `user_type: 'donor'`
- "I need support" → sets `user_type: 'cbo'`

**Profile created in Supabase with:**
- `onboarding_complete: false`
- `verification_status: 'unverified'`
- `org_tier: 'individual'`

---

### Stage 3: Role Selected (Onboarding In Progress)

**Trigger:** User picks a role in the Role Selection Modal.

**What happens next:**
- Onboarding Modal appears (2-step flow, varies by type)
- Profile exists in `user_profiles` but `onboarding_complete: false`

#### Donor Onboarding
1. Complete profile (display name, profile picture, website, bio)
2. Select preferred cause areas to support

#### CBO Onboarding
1. Complete organization profile (logo, name, description, website, EIN)
2. Select cause areas of focus

**On completion:** `onboarding_complete: true`, user navigated to their dashboard.

---

### Stage 4: Onboarded (Active, Unverified)

**Status:** `onboarding_complete: true`, `verification_status: 'unverified'`

- **Donors:** Immediately active. Can browse, donate, and use all donor features.
- **CBOs:** Account submitted for review. Message shown: "Your account will be reviewed by our team. You'll receive an email once approved."

---

### Stage 5: Verified

**Status:** `verification_status: 'verified'` (set by admin)

Full access to all features for the user's type. See detailed capabilities below.

---

## User Types Across All Stages

| Stage | Donor | CBO (Recipient Org) | Admin |
|-------|-------|---------------------|-------|
| **1. Anonymous** | Can view homepage, requests, campaigns, about | Same as Donor | Same as Donor |
| **2. Signed Up** | Role Selection Modal appears — picks "I want to give" | Role Selection Modal appears — picks "I need support" | N/A — admin is set manually in DB |
| **3. Role Selected** | Onboarding: display name, photo, bio, cause areas | Onboarding: org name, logo, description, EIN, cause areas | N/A |
| **4. Onboarded** | Immediately active — can browse and donate | Awaiting admin verification — limited access | N/A |
| **5. Verified** | Full access to donor dashboard, impact, documents, support | Full access to CBO dashboard, requests, profile, analytics, Stripe | Full access to admin dashboard, user management, impersonation |
| **6. Casual** | Browses occasionally, 1-2 donations, incomplete profile | 1-2 requests created, logs in when needed, basic profile | Handles tasks when flagged, not daily |
| **7. Regular** | Donates monthly, tracks impact, downloads tax docs, cause area prefs set | Multiple active requests, Stripe connected, profile updated, responds to donors | Weekly check-ins, verifies orgs promptly, monitors trends |
| **8. Power User** | Repeat donor across campaigns, shares/refers others, full impact tracking | Many fulfilled requests, polished profile, uses analytics, featured org candidate | Daily monitoring, impersonation QA, data exports, manages verification pipeline |
| **9. Inactive** | No activity 90+ days, or account deleted with donations anonymized | No activity 90+ days, stale requests flagged, or account archived/deleted | No longer managing platform |

---

### Stage 6: Active — Casual

**Status:** Verified user with occasional, low-frequency engagement.

- **Donors:** Browses requests from time to time, may have made 1-2 donations. Checks impact page occasionally. Not subscribed to updates or only loosely following cause areas.
- **CBOs:** Has created a profile and maybe 1-2 requests. Logs in when needed but doesn't actively manage campaigns or update org info regularly.
- **Admins:** Logs in to handle specific tasks when flagged (e.g., verify an org, respond to a report). Not monitoring the platform daily.

**Indicators:**
- Logs in a few times per month or less
- 1-2 donations or requests lifetime
- Profile may be incomplete or outdated
- Low interaction with dashboard features

---

### Stage 7: Active — Regular

**Status:** Verified user with consistent, steady engagement.

- **Donors:** Donates regularly (monthly or per-campaign), tracks impact, downloads tax docs at year-end, has filled out cause area preferences and gets relevant notifications.
- **CBOs:** Actively managing multiple open requests, keeping org profile updated, responding to donor questions, connected to Stripe and receiving funds, uploading documents.
- **Admins:** Checking the dashboard weekly, verifying new orgs promptly, reviewing flagged content, monitoring user growth and donation trends.

**Indicators:**
- Logs in weekly or multiple times per month
- Multiple donations or active requests
- Profile and org info kept current
- Uses dashboard features (analytics, documents, filters)

---

### Stage 8: Active — Power User

**Status:** Verified user who is a high-value, high-engagement champion of the platform.

- **Donors:** Repeat donor across multiple campaigns and cause areas. Downloads tax summaries annually. May share campaigns or refer others. Engages with org profiles, leaves messages, tracks all donations through impact page. Potential candidate for donor spotlight or testimonials.
- **CBOs:** Multiple fulfilled requests, strong org profile with logo/cover/social links, actively creating new campaigns, using analytics to inform strategy, full Stripe integration, responsive to questions, keeps updates flowing. Potential candidate for featured org or success stories.
- **Admins:** Daily platform monitoring, proactive user management, using impersonation to QA user experience, exporting data for reports, managing org tiers and verification pipeline, maintaining platform health.

**Indicators:**
- Logs in multiple times per week or daily
- 5+ donations or 3+ fulfilled requests
- Complete, polished profile
- Uses advanced features (analytics, exports, impersonation)
- High retention — been active for 3+ months consistently

---

### Stage 9: Inactive (Churned)

**Status:** User is no longer using the platform. May be voluntary or involuntary.

**How a user reaches this stage:**
- Stops logging in — no activity for 90+ days, gradual disengagement
- Requests account deletion (self-service or via support)
- Admin suspends and then permanently removes account (e.g., terms violation, fraud)
- Organization dissolves or stops operating
- Donor has no further interest in the platform

**What happens:**
- Account may be flagged as dormant after extended inactivity
- If self-deactivated or admin-removed:
  - Profile marked as archived or deleted
  - Personal data removed or anonymized per privacy policy
  - Donation history retained in anonymized form for tax/reporting compliance
  - CBO requests marked as closed/archived
  - Clerk account may be deactivated or deleted
  - Admin can perform full data cleanup from the Users management page
- If simply dormant (not deleted):
  - Account and data remain intact
  - Could receive re-engagement outreach (e.g., "New requests in your cause areas")
  - Can return at any time without re-onboarding

**Data retention:**
- Transaction records kept for legal/tax compliance (anonymized if account deleted)
- Platform aggregate statistics unaffected
- Personally identifiable information removed upon deletion request

---

## Detailed Capabilities by User Type

### Donor (Verified)

**Dashboard:** `/donor/dashboard`

**Navbar:** Homepage, Browse Requests, About Us, Dashboard button, Clerk UserButton

**Sidebar Navigation:**
- Dashboard
- Profile
- Impact
- Documents
- Support

**Pages & Features:**

| Page | Path | What They Can Do |
|------|------|-----------------|
| Dashboard | `/donor/dashboard` | View stats, browse/search/filter requests, quick actions |
| Profile | `/donor/profile` | View and edit personal info (email, name) |
| Impact | `/donor/impact` | View donation totals, lives impacted, cause areas, monthly trends |
| Documents | `/donor/documents` | Download tax documents, view yearly summaries |
| Support | `/donor/support` | Access FAQs, contact info, submit support messages |

**Actions:**
- Browse all public requests
- Filter requests by cause area, urgency, status
- Claim/donate to requests via checkout flow (Stripe)
- View personal donation history and impact
- Download tax receipts
- Opt into platform newsletter

**Cannot:**
- Create requests or campaigns
- Access organization management
- Access admin tools

---

### CBO / Recipient Organization (Verified)

**Dashboard:** `/cbo/dashboard`

**Navbar:** Homepage, Browse Requests, About Us, Dashboard button, Clerk UserButton

**Sidebar Navigation:**
- Dashboard
- Profile
- Campaigns
- Create Campaign
- Questions
- Analytics
- Documents
- Settings
- Support
- Search

**Pages & Features:**

| Page | Path | What They Can Do |
|------|------|-----------------|
| Dashboard | `/cbo/dashboard` | View stats (total received, open/in-progress/fulfilled requests), manage requests, Stripe Connect status, documents, analytics |
| Requests | `/cbo/requests` | View all org requests, filter by status (open, claimed, fulfilled), paginated table |
| New Request | `/cbo/requests/new` | Create resource requests (description, amount, cause area, urgency) |
| Profile | `/cbo/profile` | View org info with tabs: About, Campaigns, Updates, Team |
| Profile Edit | `/cbo/profile/edit` | Edit all org details (see fields below) |
| Setup | `/cbo/setup` | Initial org profile setup after signup |

**Editable Organization Fields:**
- Name, tagline, mission statement
- Organization type and size
- Year founded, program description
- Technology barriers, service area
- Contact info (email, phone, website, address, zipcode)
- EIN / Tax ID
- Logo and cover images
- Social media links
- Cause areas served
- Population/identity categories served

**Actions:**
- Create and manage resource requests
- Edit organization profile
- Track request status and incoming donations
- Upload and manage documents
- Connect Stripe for receiving payments
- Answer/manage organization questions
- View analytics on requests and donations

**Cannot:**
- Donate to other requests
- Access admin tools
- View donor dashboard

---

### Admin (Verified)

**Dashboard:** `/admin`

**Navbar:** Homepage, Browse Requests, About Us, Dashboard dropdown (Admin / Donor / CBO), Clerk UserButton

**Dashboard Dropdown Options:**
- Admin Dashboard (`/admin`)
- Donor Dashboard (`/donor/dashboard`)
- CBO Dashboard (`/cbo/dashboard`)

**Sidebar Navigation:**
- Overview
- Users
- Organizations
- Requests
- Reports
- Analytics
- Settings
- Support

**Pages & Features:**

| Page | Path | What They Can Do |
|------|------|-----------------|
| Dashboard | `/admin` | Platform stats, quick actions, recent activity feed, user/org/request management |
| Users | `/admin/users` | Full user list with search/filter, manage all users |

**Admin-Only Actions:**

| Action | Description |
|--------|-------------|
| Update user type | Change between donor/cbo/admin |
| Update verification status | Set unverified/verified |
| Update org tier | Set individual/small_org/large_org |
| Set vetting notes | Set `verification_status`, add `vetting_note` |
| Delete user | Full data cleanup across all tables |
| Impersonate user | View app as another user (for testing/support) |
| Export data | Export users, requests, donations to CSV |
| Review organizations | Approve/reject CBO applications |
| Moderate requests | Review reported/flagged requests |

**Admin-Only Database Fields:**
- `verification_status` — `unverified` | `verified`
- `org_tier` — `individual` | `small_org` | `large_org`
- `vetting_note` — text

**Impersonation:**
- Stored in `sessionStorage.impersonation`
- `useUserType()` respects impersonation (shows impersonated user's type)
- `useRealUserType()` ignores impersonation (used for admin route protection)
- `ImpersonationBanner` displays when active

---

## Route Protection Summary

| Route Pattern | Protection | Who Can Access |
|---------------|-----------|----------------|
| `/`, `/about`, `/requests` | Public | Everyone |
| `/campaign/:slug` | Public | Everyone |
| `/organizations/:id` | Public | Everyone |
| `/legal/*` | Public | Everyone |
| `/donor/*` | `ProtectedRoute` | Signed-in users (donor dashboard) |
| `/cbo/*` | `ProtectedRoute` | Signed-in users (CBO dashboard) |
| `/admin`, `/admin/*` | `ProtectedRoute` + `ProtectedAdminRoute` | Admin users only |
| `/checkout/:requestId` | `ProtectedRoute` | Signed-in users |

**`ProtectedRoute`** — Requires Clerk sign-in, redirects to sign-in if not authenticated.

**`ProtectedAdminRoute`** — Checks `useRealUserType()` for `admin`. Shows "Access Denied" for non-admins.

---

## Stage Transitions

How users move from one stage to the next, what triggers the transition, and where it's tracked.

| Transition | Trigger | Tracked By | Documentation |
|------------|---------|------------|---------------|
| Anonymous → Signed Up | User clicks Login or For Organizations and completes Clerk sign-up | Clerk auth event; `useClerkSupabase()` detects no `user_profiles` row | Clerk dashboard user list; `needsRoleSelection` flag in app state |
| Signed Up → Role Selected | User picks "I want to give" or "I need support" in RoleSelectionModal | Supabase upsert to `user_profiles` with `user_type`; `onboarding_complete = false` | `user_profiles` table: `user_type` field; `donor_profiles` row created if donor |
| Role Selected → Onboarded | User completes 2-step OnboardingModal (profile + cause areas) | Supabase: `onboarding_complete` flipped to `true`; navigates to dashboard | `user_profiles.onboarding_complete`; donors active immediately, CBOs await review |
| Onboarded → Verified | Admin reviews account in `/admin/users` and sets `verification_status` to `verified` | Supabase: `verification_status = verified`; admin sets `vetting_note` | Admin dashboard audit trail; `user_profiles.verification_status` + `vetting_note` fields |
| Verified → Casual | Automatic — user logs in a few times, makes 1-2 donations or requests | Login frequency; donation/request count queries from Supabase tables | Supabase: `donations` table count, `requests` table count, `last_sign_in` from Clerk |
| Casual → Regular | User donates monthly or has multiple active requests; logs in weekly+ | Donation frequency; request count; Stripe Connect active; profile completeness | Admin analytics; donor impact page history; CBO dashboard request stats |
| Regular → Power User | 5+ donations or 3+ fulfilled requests; active 3+ months; uses advanced features | Lifetime donation count; fulfilled request count; feature usage (exports, analytics) | Candidate for spotlights/testimonials; admin can flag as featured org or top donor |
| Any → Inactive | No login 90+ days; user requests deletion; admin suspends/removes account | Clerk `last_sign_in` timestamp; admin delete action; user self-service deletion request | Data anonymized per privacy policy; transactions kept for tax compliance; Clerk account deactivated |

---

## Test Matrix

Use this checklist to verify each user type at each stage:

### Anonymous
- [ ] Can view homepage, requests, about, campaigns
- [ ] "For Organizations" button opens sign-in modal
- [ ] "Login" button opens sign-in modal
- [ ] Cannot access `/donor/*`, `/cbo/*`, `/admin/*` (redirects to sign-in)

### New User (Post Sign-Up)
- [ ] Role Selection Modal appears and cannot be dismissed
- [ ] Selecting "I want to give" creates donor profile
- [ ] Selecting "I need support" creates CBO profile
- [ ] Onboarding modal appears after role selection
- [ ] Profile created with `onboarding_complete: false`, `verification_status: 'unverified'`

### Donor (Onboarded)
- [ ] Dashboard loads with stats and request list
- [ ] Can filter/search requests
- [ ] Can claim a request and go through checkout
- [ ] Profile page shows correct info
- [ ] Impact page shows donation history
- [ ] Documents page allows tax receipt download
- [ ] Support page is accessible
- [ ] Cannot access `/cbo/*` or `/admin/*`

### CBO (Onboarded, Awaiting Verification)
- [ ] Dashboard loads
- [ ] Can create new requests
- [ ] Can edit organization profile
- [ ] Can view request status
- [ ] Review pending message displayed

### CBO (Verified)
- [ ] Full dashboard with stats
- [ ] All request management features work
- [ ] Stripe Connect integration available
- [ ] Document management works
- [ ] Analytics section populated

### Admin
- [ ] Dashboard dropdown shows Admin/Donor/CBO options
- [ ] Admin dashboard shows platform-wide stats
- [ ] Users page loads with full user list
- [ ] Can filter users by type and verification status
- [ ] Can update user type, verification status, org tier
- [ ] Can delete users with full cleanup
- [ ] Can impersonate users
- [ ] Impersonation banner shows when active
- [ ] Admin routes blocked for non-admin users

### Active — Casual
- [ ] Donor: Can browse and make an occasional donation
- [ ] Donor: Impact page shows limited history (1-2 donations)
- [ ] CBO: Dashboard functional with few or no active requests
- [ ] CBO: Profile may be incomplete — no errors or broken states
- [ ] Platform handles sparse data gracefully (empty states, zero counts)

### Active — Regular
- [ ] Donor: Multiple donations visible in impact page with trends
- [ ] Donor: Tax documents available for download
- [ ] Donor: Cause area filters returning relevant requests
- [ ] CBO: Multiple requests in various statuses (open, claimed, fulfilled)
- [ ] CBO: Stripe Connect active and receiving funds
- [ ] CBO: Analytics section shows meaningful data
- [ ] Admin: Weekly review workflow smooth (verify orgs, review flags)

### Active — Power User
- [ ] Donor: Full impact history, annual tax summaries, multiple cause areas
- [ ] Donor: All dashboard features used and rendering correctly at scale
- [ ] CBO: Many fulfilled requests, complete org profile, active campaigns
- [ ] CBO: Documents, analytics, and settings all populated and functional
- [ ] Admin: Impersonation works across user types
- [ ] Admin: Data export generates correct CSVs
- [ ] Admin: User management performant with large user list

### Inactive (Churned)
- [ ] Dormant account still accessible after 90+ days of no activity
- [ ] Previous data (donations, requests, profiles) intact for dormant users
- [ ] CBO: Stale open requests visible to admin for cleanup
- [ ] Re-engagement possible without re-onboarding (dormant users)
- [ ] Deleted account: user cannot sign in
- [ ] Deleted account: personal data removed, donations anonymized
- [ ] Deleted account: CBO requests closed/archived
- [ ] Platform aggregate stats unaffected by deletions
