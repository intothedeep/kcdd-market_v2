/**
 * Payment Reconciliation Service
 *
 * Compares Stripe PaymentIntents against local `payment_transactions` rows
 * for a given time window and records any discrepancies.
 *
 * This module is intentionally framework-free (no Express, no env coupling):
 * it is reused by BOTH the admin-triggered reconciliation route and a possible
 * future cron route. Callers inject their own `supabase` (service-role) and
 * `stripe` clients so the same logic runs unchanged in either context.
 *
 * All monetary amounts are handled in integer cents end-to-end — no float math.
 */

const MAX_STRIPE_RECORDS = 5000
const STRIPE_PAGE_LIMIT = 100
const LOCAL_PAGE_SIZE = 1000
const DISCREPANCY_CHUNK = 500

/**
 * Convert an ISO string or Date into unix seconds for Stripe's `created` filter.
 */
function toUnixSeconds(value) {
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Math.floor(ms / 1000)
}

/**
 * Map a Stripe PaymentIntent status + a local transaction status to a coarse
 * bucket so we only flag genuine mismatches.
 *
 * Buckets: 'succeeded' | 'failed' | 'pending'
 */
function stripeStatusBucket(status) {
  if (status === 'succeeded') return 'succeeded'
  if (status === 'canceled' || status === 'requires_payment_method') return 'failed'
  // 'processing', 'requires_action', 'requires_confirmation', 'requires_capture'
  return 'pending'
}

function localStatusBucket(status) {
  if (status === 'succeeded') return 'succeeded'
  if (status === 'failed') return 'failed'
  return 'pending'
}

/**
 * Returns true when the Stripe and local statuses disagree in a way worth
 * flagging. Tolerates Stripe in-flight states vs local 'pending'.
 */
function isStatusMismatch(stripeStatus, localStatus) {
  const s = stripeStatusBucket(stripeStatus)
  const l = localStatusBucket(localStatus)
  if (s === l) return false
  // A Stripe-side 'pending' bucket is in-flight; tolerate against any local
  // state that is itself not yet terminal-disagreeing. Only flag when both
  // sides are terminal and disagree, or when one is terminal-succeeded vs a
  // terminal-failed on the other side.
  if (s === 'pending' || l === 'pending') return false
  return true
}

/**
 * Pull all Stripe PaymentIntents in [from, to], keyed by pi.id.
 * Returns { stripeMap, capped }.
 */
async function buildStripeMap(stripe, from, to) {
  const stripeMap = new Map()
  let processed = 0

  const iterator = stripe.paymentIntents.list({
    created: { gte: toUnixSeconds(from), lte: toUnixSeconds(to) },
    limit: STRIPE_PAGE_LIMIT,
    expand: ['data.latest_charge'],
  })

  for await (const pi of iterator) {
    processed += 1
    if (processed > MAX_STRIPE_RECORDS) {
      return { stripeMap, capped: true }
    }
    const charge =
      pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null
    stripeMap.set(pi.id, {
      status: pi.status,
      amount: pi.amount,
      application_fee_amount: charge?.application_fee_amount ?? null,
      charge_id: charge?.id ?? null,
    })
  }

  return { stripeMap, capped: false }
}

/**
 * Pull all local payment_transactions in [from, to], keyed by
 * stripe_payment_intent_id. Skips null PI ids. Returns { localMap }.
 */
async function buildLocalMap(supabase, from, to) {
  const localMap = new Map()
  let offset = 0

  for (;;) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(
        'stripe_payment_intent_id, stripe_charge_id, amount_total, platform_fee, organization_amount, status, donor_id, metadata'
      )
      .gte('created_at', new Date(from).toISOString())
      .lte('created_at', new Date(to).toISOString())
      .order('created_at', { ascending: true })
      .range(offset, offset + LOCAL_PAGE_SIZE - 1)

    if (error) throw new Error(`local query failed: ${error.message}`)
    if (!data || data.length === 0) break

    for (const row of data) {
      if (!row.stripe_payment_intent_id) continue
      localMap.set(row.stripe_payment_intent_id, row)
    }

    if (data.length < LOCAL_PAGE_SIZE) break
    offset += LOCAL_PAGE_SIZE
  }

  return { localMap }
}

/**
 * Classify a single PI present on both sides. Returns an array of discrepancy
 * objects (may be empty when fully matched).
 */
function classifyMatched(piId, stripeEntry, local) {
  const discrepancies = []

  if (isStatusMismatch(stripeEntry.status, local.status)) {
    discrepancies.push({
      payment_intent_id: piId,
      charge_id: stripeEntry.charge_id,
      type: 'STATUS_MISMATCH',
      our_value: JSON.stringify({ status: local.status }),
      stripe_value: JSON.stringify({ status: stripeEntry.status }),
      detail: { our_status: local.status, stripe_status: stripeEntry.status },
    })
  }

  if (local.amount_total !== stripeEntry.amount) {
    discrepancies.push({
      payment_intent_id: piId,
      charge_id: stripeEntry.charge_id,
      type: 'AMOUNT_MISMATCH',
      our_value: JSON.stringify({ amount_total: local.amount_total }),
      stripe_value: JSON.stringify({ amount: stripeEntry.amount }),
      detail: { our_amount_total: local.amount_total, stripe_amount: stripeEntry.amount },
    })
  }

  const bypassConnect = local.metadata?.diagnostics?.bypass_connect === true
  if (!bypassConnect && stripeEntry.application_fee_amount != null) {
    if (local.platform_fee !== stripeEntry.application_fee_amount) {
      discrepancies.push({
        payment_intent_id: piId,
        charge_id: stripeEntry.charge_id,
        type: 'FEE_MISMATCH',
        our_value: JSON.stringify({ platform_fee: local.platform_fee }),
        stripe_value: JSON.stringify({
          application_fee_amount: stripeEntry.application_fee_amount,
        }),
        detail: {
          our_platform_fee: local.platform_fee,
          stripe_application_fee_amount: stripeEntry.application_fee_amount,
        },
      })
    }
  }

  return discrepancies
}

