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
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

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
    const { organizationId, userId } = req.body

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
        accountId: org.stripe_account_id
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
      message: 'Stripe Connect account created successfully'
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
      expiresAt: accountLink.expires_at
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
      .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    if (!org.stripe_account_id) {
      return res.json({
        connected: false,
        status: 'not_connected',
        message: 'No Stripe account connected'
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
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { requestId, amount, donorId } = req.body

    if (!requestId || !amount) {
      return res.status(400).json({ error: 'Missing requestId or amount' })
    }

    // Verify request exists and get organization's Stripe account
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select(`
        *,
        organization:organizations(
          id, name, stripe_account_id, stripe_charges_enabled
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check if organization can accept payments
    const org = request.organization
    if (!org?.stripe_account_id || !org?.stripe_charges_enabled) {
      return res.status(400).json({
        error: 'Organization not ready to accept payments',
        code: 'STRIPE_NOT_CONNECTED',
        message: 'This organization has not completed their payment setup.'
      })
    }

    // Get platform fee settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['stripe_platform_fee_percent', 'stripe_platform_fee_fixed_cents'])

    const feePercent = parseFloat(
      settings?.find(s => s.key === 'stripe_platform_fee_percent')?.value || '2.9'
    )
    const feeFixed = parseInt(
      settings?.find(s => s.key === 'stripe_platform_fee_fixed_cents')?.value || '30'
    )

    // Calculate platform fee (amount is already in cents)
    const amountCents = Math.round(amount)
    const platformFee = Math.round(amountCents * (feePercent / 100)) + feeFixed
    const organizationAmount = amountCents - platformFee

    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: org.stripe_account_id,
      },
      metadata: {
        requestId,
        organizationId: org.id,
        organizationName: org.name,
        donorId: donorId || 'anonymous',
        platformFee: platformFee.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      description: `Donation for: ${request.description}`,
    })

    // Create payment transaction record
    const { error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        request_id: requestId,
        organization_id: org.id,
        donor_id: donorId || 'anonymous',
        stripe_payment_intent_id: paymentIntent.id,
        amount_total: amountCents,
        platform_fee: platformFee,
        organization_amount: organizationAmount,
        status: 'pending',
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
      }
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
      .select(`
        *,
        organization:organizations(
          id, name, stripe_account_id, stripe_charges_enabled
        )
      `)
      .eq('id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Check if organization can accept payments
    const org = campaign.organization
    if (!org?.stripe_account_id || !org?.stripe_charges_enabled) {
      return res.status(400).json({
        error: 'Organization not ready to accept payments',
        code: 'STRIPE_NOT_CONNECTED',
        message: 'This organization has not completed their payment setup.'
      })
    }

    // Get platform fee settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['stripe_platform_fee_percent', 'stripe_platform_fee_fixed_cents'])

    const feePercent = parseFloat(
      settings?.find(s => s.key === 'stripe_platform_fee_percent')?.value || '2.9'
    )
    const feeFixed = parseInt(
      settings?.find(s => s.key === 'stripe_platform_fee_fixed_cents')?.value || '30'
    )

    // Calculate platform fee (amount is already in cents)
    const amountCents = Math.round(amount)
    const platformFee = Math.round(amountCents * (feePercent / 100)) + feeFixed
    const organizationAmount = amountCents - platformFee

    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: org.stripe_account_id,
      },
      metadata: {
        campaignId,
        campaignTitle: campaign.title,
        organizationId: org.id,
        organizationName: org.name,
        donorId: donorId || 'anonymous',
        platformFee: platformFee.toString(),
        organizationAmount: organizationAmount.toString(),
      },
      description: `Campaign donation: ${campaign.title}`,
    })

    // Create payment transaction record
    const { error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        campaign_id: campaignId,
        organization_id: org.id,
        donor_id: donorId || 'anonymous',
        stripe_payment_intent_id: paymentIntent.id,
        amount_total: amountCents,
        platform_fee: platformFee,
        organization_amount: organizationAmount,
        status: 'pending',
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
      destination: org.stripe_account_id,
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        total: amountCents,
        platformFee,
        organizationAmount,
      }
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
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object)
          break

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object)
          break

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object)
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

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      res.json({ received: true })
    } catch (error) {
      console.error('Error handling webhook:', error)
      res.status(500).json({ error: error.message })
    }
  }
)

// ============================================
// WEBHOOK HANDLERS
// ============================================

async function handlePaymentSucceeded(paymentIntent) {
  const { requestId, organizationId, donorId } = paymentIntent.metadata

  console.log('Payment succeeded:', {
    paymentIntentId: paymentIntent.id,
    requestId,
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

  // Update request status in database
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
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
  })
})

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('🚀 KCDD Market API Server')
  console.log(`📡 Server running on http://localhost:${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Connected' : '❌ Not configured'}`)
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
})

