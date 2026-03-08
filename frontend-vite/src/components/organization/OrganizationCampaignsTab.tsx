/**
 * Organization Campaigns Tab Component
 * Displays stats cards and request cards with status badges
 */

import { Link } from 'react-router-dom'
import { Target, CheckCircle2, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Request {
  id: string
  description: string
  amount: number
  status: 'open' | 'claimed' | 'fulfilled' | 'denied'
  urgency: 'low' | 'medium' | 'high'
  created_at: string
  cause_area?: { id: string; name: string }
}

interface OrganizationCampaignsTabProps {
  requests: Request[]
}

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-[#d1fae5] text-[#059669]',
    icon: Target,
  },
  claimed: {
    label: 'Claimed',
    className: 'bg-[#dbeafe] text-[#2563eb]',
    icon: Clock,
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'bg-[#f3e8ff] text-[#7c3aed]',
    icon: CheckCircle2,
  },
  denied: {
    label: 'Denied',
    className: 'bg-[#fee2e2] text-[#dc2626]',
    icon: AlertCircle,
  },
}

const urgencyConfig = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  high: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
}

export function OrganizationCampaignsTab({ requests }: OrganizationCampaignsTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Calculate stats
  const openRequests = requests.filter((r) => r.status === 'open')
  const fulfilledRequests = requests.filter((r) => r.status === 'fulfilled')
  const totalRaised = fulfilledRequests.reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-[#f5f5f5] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#d1fae5] p-3">
              <Target className="h-6 w-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0a0a0a]">{openRequests.length}</p>
              <p className="text-sm text-[#737373]">Open Requests</p>
            </div>
          </div>
        </Card>
        <Card className="border-[#f5f5f5] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#f3e8ff] p-3">
              <CheckCircle2 className="h-6 w-6 text-[#7c3aed]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0a0a0a]">{fulfilledRequests.length}</p>
              <p className="text-sm text-[#737373]">Fulfilled</p>
            </div>
          </div>
        </Card>
        <Card className="border-[#f5f5f5] p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-[#ea580c]/10 p-3">
              <DollarSign className="h-6 w-6 text-[#ea580c]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#ea580c]">{formatCurrency(totalRaised)}</p>
              <p className="text-sm text-[#737373]">Total Raised</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Request Cards */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold text-[#0a0a0a]">Technology Requests</h2>

        {requests.length === 0 ? (
          <div className="rounded-lg bg-[#f5f5f5] py-12 text-center text-[#737373]">
            <Target className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg">No requests yet.</p>
            <p className="mt-2 text-sm">This organization hasn't posted any technology requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => {
              const status = statusConfig[request.status]
              const urgency = urgencyConfig[request.urgency]
              const StatusIcon = status.icon

              return (
                <Card
                  key={request.id}
                  className="border-[#f5f5f5] p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge className={`${status.className} hover:${status.className}`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge className={`${urgency.className} hover:${urgency.className}`}>
                          {urgency.label}
                        </Badge>
                        {request.cause_area && (
                          <Badge variant="secondary" className="bg-[#eaeaea] text-[#737373]">
                            {request.cause_area.name}
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 line-clamp-2 text-base text-[#0a0a0a]">
                        {request.description}
                      </p>
                      <p className="text-sm text-[#737373]">
                        Posted {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-[#0a0a0a]">
                        {formatCurrency(request.amount)}
                      </p>
                      {request.status === 'open' && (
                        <Link to={`/checkout/${request.id}`}>
                          <Button
                            size="sm"
                            className="mt-2 rounded-full bg-[#ea580c] text-white hover:bg-[#dc4c06]"
                          >
                            Support
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
