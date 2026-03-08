/**
 * Checkout Page with Stripe Integration
 * 
 * Documentation:
 * - Stripe Payment Element: https://stripe.com/docs/payments/payment-element
 * - CardElement: https://stripe.com/docs/stripe-js/react#element-components
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createPaymentIntent, toStripeAmount } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { routes } from '@/config'
import type { Database } from '@/types/database'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Check if organization can accept payments
function canAcceptPayments(organization: any): boolean {
  return organization?.stripe_charges_enabled === true
}

export function CheckoutPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useUser()

  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) return

      try {
        const { data, error } = await supabase
          .from('requests')
          .select('*, organization:organizations(*), cause_area:cause_areas(*)')
          .eq('id', requestId)
          .single()

        if (error) throw error
        setRequest(data)
      } catch (err) {
        console.error('Error loading request:', err)
        setError('Failed to load request')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [requestId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !requestId || !request) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create payment intent
      const clientSecret = await createPaymentIntent(
        requestId,
        toStripeAmount(request.amount)
      )

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
        // Update request status
        const updateData: Database['public']['Tables']['requests']['Update'] = {
          status: 'claimed',
          donor_id: user?.id,
          claimed_at: new Date().toISOString(),
        }
        
        await supabase
          .from('requests')
          .update(updateData)
          .eq('id', requestId)

        // Redirect to success page
        navigate(routes.paymentSuccess)
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
      <div className="container py-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p>Request not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if organization can accept payments
  if (!canAcceptPayments(request.organization)) {
    return (
      <div className="container py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Complete Your Donation</h1>

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
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization:</span>
              <Link
                to={`/organizations/${request.organization?.slug || request.organization?.id}`}
                className="font-semibold text-[#ea580c] hover:underline"
              >
                {request.organization?.name}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request:</span>
              <span className="font-semibold">{request.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-lg">{formatCurrency(request.amount)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Complete Your Donation</h1>

      <div className="grid gap-6">
        {/* Request Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization:</span>
              <Link
                to={`/organizations/${request.organization?.slug || request.organization?.id}`}
                className="font-semibold text-[#ea580c] hover:underline"
              >
                {request.organization?.name}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request:</span>
              <span className="font-semibold">{request.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold text-lg">{formatCurrency(request.amount)}</span>
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
                className="w-full"
                disabled={!stripe || processing}
              >
                {processing ? 'Processing...' : `Donate ${formatCurrency(request.amount)}`}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

