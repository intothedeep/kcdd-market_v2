/**
 * Admin — Audit Log Page (Phase A, Task A8 / Wave 4 brief W4-B).
 *
 * Chronological timeline of `admin_activity_log` rows. Filterable by
 * `action` and `entity_type`. Pages by `sinceIso` cursor (oldest item's
 * created_at) — fetches the next batch of 50 strictly older than that.
 *
 * The underlying RLS policy (see migration 20260618000000_admin_activity_log_soft_delete_writes.sql)
 * grants SELECT to admin users only, so this page expects a successful
 * fetch only when the caller is `user_type = 'admin'`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Inbox } from 'lucide-react'
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
import { fetchAdminActivity, fetchUserProfilesByIds, type AdminActivity } from '@/lib/supabase'

const PAGE_SIZE = 50

// Known action values for the dropdown. Keep in sync with logAdminActivity
// call sites (PendingEditsPage, UsersPage, admin DashboardPage settings).
const ACTION_OPTIONS = [
  'settings_updated',
  'campaign_approved',
  'campaign_rejected',
  'campaign_restored',
  'campaign_soft_deleted',
  'user_verified',
  'user_unverified',
  'user_role_changed',
] as const

const ENTITY_OPTIONS = ['settings', 'campaign', 'user'] as const

function truncateId(id: string | null, len = 8): string {
  if (!id) return '—'
  return id.length > len ? `${id.slice(0, len)}…` : id
}

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function actionBadgeClass(action: string): string {
  if (action.startsWith('campaign_approved') || action === 'user_verified') {
    return 'bg-green-100 text-green-800'
  }
  if (action === 'user_role_changed') {
    return 'bg-rose-100 text-rose-800'
  }
  if (action.startsWith('campaign_rejected') || action === 'user_unverified') {
    return 'bg-red-100 text-red-800'
  }
  if (action.startsWith('campaign_restored')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (action.startsWith('campaign_soft_deleted')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-gray-100 text-gray-800'
}

export function AuditLogPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [items, setItems] = useState<AdminActivity[]>([])
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // W7-12: admin_id -> profile map, accumulated across pages.
  const [adminProfiles, setAdminProfiles] = useState<
    Record<string, { email: string | null; name: string | null }>
  >({})

  // W7-12: fetch profiles for any admin_ids not yet in the map and merge in.
  const mergeAdminProfiles = useCallback(
    async (loaded: AdminActivity[]) => {
      const missing = [...new Set(loaded.map((r) => r.admin_id))].filter(
        (id) => !(id in adminProfiles)
      )
      if (missing.length === 0) return
      const fetched = await fetchUserProfilesByIds(missing)
      setAdminProfiles((prev) => ({ ...prev, ...fetched }))
    },
    [adminProfiles]
  )

  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchAdminActivity({
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      })
      setItems(rows)
      setHasMore(rows.length === PAGE_SIZE)
      await mergeAdminProfiles(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter, mergeAdminProfiles])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = async () => {
    const oldest = items[items.length - 1]
    if (!oldest) return
    setLoadingMore(true)
    try {
      const next = await fetchAdminActivity({
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        sinceIso: oldest.created_at,
      })
      setItems((prev) => [...prev, ...next])
      setHasMore(next.length === PAGE_SIZE)
      await mergeAdminProfiles(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more entries')
    } finally {
      setLoadingMore(false)
    }
  }

  const detailsPreviews = useMemo(() => {
    return items.map((row) => {
      if (!row.details) return ''
      try {
        return JSON.stringify(row.details)
      } catch {
        return String(row.details)
      }
    })
  }, [items])

  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-6xl space-y-6 p-4 md:p-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Audit Log</h1>
          <p className="text-sm text-[#737373]">
            Chronological record of admin actions. Filter by action or entity type.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInitial} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-action-filter" className="text-xs font-medium text-[#737373]">
              Action
            </label>
            <select
              id="audit-action-filter"
              className="h-9 rounded-md border border-[#e5e5e5] bg-white px-2 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audit-entity-filter" className="text-xs font-medium text-[#737373]">
              Entity type
            </label>
            <select
              id="audit-entity-filter"
              className="h-9 rounded-md border border-[#e5e5e5] bg-white px-2 text-sm"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              <option value="">All entities</option>
              {ENTITY_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          {(actionFilter || entityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionFilter('')
                setEntityFilter('')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {error && <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</Card>}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[180px]">Action</TableHead>
              <TableHead className="w-[110px]">Entity</TableHead>
              <TableHead className="w-[120px]">Entity ID</TableHead>
              <TableHead className="w-[120px]">Admin</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-[#737373]">
                    <Inbox className="h-6 w-6" />
                    <span>No admin activity recorded</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-[#737373]">
                    {formatTimestamp(row.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${actionBadgeClass(row.action)} font-normal`}>
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#0a0a0a]">{row.entity_type ?? '—'}</TableCell>
                  <TableCell
                    className="font-mono text-xs text-[#737373]"
                    title={row.entity_id ?? ''}
                  >
                    {truncateId(row.entity_id)}
                  </TableCell>
                  <TableCell className="text-xs text-[#737373]" title={row.admin_id}>
                    {adminProfiles[row.admin_id]?.email ??
                      adminProfiles[row.admin_id]?.name ??
                      truncateId(row.admin_id)}
                  </TableCell>
                  <TableCell>
                    <code
                      className="block max-w-[420px] truncate font-mono text-xs text-[#0a0a0a]"
                      title={detailsPreviews[idx]}
                    >
                      {detailsPreviews[idx] || '—'}
                    </code>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {hasMore && !loading && (
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