/**
 * Build the full discrepancy list + matched_count from the two maps.
 */
function reconcileMaps(stripeMap, localMap) {
  const discrepancies = []
  let matchedCount = 0

  // PIs from Stripe: MISSING_LOCAL or matched/comparison.
  for (const [piId, stripeEntry] of stripeMap) {
    const local = localMap.get(piId)
    if (!local) {
      discrepancies.push({
        payment_intent_id: piId,
        charge_id: stripeEntry.charge_id,
        type: 'MISSING_LOCAL',
        our_value: null,
        stripe_value: JSON.stringify(stripeEntry),
        detail: { stripe: stripeEntry },
      })
      continue
    }
    const piDiscrepancies = classifyMatched(piId, stripeEntry, local)
    if (piDiscrepancies.length === 0) {
      matchedCount += 1
    } else {
      discrepancies.push(...piDiscrepancies)
    }
  }

  // PIs only in local: MISSING_STRIPE (excluding anonymous donors).
  for (const [piId, local] of localMap) {
    if (stripeMap.has(piId)) continue
    if (local.donor_id === 'anonymous') continue
    discrepancies.push({
      payment_intent_id: piId,
      charge_id: local.stripe_charge_id ?? null,
      type: 'MISSING_STRIPE',
      our_value: JSON.stringify({
        stripe_payment_intent_id: local.stripe_payment_intent_id,
        amount_total: local.amount_total,
        platform_fee: local.platform_fee,
        status: local.status,
      }),
      stripe_value: null,
      detail: {
        local: {
          stripe_payment_intent_id: local.stripe_payment_intent_id,
          amount_total: local.amount_total,
          platform_fee: local.platform_fee,
          organization_amount: local.organization_amount,
          status: local.status,
        },
      },
    })
  }

  return { discrepancies, matchedCount }
}

/**
 * Insert discrepancy rows in chunks, each tagged with run_id.
 */
async function insertDiscrepancies(supabase, runId, discrepancies) {
  for (let i = 0; i < discrepancies.length; i += DISCREPANCY_CHUNK) {
    const chunk = discrepancies.slice(i, i + DISCREPANCY_CHUNK).map((d) => ({
      run_id: runId,
      payment_intent_id: d.payment_intent_id,
      charge_id: d.charge_id,
      type: d.type,
      our_value: d.our_value,
      stripe_value: d.stripe_value,
      detail: d.detail,
    }))
    const { error } = await supabase.from('reconciliation_discrepancies').insert(chunk)
    if (error) throw new Error(`discrepancy insert failed: ${error.message}`)
  }
}

/**
 * Run a reconciliation pass over [from, to].
 *
 * @param {object} supabase - service-role Supabase client
 * @param {object} stripe   - configured Stripe SDK client
 * @param {object} opts
 * @param {string|Date} opts.from        - window start (inclusive)
 * @param {string|Date} opts.to          - window end (inclusive)
 * @param {string}      opts.triggeredBy - actor id recorded on the run
 * @param {string}      [opts.source]    - trigger_source ('admin' default)
 * @returns {Promise<{runId, status, stripe_count, local_count, matched_count, discrepancy_count}>}
 */
export async function runReconciliation(
  supabase,
  stripe,
  { from, to, triggeredBy, source = 'admin' }
) {
  const { data: runRow, error: runError } = await supabase
    .from('reconciliation_runs')
    .insert({
      window_from: new Date(from).toISOString(),
      window_to: new Date(to).toISOString(),
      triggered_by: triggeredBy,
      trigger_source: source,
      status: 'running',
    })
    .select('id')
    .single()

  if (runError) throw new Error(`failed to create reconciliation run: ${runError.message}`)
  const runId = runRow.id

  try {
    const { stripeMap, capped } = await buildStripeMap(stripe, from, to)

    if (capped) {
      await supabase
        .from('reconciliation_runs')
        .update({
          status: 'failed',
          error_message: 'record cap exceeded, narrow the window',
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
      return {
        runId,
        status: 'failed',
        stripe_count: stripeMap.size,
        local_count: 0,
        matched_count: 0,
        discrepancy_count: 0,
      }
    }

    const { localMap } = await buildLocalMap(supabase, from, to)
    const { discrepancies, matchedCount } = reconcileMaps(stripeMap, localMap)

    await insertDiscrepancies(supabase, runId, discrepancies)

    const summary = {
      stripe_count: stripeMap.size,
      local_count: localMap.size,
      matched_count: matchedCount,
      discrepancy_count: discrepancies.length,
    }

    const { error: updateError } = await supabase
      .from('reconciliation_runs')
      .update({
        ...summary,
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId)

    if (updateError)
      throw new Error(`failed to finalize reconciliation run: ${updateError.message}`)

    return { runId, status: 'completed', ...summary }
  } catch (err) {
    await supabase
      .from('reconciliation_runs')
      .update({
        status: 'failed',
        error_message: err.message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId)
    throw err
  }
}
