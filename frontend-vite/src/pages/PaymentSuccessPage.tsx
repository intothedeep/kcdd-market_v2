/**
 * Payment Success Page
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Heart, LayoutDashboard } from 'lucide-react'

export function PaymentSuccessPage() {
  return (
    <div className="container max-w-2xl py-8">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c4e5c1]">
            <svg
              className="h-8 w-8 text-[#1b5858]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Thank You for Your Donation!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your donation has been processed successfully. The organization will be notified and
            you'll receive a confirmation email shortly.
          </p>

          {/* Tax Receipt Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Tax Receipt Generated</p>
                <p className="mt-1 text-sm text-blue-700">
                  A tax-deductible receipt has been automatically generated for this donation. You
                  can download it from your Tax Documents page.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="flex justify-center gap-3">
            <Link to="/donor/documents">
              <Button className="bg-[#1b5858] hover:bg-[#164444]">
                <FileText className="mr-2 h-4 w-4" />
                View Tax Documents
              </Button>
            </Link>
            <Link to={routes.donor.dashboard}>
              <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
          <Link to={routes.requests} className="text-sm text-muted-foreground hover:text-[#1b5858]">
            <Heart className="mr-1 inline h-3 w-3" />
            Browse more requests to support
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
