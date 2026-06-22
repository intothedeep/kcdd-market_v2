/**
 * Campaign Approval State Machine
 *
 * Phase A, Task A3 — original module.
 * Phase REFB (2026-06-16) — `campaigns.approval_status` was dropped. The
 * lifecycle state is now DERIVED from `campaign_details` rows. The TRANSITIONS
 * lookup table + `nextState()` are gone with it. Route handlers compute the
 * current state via `getCampaignState(supabase, campaignId)` and pick the
 * action themselves (DRAFT/REJECTED → submit_initial, ACTIVE → submit_edit).
 *
 * Pure module: no Express, no logging, no IO except via an injected
 * `supabase` client passed by the caller. Every function returns
 * deterministic output given identical inputs.
 *
 * Public surface:
 *   - STATES, ACTIONS                       — constants kept for callers.
 *   - getCampaignState(supabase, campaignId) — derives state from details rows.
 *   - synthesizeDedupeKey({ kind, entity_id, version })
 *   - getAdminUserIds(supabase)
 *   - emitNotification(supabase, params)
 */

// Lifecycle states. DELETED is the sentinel value returned when
// campaigns.deleted_at IS NOT NULL — it short-circuits every transition.
// ARCHIVED was dropped pending a follow-up — soft-delete via campaigns.deleted_at
// covers the only post-REFB use case.
export const STATES = Object.freeze({
  DRAFT: 'draft',
  PENDING_INITIAL_APPROVAL: 'pending_initial_approval',
  ACTIVE: 'active',
  PENDING_EDIT_APPROVAL: 'pending_edit_approval',
  REJECTED: 'rejected',
  DELETED: 'deleted',
})

// Actions a route handler can request. Kept as a stable vocabulary even
// though TRANSITIONS is gone — callers still use these strings as labels
// when logging / fanning out notifications.
export const ACTIONS = Object.freeze({
  SUBMIT_INITIAL: 'submit_initial',
  SUBMIT_EDIT: 'submit_edit',
  APPROVE: 'approve',
  REJECT: 'reject',
})

/**
 * Derive the campaign's current lifecycle state from its campaign_details rows.
 *
 * Decision table (latest = highest `version`):
 *   campaigns.deleted_at IS NOT NULL            → DELETED  (short-circuits)
 *   no detail rows                              → DRAFT
 *   latest.status = pending_initial_approval    → PENDING_INITIAL_APPROVAL
 *   latest.status = pending_edit_approval       → PENDING_EDIT_APPROVAL
 *   latest.status = rejected AND has_approved=F → REJECTED
 *   has_approved = TRUE                         → ACTIVE
 *
 * Edge: an approved detail exists but the latest detail is rejected. Donor
 * still sees the last approved snapshot, so semantically the campaign is
 * ACTIVE. The decision table above lands on ACTIVE for that case because
 * the `has_approved=T` branch fires before any "latest=rejected" check.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} campaignId
 * @returns {Promise<string>} one of STATES.*
 */
