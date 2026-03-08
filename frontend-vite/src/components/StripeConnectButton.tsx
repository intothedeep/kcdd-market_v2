/**
 * Stripe Connect Button Component
 *
 * Handles Stripe Connect account creation and onboarding for organizations.
 * Displays connection status and provides actions to connect or complete setup.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiConfig } from '@/config'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  CreditCard,
  Building2,
} from 'lucide-react'

interface StripeConnectButtonProps {
  organizationId: string
  stripeAccountId: string | null
  chargesEnabled: boolean
  onboardingComplete: boolean
  onStatusChange?: () => void
}

export function StripeConnectButton({
  organizationId,
  stripeAccountId,
  chargesEnabled,
  onboardingComplete,
  onStatusChange,
}: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create account if doesn't exist
      if (!stripeAccountId) {
        const createRes = await fetch(`${apiConfig.baseUrl}/api/stripe/connect/create-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId }),
        })

        if (!createRes.ok) {
          const data = await createRes.json()
          throw new Error(data.error || 'Failed to create Stripe account')
        }
      }

      // Step 2: Get onboarding link
      const linkRes = await fetch(`${apiConfig.baseUrl}/api/stripe/connect/onboarding-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })

      if (!linkRes.ok) {
        const data = await linkRes.json()
        throw new Error(data.error || 'Failed to generate onboarding link')
      }

      const { url } = await linkRes.json()

      // Redirect to Stripe onboarding
      window.location.href = url
    } catch (err) {
      console.error('Stripe Connect error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fully connected state
  if (onboardingComplete && chargesEnabled) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Stripe Connected
        </Badge>
        <span className="text-sm text-muted-foreground">
          Ready to receive donations
        </span>
      </div>
    )
  }

  // Setup incomplete state
  if (stripeAccountId && !chargesEnabled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Setup Incomplete
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your Stripe account needs additional information before you can accept payments.
        </p>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <Button
          variant="outline"
          onClick={handleConnect}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          Complete Stripe Setup
        </Button>
      </div>
    )
  }

  // Not connected state
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect your Stripe account to start receiving donations directly to your bank account.
      </p>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button
        onClick={handleConnect}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Connect Stripe Account
      </Button>
    </div>
  )
}

/**
 * Stripe Connect Card Component
 *
 * Full card view for payment settings section in dashboard
 */
interface StripeConnectCardProps {
  organizationId: string
  stripeAccountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  onboardingComplete: boolean
  onStatusChange?: () => void
}

export function StripeConnectCard({
  organizationId,
  stripeAccountId,
  chargesEnabled,
  payoutsEnabled,
  onboardingComplete,
  onStatusChange,
}: StripeConnectCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Payment Settings</CardTitle>
        </div>
        <CardDescription>
          Connect your Stripe account to receive donations directly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StripeConnectButton
          organizationId={organizationId}
          stripeAccountId={stripeAccountId}
          chargesEnabled={chargesEnabled}
          onboardingComplete={onboardingComplete}
          onStatusChange={onStatusChange}
        />

        {stripeAccountId && chargesEnabled && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Can accept payments</span>
              <Badge variant={chargesEnabled ? 'default' : 'secondary'} className="gap-1">
                {chargesEnabled ? (
                  <><CheckCircle2 className="h-3 w-3" /> Yes</>
                ) : (
                  'No'
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Can receive payouts</span>
              <Badge variant={payoutsEnabled ? 'default' : 'secondary'} className="gap-1">
                {payoutsEnabled ? (
                  <><CheckCircle2 className="h-3 w-3" /> Yes</>
                ) : (
                  'No'
                )}
              </Badge>
            </div>
          </div>
        )}

        {!stripeAccountId && (
          <p className="text-xs text-muted-foreground pt-2">
            Stripe securely handles all payment processing. A small platform fee applies to each donation.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default StripeConnectButton
