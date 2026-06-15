/**
 * Admin — Pending Campaign Reviews (Phase A, Task A4).
 *
 * Lists pending campaign revisions in two tabs (new vs. edits), with
 * Preview / Approve / Reject actions per row. Diff visualization is
 * deferred to A5; the preview modal renders the raw JSON snapshot.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, RefreshCw, Inbox } from 'lucide-react'
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
import { formatRelativeTime, truncate } from '@/lib/utils'

type PendingRow = {
  campaign_id: string
  campaign_title: string
  campaign_slug: string
  organization_id: string
  organization_name: string | null
  revision_id: string
  revision_number: number
  revision_approval_status: 'pending_initial_approval' | 'pending_edit_approval'
  change_summary: string | null
  submitted_by: string
  submitted_at: string
  campaign_approval_status: string
  is_initial: boolean
}

type ListResponse = {
  rows: PendingRow[]
  total: number
}

type RevisionPreview = {
  campaign: Record<string, unknown>
  revision: {
    id: string
    revision_number: number
    snapshot: Record<string, unknown>
    change_summary: string | null
    approval_status: string
    created_at: string
    changed_by: string
  }
}

type TabKey = 'initial' | 'edits'

function isTabKey(v: string | null): v is TabKey {
  return v === 'initial' || v === 'edits'
}

export function PendingEditsPage() {
  const { getToken } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : 'edits'

  const [rows, setRows] = useState<PendingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewRow, setPreviewRow] = useState<PendingRow | null>(null)
  const [previewData, setPreviewData] = useState<RevisionPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [rejectRow, setRejectRow] = useState<PendingRow | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [actionPending, setActionPending] = useState(false)

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
    setPreviewLoading(true)
    try {
      const data = await api.get<RevisionPreview>(
        `/api/campaigns/${row.campaign_id}/revisions/${row.revision_id}/preview`,
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
        `/api/admin/campaigns/${row.campaign_id}/revisions/${row.revision_id}/approve`,
        {},
        getToken
      )
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
        `/api/admin/campaigns/${rejectRow.campaign_id}/revisions/${rejectRow.revision_id}/reject`,
        { review_note: note },
        getToken
      )
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
            {rows.length} pending revision{rows.length === 1 ? '' : 's'} awaiting action.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
            {activeTab === 'initial'
              ? 'No new campaigns awaiting review.'
              : 'No pending edits.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleRows.map((row) => (
            <Card key={row.revision_id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-[#0a0a0a]">{row.campaign_title}</h3>
                    <Badge
                      className={
                        row.is_initial
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      rev #{row.revision_number}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#737373]">
                    {row.organization_name ?? 'Unknown organization'} ·{' '}
                    submitted {formatRelativeTime(row.submitted_at)}
                  </p>
                  {row.change_summary && (
                    <p className="text-sm text-[#404040]">
                      {truncate(row.change_summary, 100)}
                    </p>
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
              {previewRow?.campaign_title} — rev #{previewRow?.revision_number}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {previewData.revision.change_summary && (
                <div>
                  <p className="text-xs font-medium uppercase text-[#737373]">Change summary</p>
                  <p className="text-sm">{previewData.revision.change_summary}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase text-[#737373]">
                  Proposed snapshot (raw JSON — diff view coming in A5)
                </p>
                <pre className="mt-1 max-h-[50vh] overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                  {JSON.stringify(previewData.revision.snapshot, null, 2)}
                </pre>
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

      {/* Reject modal */}
      <Dialog open={!!rejectRow} onOpenChange={(open) => !open && closeReject()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-[#737373]">
              The CBO will see this note. Be specific about what needs to change.
            </p>
            <Textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={5}
              placeholder="Explain why this revision is being rejected…"
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
