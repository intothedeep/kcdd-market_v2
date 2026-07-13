# Production Launch — Questions for the Project Owner

**Audience:** KC Digital Drive / Kansas City local government stakeholder(s)
**Purpose:** Decisions and confirmations required before KC Digital Drive Market can accept real donations in production.
**Prepared:** 2026-07-12 · Based on a 3-part production-readiness audit (deployment, security, testing/observability).

> Please answer or assign an owner to each item. Items marked **🚩 Blocker** gate go-live; the rest shape configuration and scope. Engineering-side blockers (code fixes) are tracked separately and are already in progress.

---

## A. Payments & Fund Flow

| # | Question | Why it matters | 🚩 |
|---|----------|----------------|----|
| A1 | Who legally **owns and operates the Stripe (live) account** — the City/agency entity, or KC Digital Drive as a separate nonprofit? | Determines the account under which real money is held and who is liable for chargebacks/disputes. | 🚩 |
| A2 | Confirm the **payout destination**: each CBO receives funds directly via their own Stripe Connect account (current design), correct? | If wrong, donations land in the platform account instead of the intended organization. | 🚩 |
| A3 | What is the **platform fee percentage** (if any) taken per donation? | Must be configured in `platform_settings` before launch; affects receipts and payouts. | 🚩 |
| A4 | What is the **refund policy** — who approves refunds, under what conditions, and within what window? | Refunds auto-reopen requests; policy must be defined before real charges occur. | |
| A5 | What are the **tax-receipt legal requirements**? Is the platform (or each CBO) a 501(c)(3), and must receipts carry specific IRS language / EIN? | Receipts are auto-generated as PDFs; wording and deductibility claims need legal sign-off. | 🚩 |
| A6 | Should donors be able to **donate anonymously**, or is an authenticated account always required? | Current campaign donation flow requires sign-in; changing this is a scoped feature, not a config toggle. | |

## B. Compliance & Legal

| # | Question | Why it matters | 🚩 |
|---|----------|----------------|----|
| B1 | What are the **government data-retention rules** for donation/payment records — how long must they be kept, and what is the deletion policy? | Affects DB retention and any purge jobs; government agencies often have statutory requirements. | |
| B2 | Is the current **PII handling** approved — storing donor emails and a salted IP hash on each transaction? Any data-minimization constraints? | Security posture and privacy policy must match the agency's data policy. | 🚩 |
| B3 | Beyond the existing WCAG 2.1 AA accessibility statement, is a formal **Section 508 / ADA sign-off** required before a public-sector launch? | Government sites typically require documented accessibility compliance; may need a formal audit. | 🚩 |
| B4 | Who performs the **legal review** of the Privacy Policy and Terms of Service, and by when? | Pages exist but need agency legal approval before public launch. | 🚩 |
| B5 | Where does **liability for CBO vetting** sit — the platform operator or the agency? What is the approval standard for admitting an organization? | The admin "vetting/approval" workflow enforces this; the standard must be defined by policy. | |

## C. Operations

| # | Question | Why it matters | 🚩 |
|---|----------|----------------|----|
| C1 | Who is the **operator / first administrator**? Provide 1–2 verified operator email addresses. | Required to bootstrap the first admin (`BOOTSTRAP_ADMIN_EMAILS`); grants full admin, so must be minimal and trusted. | 🚩 |
| C2 | What is the **incident / on-call** process — who responds to a payment outage, and through what channel? | No paging/monitoring is wired yet; ownership must be assigned. | |
| C3 | Which **Slack workspace and channel** should receive admin alerts (org edits, campaign submissions)? | Needed to issue the incoming-webhook URL for `SLACK_WEBHOOK_URL`. | |
| C4 | What is the expected **uptime / SLA**? Is best-effort acceptable at launch, or is a formal SLA required? | Drives hosting tier and monitoring investment. | |
| C5 | **Vercel Hobby vs Pro** — is budget approved for Pro? | Hobby caps cron at once/day (Slack alerts batch up to ~24h) and lacks team features; Pro enables near-real-time alerts and tighter cron. | |
| C6 | Is a **staging/preview environment** budgeted (a separate Supabase + Vercel project), or should we validate against production only? | Strongly recommended to smoke-test payments in Stripe test mode before touching live funds. | 🚩 |

## D. Scope & Launch

| # | Question | Why it matters | 🚩 |
|---|----------|----------------|----|
| D1 | **Soft launch** (limited CBO cohort) or **full public launch**? | Determines rollout risk and the initial data-seeding plan. | |
| D2 | Who is the **initial CBO cohort** (names/count) that will be onboarded first? | The public directory stays empty until real CBOs onboard and an admin approves them; we need the first set. | |
| D3 | Target **go-live date**? | Sets the schedule for blocker fixes, staging validation, and legal/accessibility sign-offs. | 🚩 |
| D4 | Any **branding / domain** requirements (custom domain, agency logo, notice banner text)? | Affects Vercel domain config, Clerk allowed origins, and content. | |

---

## Engineering-side blockers (for awareness — no owner action required)

These are code fixes the engineering team is resolving before go-live; listed so stakeholders understand the "not yet" answer:

1. **Startup safety guards** — force-disable the dev-only payment bypass in production, require a real IP-hash salt and cron secret at boot.
2. **Private document URLs** — CBO documents (501c3 certs, financials) must use expiring signed URLs, not permanent public links.
3. **Missing impact views** — the donor "impact" dashboard and public `/impact` page currently render zeros because their database views were never created; a migration adds them.
4. **Pre-production hardening** — remove debug detail from auth error responses; switch Stripe/Clerk from test keys to live keys.

**Not yet in place (post-launch hardening, not blockers):** automated test suite, error monitoring (e.g. Sentry), CI quality gates, and a readiness health probe.

---

*Full internal detail lives in `_docs/00.production-readiness.plan.md` (engineering, local-only). Deployment runbook: `docs/howtodeploy.prod.md`.*
