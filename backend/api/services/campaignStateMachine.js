/**
 * Campaign Approval State Machine
 *
 * Phase A, Task A3 — hand-rolled state transition module for the
 * `campaigns.approval_status` lifecycle. Mirrors the DB CHECK constraint
 * in `20260615000000_campaigns_approval_lifecycle.sql` and the transition
 * rules locked in `_docs/00.post-launch-feedback.architecture.md` (D2).
 *
 * Pure module: no Express, no logging, no IO except via an injected
 * `supabase` client passed by the caller. Every function returns
 * deterministic output given identical inputs.
 *
 * Public surface:
 *   - STATES, ACTIONS, TRANSITIONS
 *   - nextState(currentState, action)
 *   - synthesizeDedupeKey({ kind, entity_id, version })
 *   - getAdminUserIds(supabase)
 *   - emitNotification(supabase, params)
 */

// 6-state enum, mirrors the DB CHECK constraint exactly.
export const STATES = Object.freeze({
  DRAFT: 'draft',
  PENDING_INITIAL_APPROVAL: 'pending_initial_approval',
  ACTIVE: 'active',
  PENDING_EDIT_APPROVAL: 'pending_edit_approval',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
})

// Actions a route handler can request.
export const ACTIONS = Object.freeze({
  SUBMIT_INITIAL: 'submit_initial',
  SUBMIT_EDIT: 'submit_edit',
  APPROVE: 'approve',
  REJECT: 'reject',
  ARCHIVE: 'archive',
})

// Transition table: source state → action → next state.
// `pending_edit_approval + reject` reverts to `active` per the
// 2026-06-15 locked decision (Open question #2). Disallowed
// transitions are absent and cause nextState() to throw.
export const TRANSITIONS = Object.freeze({
  draft: {
    submit_initial: 'pending_initial_approval',
    archive: 'archived',
  },
  pending_initial_approval: {
    approve: 'active',
    reject: 'rejected',
  },
  active: {
    submit_edit: 'pending_edit_approval',
    archive: 'archived',
  },
  pending_edit_approval: {
    approve: 'active',
    reject: 'active',
  },
  rejected: {
    submit_initial: 'pending_initial_approval',
    archive: 'archived',
  },
  archived: {},
})

/**
 * Compute the next approval_status given the current status and an action.
 *
 * @param {string} currentState — value from `STATES`.
 * @param {string} action — value from `ACTIONS`.
 * @returns {string} next state.
 * @throws {Error} when the transition is not in `TRANSITIONS`.
 */
export function nextState(currentState, action) {
  const branch = TRANSITIONS[currentState]
  if (!branch) {
    throw new Error(`Unknown campaign state: "${currentState}"`)
  }
  const target = branch[action]
  if (!target) {
    throw new Error(
      `Invalid transition: action "${action}" is not allowed from state "${currentState}"`
    )
  }
  return target
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
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_type', 'admin')

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
