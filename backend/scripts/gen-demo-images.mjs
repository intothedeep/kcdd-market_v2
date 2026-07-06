#!/usr/bin/env node
/**
 * gen-demo-images.mjs — self-hosted SVG demo assets (editorial redesign).
 *
 * Regenerates every /demo-images/*.svg the seed already references, in a clean
 * editorial "dark-navy banner" style (category eyebrow + bold title + impact
 * metric + green funding line + byline), replacing the earlier "mesh gradient +
 * #n + truncated title" covers.
 *
 * Pure + re-runnable: this only WRITES SVG files at the paths seed.sql already
 * points to — it does NOT mutate seed.sql, so there are no image-URL changes to
 * re-apply. Re-run any time after tweaking the design:
 *
 *   run from backend/:  node scripts/gen-demo-images.mjs
 *
 * The filenames are the contract with backend/supabase/seed.sql:
 *   cover-camp-<1..13>.svg   1200×400  campaign hero banner
 *   cover-org-<slug>.svg     1200×400  org profile hero band
 *   logo-<slug>.svg          256×256   org + team monogram avatar
 *   cover-<1..6>.svg         1200×400  org-update post thumbnail (textless)
 *
 * (supersedes the old gen-demo-covers.mjs, which was a one-shot seed migration.)
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('../frontend-vite/public/demo-images')
fs.mkdirSync(OUT, { recursive: true })

const BG = '#0d1117'
const TITLE_FILL = '#e6edf3'
const METRIC_FILL = '#8b949e'
const FUND_FILL = '#3fb950'
const BYLINE_FILL = '#6e7681'
const FONTS = "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', Roboto, sans-serif"

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── Campaign hero banners: cover-camp-<n>.svg (n matches seed order) ──────────
const CAMPAIGNS = [
  { accent: '#4f8bff', eyebrow: 'EDUCATION · DIGITAL ACCESS', title: ['Laptops for the Roots', 'After-School Program'], metric: '25 refurbished laptops for after-school study', funding: 'Goal $12,000   ·   a weekday middle-school cohort', byline: 'Amara Johnson  ·  Program Director  ·  Connecting Roots' },
  { accent: '#2dd4bf', eyebrow: 'DIGITAL LITERACY · OUTREACH', title: ['Digital Futures', 'Mobile Lab'], metric: 'A retrofitted van + 15 laptop workstations', funding: 'Goal $45,000   ·   4 Northland community centers', byline: 'Devon Park  ·  Executive Director  ·  Digital Futures KC' },
  { accent: '#f59e0b', eyebrow: 'WORKFORCE · RE-ENTRY', title: ['Workforce', 'Computer Lab'], metric: 'A 12-station job-readiness computer lab', funding: 'Goal $18,000   ·   80–90 adults trained / year', byline: 'Lin Chen  ·  Programs Lead  ·  KC Tech Bridge' },
  { accent: '#f472b6', eyebrow: 'ARTS · YOUTH', title: ['Arts Studio Tablets', 'for Roots Teens'], metric: '10 iPad + Apple Pencil bundles for teens', funding: 'Goal $5,000   ·   Saturday teen arts studio', byline: 'Amara Johnson  ·  Program Director  ·  Connecting Roots' },
  { accent: '#34d399', eyebrow: 'HOUSING STABILITY · CONNECTIVITY', title: ['Stay-Connected Phones', 'for Housing Stability'], metric: '50 prepaid smartphones + 6 months of service', funding: 'Goal $6,500   ·   housing-stability caseload', byline: 'Devon Park  ·  Executive Director  ·  Digital Futures KC' },
  { accent: '#4f8bff', eyebrow: 'EDUCATION · CS CLUBS', title: ['CS Club Laptops for', 'Northland Middle'], metric: '20 refurbished laptops for weekly coding clubs', funding: 'Goal $8,000   ·   3 middle schools share one cart', byline: 'Maya Okafor  ·  Executive Director  ·  Northland Code' },
  { accent: '#22d3ee', eyebrow: 'ROBOTICS · STEM', title: ['Robotics Kits for', 'Northland Middle'], metric: '15 classroom kits for FIRST LEGO League', funding: 'Goal $9,000   ·   from clubs to competition', byline: 'Maya Okafor  ·  Executive Director  ·  Northland Code' },
  { accent: '#f472b6', eyebrow: 'SCHOLARSHIPS · YOUTH', title: ['Summer Code Camp', 'Scholarships 2026'], metric: '30 full scholarships to a 2-week code camp', funding: 'Goal $6,000   ·   40% enroll in fall CS', byline: 'Maya Okafor  ·  Executive Director  ·  Northland Code' },
  { accent: '#f59e0b', eyebrow: 'REFURBISHING · DIGITAL EQUITY', title: ['Refurb-to-Home:', '500 Devices for KC'], metric: 'Wipe, repair & place 500 donated laptops', funding: 'Goal $40,000   ·   ~$80 makes one home-ready', byline: 'Samuel Reyes  ·  Founder & Director  ·  Heartland Device Bank' },
  { accent: '#34d399', eyebrow: 'CONNECTIVITY · SCHOOLS', title: ['Student Hotspot', 'Lending Library'], metric: '100 LTE hotspots lent out like library books', funding: 'Goal $7,000   ·   closing the homework gap', byline: 'Samuel Reyes  ·  Founder & Director  ·  Heartland Device Bank' },
  { accent: '#a78bfa', eyebrow: 'VOLUNTEERS · REPAIR', title: ['Repair Bench Tools', 'for the Volunteer Corps'], metric: '6 fully-outfitted volunteer repair stations', funding: 'Goal $5,000   ·   doubles refurb throughput', byline: 'Samuel Reyes  ·  Founder & Director  ·  Heartland Device Bank' },
  { accent: '#2dd4bf', eyebrow: 'DIGITAL EQUITY · FAMILIES', title: ['200 Home Laptops', 'for KC Families'], metric: 'Refurbish & place 200 laptops from our waitlist', funding: 'Goal $16,000   ·   ~$80 moves one family online', byline: 'Tariq Hassan  ·  Executive Director  ·  KC Connect Hub' },
  { accent: '#fb7185', eyebrow: 'DIGITAL NAVIGATION · COACHING', title: ['Grow the Digital', 'Navigator Corps'], metric: '8 bilingual navigators coaching families 1-on-1', funding: 'Goal $9,000   ·   hardware is half the answer', byline: 'Tariq Hassan  ·  Executive Director  ·  KC Connect Hub' },
]

// ── Organizations: cover-org-<slug>.svg + logo-<slug>.svg ────────────────────
const ORGS = [
  { slug: 'connecting-roots-kc', initials: 'CR', brand: '#2E7D32', accent: '#4ade80', eyebrow: 'NONPROFIT 501(c)(3)  ·  KANSAS CITY  ·  EST. 2017', tagline: 'Growing digital equity, one youth at a time.' },
  { slug: 'kc-tech-bridge', initials: 'TB', brand: '#1565C0', accent: '#60a5fa', eyebrow: 'NONPROFIT 501(c)(3)  ·  KANSAS CITY  ·  EST. 2019', tagline: 'Connecting communities to opportunity through technology.' },
  { slug: 'digital-futures-kc', initials: 'DF', brand: '#6A1B9A', accent: '#c084fc', eyebrow: 'NONPROFIT 501(c)(3)  ·  KANSAS CITY  ·  EST. 2015', tagline: 'Technology for every stage of life.' },
  { slug: 'northland-code-coalition', initials: 'NC', brand: '#00695C', accent: '#2dd4bf', eyebrow: 'NONPROFIT 501(c)(3)  ·  NORTHLAND KC  ·  EST. 2020', tagline: 'Every kid north of the river deserves a keyboard.' },
  { slug: 'heartland-device-bank', initials: 'HD', brand: '#E65100', accent: '#fb923c', eyebrow: 'NONPROFIT 501(c)(3)  ·  GREATER KC  ·  EST. 2016', tagline: 'One refurbished device. One open door.' },
  { slug: 'kc-connect-hub', initials: 'CH', brand: '#00838F', accent: '#22d3ee', eyebrow: 'NONPROFIT 501(c)(3)  ·  KC URBAN CORE  ·  EST. 2018', tagline: 'Plug every neighbor into opportunity.' },
]

// ── Monogram logos: org short-name aliases + team members ────────────────────
const LOGOS = [
  // org short-name aliases referenced by campaign content logo_url
  { slug: 'connecting-roots', initials: 'CR', brand: '#2E7D32' },
  { slug: 'digital-futures', initials: 'DF', brand: '#6A1B9A' },
  // team members — tinted with their org's brand color
  { slug: 'amara-diallo', initials: 'AD', brand: '#2E7D32' },
  { slug: 'luis-mendoza', initials: 'LM', brand: '#2E7D32' },
  { slug: 'priya-nair', initials: 'PN', brand: '#2E7D32' },
  { slug: 'marcus-bell', initials: 'MB', brand: '#6A1B9A' },
  { slug: 'jasmine-carter', initials: 'JC', brand: '#6A1B9A' },
  { slug: 'daniel-okeke', initials: 'DO', brand: '#6A1B9A' },
  { slug: 'samuel-reyes', initials: 'SR', brand: '#E65100' },
  { slug: 'grace-liu', initials: 'GL', brand: '#E65100' },
  { slug: 'tom-becker', initials: 'TB', brand: '#E65100' },
  { slug: 'tariq-hassan', initials: 'TH', brand: '#00838F' },
  { slug: 'rosa-martinez', initials: 'RM', brand: '#00838F' },
  { slug: 'james-whitfield', initials: 'JW', brand: '#00838F' },
]

// Accents for the 6 textless org-update post thumbnails (cover-1..6.svg)
const POST_ACCENTS = ['#4f8bff', '#2dd4bf', '#a78bfa', '#f59e0b', '#f472b6', '#34d399']

const W = 1200
const H = 400
const M = 64 // left margin

function campaignSvg(c) {
  const titleLines = c.title
    .map((line, i) => `  <text x="${M}" y="${158 + i * 56}" font-family="${FONTS}" font-size="48" font-weight="800" letter-spacing="-0.5" fill="${TITLE_FILL}">${esc(line)}</text>`)
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title.join(' '))}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="6" fill="${c.accent}"/>
  <text x="${M}" y="74" font-family="${FONTS}" font-size="23" font-weight="700" letter-spacing="3" fill="${c.accent}">${esc(c.eyebrow)}</text>
${titleLines}
  <text x="${M}" y="300" font-family="${FONTS}" font-size="25" font-weight="400" fill="${METRIC_FILL}">${esc(c.metric)}</text>
  <text x="${M}" y="340" font-family="${FONTS}" font-size="25" font-weight="700" fill="${FUND_FILL}">${esc(c.funding)}</text>
  <text x="${M}" y="378" font-family="${FONTS}" font-size="21" font-weight="400" fill="${BYLINE_FILL}">${esc(c.byline)}</text>
</svg>
`
}

function orgCoverSvg(o) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.slug)} cover">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="6" fill="${o.accent}"/>
  <text x="1150" y="330" text-anchor="end" font-family="${FONTS}" font-size="300" font-weight="800" fill="#ffffff" opacity="0.05">${esc(o.initials)}</text>
  <text x="${M}" y="152" font-family="${FONTS}" font-size="23" font-weight="700" letter-spacing="3" fill="${o.accent}">${esc(o.eyebrow)}</text>
  <text x="${M}" y="226" font-family="${FONTS}" font-size="36" font-weight="700" letter-spacing="-0.5" fill="${TITLE_FILL}">${esc(o.tagline)}</text>
</svg>
`
}

function monogramSvg(o) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${esc(o.slug)}">
  <rect width="256" height="256" rx="36" fill="${o.brand}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="${FONTS}" font-size="118" font-weight="800" letter-spacing="-2" fill="#ffffff">${esc(o.initials)}</text>
</svg>
`
}

function postSvg(accent, i) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="post thumbnail ${i}">
  <defs><filter id="s${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="80"/></filter></defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <g filter="url(#s${i})" opacity="0.22">
    <circle cx="980" cy="80" r="180" fill="${accent}"/>
    <circle cx="230" cy="360" r="220" fill="${accent}"/>
  </g>
  <rect width="${W}" height="5" fill="${accent}"/>
</svg>
`
}

let count = 0
CAMPAIGNS.forEach((c, i) => {
  fs.writeFileSync(path.join(OUT, `cover-camp-${i + 1}.svg`), campaignSvg(c))
  count++
})
for (const o of ORGS) {
  fs.writeFileSync(path.join(OUT, `cover-org-${o.slug}.svg`), orgCoverSvg(o))
  fs.writeFileSync(path.join(OUT, `logo-${o.slug}.svg`), monogramSvg(o))
  count += 2
}
for (const l of LOGOS) {
  fs.writeFileSync(path.join(OUT, `logo-${l.slug}.svg`), monogramSvg(l))
  count++
}
POST_ACCENTS.forEach((a, i) => {
  fs.writeFileSync(path.join(OUT, `cover-${i + 1}.svg`), postSvg(a, i + 1))
  count++
})
console.log(`Generated ${count} editorial demo SVGs → ${OUT}`)
