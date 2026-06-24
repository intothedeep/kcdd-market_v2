#!/usr/bin/env node
/**
 * Backfill base64 (data:) image URLs into Supabase Storage.
 *
 * Background: before the storage image buckets were provisioned
 * (20260624000000_storage_image_buckets.sql), the frontend upload helpers fell
 * back to writing a base64 `data:<mime>;base64,...` string straight into the DB
 * column when the bucket was missing. Those rows bloat the table and never get a
 * real public URL. This one-shot, idempotent script migrates them to the
 * `organization-images` bucket and rewrites the column to the resulting public
 * URL.
 *
 * Targeted columns (the base64 fallback could have written these):
 *   organizations.logo_url
 *   organizations.cover_image_url
 * Scanned defensively (no base64 fallback existed on these paths, but harmless):
 *   donor_profiles.profile_picture_url
 *   user_profiles.profile_picture_url
 *
 * Idempotency: the WHERE filter only selects rows whose value LIKE 'data:%', so
 * already-migrated rows (now https URLs) are skipped on re-run.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/backfill-base64-images.mjs [--dry-run]
 *   (or via package.json: pnpm backfill:images  /  pnpm backfill:images:dry)
 *
 * Requires the SERVICE key (bypasses RLS) — never run with the publishable key.
 */

import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
const BUCKET = 'organization-images'
const BATCH_SIZE = 50

// table -> columns to scan. Each column is migrated independently.
const TARGETS = [
  { table: 'organizations', idColumn: 'id', columns: ['logo_url', 'cover_image_url'] },
  { table: 'donor_profiles', idColumn: 'id', columns: ['profile_picture_url'] },
  { table: 'user_profiles', idColumn: 'id', columns: ['profile_picture_url'] },
]

const MIME_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

/**
 * Parse a `data:<mime>;base64,<payload>` URL into { mime, buffer }.
 * Returns null if the string is not a base64 data URL we can decode.
 */
function parseDataUrl(value) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(value)
  if (!match) return null
  const mime = match[1].trim().toLowerCase()
  const payload = match[2]
  let buffer
  try {
    buffer = Buffer.from(payload, 'base64')
  } catch {
    return null
  }
  if (buffer.length === 0) return null
  return { mime, buffer }
}

function extForMime(mime) {
  return MIME_EXT[mime] || 'bin'
}

async function migrateColumn(supabase, { table, idColumn, column }, stats) {
  const { data: rows, error } = await supabase
    .from(table)
    .select(`${idColumn}, ${column}`)
    .like(column, 'data:%')
    .limit(BATCH_SIZE)

  if (error) {
    console.error(`  [${table}.${column}] select failed:`, error.message)
    stats.errors += 1
    return
  }
  if (!rows || rows.length === 0) {
    console.log(`  [${table}.${column}] 0 base64 rows`)
    return
  }

  console.log(`  [${table}.${column}] ${rows.length} base64 row(s) found`)

  for (const row of rows) {
    const id = row[idColumn]
    const value = row[column]
    const parsed = parseDataUrl(value)
    if (!parsed) {
      console.warn(`    ${table} ${id}: unparseable data URL, skipping`)
      stats.skipped += 1
      continue
    }

    stats.candidates += 1
    stats.bytes += parsed.buffer.length

    if (DRY_RUN) {
      console.log(
        `    [dry-run] ${table} ${id}.${column}: ${parsed.mime} ${parsed.buffer.length} bytes`
      )
      continue
    }

    const ext = extForMime(parsed.mime)
    const key = `backfill/${id}_${column}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(key, parsed.buffer, { contentType: parsed.mime, upsert: true })

    if (uploadError) {
      console.error(`    ${table} ${id}: upload failed: ${uploadError.message}`)
      stats.errors += 1
      continue
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(key)

    const { error: updateError } = await supabase
      .from(table)
      .update({ [column]: publicUrl })
      .eq(idColumn, id)

    if (updateError) {
      console.error(`    ${table} ${id}: update failed: ${updateError.message}`)
      stats.errors += 1
      continue
    }

    console.log(`    ${table} ${id}.${column} -> ${publicUrl}`)
    stats.migrated += 1
  }
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SECRET_KEY')

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(
    `base64 image backfill${DRY_RUN ? ' (DRY RUN — no writes)' : ''} -> bucket "${BUCKET}"`
  )

  const stats = { candidates: 0, bytes: 0, migrated: 0, skipped: 0, errors: 0 }

  for (const target of TARGETS) {
    console.log(`Scanning ${target.table}...`)
    for (const column of target.columns) {
      await migrateColumn(supabase, { ...target, column }, stats)
    }
  }

  console.log('---')
  if (DRY_RUN) {
    console.log(
      `Dry run: ${stats.candidates} candidate row(s), ${stats.bytes} byte(s) total. ` +
        `${stats.skipped} unparseable.`
    )
  } else {
    console.log(
      `Done: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} error(s), ` +
        `${stats.bytes} byte(s) processed.`
    )
  }

  if (stats.errors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
