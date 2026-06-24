#!/usr/bin/env node
/**
 * v2 demo covers — give every organization and campaign its OWN distinguishable
 * cover SVG (Option B "mesh" gradient + a label), replacing the 6 shared
 * cover-N.svg placeholders created by gen-demo-images.mjs.
 *
 *   org cover      -> /demo-images/cover-org-<slug>.svg    (initials + org name)
 *   campaign cover -> /demo-images/cover-camp-<n>.svg      (#n + campaign title)
 *
 * Logos (logo-<slug>.svg) are left untouched. The old shared cover-1..6.svg are
 * deleted (orphaned after this rewrite). Self-hosted: zero external dependency.
 *
 * Run from backend/:  node scripts/gen-demo-covers.mjs
 * NOTE: this changes seed image URLs -> re-apply to any DB via db:reset
 * (local) / db reset --linked (cloud), and redeploy the frontend.
 */

import fs from 'node:fs'
import path from 'node:path'

const SEED = path.resolve('supabase/seed.sql')
const OUT = path.resolve('../frontend-vite/public/demo-images')

let sql = fs.readFileSync(SEED, 'utf8')

const hash = (s) => {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
// base0, base1 (linear gradient) + 3 blob colors — picked as a set by hash
const SCHEMES = [
  ['0D47A1', '1976D2', '42A5F5', '00B8D4', '7C4DFF'],
  ['1B5E20', '2E7D32', '66BB6A', 'B2FF59', '00BFA5'],
  ['4A148C', '6A1B9A', 'AB47BC', 'E040FB', '536DFE'],
  ['BF360C', 'E64A19', 'FF8A65', 'FFCA28', 'FF7043'],
  ['006064', '00838F', '26C6DA', '64FFDA', '18FFFF'],
  ['880E4F', 'AD1457', 'EC407A', 'FF80AB', 'F50057'],
  ['1A237E', '283593', '5C6BC0', '8C9EFF', '00B0FF'],
  ['3E2723', '5D4037', 'A1887F', 'FFAB91', 'FF8A65'],
]

const pretty = (slug) =>
  slug
    .split('-')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')

const initialsOf = (label) =>
  label
    .split(/[\s+]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

function coverSvg(big, sub, key) {
  const [c0, c1, b1, b2, b3] = SCHEMES[hash(key) % SCHEMES.length]
  const h = hash(key + 'pos')
  const cx1 = 150 + (h % 300)
  const cx2 = 700 + ((h >> 3) % 350)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" role="img" aria-label="${esc(sub || big)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${c0}"/><stop offset="1" stop-color="#${c1}"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="1200" height="400" fill="url(#bg)"/>
  <g filter="url(#soft)" opacity="0.6">
    <circle cx="${cx1}" cy="90" r="190" fill="#${b1}"/>
    <circle cx="${cx2}" cy="360" r="240" fill="#${b2}"/>
    <circle cx="1080" cy="60" r="170" fill="#${b3}"/>
  </g>${
    big
      ? `\n  <g filter="url(#sh)" font-family="Arial,Helvetica,sans-serif" fill="#fff">
    <text x="64" y="208" font-size="116" font-weight="800">${esc(big)}</text>
    <text x="68" y="270" font-size="40" font-weight="600" opacity="0.96">${esc(truncate(sub, 38))}</text>
  </g>`
      : ''
  }
</svg>\n`
}

const written = []

// 1) ORG covers — pair logo_url (slug) with the adjacent cover_image_url
sql = sql.replace(
  /(logo_url\s*=\s*'\/demo-images\/logo-([a-z0-9-]+)\.svg',\s*cover_image_url\s*=\s*')\/demo-images\/cover-\d+\.svg/g,
  (m, pre, slug) => {
    const name = pretty(slug)
    const file = `cover-org-${slug}.svg`
    fs.writeFileSync(path.join(OUT, file), coverSvg(initialsOf(name), name, slug))
    written.push(file)
    return `${pre}/demo-images/${file}`
  }
)

// 2) CAMPAIGN covers — content.image_url, labelled by nearest preceding title
const orig = sql
let n = 0
sql = sql.replace(/('image_url',\s*')\/demo-images\/cover-\d+\.svg/g, (m, pre, offset) => {
  n += 1
  const before = orig.slice(0, offset)
  const tIdx = before.lastIndexOf("'title',")
  let title = `Campaign ${n}`
  if (tIdx !== -1) {
    const tm = /'title',\s*'((?:[^']|'')*)'/.exec(orig.slice(tIdx))
    if (tm) title = tm[1].replace(/''/g, "'")
  }
  const file = `cover-camp-${n}.svg`
  fs.writeFileSync(path.join(OUT, file), coverSvg(`#${n}`, title, file))
  written.push(file)
  return `${pre}/demo-images/${file}`
})

// 3) (re)generate the 6 shared cover-N.svg as plain textless mesh backgrounds —
//    still used by organization_updates.image_url (secondary post thumbnails)
for (let i = 1; i <= 6; i++) {
  fs.writeFileSync(path.join(OUT, `cover-${i}.svg`), coverSvg('', '', `plain-${i}`))
}

fs.writeFileSync(SEED, sql)
console.log(`Generated ${written.length} per-entity covers + 6 shared plain mesh backgrounds`)
