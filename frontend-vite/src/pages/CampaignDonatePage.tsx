/**
 * Campaign Donation Page
 *
 * Allows donors to contribute to a campaign with a custom donation amount.
 * Uses Stripe for payment processing.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { routes } from '@/config'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, ArrowLeft, Loader2, Heart } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Campaign {
  id: string
  title: string
  slug: string
  short_description: string
  funding_goal: number
  amount_raised: number
  image_url: string | null
  organization_id: string
  organization: {
    id: string
    name: string
    slug: string
    stripe_charges_enabled: boolean
  }
}

// Suggested donation amounts
const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500]

export function CampaignDonatePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    const loadCampaign = async () => {
      if (!slug) return

      // H1-4 pattern: shape-validated single .eq() instead of unescaped .or()
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const slugRe = /^[a-z0-9-]+$/i
      const column: 'id' | 'slug' | null = uuidRe.test(slug)
        ? 'id'
        : slugRe.test(slug)
          ? 'slug'
          : null
      if (!column) {
        setError('Campaign not found')
        setLoading(false)
        return
      }

      try {
        // Post-REFB: title / short_description / funding_goal / image_url
        // live in campaign_details.content; campaigns row carries only
        // metadata + runtime counters. Embed latest approved detail.
        const { data, error } = await supabase
          .from('campaigns')
          .select(
            `
            id,
            slug,
            amount_raised,
            organization_id,
            organization:organizations(id, name, slug, stripe_charges_enabled, stripe_account_id),
            detail:campaign_details!inner(content)
          `
          )
          .eq(column, slug)
          .eq('detail.status', 'approved')
          .is('deleted_at', null)
          .single()

        if (error) throw error

        // Hoist content fields onto the campaign object to preserve the
        // existing JSX shape (campaign.title, campaign.short_description, ...).
        const detail = Array.isArray((data as { detail?: unknown }).detail)
          ? ((data as { detail: Array<{ content: Record<string, unknown> }> }).detail[0] ?? null)
          : ((data as unknown as { detail?: { content: Record<string, unknown> } | null }).detail ??
            null)
        const content = (detail?.content ?? {}) as Record<string, unknown>
        const merged = {
          ...(data as Record<string, unknown>),
          title: typeof content.title === 'string' ? content.title : '',
          short_description:
            typeof content.short_description === 'string' ? content.short_description : '',
          funding_goal: typeof content.funding_goal === 'number' ? content.funding_goal : 0,
          image_url: typeof content.image_url === 'string' ? content.image_url : null,
        }

        setCampaign(merged as unknown as Campaign)
      } catch (err) {
        console.error('Error loading campaign:', err)
        setError('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }

    loadCampaign()
  }, [slug])

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount)
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustom(true)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !campaign) {
      return
    }

    if (amount < 1) {
      setError('Minimum donation is $1')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create payment intent for campaign donation via authenticated helper (H5-A)
      const { clientSecret } = await api.post<{ clientSecret: string }>(
        '/api/payments/create-campaign-intent',
        {
          campaignId: campaign.id,
          amount: Math.round(amount * 100), // Convert to cents
          donorId: user?.id,
        },
        getToken
      )

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user?.primaryEmailAddress?.emailAddress,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Redirect to success page
        navigate(`${routes.paymentSuccess}?type=campaign&campaign=${campaign.slug}`)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Campaign not found</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if organization can accept payments. In dev / test-mode the
  // VITE_STRIPE_BYPASS_CONNECT flag lets us complete a fake donation against
  // the platform Stripe account even when the org hasn't onboarded Connect.
  const bypassConnect = import.meta.env.VITE_STRIPE_BYPASS_CONNECT === 'true'
  if (!bypassConnect && !campaign.organization?.stripe_charges_enabled) {
    return (
      <div className="container max-w-2xl py-8">
        <h1 className="mb-8 text-3xl font-bold">Support {campaign.title}</h1>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payments Not Available</AlertTitle>
          <AlertDescription>
            This organization hasn't completed their payment setup yet. Please check back later or
            contact the organization directly.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaign:</span>
              <span className="font-semibold">{campaign.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization:</span>
              <Link
                to={`/organizations/${campaign.organization?.slug || campaign.organization?.id}`}
                className="font-semibold text-[#ea580c] hover:underline"
              >
                {campaign.organization?.name}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-semibold">
                {formatCurrency(campaign.amount_raised)} of {formatCurrency(campaign.funding_goal)}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Go Back
            </Button>
            <Link to={`/campaign/${campaign.slug}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Campaign
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <Link
        to={`/campaign/${campaign.slug}`}
        className="mb-6 inline-flex items-center text-[#737373] hover:text-[#0a0a0a]"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Campaign
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Support {campaign.title}</h1>
      <p className="mb-8 text-[#737373]">{campaign.short_description}</p>

      <div className="grid gap-6">
        {/* Campaign Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-4">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#f5f5f5]">
                  <Heart className="h-8 w-8 text-[#ea580c]" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold">{campaign.title}</p>
                <p className="text-sm text-[#737373]">by {campaign.organization?.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
                <div
                  className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
                  style={{
                    width: `${Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">
                  {formatCurrency(campaign.amount_raised)} raised
                </span>
                <span className="text-[#737373]">of {formatCurrency(campaign.funding_goal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donation Amount Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Amount</CardTitle>
            <CardDescription>Select a donation amount or enter a custom amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-3">
              {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                <Button
                  key={suggestedAmount}
                  type="button"
                  variant={!isCustom && amount === suggestedAmount ? 'default' : 'outline'}
                  className={
                    !isCustom && amount === suggestedAmount ? 'bg-[#ea580c] hover:bg-[#dc4c06]' : ''
                  }
                  onClick={() => handleAmountSelect(suggestedAmount)}
                >
                  ${suggestedAmount}
                </Button>
              ))}
              <Button
                type="button"
                variant={isCustom ? 'default' : 'outline'}
                className={isCustom ? 'bg-[#ea580c] hover:bg-[#dc4c06]' : ''}
                onClick={() => setIsCustom(true)}
              >
                Other
              </Button>
            </div>

            {isCustom && (
              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">$</span>
                  <Input
                    id="customAmount"
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-7"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-[#f5f5f5] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#737373]">Your Donation</span>
                <span className="text-2xl font-bold text-[#0a0a0a]">{formatCurrency(amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Enter your card details to complete the donation</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="rounded-md border p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
              {error && (
                <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-[#ea580c] hover:bg-[#dc4c06]"
                disabled={!stripe || processing || amount < 1}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Donate {formatCurrency(amount)}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default CampaignDonatePage
