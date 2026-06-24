/**
 * Admin — Reconciliation Page.
 *
 * Compares Stripe-side payment records against our local ledger over a time
 * window and surfaces discrepancies (MISSING_LOCAL / MISSING_STRIPE /
 * STATUS_MISMATCH / AMOUNT_MISMATCH / FEE_MISMATCH).
 *
 * Three areas:
 *  - "Run reconciliation" panel — from/to window (defaults to last 24h), POST
 *    /run, surfaces the returned summary. WINDOW_TOO_LARGE is handled with a
 *    friendly message.
 *  - Runs table — GET /runs with keyset "Load more". Row click opens detail.
 *  - Run detail section — GET /runs/:id, discrepancies grouped by type, each
 *    with a "Mark resolved" button (PATCH, optimistic).
 *
 * Embeddable inside the admin DashboardPage shell (mirrors DonationsPage):
 * pass `embedded` to drop the page chrome.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox, Play, ChevronLeft, CheckCircle2 } from 'lucide-react'
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
import { api, ApiError } from '@/lib/api'

const PAGE_SIZE = 50

const DISCREPANCY_TYPES = [
  'MISSING_LOCAL',
  'MISSING_STRIPE',
  'STATUS_MISMATCH',
  'AMOUNT_MISMATCH',
  'FEE_MISMATCH',
] as const

interface RunRow {
  id: string
  window_from: string | null
  window_to: string | null
  status: string
  started_at: string | null
  finished_at: string | null
  stripe_count: number
  local_count: number
  matched_count: number
  discrepancy_count: number
  error_message: string | null
}

interface DiscrepancyRow {
  id: string
  payment_intent_id: string | null
  charge_id: string | null
  type: string
  our_value: string | null
  stripe_value: string | null
  detail: Record<string, unknown> | null
  resolved: boolean
}

interface RunsResponse {
  rows: RunRow[]
  nextCursor: string | null
}

interface RunDetailResponse {
  run: RunRow
  discrepancies: DiscrepancyRow[]
  nextCursor: string | null
}

interface RunSummary {
  runId: string
  status: string
  stripe_count: number
  local_count: number
  matched_count: number
  discrepancy_count: number
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'running':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function discrepancyTypeLabel(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatWindow(from: string | null, to: string | null): string {
  const fmt = (iso: string | null) => {
    if (!iso) return '—'
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }
  return `${fmt(from)} → ${fmt(to)}`
}

// `<input type="datetime-local">` wants 'YYYY-MM-DDTHH:mm' in local time.
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

function defaultWindow(): { from: string; to: string } {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  return { from: toLocalInputValue(dayAgo), to: toLocalInputValue(now) }
}

export function ReconciliationPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { getToken } = useAuth()

  // Run panel state
  const initialWindow = defaultWindow()
  const [from, setFrom] = useState(initialWindow.from)
  const [to, setTo] = useState(initialWindow.to)
  const [running, setRunning] = useState(false)
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  // Runs table state
  const [rows, setRows] = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Detail state
  const [detail, setDetail] = useState<RunDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const buildRunsPath = useCallback((cursor?: string | null) => {
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    if (cursor) params.set('cursor', cursor)
    return `/api/admin/reconciliation/runs?${params.toString()}`
  }, [])

  const loadRuns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<RunsResponse>(buildRunsPath(), getToken)
      setRows(data.rows)
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }, [buildRunsPath, getToken])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const data = await api.get<RunsResponse>(buildRunsPath(nextCursor), getToken)
      setRows((prev) => [...prev, ...data.rows])
      setNextCursor(data.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more runs')
    } finally {
      setLoadingMore(false)
    }
  }

  const runCheck = async () => {
    setRunning(true)
    setRunError(null)
    setRunSummary(null)
    try {
      const body = {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      }
      const summary = await api.post<RunSummary>('/api/admin/reconciliation/run', body, getToken)
      setRunSummary(summary)
      // Refresh the runs table so the new run appears at the top.
      loadRuns()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'WINDOW_TOO_LARGE') {
        setRunError('That time window is too large. Pick a shorter range and try again.')
      } else {
        setRunError(err instanceof Error ? err.message : 'Failed to run reconciliation')
      }
    } finally {
      setRunning(false)
    }
  }

  const openDetail = async (runId: string) => {
    setDetailLoading(true)
    setDetailError(null)
    setDetail(null)
    try {
      const data = await api.get<RunDetailResponse>(
        `/api/admin/reconciliation/runs/${runId}`,
        getToken
      )
      setDetail(data)
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load run detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const markResolved = async (discrepancyId: string, resolved: boolean) => {
    if (!detail) return
    setResolvingId(discrepancyId)
    // Optimistic update.
    const previous = detail
    setDetail({
      ...detail,
      discrepancies: detail.discrepancies.map((d) =>
        d.id === discrepancyId ? { ...d, resolved } : d
      ),
    })
    try {
      await api.patch<DiscrepancyRow>(
        `/api/admin/reconciliation/discrepancies/${discrepancyId}`,
        { resolved },
        getToken
      )
    } catch (err) {
      // Roll back on failure.
      setDetail(previous)
      setDetailError(err instanceof Error ? err.message : 'Failed to update discrepancy')
    } finally {
      setResolvingId(null)
    }
  }

  const groupedDiscrepancies = (rowsToGroup: DiscrepancyRow[]) => {
    const groups = new Map<string, DiscrepancyRow[]>()
    for (const t of DISCREPANCY_TYPES) groups.set(t, [])
    const other: DiscrepancyRow[] = []
    for (const d of rowsToGroup) {
      if (groups.has(d.type)) groups.get(d.type)!.push(d)
      else other.push(d)
    }
    if (other.length > 0) groups.set('OTHER', other)
    return groups
  }

  // ---- Run detail view ----
  if (detail || detailLoading) {
    return (
      <div className={embedded ? 'space-y-6' : 'mx-auto max-w-6xl space-y-6 p-4 md:p-6'}>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDetail(null)
              setDetailError(null)
            }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to runs
          </Button>
        </div>

        {detailLoading ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-full" />
          </Card>
        ) : detail ? (
          <>
            <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
              <span>
                <span className="font-semibold">Window:</span>{' '}
                {formatWindow(detail.run.window_from, detail.run.window_to)}
              </span>
              <Badge className={`${statusBadgeClass(detail.run.status)} font-normal`}>
                {detail.run.status}
              </Badge>
              <span className="text-[#737373]">
                Stripe {detail.run.stripe_count} · Local {detail.run.local_count} · Matched{' '}
                {detail.run.matched_count}
              </span>
              <span className="font-medium text-red-700">
                {detail.run.discrepancy_count} discrepancy(ies)
              </span>
            </Card>

            {detailError && (
              <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {detailError}
              </Card>
            )}

            {detail.discrepancies.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-[#737373]">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>No discrepancies — Stripe and local ledger match.</span>
              </Card>
            ) : (
              Array.from(groupedDiscrepancies(detail.discrepancies).entries())
                .filter(([, items]) => items.length > 0)
                .map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      {discrepancyTypeLabel(type)}
                      <Badge className="bg-gray-100 font-normal text-gray-700">
                        {items.length}
                      </Badge>
                    </h3>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Payment Intent</TableHead>
                            <TableHead>Our value</TableHead>
                            <TableHead>Stripe value</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-mono text-xs">
                                {d.payment_intent_id ?? d.charge_id ?? '—'}
                              </TableCell>
                              <TableCell className="text-xs">{d.our_value ?? '—'}</TableCell>
                              <TableCell className="text-xs">{d.stripe_value ?? '—'}</TableCell>
                              <TableCell className="text-xs text-[#737373]">
                                {d.detail ? JSON.stringify(d.detail) : '—'}
                              </TableCell>
                              <TableCell>
                                {d.resolved ? (
                                  <Badge className="bg-green-100 font-normal text-green-800">
                                    Resolved
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={resolvingId === d.id}
                                    onClick={() => markResolved(d.id, true)}
                                  >
                                    {resolvingId === d.id ? (
                                      <>
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Saving…
                                      </>
                                    ) : (
                                      'Mark resolved'
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                ))
            )}
          </>
        ) : null}
      </div>
    )
  }

  // ---- Runs list view ----
  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-6xl space-y-6 p-4 md:p-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reconciliation</h1>
          <p className="text-sm text-[#737373]">
            Compare Stripe payments against the local ledger and resolve discrepancies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadRuns} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Run panel */}
      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Run reconciliation</h2>
        <div className="flex flex-col flex-wrap items-stretch gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#737373]">From</label>
            <Input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full sm:w-[220px]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#737373]">To</label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full sm:w-[220px]"
            />
          </div>
          <Button onClick={runCheck} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run check
              </>
            )}
          </Button>
        </div>

        {runError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {runError}
          </div>
        )}

        {runSummary && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md bg-gray-50 p-3 text-sm">
            <Badge className={`${statusBadgeClass(runSummary.status)} font-normal`}>
              {runSummary.status}
            </Badge>
            <span className="text-[#737373]">
              Stripe {runSummary.stripe_count} · Local {runSummary.local_count}
            </span>
            <span className="font-medium text-green-700">{runSummary.matched_count} matched</span>
            <span className="font-medium text-red-700">
              {runSummary.discrepancy_count} discrepancy(ies)
            </span>
            <Button variant="outline" size="sm" onClick={() => openDetail(runSummary.runId)}>
              View detail
            </Button>
          </div>
        )}
      </Card>

      {error && <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</Card>}

      {/* Runs table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Window</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="text-right">Stripe</TableHead>
              <TableHead className="text-right">Local</TableHead>
              <TableHead className="text-right">Matched</TableHead>
              <TableHead className="text-right">Discrepancies</TableHead>
              <TableHead className="w-[180px]">Started</TableHead>
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
                    <span>No reconciliation runs yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(row.id)}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatWindow(row.window_from, row.window_to)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${statusBadgeClass(row.status)} font-normal`}
                      title={row.error_message ?? undefined}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{row.stripe_count}</TableCell>
                  <TableCell className="text-right">{row.local_count}</TableCell>
                  <TableCell className="text-right text-green-700">{row.matched_count}</TableCell>
                  <TableCell className="text-right font-medium text-red-700">
                    {row.discrepancy_count}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-[#737373]">
                    {formatDateTime(row.started_at)}
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
