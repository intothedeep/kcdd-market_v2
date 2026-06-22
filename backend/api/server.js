/**
 * KCDD Market API Server
 *
 * Handles Stripe payment intents and webhooks
 *
 * Documentation:
 * - Express: https://expressjs.com/
 * - Stripe API: https://stripe.com/docs/api
 * - Stripe Webhooks: https://stripe.com/docs/webhooks
 */

import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { generateDonationReceipt, generateAnnualSummary } from './services/pdfGenerator.js'
import { clerkAuth } from './middleware/clerkAuth.js'
import usersRouter from './routes/users.js'
import { buildPaymentMetadata, appendLifecycle } from './helpers/paymentMetadata.js'
import { upsertDispute } from './helpers/disputes.js'
import { postToSlack, formatPayload, enqueueSlackAlert } from './helpers/slack.js'
import {
  STATES as CAMPAIGN_STATES,
  getCampaignState,
  getAdminUserIds,
  emitNotification,
} from './services/campaignStateMachine.js'

// Load environment variables
dotenv.config()

// Initialize Express
const app = express()
const PORT = process.env.PORT || 4000

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase (with service role key for admin access)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

// Parse JSON bodies (except for webhook route)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next()
  } else {
    express.json()(req, res, next)
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// Mount /api/users router (Clerk JWT required)
app.use('/api/users', clerkAuth, usersRouter)

// ============================================
// SEO ENDPOINTS (sitemap + public meta)
// ============================================
//
// Expose `campaigns.last_edit_approved_at` as the canonical "content updated"
// timestamp for crawlers. `last_edited_at` is intentionally NOT exposed (it
// leaks unapproved edit cadence). See architect decision 2026-06-15.

function escapeXml(s) {
  return String(s).replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[c]
  )
}

/**
 * GET /sitemap.xml
 * Public, no auth. Lists all donor-visible campaigns — i.e. those with at
 * least one approved campaign_details row and not soft-deleted. Uses
 * last_edit_approved_at (fallback created_at) for <lastmod>.
 */
