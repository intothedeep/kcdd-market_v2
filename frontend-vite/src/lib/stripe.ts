/**
 * Stripe Payment Integration
 *
 * Documentation:
 * - Stripe JS: https://stripe.com/docs/js
 * - Stripe React: https://stripe.com/docs/stripe-js/react
 * - Payment Intents: https://stripe.com/docs/payments/payment-intents
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { stripeConfig, apiConfig } from '@/config'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe instance (singleton)
 */
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripeConfig.publishableKey)
  }
  return stripePromise
}

/**
 * Create a payment intent for a request
 */
export const createPaymentIntent = async (requestId: string, amount: number): Promise<string> => {
  const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.payments.createIntent}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId,
      amount,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create payment intent')
  }

  const data = await response.json()
  return data.clientSecret
}

/**
 * Format amount for Stripe (convert dollars to cents)
 */
export const toStripeAmount = (dollars: number): number => {
  return Math.round(dollars * 100)
}

/**
 * Format amount from Stripe (convert cents to dollars)
 */
export const fromStripeAmount = (cents: number): number => {
  return cents / 100
}
