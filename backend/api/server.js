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
import dotenv from 'dotenv'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { generateDonationReceipt, generateAnnualSummary } from './services/pdfGenerator.js'
import { clerkAuth } from './middleware/clerkAuth.js'
import usersRouter from './routes/users.js'
import { buildPaymentMetadata, appendLifecycle } from './helpers/paymentMetadata.js'
import { upsertDispute } from './helpers/disputes.js'
import {
  nextState as campaignNextState,
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
  return String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[c]))
}

/**
 * GET /sitemap.xml
 * Public, no auth. Lists all donor-visible campaigns (published_detail_id
 * IS NOT NULL). Uses last_edit_approved_at (fallback created_at) for <lastmod>.
 */
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('slug, last_edit_approved_at, created_at')
      .not('published_detail_id', 'is', null)
    if (error) throw error
    const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
    const urls = (data ?? [])
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
    const { data, error } = await supabase
      .from('campaigns')
      .select('slug, last_edit_approved_at, created_at, published_detail_id')
      .eq('slug', req.params.slug)
      .single()
    if (error || !data || !data.published_detail_id) {
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
app.post('/api/stripe/connect/create-account', async (req, res) => {
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
app.post('/api/stripe/connect/onboarding-link', async (req, res) => {
  try {
    const { organizationId } = req.body

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' })
    }

    // Get organization's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_account_id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
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
app.get('/api/stripe/connect/status/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params

    // Get organization's Stripe account
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(
        'stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled'
      )
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
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
 * Body:
 * - campaignId: string
 * - amount: number (in cents)
 * - donorId: string (optional)
 *
 * Supports destination charges to transfer funds to connected accounts
 */
// NOTE: campaign amounts are donor-chosen by design — client-supplied amount is intentional here.
app.post('/api/payments/create-campaign-intent', async (req, res) => {
  try {
    const { campaignId, amount, donorId } = req.body

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
        campaignTitle: campaign.title,
        organizationId: org?.id || '',
        organizationName: org?.name || '',
        donorId: donorId || 'anonymous',
        platformFee: platformFee.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      description: `Campaign donation: ${campaign.title}`,
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
          campaign_title_snapshot: campaign.title,
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

  // Idempotency: record the event before any side-effect runs. If Stripe
  // retries (network failure, our 5xx, etc.), the second delivery hits the
  // stripe_events PK uniqueness on event_id and we exit early.
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

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        await appendLifecycle(supabase, event.data.object.id, {
          at: new Date().toISOString(),
          event: 'payment_intent.succeeded',
          event_id: event.id,
        })
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        await appendLifecycle(supabase, event.data.object.id, {
          at: new Date().toISOString(),
          event: 'payment_intent.payment_failed',
          event_id: event.id,
          error_message: event.data.object.last_payment_error?.message || null,
        })
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object)
        // charge.refunded's data.object is a Charge, not a PaymentIntent. The PI ID
        // lives on charge.payment_intent.
        await appendLifecycle(supabase, event.data.object.payment_intent, {
          at: new Date().toISOString(),
          event: 'charge.refunded',
          event_id: event.id,
        })
        break

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
        await upsertDispute(supabase, dispute)
        const newStatus =
          dispute.status === 'won'
            ? 'dispute_won'
            : dispute.status === 'lost'
              ? 'dispute_lost'
              : 'disputed'
        await supabase
          .from('payment_transactions')
          .update({ status: newStatus })
          .eq('stripe_payment_intent_id', dispute.payment_intent)
        if (newStatus === 'dispute_lost') {
          // Compensating UPDATE on campaign: dispute_lost means we ultimately lost
          // the funds, so the campaign tally was overstated. Read current values,
          // decrement by the dispute amount (in dollars). Same fallback pattern
          // the succeeded handler uses for the increment side.
          const { data: tx } = await supabase
            .from('payment_transactions')
            .select('campaign_id')
            .eq('stripe_payment_intent_id', dispute.payment_intent)
            .single()
          if (tx?.campaign_id) {
            const amountDollars = (dispute.amount || 0) / 100
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('amount_raised, supporters_count')
              .eq('id', tx.campaign_id)
              .single()
            if (campaign) {
              await supabase
                .from('campaigns')
                .update({
                  amount_raised: Math.max(0, (campaign.amount_raised || 0) - amountDollars),
                  supporters_count: Math.max(0, (campaign.supporters_count || 0) - 1),
                })
                .eq('id', tx.campaign_id)
            }
          }
        }
        await appendLifecycle(supabase, dispute.payment_intent, {
          at: new Date().toISOString(),
          event: 'charge.dispute.closed',
          event_id: event.id,
          dispute_id: dispute.id,
          outcome: dispute.status,
        })
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

async function handlePaymentSucceeded(paymentIntent) {
  const { requestId, campaignId, organizationId, donorId } = paymentIntent.metadata

  console.log('Payment succeeded:', {
    paymentIntentId: paymentIntent.id,
    requestId: requestId || campaignId,
    amount: paymentIntent.amount / 100,
  })

  // Update payment transaction record
  const { error: txError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (txError) {
    console.error('Error updating transaction:', txError)
  }

  // Update request status in database (only for request donations)
  if (requestId) {
    const { error } = await supabase
      .from('requests')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        donor_id: donorId || null,
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error updating request:', error)
    }

    // Create notification for organization
    await supabase.from('request_notifications').insert({
      request_id: requestId,
      notification_type: 'claimed',
      title: 'Donation Received!',
      message: `A donor has claimed your request with a $${(paymentIntent.amount / 100).toFixed(2)} donation.`,
      recipient_id: organizationId,
    })
  }

  // Update campaign amounts (for campaign donations). On branches without
  // the increment_campaign_amount RPC (added in 20260605000100), fall back
  // to a SELECT + UPDATE. supabase-js v2 returns { data, error } from .rpc()
  // and never rejects, so we branch on `rpcError` instead of .catch().
  if (campaignId) {
    const amountDollars = paymentIntent.amount / 100
    const { error: rpcError } = await supabase.rpc('increment_campaign_amount', {
      campaign_id: campaignId,
      amount: amountDollars,
    })
    if (rpcError) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('amount_raised, supporters_count')
        .eq('id', campaignId)
        .single()
      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            amount_raised: (campaign.amount_raised || 0) + amountDollars,
            supporters_count: (campaign.supporters_count || 0) + 1,
          })
          .eq('id', campaignId)
      }
    }
  }

  // Generate tax receipt PDF automatically
  try {
    const receipt = await generateAndStoreReceipt(paymentIntent)
    if (receipt) {
      console.log('Auto-generated receipt:', receipt.receipt_number)
    }
  } catch (receiptError) {
    console.error('Error auto-generating receipt:', receiptError)
    // Don't fail the webhook - receipt generation is non-critical
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', {
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error,
  })

  // Update payment transaction record
  await supabase
    .from('payment_transactions')
    .update({
      status: 'failed',
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handleChargeRefunded(charge) {
  console.log('Charge refunded:', {
    chargeId: charge.id,
    amount: charge.amount_refunded / 100,
  })

  // Update payment transaction record
  await supabase
    .from('payment_transactions')
    .update({
      status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
    })
    .eq('stripe_charge_id', charge.id)
}

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
 * Behavior:
 *   - status in (draft, rejected) → action=submit_initial
 *   - status === 'active'         → action=submit_edit
 *   - otherwise                   → 409 (edit already pending / archived)
 *
 * Side effects:
 *   1. INSERT campaign_details row (version = max+1).
 *   2. UPDATE campaigns.approval_status + last_edited_at.
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

    // 1. Load campaign + owning organization for auth + state read.
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, title, approval_status, organization_id, organizations(user_id)')
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const orgOwner = campaign.organizations?.user_id
    if (!orgOwner || orgOwner !== callerUserId) {
      return res.status(403).json({ error: 'Forbidden: not the campaign owner' })
    }

    // 2. Resolve action from current status.
    const currentStatus = campaign.approval_status
    let action
    if (currentStatus === 'draft' || currentStatus === 'rejected') {
      action = 'submit_initial'
    } else if (currentStatus === 'active') {
      action = 'submit_edit'
    } else {
      return res.status(409).json({
        error: 'Cannot submit edit from current state',
        code: 'INVALID_STATE',
        currentStatus,
      })
    }

    // 3. Compute new status via the state machine (also guards bad inputs).
    let newStatus
    try {
      newStatus = campaignNextState(currentStatus, action)
    } catch (err) {
      return res.status(409).json({ error: err.message, code: 'INVALID_TRANSITION' })
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
    const detailStatus =
      newStatus === 'pending_initial_approval'
        ? 'pending_initial_approval'
        : 'pending_edit_approval'

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

    // 6. UPDATE campaigns.approval_status + last_edited_at.
    const { error: updateErr } = await supabase
      .from('campaigns')
      .update({
        approval_status: newStatus,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    if (updateErr) throw updateErr

    // 7. Fan-out notifications to admins.
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
              campaign_title: campaign.title,
            },
            link_url: `/admin/pending-edits/${campaignId}`,
          })
        )
      )
    } catch (notifyErr) {
      // Notification failures must not break the submission flow.
      console.error('Error fanning out submit-edit notifications:', notifyErr)
    }

    return res.json({
      detail_id: detail.id,
      version: detail.version,
      status: newStatus,
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
 * Side effects:
 *   - UPDATE detail row: approved + approved_by + approved_at.
 *   - UPDATE campaign: approval_status='active',
 *     published_detail_id=detailId, last_edit_approved_at=now(),
 *     first_approved_at=now() if previously NULL.
 *   - Emit notification to CBO (campaigns.created_by).
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
        .select('id, campaign_id, version, status')
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
        .select('id, slug, title, approval_status, created_by, first_approved_at')
        .eq('id', campaignId)
        .single()
      if (campErr || !campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // 3. State machine: only valid from pending_* states.
      let newStatus
      try {
        newStatus = campaignNextState(campaign.approval_status, 'approve')
      } catch (err) {
        return res.status(409).json({ error: err.message, code: 'INVALID_TRANSITION' })
      }

      const nowIso = new Date().toISOString()

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

      // 5. UPDATE campaign — set published detail pointer + timestamps.
      const isFirstApproval = !campaign.first_approved_at
      const campaignPatch = {
        approval_status: newStatus,
        published_detail_id: detailId,
        last_edit_approved_at: nowIso,
      }
      if (isFirstApproval) {
        campaignPatch.first_approved_at = nowIso
      }

      const { error: campUpdErr } = await supabase
        .from('campaigns')
        .update(campaignPatch)
        .eq('id', campaignId)
      if (campUpdErr) throw campUpdErr

      // 6. Notify CBO.
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
              campaign_title: campaign.title,
            },
            link_url: `/campaign/${campaign.slug}`,
          })
        }
      } catch (notifyErr) {
        console.error('Error notifying CBO of approval:', notifyErr)
      }

      return res.json({
        status: newStatus,
        published_detail_id: detailId,
      })
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
 * Side effects:
 *   - UPDATE detail: rejected + approved_by + approved_at + review_note.
 *   - UPDATE campaign.approval_status only (published_detail_id stays).
 *   - Emit `campaign_edit_rejected` notification to the CBO.
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
        .select('id, campaign_id, version, status')
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
        .select('id, title, approval_status, created_by')
        .eq('id', campaignId)
        .single()
      if (campErr || !campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // 3. State machine: reject reverts pending_edit_approval → active,
      //    pending_initial_approval → rejected.
      let newStatus
      try {
        newStatus = campaignNextState(campaign.approval_status, 'reject')
      } catch (err) {
        return res.status(409).json({ error: err.message, code: 'INVALID_TRANSITION' })
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

      // 5. UPDATE campaign approval_status ONLY. Do NOT touch
      //    published_detail_id — the last approved detail stays live.
      const { error: campUpdErr } = await supabase
        .from('campaigns')
        .update({ approval_status: newStatus })
        .eq('id', campaignId)
      if (campUpdErr) throw campUpdErr

      // 6. Notify CBO.
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
              campaign_title: campaign.title,
              review_note: reviewNote,
            },
            link_url: `/dashboard/campaigns/${campaign.id}`,
          })
        }
      } catch (notifyErr) {
        console.error('Error notifying CBO of rejection:', notifyErr)
      }

      return res.json({ status: newStatus })
    } catch (err) {
      console.error('Error in detail reject:', err)
      return res.status(500).json({ error: err.message })
    }
  }
)

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
    const { data: details, error: detailErr } = await supabase
      .from('campaign_details')
      .select(
        'id, version, status, change_summary, changed_by, created_at, campaign_id, ' +
          'campaigns!inner(id, title, slug, approval_status, organization_id, organizations(id, name))'
      )
      .in('status', ['pending_initial_approval', 'pending_edit_approval'])
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
      rows.push({
        campaign_id: c.id,
        campaign_title: c.title,
        campaign_slug: c.slug,
        organization_id: c.organization_id,
        organization_name: org.name ?? null,
        detail_id: d.id,
        version: d.version,
        detail_status: d.status,
        change_summary: d.change_summary,
        submitted_by: d.changed_by,
        submitted_at: d.created_at,
        campaign_approval_status: c.approval_status,
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
 * Fetch a single detail's content for admin preview.
 * GET /api/campaigns/:campaignId/details/:detailId/preview
 *
 * Auth: Clerk JWT — admin only.
 * Returns: { campaign, detail }
 *
 * No diff visualization — A5 owns that.
 */
app.get(
  '/api/campaigns/:campaignId/details/:detailId/preview',
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

      // 2. Load detail.
      const { data: detail, error: detailErr } = await supabase
        .from('campaign_details')
        .select(
          'id, campaign_id, version, content, change_summary, status, created_at, changed_by'
        )
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
      })
    } catch (err) {
      console.error('Error in detail preview:', err)
      return res.status(500).json({ error: err.message })
    }
  }
)

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
      .select('id, recipient_clerk_user_id, kind, payload, link_url, entity_type, entity_id, read_at, created_at')
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
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('title')
        .eq('id', campaignId)
        .single()
      if (campaign) {
        description = `Campaign donation: ${campaign.title}`
      }
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
app.get('/api/documents/download/:documentId', async (req, res) => {
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
app.post('/api/documents/generate-annual-summary', async (req, res) => {
  try {
    const { donorId, year } = req.body

    if (!donorId || !year) {
      return res.status(400).json({ error: 'Missing donorId or year' })
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
app.get('/api/documents/list/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params
    const { year, type } = req.query

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
  })
}

export default app
