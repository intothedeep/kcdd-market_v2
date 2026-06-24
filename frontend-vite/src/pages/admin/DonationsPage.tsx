/**
 * Admin — Donations Page.
 *
 * Read-only ledger view over payment_transactions (amounts in CENTS) with a
 * stripe_disputes overlay, served by GET /api/admin/donations. Filter chips
 * by display status, keyset "Load more" pagination, and a totals strip.
 *
 * Embeddable inside the admin DashboardPage shell (mirrors PendingEditsPage /
 * AuditLogPage): pass `embedded` to drop the page chrome.
 *
 * NOTE: Refund is intentionally OUT OF SCOPE. This screen never issues
 * refunds — refunds are performed in Stripe and reconciled via the webhook.
 * The kebab only offers copy-PI-id and a deep link into the Stripe dashboard.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox, MoreVertical, Copy, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 50

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'disputed', label: 'Disputed' },
] as const

interface DonationTarget {
  type: 'campaign' | 'request'
  title: string | null
  slug: string | null
  id: string | null
}

interface DonationDispute {
  status: string
  reason: string | null
  evidenceDueBy: string | null
}

interface DonationRow {
  id: string
  createdAt: string
  status: string
  baseStatus: string
  donorId: string
  donorName: string | null
  donorEmail: string | null
  isAnonymous: boolean
  target: DonationTarget
  organizationName: string | null
  amountTotal: number
  platformFee: number
  netToOrg: number
  currency: string
  paymentIntentId: string
  dispute: DonationDispute | null
}

interface DonationTotals {
  succeededCount: number
  succeededAmount: number
  currency: string
  succeededThisMonth: { amount: number; count: number }
  monthlyTrends: { month: number; year: number; count: number; amount: number }[]
}

interface DonationsResponse {
  rows: DonationRow[]
  nextCursor: string | null
  totals: DonationTotals
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Succeeded':
      return 'bg-green-100 text-green-800'
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'Failed':
      return 'bg-gray-200 text-gray-800'
    case 'Refunded':
      return 'bg-blue-100 text-blue-800'
    case 'Disputed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function DonationsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<DonationRow[]>([])
  const [totals, setTotals] = useState<DonationTotals | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buildPath = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('limit', String(PAGE_SIZE))
      if (cursor) params.set('cursor', cursor)
      return `/api/admin/donations?${params.toString()}`
    },
    [statusFilter]
  )

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<DonationsResponse>(buildPath(), getToken)
      setRows(data.rows)
      setTotals(data.totals)
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load donations')
    } finally {
      setLoading(false)
    }
  }, [buildPath, getToken])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const data = await api.get<DonationsResponse>(buildPath(nextCursor), getToken)
      setRows((prev) => [...prev, ...data.rows])
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more donations')
    } finally {
      setLoadingMore(false)
    }
  }

  const openDisputes = rows.filter((r) => r.status === 'Disputed').length

  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-6xl space-y-6 p-4 md:p-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Donations</h1>
          <p className="text-sm text-[#737373]">
            Payment ledger across all campaigns and requests. Filter by status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInitial} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((chip) => (
          <Button
            key={chip.value || 'all'}
            variant={statusFilter === chip.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(chip.value)}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {/* Totals strip */}
      {totals && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span>
            <span className="font-semibold">Succeeded:</span> {totals.succeededCount} ·{' '}
            {formatCurrency(totals.succeededAmount / 100)}
          </span>
          <span className="text-[#737373]">
            This month: {totals.succeededThisMonth.count} ·{' '}
            {formatCurrency(totals.succeededThisMonth.amount / 100)}
          </span>
          {openDisputes > 0 && (
            <span className="font-medium text-red-700">{openDisputes} open dispute(s)</span>
          )}
        </Card>
      )}

      {error && <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</Card>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead className="text-right">Net to org</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[48px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-[#737373]">
                    <Inbox className="h-6 w-6" />
                    <span>No donations found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-[#737373]">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    {row.isAnonymous ? (
                      <Badge className="bg-gray-100 font-normal text-gray-700">Anonymous</Badge>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.donorName ?? '—'}</p>
                        {row.donorEmail && (
                          <p className="truncate text-xs text-[#737373]">{row.donorEmail}</p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{row.target.title ?? '—'}</span>
                      <Badge className="bg-gray-100 font-normal capitalize text-gray-600">
                        {row.target.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium">
                    {formatCurrency(row.amountTotal / 100)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-[#737373]">
                    {formatCurrency(row.platformFee / 100)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-[#737373]">
                    {formatCurrency(row.netToOrg / 100)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusBadgeClass(row.status)} font-normal`}
                      title={
                        row.dispute
                          ? `Dispute: ${row.dispute.reason ?? 'unknown'}${
                              row.dispute.evidenceDueBy
                                ? ` · evidence due ${formatDate(row.dispute.evidenceDueBy)}`
                                : ''
                            }`
                          : undefined
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Refund deliberately omitted — read-only ledger; refunds
                            happen in Stripe and reconcile via webhook. */}
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard?.writeText(row.paymentIntentId)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Payment Intent ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `https://dashboard.stripe.com/test/payments/${row.paymentIntentId}`,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Stripe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {nextCursor && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
