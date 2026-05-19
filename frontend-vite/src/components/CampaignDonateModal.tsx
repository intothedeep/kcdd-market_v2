/**
 * CampaignDonateModal
 *
 * In-page donation flow for a campaign. Reuses the same /api/payments/
 * create-campaign-intent endpoint as the standalone CampaignDonatePage but
 * stays inside a Dialog so the donor doesn't lose their place on the
 * campaign detail page. The /campaign/:slug/donate route is kept around as
 * a fallback for direct/share links.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useUser } from '@clerk/clerk-react'
import { Heart, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { apiConfig, routes } from '@/config'
import { formatCurrency } from '@/lib/utils'

const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500]

interface CampaignDonateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: {
    id: string
    title: string
    slug: string
    organization?: {
      stripe_charges_enabled?: boolean
    } | null
  } | null
}

export function CampaignDonateModal({ open, onOpenChange, campaign }: CampaignDonateModalProps) {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useUser()

  const [amount, setAmount] = useState<number>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setAmount(50)
    setCustomAmount('')
    setIsCustom(false)
    setError(null)
    setProcessing(false)
  }

  const handleClose = (next: boolean) => {
    if (processing) return // don't close mid-payment
    if (!next) reset()
    onOpenChange(next)
  }

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

  const bypassConnect = import.meta.env.VITE_STRIPE_BYPASS_CONNECT === 'true'
  const canAcceptPayments = bypassConnect || campaign?.organization?.stripe_charges_enabled

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !campaign) return
    if (amount < 1) {
      setError('Minimum donation is $1')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/payments/create-campaign-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: Math.round(amount * 100),
          donorId: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const { clientSecret } = await response.json()

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

      if (stripeError) throw new Error(stripeError.message)

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onOpenChange(false)
        reset()
        navigate(`${routes.paymentSuccess}?type=campaign&campaign=${campaign.slug}`)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Support {campaign?.title || 'this campaign'}</DialogTitle>
        </DialogHeader>

        {!canAcceptPayments ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payments Not Available</AlertTitle>
            <AlertDescription>
              This organization hasn't completed their payment setup yet.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Choose amount</p>
              <div className="grid grid-cols-3 gap-2">
                {SUGGESTED_AMOUNTS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={!isCustom && amount === s ? 'default' : 'outline'}
                    className={!isCustom && amount === s ? 'bg-[#ea580c] hover:bg-[#dc4c06]' : ''}
                    onClick={() => handleAmountSelect(s)}
                  >
                    ${s}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant={isCustom ? 'default' : 'outline'}
                  className={isCustom ? 'bg-[#ea580c] hover:bg-[#dc4c06]' : ''}
                  onClick={() => setIsCustom(true)}
                >
                  Other
                </Button>
              </div>

              {isCustom && (
                <div className="mt-3 space-y-1">
                  <Label htmlFor="customAmountModal" className="text-xs">
                    Custom amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]">
                      $
                    </span>
                    <Input
                      id="customAmountModal"
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
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#f5f5f5] p-3">
              <span className="text-sm text-[#737373]">Your donation</span>
              <span className="text-xl font-bold text-[#0a0a0a]">{formatCurrency(amount)}</span>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Payment information</p>
              <div className="rounded-md border p-3">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': { color: '#aab7c4' },
                      },
                      invalid: { color: '#9e2146' },
                    },
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleClose(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#ea580c] hover:bg-[#dc4c06]"
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
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
