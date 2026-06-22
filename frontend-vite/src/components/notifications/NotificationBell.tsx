/**
 * NotificationBell — admin/CBO in-app notification inbox.
 *
 * Phase A, Task A9 (frontend half) + A11 polling.
 *
 * Behavior:
 *  - Polls GET /api/notifications every POLL_MS while mounted.
 *  - Shows a badge with the unread count.
 *  - On click, opens a dropdown listing the 50 most-recent notifications.
 *  - Clicking an item posts /api/notifications/:id/read (optimistic) and,
 *    if the row has a link_url, navigates to it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Bell } from 'lucide-react'
import { api } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

const POLL_MS = 45_000

type NotificationRow = {
  id: string
  recipient_clerk_user_id: string
  kind: string
  payload: Record<string, unknown> | null
  link_url: string | null
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  created_at: string
}

type ListResponse = {
  rows: NotificationRow[]
  unread_count: number
}

// Map raw `kind` strings to human-readable labels. New kinds fall through
// to a Title-Case fallback so a missing entry never blanks the UI.
const KIND_LABELS: Record<string, string> = {
  campaign_edit_pending: 'Campaign edit pending review',
  campaign_first_approved: 'Campaign approved',
  campaign_edit_approved: 'Campaign edit approved',
  campaign_edit_rejected: 'Campaign edit rejected',
}

function humanizeKind(kind: string): string {
  if (KIND_LABELS[kind]) return KIND_LABELS[kind]
  return kind
    .split('_')
    .map((s) => (s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ')
}

function payloadPreview(payload: Record<string, unknown> | null): string {
  if (!payload) return ''
  const title = (payload as { campaign_title?: unknown }).campaign_title
  if (typeof title === 'string' && title.length > 0) return title
  const note = (payload as { review_note?: unknown }).review_note
  if (typeof note === 'string' && note.length > 0) {
    return note.length > 80 ? `${note.slice(0, 80)}…` : note
  }
  return ''
}

export function NotificationBell() {
  const { isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const fetchInbox = useCallback(async () => {
    if (!isSignedIn) return
    try {
      setLoading(true)
      const data = await api.get<ListResponse>('/api/notifications', getToken)
      setRows(data.rows)
      setUnreadCount(data.unread_count)
    } catch (err) {
      // Polling errors are non-fatal — keep the existing inbox state.
      console.error('[NotificationBell] fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [getToken, isSignedIn])

  // Initial fetch + 45s polling. Cleared on unmount / sign-out.
  useEffect(() => {
    if (!isSignedIn) {
      setRows([])
      setUnreadCount(0)
      return
    }
    fetchInbox()
    const handle = window.setInterval(fetchInbox, POLL_MS)
    return () => window.clearInterval(handle)
  }, [isSignedIn, fetchInbox])

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Optimistic mark-as-read. Updates local state immediately, then fires the
  // POST. On failure the row stays flipped — the next poll will reconcile.
  const markRead = useCallback(
    async (id: string) => {
      const target = rows.find((r) => r.id === id)
      if (!target || target.read_at !== null) return
      const nowIso = new Date().toISOString()
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, read_at: r.read_at ?? nowIso } : r)))
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await api.post<{ updated: boolean }>(`/api/notifications/${id}/read`, {}, getToken)
      } catch (err) {
        console.error('[NotificationBell] mark-read failed:', err)
      }
    },
    [rows, getToken]
  )

  if (!isSignedIn) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0a0a0a] hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ea580c] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <span className="text-xs text-[#737373]">
              {loading ? 'Refreshing…' : `${unreadCount} unread`}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[#737373]">
              No notifications yet.
            </div>
          ) : (
            <ul className="max-h-96 overflow-auto">
              {rows.map((row) => {
                const unread = row.read_at === null
                const label = humanizeKind(row.kind)
                const preview = payloadPreview(row.payload)
                const itemBody = (
                  <div className="flex items-start gap-2 px-3 py-2">
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        unread ? 'bg-[#ea580c]' : 'bg-transparent'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          unread ? 'font-medium text-[#0a0a0a]' : 'text-[#737373]'
                        }`}
                      >
                        {label}
                      </p>
                      {preview && <p className="truncate text-xs text-[#737373]">{preview}</p>}
                      <p className="text-[10px] text-[#a3a3a3]">
                        {formatRelativeTime(row.created_at)}
                      </p>
                    </div>
                  </div>
                )

                const className = `block w-full text-left transition-colors hover:bg-gray-50 ${
                  unread ? '' : 'opacity-70'
                }`

                if (row.link_url) {
                  return (
                    <li key={row.id} className="border-b border-gray-100 last:border-b-0">
                      <Link
                        to={row.link_url}
                        className={className}
                        onClick={() => {
                          markRead(row.id)
                          setOpen(false)
                        }}
                      >
                        {itemBody}
                      </Link>
                    </li>
                  )
                }
                return (
                  <li key={row.id} className="border-b border-gray-100 last:border-b-0">
                    <button type="button" className={className} onClick={() => markRead(row.id)}>
                      {itemBody}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
