/**
 * useStripeConnect Hook
 *
 * Manages Stripe Connect status for organizations.
 * Fetches and caches account status, handles refresh after onboarding.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiConfig } from '@/config'

export interface StripeConnectStatus {
  connected: boolean
  accountId?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  onboardingComplete: boolean
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
  }
}

interface UseStripeConnectResult {
  status: StripeConnectStatus | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isRefreshing: boolean
}

export function useStripeConnect(organizationId: string | undefined): UseStripeConnectResult {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const fetchStatus = useCallback(async () => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch(
        `${apiConfig.baseUrl}/api/stripe/connect/status/${organizationId}`
      )

      if (!res.ok) {
        throw new Error('Failed to fetch Stripe status')
      }

      const data = await res.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching Stripe status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
      setStatus(null)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [organizationId])

  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Handle return from Stripe onboarding
  useEffect(() => {
    const stripeParam = searchParams.get('stripe')

    if (stripeParam === 'complete' || stripeParam === 'refresh') {
      setIsRefreshing(true)

      // Clear the URL param
      searchParams.delete('stripe')
      setSearchParams(searchParams, { replace: true })

      // Refetch status after a short delay to allow Stripe to process
      const timer = setTimeout(() => {
        fetchStatus()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [searchParams, setSearchParams, fetchStatus])

  const refetch = useCallback(async () => {
    setIsRefreshing(true)
    await fetchStatus()
  }, [fetchStatus])

  return {
    status,
    loading,
    error,
    refetch,
    isRefreshing,
  }
}

/**
 * Check if an organization can accept payments
 */
export function canAcceptPayments(status: StripeConnectStatus | null): boolean {
  return status?.connected === true && status?.chargesEnabled === true
}

export default useStripeConnect
