/**
 * Admin — Pending Campaign Reviews (Phase A, Task A4).
 *
 * Lists pending campaign details in two tabs (new vs. edits), with
 * Preview / Approve / Reject actions per row. Diff visualization is
 * deferred to A5; the preview modal renders the raw JSON content.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox, Trash2, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { formatRelativeTime, truncate } from '@/lib/utils'
import { RevisionDiff } from '@/components/admin/RevisionDiff'

type PendingRow = {
  campaign_id: string
  campaign_title: string
  campaign_slug: string
  organization_id: string
  organization_name: string | null
  detail_id: string
  version: number
  detail_status: 'pending_initial_approval' | 'pending_edit_approval'
  change_summary: string | null
  submitted_by: string
  submitted_at: string
  is_initial: boolean
}

type ListResponse = {
  rows: PendingRow[]
  total: number
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

type DeletedRow = {
  id: string
  slug: string
  title: string | null
  deleted_at: string
  deleted_by: string | null
  organization_id: string | null
  organization_name: string | null
}

type DeletedListResponse = {
  rows: DeletedRow[]
  total: number
}

type TabKey = 'initial' | 'edits'

function isTabKey(v: string | null): v is TabKey {
  return v === 'initial' || v === 'edits'
}

export function PendingEditsPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : 'edits'

  const [rows, setRows] = useState<PendingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewRow, setPreviewRow] = useState<PendingRow | null>(null)
  const [previewData, setPreviewData] = useState<DetailPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [rejectRow, setRejectRow] = useState<PendingRow | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [deletedRows, setDeletedRows] = useState<DeletedRow[]>([])
  const [deletedLoading, setDeletedLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get<ListResponse>('/api/admin/pending-edits', getToken)
      setRows(data.rows)
    } catch (err) {
      toast({
        title: 'Failed to load pending reviews',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, toast])

  const fetchDeleted = useCallback(async () => {
    try {
      setDeletedLoading(true)
      const data = await api.get<DeletedListResponse>('/api/admin/deleted-campaigns', getToken)
      setDeletedRows(data.rows)
    } catch (err) {
      toast({
        title: 'Failed to load deleted campaigns',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setDeletedLoading(false)
    }
  }, [getToken, toast])

  const handleRestore = async (row: DeletedRow) => {
    setRestoringId(row.id)
    try {
      await api.post(`/api/admin/campaigns/${row.id}/restore`, {}, getToken)
      // W4-B: audit log — admin restored a soft-deleted campaign.
      if (user?.id) {
        await logAdminActivity(user.id, 'campaign_restored', 'campaign', row.id, {
          restored_by_clerk_id: user.id,
        })
      }
      toast({ title: 'Restored', description: row.title ?? row.slug })
      await fetchDeleted()
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

  const openDeleted = () => {
    setShowDeleted(true)
    fetchDeleted()
  }

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  const initialRows = useMemo(() => rows.filter((r) => r.is_initial), [rows])
  const editsRows = useMemo(() => rows.filter((r) => !r.is_initial), [rows])
  const visibleRows = activeTab === 'initial' ? initialRows : editsRows

  const openPreview = async (row: PendingRow) => {
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

  const openReject = (row: PendingRow) => {
    setRejectRow(row)
    setReviewNote('')
  }

  const closeReject = () => {
    setRejectRow(null)
    setReviewNote('')
  }

  const handleApprove = async (row: PendingRow) => {
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
      toast({ title: 'Approved', description: row.campaign_title })
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
    if (!rejectRow) return
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
      toast({ title: 'Rejected', description: rejectRow.campaign_title })
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pending Campaign Reviews</h1>
          <p className="text-sm text-[#737373]">
            {rows.length} pending detail{rows.length === 1 ? '' : 's'} awaiting action.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openDeleted}>
            <Trash2 className="mr-1 h-4 w-4" />
            View deleted
          </Button>
          <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => isTabKey(v) && setTab(v)}>
        <TabsList>
          <TabsTrigger value="edits" className="gap-2">
            Pending edits
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{editsRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="initial" className="gap-2">
            Pending new campaigns
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">
              {initialRows.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
        </div>
      ) : visibleRows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Inbox className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-[#737373]">
            {activeTab === 'initial' ? 'No new campaigns awaiting review.' : 'No pending edits.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleRows.map((row) => (
            <Card key={row.detail_id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-[#0a0a0a]">{row.campaign_title}</h3>
                    <Badge
                      className={
                        row.is_initial ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }
                    >
                      v{row.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#737373]">
                    {row.organization_name ?? 'Unknown organization'} · submitted{' '}
                    {formatRelativeTime(row.submitted_at)}
                  </p>
                  {row.change_summary && (
                    <p className="text-sm text-[#404040]">{truncate(row.change_summary, 100)}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openPreview(row)}>
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#16a34a] hover:bg-[#15803d]"
                    onClick={() => handleApprove(row)}
                    disabled={actionPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => openReject(row)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
        </DialogContent>
      </Dialog>

      {/* Deleted campaigns modal */}
      <Dialog open={showDeleted} onOpenChange={(open) => !open && setShowDeleted(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Soft-deleted campaigns</DialogTitle>
          </DialogHeader>
          {deletedLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
            </div>
          ) : deletedRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-[#737373]">No soft-deleted campaigns.</p>
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-auto">
              {deletedRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[#e5e5e5] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0a0a0a]">
                      {row.title ?? row.slug}
                    </p>
                    <p className="text-xs text-[#737373]">
                      {row.organization_name ?? 'Unknown organization'} · deleted{' '}
                      {formatRelativeTime(row.deleted_at)}
                    </p>
                    <p className="text-xs text-[#737373]">Deleted by: {row.deleted_by ?? '—'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#1b5858] text-[#1b5858] hover:bg-[#1b5858]/10"
                    onClick={() => handleRestore(row)}
                    disabled={restoringId === row.id}
                  >
                    {restoringId === row.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1 h-4 w-4" />
                    )}
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleted(false)}>
              Close
            </Button>
          </DialogFooter>
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