app.get('/sitemap.xml', async (req, res) => {
  try {
    // Post-REFB: derive donor-visibility from an INNER JOIN on
    // campaign_details where status='approved'. PostgREST's `inner` hint
    // turns the embed into an INNER JOIN; the filter on the embed restricts
    // to approved rows. Duplicate rows (multiple approved versions per
    // campaign) are collapsed by slug in the JS Map below.
    const { data, error } = await supabase
      .from('campaigns')
      .select('slug, last_edit_approved_at, created_at, deleted_at, campaign_details!inner(status)')
      .eq('campaign_details.status', 'approved')
      .is('deleted_at', null)
    if (error) throw error
    const bySlug = new Map()
    for (const c of data ?? []) {
      if (!bySlug.has(c.slug)) bySlug.set(c.slug, c)
    }
    const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
    const urls = Array.from(bySlug.values())
      .map((c) => {
        const lastmod = c.last_edit_approved_at || c.created_at
        return `  <url>
    <loc>${escapeXml(`${base}/campaign/${c.slug}`)}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      })
      .join('\n')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
    res.set('Content-Type', 'application/xml')
    res.set('Cache-Control', 'public, max-age=300')
    res.send(xml)
  } catch (err) {
    console.error('sitemap error:', err)
    res.status(500).send('<?xml version="1.0"?><error/>')
  }
})

/**
 * GET /api/campaigns/:slug/public-meta
 * Tiny public-meta endpoint that returns { slug, last_edit_approved_at } and
 * sets HTTP `Last-Modified` header so crawlers can pick up the canonical
 * content-updated timestamp even though the SPA renders client-side.
 */
app.get('/api/campaigns/:slug/public-meta', async (req, res) => {
  try {
    // Post-REFB: donor-visibility = at least one approved detail row exists.
    // Inner-join via PostgREST and require status='approved'.
    const { data, error } = await supabase
      .from('campaigns')
      .select('slug, last_edit_approved_at, created_at, deleted_at, campaign_details!inner(status)')
      .eq('slug', req.params.slug)
      .eq('campaign_details.status', 'approved')
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle()
    if (error || !data) {
      return res.status(404).json({ error: 'Not found' })
    }
    const lm = new Date(data.last_edit_approved_at || data.created_at)
    res.set('Last-Modified', lm.toUTCString())
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ slug: data.slug, last_edit_approved_at: lm.toISOString() })
  } catch (err) {
    console.error('public-meta error:', err)
    res.status(500).json({ error: 'internal' })
  }
})

// ============================================
// STRIPE CONNECT ENDPOINTS
// ============================================

/**
 * Create Stripe Connect Account
 * POST /api/stripe/connect/create-account
 *
 * Body:
 * - organizationId: string
 * - userId: string (Clerk user ID)
 */
app.post('/api/stripe/connect/create-account', clerkAuth, async (req, res) => {
  try {
    const { organizationId, userId: _userId } = req.body

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' })
    }

    // Verify organization exists and belongs to user
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    // H5-D (L5): caller must own this organization
    if (org.user_id !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: 'caller does not own this organization' })
    }

    // Check if already has Stripe account
    if (org.stripe_account_id) {
      return res.status(400).json({
        error: 'Organization already has a Stripe account',
        accountId: org.stripe_account_id,
      })
    }

    // Create Express Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: org.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'non_profit',
      business_profile: {
        name: org.name,
        url: org.website || undefined,
      },
      metadata: {
        organization_id: organizationId,
        platform: 'kcdd_market',
      },
    })

    // Update organization with stripe_account_id
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_complete: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return res.status(500).json({ error: 'Failed to save Stripe account' })
    }

    console.log('Created Stripe Connect account:', account.id, 'for org:', organizationId)

    res.json({
      accountId: account.id,
      message: 'Stripe Connect account created successfully',
    })
  } catch (error) {
    console.error('Error creating Connect account:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Generate Stripe Connect Onboarding Link
 * POST /api/stripe/connect/onboarding-link
 *
 * Body:
 * - organizationId: string
 */
app.post('/api/stripe/connect/onboarding-link', clerkAuth, async (req, res) => {
  try {
    const { organizationId } = req.body

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' })
    }

    // Get organization's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id, user_id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    // H5-D (L5): caller must own this organization
    if (org.user_id !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: 'caller does not own this organization' })
    }

    if (!org.stripe_account_id) {
      return res.status(400).json({ error: 'No Stripe account found. Create one first.' })
    }

    // Create account link for onboarding
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: org.stripe_account_id,
      refresh_url: `${frontendUrl}/cbo/dashboard?stripe=refresh`,
      return_url: `${frontendUrl}/cbo/dashboard?stripe=complete`,
      type: 'account_onboarding',
    })

    console.log('Generated onboarding link for account:', org.stripe_account_id)

    res.json({
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    })
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get Stripe Connect Account Status
 * GET /api/stripe/connect/status/:organizationId
 */
app.get('/api/stripe/connect/status/:organizationId', clerkAuth, async (req, res) => {
  try {
    const { organizationId } = req.params

    // Get organization's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(
        'stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, user_id'
      )
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    // H5-D (L5): caller must own this organization (gate BEFORE write-back to row)
    if (org.user_id !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: 'caller does not own this organization' })
    }

    if (!org.stripe_account_id) {
      return res.json({
        connected: false,
        status: 'not_connected',
        message: 'No Stripe account connected',
      })
    }

    // Fetch current status from Stripe
    const account = await stripe.accounts.retrieve(org.stripe_account_id)

    // Update local database with latest status
    await supabase
      .from('organizations')
      .update({
        stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        stripe_connected_at: account.charges_enabled ? new Date().toISOString() : null,
      })
      .eq('id', organizationId)

    res.json({
      connected: true,
      accountId: org.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingComplete: account.details_submitted && account.charges_enabled,
      requirements: account.requirements,
    })
  } catch (error) {
    console.error('Error fetching Connect status:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// PAYMENT ENDPOINTS
// ============================================

/**
 * Create Payment Intent with Stripe Connect
 * POST /api/payments/create-intent
 *
 * Body:
 * - requestId: string
 * - amount: number (in cents)
 * - donorId: string (optional)
 *
 * Supports destination charges to transfer funds to connected accounts
 */
app.post('/api/payments/create-intent', clerkAuth, async (req, res) => {
  try {
    const { requestId } = req.body
    const donorId = req.auth.userId // from Clerk JWT, not client

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' })
    }

    // Verify request exists and get organization's Stripe account
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select(
        `
        *,
        organization:organizations(
          id, name, stripe_account_id, stripe_charges_enabled
        )
      `
      )
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check if organization can accept payments. Dev convenience:
    // STRIPE_BYPASS_CONNECT=true lets us run test-mode donations without
    // having a Connect account set up. Money goes to the platform balance
    // directly (no destination/application_fee). Test mode only.
    const bypassConnect = process.env.STRIPE_BYPASS_CONNECT === 'true'
    const org = request.organization
    if (!bypassConnect && (!org?.stripe_account_id || !org?.stripe_charges_enabled)) {
      return res.status(400).json({
        error: 'Organization not ready to accept payments',
        code: 'STRIPE_NOT_CONNECTED',
        message: 'This organization has not completed their payment setup.',
      })
    }

    // Get platform fee settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['stripe_platform_fee_percent', 'stripe_platform_fee_fixed_cents'])

    const feePercent = parseFloat(
      settings?.find((s) => s.key === 'stripe_platform_fee_percent')?.value || '2.9'
    )
    const feeFixed = parseInt(
      settings?.find((s) => s.key === 'stripe_platform_fee_fixed_cents')?.value || '30'
    )

    // Canonical amount: requests.amount is in dollars in the DB — never trust client body
    const amountCents = Math.round(Number(request.amount) * 100)
    const platformFee = Math.round(amountCents * (feePercent / 100)) + feeFixed
    const organizationAmount = amountCents - platformFee

    // Create payment intent. When Connect is set up, route via destination
    // charge to the org. In bypass mode (dev/test only) just create a direct
    // PaymentIntent against the platform account.
    const intentParams = {
      amount: amountCents,
      currency: 'usd',
      metadata: {
        requestId,
        organizationId: org.id,
        organizationName: org.name,
        donorId: donorId || 'anonymous',
        platformFee: platformFee.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      description: `Donation for: ${request.description}`,
    }
    if (!bypassConnect) {
      intentParams.application_fee_amount = platformFee
      intentParams.transfer_data = { destination: org.stripe_account_id }
    }
    const paymentIntent = await stripe.paymentIntents.create(intentParams)

    // Create payment transaction record
    const { error: txError } = await supabase.from('payment_transactions').insert({
      request_id: requestId,
      organization_id: org.id,
      donor_id: donorId || 'anonymous',
      stripe_payment_intent_id: paymentIntent.id,
      amount_total: amountCents,
      platform_fee: platformFee,
      organization_amount: organizationAmount,
      status: 'pending',
      metadata: buildPaymentMetadata({
        paymentIntent,
        kind: 'request',
        targetSnapshot: {
          request_id: requestId,
          organization_name_snapshot: org.name,
        },
        req,
      }),
    })

    if (txError) {
      console.error('Error creating transaction record:', txError)
      // Don't fail the request, just log the error
    }

    console.log('Created payment intent:', {
      id: paymentIntent.id,
      amount: amountCents / 100,
      platformFee: platformFee / 100,
      orgAmount: organizationAmount / 100,
      destination: org.stripe_account_id,
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        total: amountCents,
        platformFee,
        organizationAmount,
      },
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Create Payment Intent for Campaign Donation
 * POST /api/payments/create-campaign-intent
 *
 * Auth required (clerkAuth). donor_id is taken from the verified Clerk JWT,
 * never from the request body — accepting client-supplied donorId would let
 * an anonymous attacker pollute Stripe immutable metadata under any user id.
 *
 * Body:
 * - campaignId: string
 * - amount: number (in cents)
 *
 * Supports destination charges to transfer funds to connected accounts.
 * TODO: if anonymous campaign donations are needed, add a separate explicit
 * route — do NOT relax this auth gate.
 */
// NOTE: campaign amounts are donor-chosen by design — client-supplied amount is intentional here.
app.post('/api/payments/create-campaign-intent', clerkAuth, async (req, res) => {
  try {
    const { campaignId, amount } = req.body
    const donorId = req.auth.userId // from Clerk JWT, not client

    if (!campaignId || !amount) {
      return res.status(400).json({ error: 'Missing campaignId or amount' })
    }

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum donation is $1 (100 cents)' })
    }

    // Verify campaign exists and get organization's Stripe account
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        organization:organizations(
          id, name, stripe_account_id, stripe_charges_enabled
        )
      `
      )
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Post-REFB: campaigns has no title column. Pull the title (and any
    // other content fields needed for receipts / metadata) from the
    // latest approved campaign_details row. `maybeSingle()` returns null
    // when no approved detail exists yet; we fall back to a stable label.
    const { data: campaignDetail } = await supabase
      .from('campaign_details')
      .select('content')
      .eq('campaign_id', campaign.id)
      .eq('status', 'approved')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    const campaignTitle = campaignDetail?.content?.title || 'Untitled campaign'

    // Check if organization can accept payments. Dev convenience:
    // STRIPE_BYPASS_CONNECT=true lets us run test-mode donations without
    // having a Connect account set up. Money goes to the platform balance
    // directly (no destination/application_fee). Test mode only.
    const bypassConnect = process.env.STRIPE_BYPASS_CONNECT === 'true'
    const org = campaign.organization
    if (!bypassConnect && (!org?.stripe_account_id || !org?.stripe_charges_enabled)) {
      return res.status(400).json({
        error: 'Organization not ready to accept payments',
        code: 'STRIPE_NOT_CONNECTED',
        message: 'This organization has not completed their payment setup.',
      })
    }

    // Get platform fee settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['stripe_platform_fee_percent', 'stripe_platform_fee_fixed_cents'])

    const feePercent = parseFloat(
      settings?.find((s) => s.key === 'stripe_platform_fee_percent')?.value || '2.9'
    )
    const feeFixed = parseInt(
      settings?.find((s) => s.key === 'stripe_platform_fee_fixed_cents')?.value || '30'
    )

    // Calculate platform fee (amount is already in cents)
    const amountCents = Math.round(amount)
    const platformFee = Math.round(amountCents * (feePercent / 100)) + feeFixed
    const organizationAmount = amountCents - platformFee

    // Create payment intent. When Connect is set up, route via destination
    // charge to the org. In bypass mode (dev/test only) just create a direct
    // PaymentIntent against the platform account.
    const intentParams = {
      amount: amountCents,
      currency: 'usd',
      metadata: {
        campaignId,
        campaignTitle,
        organizationId: org?.id || '',
        organizationName: org?.name || '',
        donorId: donorId || 'anonymous',
        platformFee: platformFee.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      description: `Campaign donation: ${campaignTitle}`,
    }
    if (!bypassConnect) {
      intentParams.application_fee_amount = platformFee
      intentParams.transfer_data = { destination: org.stripe_account_id }
    }
    const paymentIntent = await stripe.paymentIntents.create(intentParams)

    // Create payment transaction record
    const { error: txError } = await supabase.from('payment_transactions').insert({
      campaign_id: campaignId,
      organization_id: org?.id || null,
      donor_id: donorId || 'anonymous',
      stripe_payment_intent_id: paymentIntent.id,
      amount_total: amountCents,
      platform_fee: platformFee,
      organization_amount: organizationAmount,
      status: 'pending',
      metadata: buildPaymentMetadata({
        paymentIntent,
        kind: 'campaign',
        targetSnapshot: {
          campaign_slug: campaign.slug,
          campaign_title_snapshot: campaignTitle,
          organization_name_snapshot: org?.name || null,
        },
        req,
        donorId,
      }),
    })

    if (txError) {
      console.error('Error creating transaction record:', txError)
      // Don't fail the request, just log the error
    }

    console.log('Created campaign payment intent:', {
      id: paymentIntent.id,
      campaignId,
      amount: amountCents / 100,
      platformFee: platformFee / 100,
      orgAmount: organizationAmount / 100,
      destination: org?.stripe_account_id || '(bypass)',
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        total: amountCents,
        platformFee,
        organizationAmount,
      },
    })
  } catch (error) {
    console.error('Error creating campaign payment intent:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Stripe Webhook Handler
 * POST /api/payments/webhook
 *
 * Handles Stripe webhook events
 */
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Event routing.
  //
  // RPC_HANDLED events have their stripe_events dedup INSERT performed
  // INSIDE a SECURITY DEFINER RPC together with their side-effect writes
  // (see 20260617000004_process_stripe_event_rpc.sql). This guarantees
  // dedup + writes commit/rollback together; a mid-handler crash no
  // longer leaves a dedup row that blocks Stripe's retry.
  //
  // For non-RPC events (Connect, dispute open/withdraw/reinstate) we keep
  // the legacy pattern: pre-INSERT the dedup row, then dispatch. Those
  // handlers are simple enough that splitting the dedup INSERT from the
  // handler body is acceptable.
  const RPC_HANDLED = new Set([
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'charge.dispute.closed',
  ])

  if (!RPC_HANDLED.has(event.type)) {
    const { error: dedupError } = await supabase
      .from('stripe_events')
      .insert({ event_id: event.id, event_type: event.type, payload: event })
    if (dedupError) {
      if (dedupError.code === '23505') {
        // duplicate event_id — Stripe is retrying; we already processed it
        return res.json({ received: true, duplicate: true })
      }
      console.error('Failed to record stripe_event:', dedupError)
      // Continue anyway — we'd rather double-process than drop. Idempotency
      // is best-effort if the events table itself is unavailable.
    }
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const { requestId, campaignId, organizationId, donorId } = pi.metadata || {}
        const lifecycleEntry = {
          at: new Date().toISOString(),
          event: 'payment_intent.succeeded',
          event_id: event.id,
        }
        const { error: rpcError } = await supabase.rpc('process_payment_succeeded', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_payload: event,
          p_payment_intent_id: pi.id,
          p_amount_cents: pi.amount,
          p_charge_id: pi.latest_charge || null,
          p_request_id: requestId || null,
          p_campaign_id: campaignId || null,
          p_organization_id: organizationId || null,
          p_donor_id: donorId || null,
          p_lifecycle_entry: lifecycleEntry,
        })
        if (rpcError) {
          if (rpcError.code === '23505') {
            return res.json({ received: true, duplicate: true })
          }
          throw new Error(`process_payment_succeeded RPC failed: ${rpcError.message}`)
        }
        console.log('Payment succeeded:', {
          paymentIntentId: pi.id,
          requestId: requestId || campaignId,
          amount: pi.amount / 100,
        })
        // Non-transactional follow-up: tax receipt PDF. Network + storage
        // upload cannot live inside the Postgres txn; a flaky receipt
        // generator must not block money tracking.
        try {
          const receipt = await generateAndStoreReceipt(pi)
          if (receipt) {
            console.log('Auto-generated receipt:', receipt.receipt_number)
          }
        } catch (receiptError) {
          console.error('Error auto-generating receipt:', receiptError)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const errorMessage = pi.last_payment_error?.message || 'Payment failed'
        const lifecycleEntry = {
          at: new Date().toISOString(),
          event: 'payment_intent.payment_failed',
          event_id: event.id,
          error_message: pi.last_payment_error?.message || null,
        }
        const { error: rpcError } = await supabase.rpc('process_payment_failed', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_payload: event,
          p_payment_intent_id: pi.id,
          p_error_message: errorMessage,
          p_lifecycle_entry: lifecycleEntry,
        })
        if (rpcError) {
          if (rpcError.code === '23505') {
            return res.json({ received: true, duplicate: true })
          }
          throw new Error(`process_payment_failed RPC failed: ${rpcError.message}`)
        }
        console.log('Payment failed:', {
          paymentIntentId: pi.id,
          error: pi.last_payment_error,
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        // charge.refunded's data.object is a Charge, not a PaymentIntent. The PI ID
        // lives on charge.payment_intent.
        const newStatus =
          charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded'
        const lifecycleEntry = {
          at: new Date().toISOString(),
          event: 'charge.refunded',
          event_id: event.id,
        }
        const { error: rpcError } = await supabase.rpc('process_charge_refunded', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_payload: event,
          p_payment_intent_id: charge.payment_intent,
          p_charge_id: charge.id,
          p_new_status: newStatus,
          p_lifecycle_entry: lifecycleEntry,
        })
        if (rpcError) {
          if (rpcError.code === '23505') {
            return res.json({ received: true, duplicate: true })
          }
          throw new Error(`process_charge_refunded RPC failed: ${rpcError.message}`)
        }
        console.log('Charge refunded:', {
          chargeId: charge.id,
          amount: charge.amount_refunded / 100,
        })
        break
      }

      // Stripe Connect events
      case 'account.updated':
        await handleAccountUpdated(event.data.object)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object)
        break

      case 'charge.dispute.created': {
        const dispute = event.data.object
        await upsertDispute(supabase, dispute)
        await supabase
          .from('payment_transactions')
          .update({ status: 'disputed', error_message: `Dispute opened: ${dispute.reason}` })
          .eq('stripe_payment_intent_id', dispute.payment_intent)
        await appendLifecycle(supabase, dispute.payment_intent, {
          at: new Date().toISOString(),
          event: 'charge.dispute.created',
          event_id: event.id,
          dispute_id: dispute.id,
          reason: dispute.reason,
        })
        break
      }

      case 'charge.dispute.funds_withdrawn': {
        const dispute = event.data.object
        await upsertDispute(supabase, dispute)
        // status stays 'disputed' — funds withdrawn is a sub-state, not the resolution
        await appendLifecycle(supabase, dispute.payment_intent, {
          at: new Date().toISOString(),
          event: 'charge.dispute.funds_withdrawn',
          event_id: event.id,
          dispute_id: dispute.id,
        })
        break
      }

      case 'charge.dispute.funds_reinstated': {
        const dispute = event.data.object
        await upsertDispute(supabase, dispute)
        // funds back but dispute may still be open — don't flip to 'succeeded' yet;
        // wait for .closed with outcome
        await appendLifecycle(supabase, dispute.payment_intent, {
          at: new Date().toISOString(),
          event: 'charge.dispute.funds_reinstated',
          event_id: event.id,
          dispute_id: dispute.id,
        })
        break
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object
        // upsertDispute is non-transactional bookkeeping on the disputes
        // table; run it before the RPC so the disputes row exists even if
        // the RPC's PK dedup raises (duplicate Stripe delivery).
        await upsertDispute(supabase, dispute)
        const newStatus =
          dispute.status === 'won'
            ? 'dispute_won'
            : dispute.status === 'lost'
              ? 'dispute_lost'
              : 'disputed'
        const isDisputeLost = newStatus === 'dispute_lost'

        // H3-C: partial-dispute semantics. Stripe lets cardholders dispute
        // any subset of the original charge; dispute.amount can be < the
        // original. We always decrement amount_raised by the disputed
        // amount (the money really is gone), but only decrement
        // supporters_count when the ENTIRE charge was disputed — a partial
        // dispute means the donor still successfully contributed some
        // money, so they remain a supporter. Look up the original charge
        // amount via payment_transactions.amount_total (cents) keyed on
        // the payment_intent.
        let isFullDispute = true
        if (isDisputeLost) {
          const { data: tx } = await supabase
            .from('payment_transactions')
            .select('amount_total')
            .eq('stripe_payment_intent_id', dispute.payment_intent)
            .single()
          if (tx && typeof tx.amount_total === 'number') {
            isFullDispute = (dispute.amount || 0) === tx.amount_total
          }
        }

        const lifecycleEntry = {
          at: new Date().toISOString(),
          event: 'charge.dispute.closed',
          event_id: event.id,
          dispute_id: dispute.id,
          outcome: dispute.status,
          is_full_dispute: isDisputeLost ? isFullDispute : null,
        }
        const { error: rpcError } = await supabase.rpc('process_dispute_closed', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_payload: event,
          p_payment_intent_id: dispute.payment_intent,
          p_dispute_amount_cents: dispute.amount || 0,
          p_new_status: newStatus,
          p_is_dispute_lost: isDisputeLost,
          p_is_full_dispute: isFullDispute,
          p_lifecycle_entry: lifecycleEntry,
        })
        if (rpcError) {
          if (rpcError.code === '23505') {
            return res.json({ received: true, duplicate: true })
          }
          throw new Error(`process_dispute_closed RPC failed: ${rpcError.message}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// WEBHOOK HANDLERS
// ============================================

// Note: handlers for payment_intent.succeeded, payment_intent.payment_failed,
// and charge.refunded now live in Postgres as SECURITY DEFINER RPCs
// (see 20260617000004_process_stripe_event_rpc.sql). Side effects + the
// stripe_events dedup row commit/rollback together.

// Stripe Connect webhook handlers
async function handleAccountUpdated(account) {
  console.log('Stripe account updated:', account.id)

  // Update organization's Stripe status
  const { error } = await supabase
    .from('organizations')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
      stripe_connected_at: account.charges_enabled ? new Date().toISOString() : null,
    })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Error updating organization Stripe status:', error)
  }

  // Log the event
  await supabase.from('stripe_connect_events').insert({
    stripe_event_id: `account_${account.id}_${Date.now()}`,
    event_type: 'account.updated',
    stripe_account_id: account.id,
    data: {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    },
    processed: true,
  })
}

async function handleAccountDeauthorized(account) {
  console.log('Stripe account deauthorized:', account.id)

  // Mark organization as disconnected
  await supabase
    .from('organizations')
    .update({
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_onboarding_complete: false,
    })
    .eq('stripe_account_id', account.id)
}

async function handleTransferCreated(transfer) {
  console.log('Transfer created:', {
    id: transfer.id,
    amount: transfer.amount / 100,
    destination: transfer.destination,
  })

  // Update payment transaction with transfer ID
  if (transfer.source_transaction) {
    await supabase
      .from('payment_transactions')
      .update({
        stripe_transfer_id: transfer.id,
      })
      .eq('stripe_charge_id', transfer.source_transaction)
  }
}

// ============================================
// CAMPAIGN APPROVAL LIFECYCLE ENDPOINTS
// ============================================
// Phase A, Task A3 — state machine routes for the campaigns
// approval lifecycle. Backed by `services/campaignStateMachine.js`.
// Notifications are written to the `notifications` table with a
// synthesized dedupe_key so duplicate emits are no-ops.

/**
 * Submit a draft / new edit for admin review.
 * POST /api/campaigns/:id/submit-edit
 *
 * Auth: Clerk JWT — caller must own the campaign's organization.
 * Body: { content: object, change_summary: string|null }
 *   `content` is the JSONB content blob for `campaign_details.content`
 *   (title, description, story, etc.). The frontend posts the full
 *   proposed content for this version.
 *
 * Behavior (post-REFB; campaign state is DERIVED from campaign_details):
 *   - DRAFT / REJECTED → action=submit_initial, new detail status=pending_initial_approval
 *   - ACTIVE           → action=submit_edit,    new detail status=pending_edit_approval
 *   - otherwise        → 409 INVALID_TRANSITION (edit already pending, etc.)
 *
 * Side effects:
 *   1. INSERT campaign_details row (version = max+1).
 *   2. UPDATE campaigns.last_edited_at  (NO campaign-level state column anymore).
 *   3. Fan-out notifications to every admin user.
 */
app.post('/api/campaigns/:id/submit-edit', clerkAuth, async (req, res) => {
  try {
    const campaignId = req.params.id
    const callerUserId = req.auth.userId
    const { content, change_summary = null } = req.body || {}

    if (!content || typeof content !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid content' })
    }

    // 1. Load campaign + owning organization for auth. Title is read from the
    //    submitted content (campaigns row no longer carries it).
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, organization_id, organizations(user_id)')
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const orgOwner = campaign.organizations?.user_id
    if (!orgOwner || orgOwner !== callerUserId) {
      return res.status(403).json({ error: 'Forbidden: not the campaign owner' })
    }

    // 2. Derive current state from campaign_details rows.
    const currentState = await getCampaignState(supabase, campaignId)

    if (currentState === CAMPAIGN_STATES.DELETED) {
      return res.status(409).json({
        error: 'Cannot submit edit on a deleted campaign',
        code: 'CAMPAIGN_DELETED',
        currentState,
      })
    }

    // 3. Resolve detail status from current state.
    let detailStatus
    if (currentState === CAMPAIGN_STATES.DRAFT || currentState === CAMPAIGN_STATES.REJECTED) {
      detailStatus = 'pending_initial_approval'
    } else if (currentState === CAMPAIGN_STATES.ACTIVE) {
      detailStatus = 'pending_edit_approval'
    } else {
      return res.status(409).json({
        error: `Cannot submit edit from state "${currentState}"`,
        code: 'INVALID_TRANSITION',
        currentState,
      })
    }

    // 4. Compute next version.
    const { data: maxRow, error: maxErr } = await supabase
      .from('campaign_details')
      .select('version')
      .eq('campaign_id', campaignId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (maxErr) throw maxErr
    const nextVersion = (maxRow?.version ?? 0) + 1

    // 5. INSERT campaign_details row.
    const { data: detail, error: insertErr } = await supabase
      .from('campaign_details')
      .insert({
        campaign_id: campaignId,
        version: nextVersion,
        content,
        changed_by: callerUserId,
        change_summary,
        status: detailStatus,
      })
      .select('id, version')
      .single()

    if (insertErr) throw insertErr

    // 6. UPDATE campaigns.last_edited_at. No campaign-level state column to set.
    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({ last_edited_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (updateErr) throw updateErr

    // 7. Fan-out notifications to admins. Title is sourced from the submitted
    //    content (campaigns row no longer carries it).
    const campaignTitle =
      (content && typeof content.title === 'string' ? content.title : null) ?? null
    try {
      const adminIds = await getAdminUserIds(supabase)
      await Promise.all(
        adminIds.map((adminId) =>
          emitNotification(supabase, {
            recipient_clerk_user_id: adminId,
            kind: 'campaign_edit_pending',
            entity_type: 'campaign_detail',
            entity_id: detail.id,
            version: detail.version,
            payload: {
              campaign_id: campaignId,
              campaign_title: campaignTitle,
            },
            link_url: `/admin/pending-edits/${campaignId}`,
          })
        )
      )
    } catch (notifyErr) {
      // Notification failures must not break the submission flow.
      console.error('Error fanning out submit-edit notifications:', notifyErr)
    }

    // 8. Enqueue Slack alert for admins (A6-S2). Initial vs edit is derived from
    //    detailStatus (already authoritative). Slack failure must NOT break the
    //    submit-edit flow — wrap in try/catch and swallow.
    try {
      const isInitial = detailStatus === 'pending_initial_approval'
      const event = isInitial ? 'campaign_submitted' : 'campaign_edit_submitted'
      const dedupeKey = isInitial
        ? `campaign_submitted:${campaignId}`
        : `campaign_edit_submitted:${campaignId}:${callerUserId}`
      await enqueueSlackAlert({
        event,
        dedupeKey,
        payload: {
          campaign_id: campaignId,
          campaign_title: campaignTitle,
          actor_user_id: callerUserId,
          link_url: `${process.env.APP_URL || ''}/admin/pending-edits`,
          occurred_at: new Date().toISOString(),
        },
      })
    } catch (slackErr) {
      console.error('[slack] enqueue submit-edit failed:', slackErr)
    }

    // Derived next state after a successful submit:
    //   submit_initial → pending_initial_approval
    //   submit_edit    → pending_edit_approval
    const newState =
      detailStatus === 'pending_initial_approval'
        ? CAMPAIGN_STATES.PENDING_INITIAL_APPROVAL
        : CAMPAIGN_STATES.PENDING_EDIT_APPROVAL

    return res.json({
      detail_id: detail.id,
      version: detail.version,
      status: newState,
    })
  } catch (err) {
    console.error('Error in submit-edit:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Approve a pending campaign detail.
 * POST /api/admin/campaigns/:campaignId/details/:detailId/approve
 *
 * Auth: Clerk JWT — caller must have user_profiles.user_type='admin'.
 * Body: none.
 *
 * Side effects (post-REFB):
 *   - UPDATE detail row: approved + approved_by + approved_at.
 *   - UPDATE campaign: last_edit_approved_at=now(),
 *     first_approved_at=COALESCE(first_approved_at, now()).
 *     (NO approval_status / published_detail_id columns anymore.)
 *   - Emit notification to CBO (campaigns.created_by).
 *
 * Response: { status: 'active' } — derived state after a successful approve
 *   on a pending_* detail is always ACTIVE.
 */
app.post(
  '/api/admin/campaigns/:campaignId/details/:detailId/approve',
  clerkAuth,
  async (req, res) => {
    try {
      const { campaignId, detailId } = req.params
      const callerUserId = req.auth.userId

      // 1. Admin auth.
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', callerUserId)
        .single()
      if (profileErr || !profile || profile.user_type !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: admin only' })
      }

      // 2. Load detail + campaign.
      const { data: detail, error: detailErr } = await supabase
        .from('campaign_details')
        .select('id, campaign_id, version, status, content')
        .eq('id', detailId)
        .single()
      if (detailErr || !detail) {
        return res.status(404).json({ error: 'Detail not found' })
      }
      if (detail.campaign_id !== campaignId) {
        return res.status(400).json({ error: 'Detail does not belong to campaign' })
      }

      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('id, slug, created_by, first_approved_at')
        .eq('id', campaignId)
        .single()
      if (campErr || !campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // 3. Verify state from the detail rows themselves: only valid from a
      //    pending_* derived state.
      const currentState = await getCampaignState(supabase, campaignId)
      if (currentState === CAMPAIGN_STATES.DELETED) {
        return res.status(409).json({
          error: 'Cannot approve a deleted campaign',
          code: 'CAMPAIGN_DELETED',
          currentState,
        })
      }
      if (
        currentState !== CAMPAIGN_STATES.PENDING_INITIAL_APPROVAL &&
        currentState !== CAMPAIGN_STATES.PENDING_EDIT_APPROVAL
      ) {
        return res.status(409).json({
          error: `Cannot approve from state "${currentState}"`,
          code: 'INVALID_TRANSITION',
          currentState,
        })
      }

      const nowIso = new Date().toISOString()
      const isFirstApproval = !campaign.first_approved_at

      // 4. UPDATE detail row.
      const { error: detailUpdErr } = await supabase
        .from('campaign_details')
        .update({
          status: 'approved',
          approved_by: callerUserId,
          approved_at: nowIso,
        })
        .eq('id', detailId)
      if (detailUpdErr) throw detailUpdErr

      // 5. UPDATE campaign timestamps. No state column to set.
      //    first_approved_at uses COALESCE-style: only write it when NULL.
      const campaignPatch = { last_edit_approved_at: nowIso }
      if (isFirstApproval) {
        campaignPatch.first_approved_at = nowIso
      }
      const { error: campUpdErr } = await supabase
        .from('campaigns')
        .update(campaignPatch)
        .eq('id', campaignId)
      if (campUpdErr) throw campUpdErr

      // 6. Notify CBO. Title comes from the approved detail's content.
      const campaignTitle =
        detail.content && typeof detail.content.title === 'string' ? detail.content.title : null
      try {
        if (campaign.created_by) {
          await emitNotification(supabase, {
            recipient_clerk_user_id: campaign.created_by,
            kind: isFirstApproval ? 'campaign_first_approved' : 'campaign_edit_approved',
            entity_type: 'campaign',
            entity_id: campaign.id,
            version: detail.version,
            payload: {
              campaign_id: campaign.id,
              campaign_title: campaignTitle,
            },
            link_url: `/campaign/${campaign.slug}`,
          })
        }
      } catch (notifyErr) {
        console.error('Error notifying CBO of approval:', notifyErr)
      }

      return res.json({ status: CAMPAIGN_STATES.ACTIVE })
    } catch (err) {
      console.error('Error in detail approve:', err)
      return res.status(500).json({ error: err.message })
    }
  }
)

/**
 * Reject a pending campaign detail.
 * POST /api/admin/campaigns/:campaignId/details/:detailId/reject
 *
 * Auth: Clerk JWT — admin only.
 * Body: { review_note: string }  (required, min length 1)
 *
 * Side effects (post-REFB):
 *   - UPDATE detail: rejected + approved_by + approved_at + review_note.
 *   - Campaign row is NOT mutated (no state column to set; the last
 *     approved detail continues to be the donor-visible one).
 *   - Emit `campaign_edit_rejected` notification to the CBO.
 *
 * Response: { status } — derived state AFTER the reject.
 *   pending_edit_approval    → ACTIVE       (prior approved detail stays live)
 *   pending_initial_approval → REJECTED
 */
app.post(
  '/api/admin/campaigns/:campaignId/details/:detailId/reject',
  clerkAuth,
  async (req, res) => {
    try {
      const { campaignId, detailId } = req.params
      const callerUserId = req.auth.userId
      const reviewNote = typeof req.body?.review_note === 'string' ? req.body.review_note : ''

      if (!reviewNote || reviewNote.trim().length < 1) {
        return res.status(400).json({ error: 'review_note is required' })
      }

      // 1. Admin auth.
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', callerUserId)
        .single()
      if (profileErr || !profile || profile.user_type !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: admin only' })
      }

      // 2. Load detail + campaign.
      const { data: detail, error: detailErr } = await supabase
        .from('campaign_details')
        .select('id, campaign_id, version, status, content')
        .eq('id', detailId)
        .single()
      if (detailErr || !detail) {
        return res.status(404).json({ error: 'Detail not found' })
      }
      if (detail.campaign_id !== campaignId) {
        return res.status(400).json({ error: 'Detail does not belong to campaign' })
      }

      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .select('id, created_by')
        .eq('id', campaignId)
        .single()
      if (campErr || !campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // 3. Verify derived state — only valid from pending_*.
      const beforeState = await getCampaignState(supabase, campaignId)
      if (beforeState === CAMPAIGN_STATES.DELETED) {
        return res.status(409).json({
          error: 'Cannot reject a deleted campaign',
          code: 'CAMPAIGN_DELETED',
          currentState: beforeState,
        })
      }
      if (
        beforeState !== CAMPAIGN_STATES.PENDING_INITIAL_APPROVAL &&
        beforeState !== CAMPAIGN_STATES.PENDING_EDIT_APPROVAL
      ) {
        return res.status(409).json({
          error: `Cannot reject from state "${beforeState}"`,
          code: 'INVALID_TRANSITION',
          currentState: beforeState,
        })
      }

      const nowIso = new Date().toISOString()

      // 4. UPDATE detail row.
      const { error: detailUpdErr } = await supabase
        .from('campaign_details')
        .update({
          status: 'rejected',
          approved_by: callerUserId,
          approved_at: nowIso,
          review_note: reviewNote,
        })
        .eq('id', detailId)
      if (detailUpdErr) throw detailUpdErr

      // 5. Compute the derived state AFTER the reject.
      //    pending_edit_approval → ACTIVE (prior approved detail still exists)
      //    pending_initial_approval → REJECTED (no approved detail exists)
      const afterState =
        beforeState === CAMPAIGN_STATES.PENDING_EDIT_APPROVAL
          ? CAMPAIGN_STATES.ACTIVE
          : CAMPAIGN_STATES.REJECTED

      // 6. Notify CBO. Title sourced from the rejected detail's content.
      const campaignTitle =
        detail.content && typeof detail.content.title === 'string' ? detail.content.title : null
      try {
        if (campaign.created_by) {
          await emitNotification(supabase, {
            recipient_clerk_user_id: campaign.created_by,
            kind: 'campaign_edit_rejected',
            entity_type: 'campaign',
            entity_id: campaign.id,
            version: detail.version,
            payload: {
              campaign_id: campaign.id,
              campaign_title: campaignTitle,
              review_note: reviewNote,
            },
            link_url: `/dashboard/campaigns/${campaign.id}`,
          })
        }
      } catch (notifyErr) {
        console.error('Error notifying CBO of rejection:', notifyErr)
      }

      return res.json({ status: afterState })
    } catch (err) {
      console.error('Error in detail reject:', err)
      return res.status(500).json({ error: err.message })
    }
  }
)

// ============================================
// CAMPAIGN SOFT-DELETE ENDPOINTS
// ============================================
// SOFT-DEL task — campaign soft-delete (CBO + admin) and admin restore.
// Soft-deleted campaigns return state `deleted` from the state machine and
// are excluded from the public RLS SELECT policy. campaign_details rows are
// preserved for audit + restore.

/**
 * Soft-delete a campaign.
 * POST /api/campaigns/:id/soft-delete
 *
 * Auth: Clerk JWT — caller must own the campaign's organization OR be admin.
 * Body: none.
 *
 * Side effects:
 *   - UPDATE campaigns SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL.
 *
 * Errors:
 *   - 404 if campaign not found.
 *   - 403 if caller is neither org owner nor admin.
 *   - 409 if campaign is already soft-deleted.
 */
app.post('/api/campaigns/:id/soft-delete', clerkAuth, async (req, res) => {
  try {
    const campaignId = req.params.id
    const callerUserId = req.auth.userId

    // 1. Load campaign + owning organization for auth.
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, deleted_at, organization_id, organizations(user_id)')
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // 2. Authorization: org owner OR admin.
    const orgOwner = campaign.organizations?.user_id ?? null
    const isOwner = orgOwner === callerUserId
    let isAdmin = false
    if (!isOwner) {
      const { data: profile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', callerUserId)
        .single()
      if (!profileErr && profile?.user_type === 'admin') {
        isAdmin = true
      }
    }
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: not the campaign owner or admin' })
    }

    // 3. Idempotency guard: already deleted → 409.
    if (campaign.deleted_at) {
      return res.status(409).json({ error: 'Already deleted' })
    }

    // 4. Stamp deleted_at + deleted_by (SOFT-DEL.1: capture WHO performed the delete).
    const nowIso = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({ deleted_at: nowIso, deleted_by: callerUserId })
      .eq('id', campaignId)
      .is('deleted_at', null)
    if (updateErr) throw updateErr

    // 5. Enqueue Slack alert ONLY for owner-initiated soft-delete (A6-S2).
    //    Admin self-actions are intentionally excluded per D-A6-4 lock.
    //    Slack failure must NOT break the soft-delete flow.
    if (isOwner) {
      try {
        await enqueueSlackAlert({
          event: 'campaign_soft_deleted_by_owner',
          dedupeKey: `campaign_soft_deleted:${campaignId}`,
          payload: {
            campaign_id: campaignId,
            campaign_title: null,
            actor_user_id: callerUserId,
            link_url: `${process.env.APP_URL || ''}/campaign/${campaignId}`,
            occurred_at: nowIso,
          },
        })
      } catch (slackErr) {
        console.error('[slack] enqueue soft-delete failed:', slackErr)
      }
    }

    return res.json({ deleted_at: nowIso })
  } catch (err) {
    console.error('Error in soft-delete:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Restore a soft-deleted campaign. Admin only.
 * POST /api/admin/campaigns/:id/restore
 *
 * Auth: Clerk JWT — admin only.
 * Body: none.
 *
 * Errors:
 *   - 404 if campaign not found.
 *   - 403 if caller is not admin.
 *   - 409 if campaign is not soft-deleted.
 */
app.post('/api/admin/campaigns/:id/restore', clerkAuth, async (req, res) => {
  try {
    const campaignId = req.params.id
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Load campaign.
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, deleted_at')
      .eq('id', campaignId)
      .single()
    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }
    if (!campaign.deleted_at) {
      return res.status(409).json({ error: 'Not deleted' })
    }

    // 3. Clear deleted_at + deleted_by (SOFT-DEL.1: clean reset semantics — the
    //    row is no longer in a deleted state, so neither column should retain
    //    stale values. Audit trail for the restoring admin lives in
    //    `admin_activity_log`, NOT in row-level state).
    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', campaignId)
    if (updateErr) throw updateErr

    return res.json({ restored: true })
  } catch (err) {
    console.error('Error in restore:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * List soft-deleted campaigns. Admin only.
 * GET /api/admin/deleted-campaigns
 *
 * Auth: Clerk JWT — admin only.
 * Returns: { rows: [{ id, title, deleted_at, organization_name }] }
 *   `title` is sourced from the latest `campaign_details` row's content blob.
 */
app.get('/api/admin/deleted-campaigns', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Pull every soft-deleted campaign + its organization.
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, slug, deleted_at, deleted_by, organizations(id, name)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (campErr) throw campErr

    // 3. For each campaign, fetch the latest detail (any status) and read its title.
    //    Volume here is small (admin-only, soft-deletes rare) so N+1 is acceptable.
    const rows = []
    for (const c of campaigns ?? []) {
      const { data: detail } = await supabase
        .from('campaign_details')
        .select('content')
        .eq('campaign_id', c.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      const title =
        detail?.content && typeof detail.content.title === 'string' ? detail.content.title : null
      rows.push({
        id: c.id,
        slug: c.slug,
        title,
        deleted_at: c.deleted_at,
        deleted_by: c.deleted_by ?? null,
        organization_id: c.organizations?.id ?? null,
        organization_name: c.organizations?.name ?? null,
      })
    }

    return res.json({ rows, total: rows.length })
  } catch (err) {
    console.error('Error in GET /api/admin/deleted-campaigns:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ============================================
// PENDING REVIEWS + NOTIFICATIONS ENDPOINTS
// ============================================
// Phase A, Tasks A4 + A9 — admin pending-edits queue, revision
// preview, and the in-app notification inbox.  All four routes
// require a Clerk JWT; admin-only routes additionally verify
// user_profiles.user_type === 'admin'.

/**
 * List pending campaign details (initial + edit) for admin review.
 * GET /api/admin/pending-edits
 *
 * Auth: Clerk JWT — caller must be user_profiles.user_type='admin'.
 *
 * Returns the latest pending detail per campaign, oldest first.
 * Pagination is intentionally out of scope (admin volume small).
 */
app.get('/api/admin/pending-edits', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Pull every pending detail joined to its campaign + org.
    //    Sorted oldest-first so admins burn down the queue FIFO.
    //    Post-REFB: campaigns row no longer carries approval_status / title;
    //    title is read from the detail's content blob.
    const { data: details, error: detailErr } = await supabase
      .from('campaign_details')
      .select(
        'id, version, status, change_summary, changed_by, created_at, campaign_id, content, ' +
          'campaigns!inner(id, slug, organization_id, organizations(id, name))'
      )
      .in('status', ['pending_initial_approval', 'pending_edit_approval'])
      .is('campaigns.deleted_at', null)
      .order('created_at', { ascending: true })
    if (detailErr) throw detailErr

    // 3. Collapse to one row per campaign (latest pending wins) — a
    //    second pending row should not exist (state machine forbids
    //    submit_edit while pending), but be defensive.
    const seen = new Set()
    const rows = []
    for (const d of details ?? []) {
      if (seen.has(d.campaign_id)) continue
      seen.add(d.campaign_id)
      const c = d.campaigns || {}
      const org = c.organizations || {}
      const title = d.content && typeof d.content.title === 'string' ? d.content.title : null
      rows.push({
        campaign_id: c.id,
        campaign_title: title,
        campaign_slug: c.slug,
        organization_id: c.organization_id,
        organization_name: org.name ?? null,
        detail_id: d.id,
        version: d.version,
        detail_status: d.status,
        change_summary: d.change_summary,
        submitted_by: d.changed_by,
        submitted_at: d.created_at,
        is_initial: d.status === 'pending_initial_approval',
      })
    }

    return res.json({ rows, total: rows.length })
  } catch (err) {
    console.error('Error in GET /api/admin/pending-edits:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * List donations (payment ledger) for the admin Donations view.
 * GET /api/admin/donations?status=&search=&cursor=&limit=
 *
 * Auth: Clerk JWT — caller must be user_profiles.user_type='admin'.
 *
 * Data source: payment_transactions (amounts in CENTS) with a
 * stripe_disputes overlay (LEFT JOIN on payment_intent_id). Service-role
 * client bypasses RLS. Donor / campaign / org joins are batch-resolved per
 * page (one .in(...) each) to avoid N+1.
 *
 * Returns { rows, nextCursor, totals } — see buildDonationRow for row shape.
 * `totals` carries succeededToday + succeededThisMonth + monthlyTrends so the admin
 * Overview (Pass 2) can reuse this endpoint without a second query.
 *
 * Refund is intentionally OUT OF SCOPE here — this is a read-only ledger
 * view; refunds are issued via Stripe and reconciled through the webhook.
 */
app.get('/api/admin/donations', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Parse query params.
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : null
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null
    const rawLimit = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50

    // base payment_transactions.status values that map to each display bucket.
    const STATUS_TO_BASE = {
      succeeded: ['succeeded'],
      pending: ['pending', 'processing'],
      failed: ['failed'],
      refunded: ['refunded', 'partially_refunded'],
    }

    // 3. Build the keyset query. Fetch limit+1 to detect "has more".
    //    `disputed` is a derived (overlay) status, not a column value, so it
    //    can't be filtered at the DB level — we over-fetch and filter in JS.
    const isDisputedFilter = statusFilter === 'disputed'
    let query = supabase
      .from('payment_transactions')
      .select(
        'id, created_at, status, donor_id, campaign_id, request_id, organization_id, ' +
          'stripe_payment_intent_id, amount_total, platform_fee, organization_amount, currency'
      )
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (statusFilter && !isDisputedFilter && STATUS_TO_BASE[statusFilter]) {
      query = query.in('status', STATUS_TO_BASE[statusFilter])
    }
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: txns, error: txnErr } = await query
    if (txnErr) throw txnErr

    const page = txns ?? []

    // 4. Batch-resolve donor profiles. Skip the 'anonymous' sentinel.
    const donorIds = [
      ...new Set(page.map((t) => t.donor_id).filter((id) => id && id !== 'anonymous')),
    ]
    const donorMap = new Map() // id -> { name, email }
    if (donorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', donorIds)
      const { data: donorProfiles } = await supabase
        .from('donor_profiles')
        .select('user_id, display_name')
        .in('user_id', donorIds)
      const displayMap = new Map((donorProfiles ?? []).map((d) => [d.user_id, d.display_name]))
      for (const p of profiles ?? []) {
        donorMap.set(p.id, {
          name: displayMap.get(p.id) || p.name || null,
          email: p.email || null,
        })
      }
    }

    // 5. Batch-resolve campaigns (+ latest detail title) and organizations.
    const campaignIds = [...new Set(page.map((t) => t.campaign_id).filter(Boolean))]
    const orgIds = [...new Set(page.map((t) => t.organization_id).filter(Boolean))]

    const campaignMap = new Map() // id -> { slug, title }
    if (campaignIds.length > 0) {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, slug')
        .in('id', campaignIds)
      for (const c of campaigns ?? []) {
        campaignMap.set(c.id, { slug: c.slug ?? null, title: null })
      }
      // campaigns are metadata-only; the human title lives in the detail blob.
      // Pull the latest version per campaign and read content.title.
      const { data: details } = await supabase
        .from('campaign_details')
        .select('campaign_id, version, content')
        .in('campaign_id', campaignIds)
        .order('version', { ascending: false })
      for (const d of details ?? []) {
        const entry = campaignMap.get(d.campaign_id)
        if (entry && entry.title == null) {
          entry.title = d.content && typeof d.content.title === 'string' ? d.content.title : null
        }
      }
    }

    const orgMap = new Map() // id -> name
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)
      for (const o of orgs ?? []) {
        orgMap.set(o.id, o.name ?? null)
      }
    }

    // 6. Batch-resolve disputes by payment_intent_id (overlay).
    const piIds = [...new Set(page.map((t) => t.stripe_payment_intent_id).filter(Boolean))]
    const disputeMap = new Map() // payment_intent_id -> { status, reason, evidenceDueBy }
    if (piIds.length > 0) {
      const { data: disputes } = await supabase
        .from('stripe_disputes')
        .select('payment_intent_id, status, reason, evidence_due_by')
        .in('payment_intent_id', piIds)
      for (const d of disputes ?? []) {
        // A PI can only carry one dispute in practice; first wins.
        if (!disputeMap.has(d.payment_intent_id)) {
          disputeMap.set(d.payment_intent_id, {
            status: normalizeDisputeStatus(d.status),
            reason: normalizeDisputeReason(d.reason),
            evidenceDueBy: d.evidence_due_by ?? null,
          })
        }
      }
    }

    // 7. Derive rows. A dispute with status !== 'won' flips the display
    //    status to "Disputed" while preserving the underlying baseStatus.
    let rows = page.map((t) => {
      const baseStatus = deriveBaseStatus(t.status)
      const dispute = disputeMap.get(t.stripe_payment_intent_id) ?? null
      const isDisputed = dispute != null && dispute.status !== 'won'
      const isAnonymous = !t.donor_id || t.donor_id === 'anonymous'
      const donor = isAnonymous ? null : (donorMap.get(t.donor_id) ?? null)
      const campaign = t.campaign_id ? campaignMap.get(t.campaign_id) : null
      const target = t.campaign_id
        ? {
            type: 'campaign',
            title: campaign?.title ?? null,
            slug: campaign?.slug ?? null,
            id: t.campaign_id,
          }
        : {
            type: 'request',
            title: orgMap.get(t.organization_id) ?? null,
            slug: null,
            id: t.request_id ?? null,
          }

      return {
        id: t.id,
        createdAt: t.created_at,
        status: isDisputed ? 'Disputed' : baseStatus,
        baseStatus,
        donorId: t.donor_id,
        donorName: donor?.name ?? null,
        donorEmail: donor?.email ?? null,
        isAnonymous,
        target,
        organizationName: orgMap.get(t.organization_id) ?? null,
        amountTotal: t.amount_total,
        platformFee: t.platform_fee,
        netToOrg: t.organization_amount,
        currency: t.currency || 'usd',
        paymentIntentId: t.stripe_payment_intent_id,
        dispute: isDisputed ? dispute : null,
      }
    })

    // Apply search + disputed-only filtering in JS (post-derive).
    if (isDisputedFilter) {
      rows = rows.filter((r) => r.status === 'Disputed')
    }
    if (search) {
      const needle = search.toLowerCase()
      rows = rows.filter((r) => {
        const hay = [r.donorName, r.donorEmail, r.target?.title, r.organizationName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(needle)
      })
    }

    // Keyset pagination: nextCursor is the created_at of the last kept row,
    // but only if the unfiltered page hit the limit (more pages exist).
    const hasMore = page.length > limit
    const trimmed = rows.slice(0, limit)
    const nextCursor =
      hasMore && page.length > 0 ? page[Math.min(limit, page.length) - 1].created_at : null

    // 8. Aggregate totals. These run over the FULL succeeded ledger (not just
    //    the current page) so the strip + Overview reflect lifetime numbers.
    const totals = await computeDonationTotals(supabase)

    return res.json({ rows: trimmed, nextCursor, totals })
  } catch (err) {
    console.error('Error in GET /api/admin/donations:', err)
    return res.status(500).json({ error: err.message })
  }
})

// --- Donations helpers -----------------------------------------------------

/** Map a raw payment_transactions.status to a display bucket. */
function deriveBaseStatus(raw) {
  switch (raw) {
    case 'succeeded':
      return 'Succeeded'
    case 'failed':
      return 'Failed'
    case 'refunded':
    case 'partially_refunded':
      return 'Refunded'
    case 'pending':
    case 'processing':
    default:
      return 'Pending'
  }
}

/** Normalize Stripe dispute status vocab to our 4-state model. */
function normalizeDisputeStatus(raw) {
  if (!raw) return 'needs_response'
  const s = String(raw).toLowerCase()
  if (s === 'won') return 'won'
  if (s === 'lost') return 'lost'
  if (s === 'under_review') return 'under_review'
  // warning_needs_response, needs_response, warning_under_review, etc.
  return 'needs_response'
}

/** Humanize Stripe dispute reason codes (snake_case → Title Case). */
function normalizeDisputeReason(raw) {
  if (!raw) return null
  return String(raw)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Compute succeeded totals over the whole ledger:
 *  - succeededCount / succeededAmount (lifetime)
 *  - succeededToday { amount, count } (current UTC day)
 *  - succeededThisMonth { amount, count } (current calendar month)
 *  - monthlyTrends [{ month, year, count, amount }] (last ~6 months)
 * Amounts in CENTS.
 */
async function computeDonationTotals(client) {
  const { data, error } = await client
    .from('payment_transactions')
    .select('amount_total, created_at')
    .eq('status', 'succeeded')
  if (error) throw error

  const succeeded = data ?? []
  const succeededAmount = succeeded.reduce((sum, r) => sum + (r.amount_total || 0), 0)

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  let thisMonthAmount = 0
  let thisMonthCount = 0
  let todayAmount = 0
  let todayCount = 0

  // last 6 calendar months (including current) keyed YYYY-MM.
  const buckets = new Map()
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    buckets.set(key, { month: d.getUTCMonth() + 1, year: d.getUTCFullYear(), count: 0, amount: 0 })
  }

  for (const r of succeeded) {
    const created = new Date(r.created_at)
    if (created >= monthStart) {
      thisMonthAmount += r.amount_total || 0
      thisMonthCount += 1
    }
    if (created >= dayStart) {
      todayAmount += r.amount_total || 0
      todayCount += 1
    }
    const key = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.count += 1
      bucket.amount += r.amount_total || 0
    }
  }

  return {
    succeededCount: succeeded.length,
    succeededAmount,
    currency: 'usd',
    succeededToday: { amount: todayAmount, count: todayCount },
    succeededThisMonth: { amount: thisMonthAmount, count: thisMonthCount },
    monthlyTrends: [...buckets.values()],
  }
}

/**
 * List ALL campaigns for the admin Campaign Management view.
 * GET /api/admin/campaigns?status=&limit=
 *
 * Auth: Clerk JWT — caller must be user_profiles.user_type='admin'.
 *
 * Service-role client (bypasses RLS) → reads every status including
 * soft-deleted campaigns. Derives a single management status per campaign
 * from its campaign_details version history.
 *
 * Returns: { rows: CampaignAdminRow[] } sorted by submitted_at DESC.
 */
app.get('/api/admin/campaigns', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Pull every campaign (no deleted_at filter — admin sees deleted) with
    //    its org + the full campaign_details version history.
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select(
        '*, organizations(id, name), ' +
          'campaign_details(id, version, status, content, change_summary, changed_by, created_at)'
      )
    if (campErr) throw campErr

    // 3. Derive management status + projection per campaign.
    const rows = []
    for (const c of campaigns ?? []) {
      const details = [...(c.campaign_details ?? [])].sort((a, b) => b.version - a.version)
      const latest = details[0] ?? null
      const latestApproved = details.find((d) => d.status === 'approved') ?? null

      let status
      if (c.deleted_at != null) {
        status = 'deleted'
      } else if (latest?.status === 'pending_initial_approval') {
        status = 'pending_new'
      } else if (latest?.status === 'pending_edit_approval') {
        status = 'pending_edit'
      } else if (latestApproved && latest?.status === 'approved') {
        status = 'live'
      } else if (latest?.status === 'rejected' && !latestApproved) {
        status = 'rejected'
      } else {
        status = 'draft'
      }

      const isPublic = !!latestApproved && c.deleted_at == null

      const titleOf = (d) =>
        d?.content && typeof d.content.title === 'string' ? d.content.title : null
      const title = titleOf(latestApproved) ?? titleOf(latest) ?? null

      const org = c.organizations || {}
      rows.push({
        campaign_id: c.id,
        campaign_title: title,
        campaign_slug: c.slug,
        organization_id: c.organization_id ?? org.id ?? null,
        organization_name: org.name ?? null,
        status,
        is_public: isPublic,
        detail_id: latest?.id ?? null,
        version: latest?.version ?? null,
        detail_status: latest?.status ?? null,
        change_summary: latest?.change_summary ?? null,
        submitted_by: latest?.changed_by ?? null,
        submitted_at: latest?.created_at ?? c.created_at ?? null,
        amount_raised: c.amount_raised ?? 0,
        supporters_count: c.supporters_count ?? 0,
        deleted_at: c.deleted_at ?? null,
        deleted_by: c.deleted_by ?? null,
      })
    }

    // 4. Optional status filter + sort by submitted_at DESC + limit.
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : null
    const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows
    filtered.sort((a, b) => {
      const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
      const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
      return tb - ta
    })
    const limit = Number.parseInt(req.query.limit, 10)
    const capped =
      Number.isFinite(limit) && limit > 0 ? filtered.slice(0, limit) : filtered.slice(0, 100)

    return res.json({ rows: capped })
  } catch (err) {
    console.error('Error in GET /api/admin/campaigns:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Fetch a single detail's content for admin preview.
 * GET /api/campaigns/:campaignId/details/:detailId/preview
 *
 * Auth: Clerk JWT — admin only.
 * Returns: { campaign, detail }
 *
 * No diff visualization — A5 owns that.
 */
app.get('/api/campaigns/:campaignId/details/:detailId/preview', clerkAuth, async (req, res) => {
  try {
    const { campaignId, detailId } = req.params
    const callerUserId = req.auth.userId

    // 1. Admin auth.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', callerUserId)
      .single()
    if (profileErr || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' })
    }

    // 2. Load detail.
    const { data: detail, error: detailErr } = await supabase
      .from('campaign_details')
      .select('id, campaign_id, version, content, change_summary, status, created_at, changed_by')
      .eq('id', detailId)
      .single()
    if (detailErr || !detail) {
      return res.status(404).json({ error: 'Detail not found' })
    }
    if (detail.campaign_id !== campaignId) {
      return res.status(400).json({ error: 'Detail does not belong to campaign' })
    }

    // 3. Load current campaign row (used as the 'before' side).
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    if (campErr || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // 4. Load latest approved detail (for client-side diff vs. this pending).
    const { data: approvedDetail, error: approvedErr } = await supabase
      .from('campaign_details')
      .select('id, version, content, created_at')
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (approvedErr) {
      return res.status(500).json({ error: approvedErr.message })
    }

    return res.json({
      campaign,
      detail: {
        id: detail.id,
        version: detail.version,
        content: detail.content,
        change_summary: detail.change_summary,
        status: detail.status,
        created_at: detail.created_at,
        changed_by: detail.changed_by,
      },
      current_approved_detail: approvedDetail
        ? {
            id: approvedDetail.id,
            version: approvedDetail.version,
            content: approvedDetail.content,
            created_at: approvedDetail.created_at,
          }
        : null,
    })
  } catch (err) {
    console.error('Error in detail preview:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * List the caller's in-app notifications (newest first, capped at 50).
 * GET /api/notifications
 *
 * Auth: Clerk JWT.
 * Returns: { rows, unread_count }
 */
app.get('/api/notifications', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId

    const { data: rows, error } = await supabase
      .from('notifications')
      .select(
        'id, recipient_clerk_user_id, kind, payload, link_url, entity_type, entity_id, read_at, created_at'
      )
      .eq('recipient_clerk_user_id', callerUserId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error

    const unread_count = (rows ?? []).filter((r) => r.read_at === null).length
    return res.json({ rows: rows ?? [], unread_count })
  } catch (err) {
    console.error('Error in GET /api/notifications:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Mark a single notification as read.
 * POST /api/notifications/:id/read
 *
 * Auth: Clerk JWT — caller must own the notification.
 * Returns: { updated: boolean } — false when the row was already read
 *   or did not match (idempotent for client retries).
 */
app.post('/api/notifications/:id/read', clerkAuth, async (req, res) => {
  try {
    const callerUserId = req.auth.userId
    const { id } = req.params

    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_clerk_user_id', callerUserId)
      .is('read_at', null)
      .select('id')
    if (error) throw error

    return res.json({ updated: Array.isArray(data) && data.length > 0 })
  } catch (err) {
    console.error('Error in POST /api/notifications/:id/read:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ============================================
// TAX DOCUMENT ENDPOINTS
// ============================================

/**
 * Generate Receipt Number
 * Uses database sequence for unique sequential numbers
 */
async function generateReceiptNumber() {
  const { data, error } = await supabase.rpc('generate_receipt_number')
  if (error) {
    // Fallback to timestamp-based number if function doesn't exist
    const now = new Date()
    return `KCDD-${now.getFullYear()}-${Date.now().toString().slice(-8)}`
  }
  return data
}

/**
 * Generate Donation Receipt (Internal)
 * Called automatically after successful payment
 */
async function generateAndStoreReceipt(paymentIntent) {
  try {
    const {
      requestId,
      campaignId,
      organizationId,
      organizationName: _organizationName,
      donorId,
      platformFee: _platformFee,
      organizationAmount: _organizationAmount,
    } = paymentIntent.metadata

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      console.error('Error fetching organization for receipt:', orgError)
      return null
    }

    // Get donor details
    let donorName = 'Anonymous Donor'
    let donorEmail = null

    if (donorId && donorId !== 'anonymous') {
      const { data: donor } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('id', donorId)
        .single()

      if (donor) {
        donorName = `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || 'Donor'
        donorEmail = donor.email
      }
    }

    // Get request/campaign description
    let description = 'Charitable donation'
    if (requestId) {
      const { data: request } = await supabase
        .from('requests')
        .select('description, item')
        .eq('id', requestId)
        .single()
      if (request) {
        description = `Donation for: ${request.item || request.description || 'Request'}`
      }
    } else if (campaignId) {
      // Post-REFB: campaigns.title is gone. Pull the donor-visible title
      // from the latest approved campaign_details row. maybeSingle() so
      // receipts still issue (with a generic description) when no
      // approved detail exists at receipt time.
      const { data: detail } = await supabase
        .from('campaign_details')
        .select('content')
        .eq('campaign_id', campaignId)
        .eq('status', 'approved')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      const campaignTitle = detail?.content?.title || 'Untitled campaign'
      description = `Campaign donation: ${campaignTitle}`
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()
    const donationDate = new Date().toISOString()
    const amountDollars = paymentIntent.amount / 100

    // Generate PDF
    const pdfBuffer = await generateDonationReceipt({
      receiptNumber,
      donorName,
      donorEmail,
      amount: amountDollars,
      donationDate,
      description,
      organization: {
        name: org.name,
        ein: org.ein,
        address: org.address,
        city: org.city,
        state: org.state,
        zipcode: org.zipcode,
        email: org.email,
        phone: org.phone,
      },
    })

    // Upload to Supabase Storage
    const fileName = `${donorId || 'anonymous'}/${receiptNumber}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('tax-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading receipt PDF:', uploadError)
      // Continue anyway - we'll store the record without file_url
    }

    // Get public URL (or signed URL)
    const { data: urlData } = await supabase.storage
      .from('tax-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year expiry

    const fileUrl = urlData?.signedUrl || null

    // Create donor_documents record
    const year = new Date(donationDate).getFullYear()
    const quarter = Math.ceil((new Date(donationDate).getMonth() + 1) / 3)

    const { data: docRecord, error: docError } = await supabase
      .from('donor_documents')
      .insert({
        user_id: donorId || 'anonymous',
        name: `Donation Receipt - ${org.name} - ${receiptNumber}`,
        type: 'tax_receipt',
        size: `${Math.round(pdfBuffer.length / 1024)} KB`,
        file_url: fileUrl,
        year,
        quarter,
        status: 'ready',
        organization_id: organizationId,
        organization_name: org.name,
        organization_ein: org.ein,
        donation_amount: amountDollars,
        donation_date: donationDate,
        receipt_number: receiptNumber,
        request_id: requestId || null,
        campaign_id: campaignId || null,
        donor_name: donorName,
        donor_email: donorEmail,
      })
      .select()
      .single()

    if (docError) {
      console.error('Error creating document record:', docError)
      return null
    }

    console.log('Generated receipt:', {
      receiptNumber,
      documentId: docRecord?.id,
      donorId,
      amount: amountDollars,
    })

    return docRecord
  } catch (error) {
    console.error('Error generating receipt:', error)
    return null
  }
}

/**
 * Dev-only: trigger receipt generation for an existing fulfilled request
 * without going through Stripe. Useful for validating the PDF + storage +
 * donor_documents pipeline when Stripe Connect platform enrollment isn't
 * yet done.
 *
 * POST /api/dev/generate-test-receipt
 * Body: { requestId, donorId, amount? }
 */
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/generate-test-receipt', async (req, res) => {
    try {
      const { requestId, donorId, amount } = req.body
      if (!requestId || !donorId) {
        return res.status(400).json({ error: 'requestId and donorId required' })
      }

      const { data: request, error: reqError } = await supabase
        .from('requests')
        .select('id, organization_id, amount, description')
        .eq('id', requestId)
        .single()
      if (reqError || !request) {
        return res.status(404).json({ error: 'Request not found' })
      }

      const cents = Math.round((Number(amount) || Number(request.amount) || 0) * 100)
      if (cents <= 0) {
        return res.status(400).json({ error: 'Invalid amount' })
      }

      const fakeIntent = {
        id: `pi_test_${Date.now()}`,
        amount: cents,
        metadata: {
          requestId,
          campaignId: null,
          organizationId: request.organization_id,
          donorId,
        },
      }

      const doc = await generateAndStoreReceipt(fakeIntent)
      if (!doc) {
        return res
          .status(500)
          .json({ error: 'Receipt generation returned null — check server logs' })
      }
      res.json({ document: doc })
    } catch (err) {
      console.error('Test receipt error:', err)
      res.status(500).json({ error: err.message })
    }
  })
}

/**
 * Download Document
 * GET /api/documents/download/:documentId
 *
 * Returns a signed URL for downloading the document
 */
app.get('/api/documents/download/:documentId', clerkAuth, async (req, res) => {
  try {
    const { documentId } = req.params

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from('donor_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // H5-D (M7): caller may only download their own documents
    if (doc.user_id !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: "caller cannot read another donor's documents" })
    }

    // If we have a file_url, return it
    if (doc.file_url) {
      return res.json({
        url: doc.file_url,
        name: doc.name,
        type: doc.type,
      })
    }

    // Try to generate a new signed URL from storage
    const fileName = `${doc.user_id}/${doc.receipt_number}.pdf`
    const { data: urlData, error: urlError } = await supabase.storage
      .from('tax-documents')
      .createSignedUrl(fileName, 60 * 60) // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      return res.status(404).json({ error: 'Document file not available' })
    }

    res.json({
      url: urlData.signedUrl,
      name: doc.name,
      type: doc.type,
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * Generate Annual Summary
 * POST /api/documents/generate-annual-summary
 *
 * Body:
 * - donorId: string (Clerk user ID)
 * - year: number
 */
app.post('/api/documents/generate-annual-summary', clerkAuth, async (req, res) => {
  try {
    const { donorId, year } = req.body

    if (!donorId || !year) {
      return res.status(400).json({ error: 'Missing donorId or year' })
    }

    // H5-D (M7): caller may only generate their own annual summary
    if (donorId !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: "caller cannot read another donor's documents" })
    }

    // Get donor details
    const { data: donor } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('user_id', donorId)
      .single()

    const donorName = donor
      ? `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || 'Donor'
      : 'Anonymous Donor'
    const donorEmail = donor?.email || null

    // Get all receipts for the year
    const { data: receipts, error: receiptError } = await supabase
      .from('donor_documents')
      .select('*')
      .eq('user_id', donorId)
      .eq('type', 'tax_receipt')
      .eq('year', year)
      .eq('status', 'ready')
      .order('donation_date', { ascending: true })

    if (receiptError) {
      console.error('Error fetching receipts:', receiptError)
      return res.status(500).json({ error: 'Failed to fetch donation records' })
    }

    if (!receipts || receipts.length === 0) {
      return res.status(404).json({ error: 'No donations found for this year' })
    }

    // Format donations for PDF
    const donations = receipts.map((r) => ({
      date: r.donation_date,
      organizationName: r.organization_name,
      receiptNumber: r.receipt_number,
      amount: r.donation_amount,
    }))

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)

    // Generate PDF
    const pdfBuffer = await generateAnnualSummary({
      donorName,
      donorEmail,
      year,
      donations,
      totalAmount,
    })

    // Upload to Supabase Storage
    const receiptNumber = `KCDD-${year}-ANNUAL-${donorId.slice(-6)}`
    const fileName = `${donorId}/${receiptNumber}.pdf`

    await supabase.storage.from('tax-documents').upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('tax-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365)

    const fileUrl = urlData?.signedUrl || null

    // Check if annual summary already exists
    const { data: existing } = await supabase
      .from('donor_documents')
      .select('id')
      .eq('user_id', donorId)
      .eq('type', 'annual_summary')
      .eq('year', year)
      .single()

    // Create or update donor_documents record
    const docData = {
      user_id: donorId,
      name: `Annual Donation Summary - ${year}`,
      type: 'annual_summary',
      size: `${Math.round(pdfBuffer.length / 1024)} KB`,
      file_url: fileUrl,
      year,
      quarter: null,
      status: 'ready',
      donation_amount: totalAmount,
      donation_date: new Date().toISOString(),
      receipt_number: receiptNumber,
      donor_name: donorName,
      donor_email: donorEmail,
    }

    let docRecord
    if (existing) {
      const { data, error: _updateError } = await supabase
        .from('donor_documents')
        .update(docData)
        .eq('id', existing.id)
        .select()
        .single()
      docRecord = data
    } else {
      const { data, error: _insertError } = await supabase
        .from('donor_documents')
        .insert(docData)
        .select()
        .single()
      docRecord = data
    }

    console.log('Generated annual summary:', {
      donorId,
      year,
      totalAmount,
      donationCount: donations.length,
    })

    res.json({
      success: true,
      document: docRecord,
      summary: {
        year,
        totalAmount,
        donationCount: donations.length,
      },
    })
  } catch (error) {
    console.error('Error generating annual summary:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * List Donor Documents
 * GET /api/documents/list/:donorId
 */
app.get('/api/documents/list/:donorId', clerkAuth, async (req, res) => {
  try {
    const { donorId } = req.params
    const { year, type } = req.query

    // H5-D (M7): caller may only list their own documents
    if (donorId !== req.auth.userId) {
      return res
        .status(403)
        .json({ error: 'forbidden', detail: "caller cannot read another donor's documents" })
    }

    let query = supabase
      .from('donor_documents')
      .select('*')
      .eq('user_id', donorId)
      .eq('status', 'ready')
      .order('donation_date', { ascending: false })

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ documents: data || [] })
  } catch (error) {
    console.error('Error listing documents:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// CRON — SLACK NOTIFICATION QUEUE FLUSH
// ============================================

// Flush pending Slack notifications. Called by Vercel cron every 5 min.
// Vercel cron uses GET with Authorization: Bearer $CRON_SECRET.
// Also accept POST with header x-cron-secret for manual operator triggers.
const slackCronHandler = async (req, res) => {
  const headerSecret =
    req.headers['x-cron-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '')
  // Constant-time comparison: this endpoint is publicly reachable, so a plain
  // `!==` would leak the secret one byte at a time via response timing.
  const expectedSecret = process.env.CRON_SECRET || ''
  const provided = Buffer.from(String(headerSecret))
  const expected = Buffer.from(expectedSecret)
  if (
    !expectedSecret ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(provided, expected)
  ) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const { data: rows, error: selectErr } = await supabase
    .from('slack_notification_queue')
    .select('*')
    .eq('status', 'pending')
    .order('queued_at', { ascending: true })
    .limit(100)

  if (selectErr) {
    console.error('[slack:cron] select error:', selectErr)
    return res.status(500).json({ error: 'select failed' })
  }

  let sent = 0
  let failed = 0
  for (const row of rows || []) {
    try {
      await postToSlack(formatPayload(row.payload?.event, row.payload || {}))
      await supabase
        .from('slack_notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (err) {
      failed++
      const attempt = (row.attempt_count || 0) + 1
      // Keep the row 'pending' so the next cron tick retries it; only flip to
      // the terminal 'failed' state once MAX_SLACK_ATTEMPTS is exhausted.
      // Otherwise a transient Slack outage would silently drop the alert,
      // since the select above only ever picks up status='pending' rows.
      const MAX_SLACK_ATTEMPTS = 5
      await supabase
        .from('slack_notification_queue')
        .update({
          status: attempt >= MAX_SLACK_ATTEMPTS ? 'failed' : 'pending',
          attempt_count: attempt,
          last_error: err?.message || String(err),
        })
        .eq('id', row.id)
    }
  }

  res.json({ processed: rows?.length || 0, sent, failed })
}

app.get('/api/cron/flush-slack-queue', slackCronHandler)
app.post('/api/cron/flush-slack-queue', slackCronHandler)

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, _next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
  })
})

// ============================================
// START SERVER
// ============================================

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('🚀 KCDD Market API Server')
    console.log(`📡 Server running on http://localhost:${PORT}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
    console.log(
      `💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Connected' : '❌ Not configured'}`
    )
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL}`)
    console.log(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
    console.log('\n📝 Available endpoints:')
    console.log('  GET  /health')
    console.log('  POST /api/payments/create-intent')
    console.log('  POST /api/payments/create-campaign-intent')
    console.log('  POST /api/payments/webhook')
    console.log('  POST /api/stripe/connect/create-account')
    console.log('  POST /api/stripe/connect/onboarding-link')
    console.log('  GET  /api/stripe/connect/status/:organizationId')
    console.log('  GET  /api/documents/download/:documentId')
    console.log('  GET  /api/documents/list/:donorId')
    console.log('  POST /api/documents/generate-annual-summary')
    console.log('  POST /api/cron/flush-slack-queue')
  })
}

export default app
