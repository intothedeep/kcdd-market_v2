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
import { api } from '@/lib/api'

let stripePromise: Promise<Stripe | null>

type GetToken = (options?: { template?: string }) => Promise<string | null>

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
 *
 * H5-A: routes through authenticated api.post() helper so the backend
 * clerkAuth middleware (added in H1) can validate the Bearer token.
 */
export const createPaymentIntent = async (
  getToken: GetToken,
  params: { requestId: string; amount: number; donorId?: string }
): Promise<string> => {
  const { clientSecret } = await api.post<{ clientSecret: string }>(
    apiConfig.endpoints.payments.createIntent,
    {
      requestId: params.requestId,
      amount: params.amount,
      donorId: params.donorId,
    },
    getToken
  )
  return clientSecret
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
