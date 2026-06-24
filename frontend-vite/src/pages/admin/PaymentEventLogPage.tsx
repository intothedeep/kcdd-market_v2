/**
 * Admin — Payment Event Log Page.
 *
 * Debug log viewer over the payment-events stream (every webhook / intent
 * lifecycle event we recorded). Filter by paymentIntentId + eventType, keyset
 * "Load more" pagination.
 *
 * Read-only. Amounts arrive in CENTS.
 *
 * Embeddable inside the admin DashboardPage shell (mirrors DonationsPage):
 * pass `embedded` to drop the page chrome.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox, Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const PAGE_SIZE = 50

interface PaymentEventRow {
  id: string
  created_at: string
  event_type: string
  outcome: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  error_code: string | null
  error_message: string | null
  amount_cents: number | null
  source: string | null
  request_id: string | null
  campaign_id: string | null
  context: unknown
}

interface PaymentEventsResponse {
  rows: PaymentEventRow[]
  nextCursor: string | null
}

function outcomeBadgeClass(outcome: string | null): string {
  switch (outcome) {
    case 'ok':
    case 'success':
    case 'succeeded':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function PaymentEventLogPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { getToken } = useAuth()

  // Filter inputs are kept separate from the applied filters so typing doesn't
  // refetch on every keystroke — the form submit / Apply button commits them.
  const [piInput, setPiInput] = useState('')
  const [eventTypeInput, setEventTypeInput] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [eventType, setEventType] = useState('')

  const [rows, setRows] = useState<PaymentEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buildPath = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams()
      if (paymentIntentId) params.set('paymentIntentId', paymentIntentId)
      if (eventType) params.set('eventType', eventType)
      params.set('limit', String(PAGE_SIZE))
      if (cursor) params.set('cursor', cursor)
      return `/api/admin/payment-events?${params.toString()}`
    },
    [paymentIntentId, eventType]
  )

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<PaymentEventsResponse>(buildPath(), getToken)
      setRows(data.rows)
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment events')
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
      const data = await api.get<PaymentEventsResponse>(buildPath(nextCursor), getToken)
      setRows((prev) => [...prev, ...data.rows])
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more events')
    } finally {
      setLoadingMore(false)
    }
  }

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentIntentId(piInput.trim())
    setEventType(eventTypeInput.trim())
  }

  const clearFilters = () => {
    setPiInput('')
    setEventTypeInput('')
    setPaymentIntentId('')
    setEventType('')
  }

  const hasFilters = paymentIntentId !== '' || eventType !== ''

  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-6xl space-y-6 p-4 md:p-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment Events</h1>
          <p className="text-sm text-[#737373]">
            Debug log of payment lifecycle events. Filter by payment intent or event type.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInitial} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <form
        className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-end"
        onSubmit={applyFilters}
      >
        <div className="space-y-1 sm:min-w-[240px] sm:flex-1">
          <label className="block text-xs font-medium text-[#737373]">Payment Intent ID</label>
          <Input placeholder="pi_…" value={piInput} onChange={(e) => setPiInput(e.target.value)} />
        </div>
        <div className="space-y-1 sm:min-w-[200px]">
          <label className="block text-xs font-medium text-[#737373]">Event type</label>
          <Input
            placeholder="payment_intent.succeeded"
            value={eventTypeInput}
            onChange={(e) => setEventTypeInput(e.target.value)}
          />
        </div>
        <Button type="submit">
          <Search className="mr-1 h-4 w-4" />
          Apply
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </form>

      {error && <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</Card>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Time</TableHead>
              <TableHead>Event type</TableHead>
              <TableHead className="w-[110px]">Outcome</TableHead>
              <TableHead>Payment Intent</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-[#737373]">
                    <Inbox className="h-6 w-6" />
                    <span>No payment events found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-[#737373]">
                    {formatDateTime(row.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.event_type}</TableCell>
                  <TableCell>
                    <Badge className={`${outcomeBadgeClass(row.outcome)} font-normal`}>
                      {row.outcome ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.stripe_payment_intent_id ?? row.stripe_charge_id ?? '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {row.amount_cents != null ? formatCurrency(row.amount_cents / 100) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-[#737373]">{row.source ?? '—'}</TableCell>
                  <TableCell className="text-xs text-red-700">
                    {row.error_code || row.error_message ? (
                      <span title={row.error_message ?? undefined}>
                        {row.error_code ?? ''}
                        {row.error_code && row.error_message ? ': ' : ''}
                        {row.error_message ?? ''}
                      </span>
                    ) : (
                      '—'
                    )}
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
