/**
 * Campaign Donation Page
 *
 * Allows donors to contribute to a campaign with a custom donation amount.
 * Uses Stripe for payment processing.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { apiConfig, routes } from '@/config'
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

      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            id,
            title,
            slug,
            short_description,
            funding_goal,
            amount_raised,
            image_url,
            organization_id,
            organization:organizations(id, name, slug)
          `)
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .single()

        if (error) throw error

        // Add stripe_charges_enabled as false by default until Stripe Connect is set up
        const campaignWithStripe = {
          ...data,
          organization: data.organization ? {
            ...data.organization,
            stripe_charges_enabled: false // Default to false until Stripe Connect migration is applied
          } : null
        }
        setCampaign(campaignWithStripe)
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
      // Create payment intent for campaign donation
      const response = await fetch(`${apiConfig.baseUrl}/api/payments/create-campaign-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: Math.round(amount * 100), // Convert to cents
          donorId: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const { clientSecret } = await response.json()

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.primaryEmailAddress?.emailAddress,
            },
          },
        }
      )

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
      <div className="container py-8 flex justify-center">
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if organization can accept payments
  if (!campaign.organization?.stripe_charges_enabled) {
    return (
      <div className="container py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Support {campaign.title}</h1>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payments Not Available</AlertTitle>
          <AlertDescription>
            This organization hasn't completed their payment setup yet.
            Please check back later or contact the organization directly.
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
    <div className="container py-8 max-w-2xl">
      <Link
        to={`/campaign/${campaign.slug}`}
        className="inline-flex items-center text-[#737373] hover:text-[#0a0a0a] mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaign
      </Link>

      <h1 className="text-3xl font-bold mb-2">Support {campaign.title}</h1>
      <p className="text-[#737373] mb-8">{campaign.short_description}</p>

      <div className="grid gap-6">
        {/* Campaign Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
                  <Heart className="h-8 w-8 text-[#ea580c]" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">{campaign.title}</p>
                <p className="text-sm text-[#737373]">by {campaign.organization?.name}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ea580c] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{formatCurrency(campaign.amount_raised)} raised</span>
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
            <div className="grid grid-cols-3 gap-3 mb-4">
              {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                <Button
                  key={suggestedAmount}
                  type="button"
                  variant={!isCustom && amount === suggestedAmount ? 'default' : 'outline'}
                  className={!isCustom && amount === suggestedAmount
                    ? 'bg-[#ea580c] hover:bg-[#dc4c06]'
                    : ''
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

            <div className="mt-4 p-4 bg-[#f5f5f5] rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-[#737373]">Your Donation</span>
                <span className="text-2xl font-bold text-[#0a0a0a]">
                  {formatCurrency(amount)}
                </span>
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
              <div className="p-4 border rounded-md">
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
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
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
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
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
