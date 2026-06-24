#!/usr/bin/env node
/**
 * Generate self-hosted demo image assets and rewrite seed.sql to use them.
 *
 * Replaces the external image hotlinks in backend/supabase/seed.sql
 * (images.unsplash.com covers/heroes + ui-avatars.com logos/avatars) with
 * locally-served SVGs under frontend-vite/public/demo-images/, so the demo
 * marketplace renders with ZERO external dependency (Unsplash availability /
 * rate-limits / ui-avatars uptime no longer matter).
 *
 *   ui-avatars URL  -> /demo-images/logo-<slug>.svg   (initials on the same bg color)
 *   unsplash URL    -> /demo-images/cover-<1..6>.svg  (gradient placeholder, round-robin)
 *
 * Idempotent: after a run the seed has no unsplash/ui-avatars URLs left, so a
 * re-run is a no-op. New rows added later with those hosts get converted on the
 * next run. Run from backend/:  node scripts/gen-demo-images.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const SEED = path.resolve('supabase/seed.sql')
const OUT = path.resolve('../frontend-vite/public/demo-images')
fs.mkdirSync(OUT, { recursive: true })

let sql = fs.readFileSync(SEED, 'utf8')

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const initials = (name) =>
  name
    .split(/[\s+]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const PALETTE = ['1565C0', '2E7D32', '6A1B9A', 'E65100', '00838F', '00695C', 'AD1457', '4527A0', '283593', '37474F']
function colorFromString(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

const logoSvg = (text, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${text}"><rect width="256" height="256" rx="36" fill="#${bg}"/><text x="50%" y="50%" dy=".34em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="108" font-weight="700" fill="#fff">${text}</text></svg>\n`

const COVER_PAIRS = [
  ['1565C0', '42A5F5'],
  ['2E7D32', '66BB6A'],
  ['6A1B9A', 'AB47BC'],
  ['E65100', 'FFA726'],
  ['00838F', '4DD0E1'],
  ['00695C', '4DB6AC'],
]
const coverSvg = ([c1, c2], i) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" role="img" aria-label="cover ${i}"><defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${c1}"/><stop offset="1" stop-color="#${c2}"/></linearGradient></defs><rect width="1200" height="400" fill="url(#g${i})"/><circle cx="980" cy="80" r="170" fill="#fff" opacity="0.08"/><circle cx="200" cy="360" r="240" fill="#fff" opacity="0.06"/></svg>\n`

// 1) logos — ui-avatars
const writtenLogos = new Set()
sql = sql.replace(
  /https:\/\/ui-avatars\.com\/api\/\?name=([^&'"\\]*)(?:&[^'"\\)]*)?/g,
  (full, nameParam) => {
    const name = decodeURIComponent(nameParam.replace(/\+/g, ' '))
    const slug = slugify(name)
    const bg = (full.match(/background=([0-9A-Fa-f]{6})/) || [])[1] || colorFromString(name)
    if (!writtenLogos.has(slug)) {
      fs.writeFileSync(path.join(OUT, `logo-${slug}.svg`), logoSvg(initials(name), bg))
      writtenLogos.add(slug)
    }
    return `/demo-images/logo-${slug}.svg`
  }
)

// 2) covers — unsplash (distinct URL -> rotating cover)
const coverAssign = new Map()
let n = 0
sql = sql.replace(/https:\/\/images\.unsplash\.com\/[^'"\s)]+/g, (full) => {
  if (!coverAssign.has(full)) coverAssign.set(full, (n++ % COVER_PAIRS.length) + 1)
  return `/demo-images/cover-${coverAssign.get(full)}.svg`
})
COVER_PAIRS.forEach((pair, i) => fs.writeFileSync(path.join(OUT, `cover-${i + 1}.svg`), coverSvg(pair, i + 1)))

fs.writeFileSync(SEED, sql)
console.log(`Wrote ${writtenLogos.size} logo SVGs + 6 cover SVGs to ${OUT}`)
console.log(`Rewrote ${coverAssign.size} distinct unsplash URLs + ${writtenLogos.size} logo URL groups in seed.sql`)
