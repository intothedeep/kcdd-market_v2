/**
 * Admin — Campaign Management.
 *
 * Full ALL-campaigns management view (refactor of the former Pending
 * Campaigns surface). Sources from GET /api/admin/campaigns which returns
 * every campaign across all statuses including soft-deleted. Tabs filter
 * client-side; per-status action cells reuse the existing
 * preview/approve/reject modals plus soft-delete + restore.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox, Trash2, RotateCcw, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import { logAdminActivity } from '@/lib/supabase'
import { formatCurrency, formatRelativeTime, truncate } from '@/lib/utils'
import { RevisionDiff } from '@/components/admin/RevisionDiff'

type CampaignStatus = 'live' | 'pending_new' | 'pending_edit' | 'rejected' | 'deleted' | 'draft'

type CampaignAdminRow = {
  campaign_id: string
  campaign_title: string | null
  campaign_slug: string
  organization_id: string | null
  organization_name: string | null
  status: CampaignStatus
  is_public: boolean
  detail_id: string | null
  version: number | null
  detail_status: string | null
  change_summary: string | null
  submitted_by: string | null
  submitted_at: string | null
  amount_raised: number
  supporters_count: number
  deleted_at: string | null
  deleted_by: string | null
}

type ListResponse = {
  rows: CampaignAdminRow[]
}

type DetailPreview = {
  campaign: Record<string, unknown>
  detail: {
    id: string
    version: number
    content: Record<string, unknown>
    change_summary: string | null
    status: string
    created_at: string
    changed_by: string
  }
  current_approved_detail: {
    id: string
    version: number
    content: Record<string, unknown>
    created_at: string
  } | null
}

type TabKey = 'all' | 'live' | 'pending_new' | 'pending_edit' | 'rejected' | 'deleted'

const TAB_KEYS: TabKey[] = ['all', 'live', 'pending_new', 'pending_edit', 'rejected', 'deleted']

function isTabKey(v: string | null): v is TabKey {
  return v != null && (TAB_KEYS as string[]).includes(v)
}

const STATUS_BADGE: Record<CampaignStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-green-100 text-green-700' },
  pending_new: { label: 'Pending new', className: 'bg-blue-100 text-blue-700' },
  pending_edit: { label: 'Pending edit', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  deleted: { label: 'Deleted', className: 'bg-gray-200 text-gray-600' },
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600' },
}

export function CampaignsAdminPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : 'all'

  const [rows, setRows] = useState<CampaignAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewRow, setPreviewRow] = useState<CampaignAdminRow | null>(null)
  const [previewData, setPreviewData] = useState<DetailPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [rejectRow, setRejectRow] = useState<CampaignAdminRow | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<ListResponse>('/api/admin/campaigns', getToken)
      setRows(data.rows)
    } catch (err) {
      toast({
        title: 'Failed to load campaigns',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, toast])

  const handleRestore = async (row: CampaignAdminRow) => {
    setRestoringId(row.campaign_id)
    try {
      await api.post(`/api/admin/campaigns/${row.campaign_id}/restore`, {}, getToken)
      // W4-B: audit log — admin restored a soft-deleted campaign.
      if (user?.id) {
        await logAdminActivity(user.id, 'campaign_restored', 'campaign', row.campaign_id, {
          restored_by_clerk_id: user.id,
        })
      }
      toast({ title: 'Restored', description: row.campaign_title ?? row.campaign_slug })
      await fetchList()
    } catch (err) {
      toast({
        title: 'Restore failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setRestoringId(null)
    }
  }

  const handleSoftDelete = async (row: CampaignAdminRow) => {
    if (
      !window.confirm(
        `Soft-delete "${row.campaign_title ?? row.campaign_slug}"? It will be hidden from the public site but can be restored.`
      )
    ) {
      return
    }
    setDeletingId(row.campaign_id)
    try {
      await api.post(`/api/campaigns/${row.campaign_id}/soft-delete`, {}, getToken)
      // W4-B: audit log — admin soft-deleted a campaign.
      if (user?.id) {
        await logAdminActivity(user.id, 'campaign_soft_deleted', 'campaign', row.campaign_id, {
          deleted_by_clerk_id: user.id,
        })
      }
      toast({ title: 'Deleted', description: row.campaign_title ?? row.campaign_slug })
      await fetchList()
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      all: rows.length,
      live: 0,
      pending_new: 0,
      pending_edit: 0,
      rejected: 0,
      deleted: 0,
    }
    for (const r of rows) {
      if (r.status === 'live') c.live += 1
      else if (r.status === 'pending_new') c.pending_new += 1
      else if (r.status === 'pending_edit') c.pending_edit += 1
      else if (r.status === 'rejected') c.rejected += 1
      else if (r.status === 'deleted') c.deleted += 1
    }
    return c
  }, [rows])

  const visibleRows = useMemo(
    () => (activeTab === 'all' ? rows : rows.filter((r) => r.status === activeTab)),
    [rows, activeTab]
  )

  const openPreview = async (row: CampaignAdminRow) => {
    if (!row.detail_id) return
    setPreviewRow(row)
    setPreviewData(null)
    setShowRawJson(false)
    setPreviewLoading(true)
    try {
      const data = await api.get<DetailPreview>(
        `/api/campaigns/${row.campaign_id}/details/${row.detail_id}/preview`,
        getToken
      )
      setPreviewData(data)
    } catch (err) {
      toast({
        title: 'Failed to load preview',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
      setPreviewRow(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreviewRow(null)
    setPreviewData(null)
  }

  const openReject = (row: CampaignAdminRow) => {
    setRejectRow(row)
    setReviewNote('')
  }

  const closeReject = () => {
    setRejectRow(null)
    setReviewNote('')
  }

  const isPendingReview = (row: CampaignAdminRow) =>
    row.status === 'pending_new' || row.status === 'pending_edit'

  const handleApprove = async (row: CampaignAdminRow) => {
    if (!row.detail_id) return
    setActionPending(true)
    try {
      await api.post(
        `/api/admin/campaigns/${row.campaign_id}/details/${row.detail_id}/approve`,
        {},
        getToken
      )
      // W4-B: audit log — admin approved a pending campaign revision.
      if (user?.id) {
        await logAdminActivity(user.id, 'campaign_approved', 'campaign', row.campaign_id, {
          revision_id: row.detail_id,
          before_status: row.detail_status,
          after_status: 'approved',
        })
      }
      toast({ title: 'Approved', description: row.campaign_title ?? row.campaign_slug })
      closePreview()
      fetchList()
    } catch (err) {
      toast({
        title: 'Approve failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setActionPending(false)
    }
  }

  const handleReject = async () => {
    if (!rejectRow || !rejectRow.detail_id) return
    const note = reviewNote.trim()
    if (note.length < 1) {
      toast({
        title: 'Review note required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      })
      return
    }
    setActionPending(true)
    try {
      await api.post(
        `/api/admin/campaigns/${rejectRow.campaign_id}/details/${rejectRow.detail_id}/reject`,
        { review_note: note },
        getToken
      )
      // W4-B: audit log — admin rejected a pending campaign revision.
      if (user?.id) {
        await logAdminActivity(user.id, 'campaign_rejected', 'campaign', rejectRow.campaign_id, {
          revision_id: rejectRow.detail_id,
          reason: note,
        })
      }
      toast({ title: 'Rejected', description: rejectRow.campaign_title ?? rejectRow.campaign_slug })
      closeReject()
      closePreview()
      fetchList()
    } catch (err) {
      toast({
        title: 'Reject failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setActionPending(false)
    }
  }

  const renderAction = (row: CampaignAdminRow) => {
    if (row.status === 'pending_new' || row.status === 'pending_edit') {
      return (
        <Button variant="outline" size="sm" onClick={() => openPreview(row)}>
          Preview
        </Button>
      )
    }
    if (row.status === 'live') {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/campaign/${row.campaign_slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              View
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => handleSoftDelete(row)}
            disabled={deletingId === row.campaign_id}
          >
            {deletingId === row.campaign_id ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      )
    }
    if (row.status === 'deleted') {
      return (
        <Button
          size="sm"
          variant="outline"
          className="border-[#1b5858] text-[#1b5858] hover:bg-[#1b5858]/10"
          onClick={() => handleRestore(row)}
          disabled={restoringId === row.campaign_id}
        >
          {restoringId === row.campaign_id ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
          )}
          Restore
        </Button>
      )
    }
    if ((row.status === 'rejected' || row.status === 'draft') && row.detail_id) {
      return (
        <Button variant="outline" size="sm" onClick={() => openPreview(row)}>
          Preview
        </Button>
      )
    }
    return null
  }

  const emptyMessage =
    activeTab === 'all'
      ? 'No campaigns yet.'
      : `No ${STATUS_BADGE[activeTab].label.toLowerCase()} campaigns.`

  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-5xl space-y-6 p-6'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-[#737373]">Manage all campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => isTabKey(v) && setTab(v)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            Live
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{counts.live}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending_new" className="gap-2">
            Pending new
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">
              {counts.pending_new}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending_edit" className="gap-2">
            Pending edit
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">
              {counts.pending_edit}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejected
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{counts.rejected}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="gap-2">
            Deleted
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{counts.deleted}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[140px]">Raised</TableHead>
              <TableHead className="w-[140px]">Submitted</TableHead>
              <TableHead className="w-[160px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
                  </div>
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <Inbox className="h-10 w-10 text-gray-300" />
                    <p className="text-sm text-[#737373]">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const badge = STATUS_BADGE[row.status]
                return (
                  <TableRow key={row.campaign_id}>
                    <TableCell>
                      <p className="font-medium text-[#0a0a0a]">
                        {row.campaign_title ?? '(untitled)'}
                      </p>
                      {row.change_summary && (
                        <p className="text-xs text-[#737373]">
                          {truncate(row.change_summary, 100)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#404040]">
                      {row.organization_name ?? 'Unknown organization'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge className={badge.className}>{badge.label}</Badge>
                        {row.is_public && row.status === 'pending_edit' && (
                          <Badge className="bg-green-100 text-green-700">Live</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#404040]">
                      <div className="text-[#0a0a0a]">{formatCurrency(row.amount_raised)}</div>
                      <div className="text-xs text-[#737373]">
                        {row.supporters_count} supporters
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-[#737373]">
                      {row.submitted_at ? (
                        <>
                          <div className="text-[#0a0a0a]">
                            {new Date(row.submitted_at).toLocaleDateString()}
                          </div>
                          <div>{formatRelativeTime(row.submitted_at)}</div>
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-shrink-0 items-center justify-end">
                        {renderAction(row)}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Preview modal */}
      <Dialog open={!!previewRow} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {previewRow?.campaign_title} — v{previewRow?.version}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {previewData.detail.change_summary && (
                <div>
                  <p className="text-xs font-medium uppercase text-[#737373]">Change summary</p>
                  <p className="text-sm">{previewData.detail.change_summary}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-[#737373]">
                    {showRawJson ? 'Raw JSON' : 'Proposed changes'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRawJson((v) => !v)}
                    className="text-xs text-[#737373] underline hover:text-[#0a0a0a]"
                  >
                    {showRawJson ? 'View diff' : 'View raw JSON'}
                  </button>
                </div>
                <div className="mt-1 max-h-[50vh] overflow-auto">
                  {showRawJson ? (
                    <pre className="rounded-lg bg-gray-50 p-3 text-xs">
                      {JSON.stringify(previewData.detail.content, null, 2)}
                    </pre>
                  ) : (
                    <RevisionDiff
                      before={previewData.current_approved_detail?.content ?? null}
                      after={previewData.detail.content}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {previewRow && isPendingReview(previewRow) && (
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => previewRow && openReject(previewRow)}
                disabled={actionPending}
              >
                Reject (with note)
              </Button>
              <Button
                size="sm"
                className="bg-[#16a34a] hover:bg-[#15803d]"
                onClick={() => previewRow && handleApprove(previewRow)}
                disabled={actionPending || previewLoading}
              >
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject modal */}
      <Dialog open={!!rejectRow} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject detail</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-[#737373]">
              The CBO will see this note. Be specific about what needs to change.
            </p>
            <Textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={5}
              placeholder="Explain why this detail is being rejected…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeReject} disabled={actionPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={actionPending || reviewNote.trim().length < 1}
            >
              {actionPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