export async function getCampaignState(supabase, campaignId) {
  if (!campaignId) {
    throw new Error('getCampaignState: campaignId is required')
  }

  // Soft-delete short-circuit: a deleted campaign returns DELETED regardless
  // of its detail rows. Done as a separate round-trip (cheap PK lookup) so
  // every other branch in this function keeps its pre-existing semantics.
  const { data: campaignRow, error: campaignErr } = await supabase
    .from('campaigns')
    .select('deleted_at')
    .eq('id', campaignId)
    .maybeSingle()
  if (campaignErr) throw campaignErr
  if (campaignRow?.deleted_at) return STATES.DELETED

  // Single round-trip: latest detail row + a boolean "any approved exists".
  // PostgREST does not expose SQL subqueries via the JS client, so we issue
  // two simple queries in parallel. Both hit the same partial / composite
  // indexes from REFA1 (idx_campaign_details_campaign_status_version).
  const [latestRes, approvedRes] = await Promise.all([
    supabase
      .from('campaign_details')
      .select('status, version')
      .eq('campaign_id', campaignId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('campaign_details')
      .select('id', { head: true, count: 'exact' })
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .limit(1),
  ])

  if (latestRes.error) throw latestRes.error
  if (approvedRes.error) throw approvedRes.error

  const latest = latestRes.data
  const hasApproved = (approvedRes.count ?? 0) > 0

  if (!latest) return STATES.DRAFT

  if (latest.status === 'pending_initial_approval') {
    return STATES.PENDING_INITIAL_APPROVAL
  }
  if (latest.status === 'pending_edit_approval') {
    return STATES.PENDING_EDIT_APPROVAL
  }
  if (hasApproved) return STATES.ACTIVE
  if (latest.status === 'rejected') return STATES.REJECTED
  // Defensive: detail row present but not in any of the buckets above
  // (e.g. an unexpected `draft` status). Treat as DRAFT.
  return STATES.DRAFT
}

/**
 * Synthesize the deterministic dedupe_key used by the notifications
 * partial UNIQUE index `(recipient_clerk_user_id, dedupe_key)`.
 *
 * Format: `"<kind>:<entity_id>:<version>"`.
 *
 * @param {object} params
 * @param {string} params.kind
 * @param {string} params.entity_id
 * @param {number|string} params.version
 * @returns {string}
 * @throws {Error} when any required field is missing.
 */
export function synthesizeDedupeKey({ kind, entity_id, version } = {}) {
  if (!kind) throw new Error('synthesizeDedupeKey: kind is required')
  if (!entity_id) throw new Error('synthesizeDedupeKey: entity_id is required')
  if (version === undefined || version === null) {
    throw new Error('synthesizeDedupeKey: version is required')
  }
  return `${kind}:${entity_id}:${version}`
}

/**
 * Resolve the set of admin Clerk user IDs for fan-out.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<string[]>}
 */
export async function getAdminUserIds(supabase) {
  const { data, error } = await supabase.from('user_profiles').select('id').eq('user_type', 'admin')

  if (error) throw error
  return (data ?? []).map((row) => row.id)
}

/**
 * Insert one notification row, idempotent under the partial UNIQUE
 * `(recipient_clerk_user_id, dedupe_key)` index. Duplicate emits
 * (Postgres 23505) are swallowed and treated as success.
 *
 * `dedupe_key` is synthesized from kind/entity_id/version.
 * `payload` defaults to `{}`. `link_url` is optional but recommended
 * for actionable kinds.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 * @param {string} params.recipient_clerk_user_id
 * @param {string} params.kind
 * @param {string} params.entity_type
 * @param {string} params.entity_id
 * @param {number|string} params.version
 * @param {object} [params.payload]
 * @param {string} [params.link_url]
 * @returns {Promise<{inserted: boolean}>}
 */
export async function emitNotification(supabase, params) {
  const {
    recipient_clerk_user_id,
    kind,
    entity_type,
    entity_id,
    version,
    payload = {},
    link_url = null,
  } = params

  if (!recipient_clerk_user_id) {
    throw new Error('emitNotification: recipient_clerk_user_id is required')
  }
  if (!kind) throw new Error('emitNotification: kind is required')
  if (!entity_type) throw new Error('emitNotification: entity_type is required')
  if (!entity_id) throw new Error('emitNotification: entity_id is required')

  const dedupe_key = synthesizeDedupeKey({ kind, entity_id, version })

  const { error } = await supabase.from('notifications').insert({
    recipient_clerk_user_id,
    kind,
    entity_type,
    entity_id,
    dedupe_key,
    payload,
    link_url,
  })

  if (error) {
    if (error.code === '23505') {
      // Duplicate emit — partial UNIQUE index hit. No-op.
      return { inserted: false }
    }
    throw error
  }
  return { inserted: true }
}
