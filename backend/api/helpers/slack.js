// A6-S1 / Phase A6 — Slack notification helpers
//
// enqueueSlackAlert  — insert/upsert into slack_notification_queue (service role)
// postToSlack        — POST to Slack Incoming Webhook with 3-attempt backoff
// formatPayload      — convert (event, payload) to Slack Block Kit body
//
// Dev mode (SLACK_WEBHOOK_URL unset): postToSlack returns OK and logs
// to console without making a network request — so dev/test flows can
// exercise the queue end-to-end without a real webhook.

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Upsert a Slack alert into the queue. Same dedupeKey while pending = single row.
 *
 * @param {object} args
 * @param {string} args.event       e.g. 'campaign_edit_submitted'
 * @param {string} args.dedupeKey   e.g. `campaign_edit_submitted:<id>:<user>`
 * @param {object} args.payload     JSON serializable payload body
 * @param {string} [args.channel]   defaults to 'admin'
 */
export async function enqueueSlackAlert({ event, dedupeKey, payload, channel = 'admin' }) {
  // Upsert: if a pending row with the same dedupe_key exists, refresh its payload
  // and queued_at so the cron flush picks up the latest state ("last write wins").
  const { error } = await supabaseAdmin.from('slack_notification_queue').upsert(
    {
      dedupe_key: dedupeKey,
      channel,
      payload: { ...payload, event },
      status: 'pending',
      queued_at: new Date().toISOString(),
    },
    { onConflict: 'dedupe_key', ignoreDuplicates: false }
  )
  // ignoreDuplicates:false + onConflict will UPDATE on conflict. However the
  // partial UNIQUE index is WHERE status='pending', so non-pending rows do
  // NOT conflict — a previously-sent row with the same dedupe_key will not
  // block a new enqueue. This is the intended behavior.
  if (error) {
    console.error('[slack] enqueue error:', error)
    throw error
  }
}

/**
 * POST a Slack Block Kit body to the configured webhook with 3-attempt
 * exponential backoff (1s / 4s / 16s). Returns { ok: true } or throws
 * after final failure with cumulative error.
 *
 * Dev mode: SLACK_WEBHOOK_URL unset -> log to console + return ok.
 */
export async function postToSlack(slackBody) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) {
    console.log('[slack:dev]', JSON.stringify(slackBody))
    return { ok: true, dev: true }
  }

  const delays = [1000, 4000, 16000]
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackBody),
      })
      if (res.ok) return { ok: true, attempt }
      lastError = new Error(`slack ${res.status}: ${await res.text().catch(() => '')}`)
    } catch (err) {
      lastError = err
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]))
    }
  }
  throw lastError ?? new Error('slack post failed')
}

/**
 * Convert a queue payload into a Slack Block Kit body.
 * Keep messages short — one alert = one line + a link.
 */
export function formatPayload(event, payload) {
  const titleByEvent = {
    campaign_submitted: 'New campaign submitted',
    campaign_edit_submitted: 'Campaign edit submitted',
    campaign_reported: 'Campaign reported',
    campaign_soft_deleted_by_owner: 'Campaign soft-deleted by owner',
  }
  const title = titleByEvent[event] || `Event: ${event}`
  const link = payload.link_url ? `<${payload.link_url}|View>` : '(no link)'
  const campaign =
    payload.campaign_title && payload.campaign_id
      ? `*${payload.campaign_title}* (${payload.campaign_id})`
      : payload.campaign_id || '(unknown campaign)'
  const actor = payload.actor_user_id ? `by \`${payload.actor_user_id}\`` : ''

  return {
    text: `${title}: ${campaign} ${actor} ${link}`.trim(),
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${title}*\n${campaign} ${actor}\n${link}`,
        },
      },
    ],
  }
}
