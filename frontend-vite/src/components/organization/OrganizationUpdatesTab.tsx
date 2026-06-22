/**
 * Organization Updates Tab Component
 * Timeline of posted updates with date, title, image, and content.
 * When isOwner=true: shows compose form for new updates.
 */

import { useState } from 'react'
import { Clock, MessageSquarePlus, Plus, X, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrganizationUpdate, type OrganizationUpdate } from '@/lib/supabase'

interface OrganizationUpdatesTabProps {
  updates: OrganizationUpdate[]
  isOwner?: boolean
  organizationId?: string
  onUpdatesChanged?: () => void
}

export function OrganizationUpdatesTab({
  updates,
  isOwner = false,
  organizationId,
  onUpdatesChanged,
}: OrganizationUpdatesTabProps) {
  const [composing, setComposing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  const openCompose = () => {
    setForm({ title: '', content: '', image_url: '' })
    setError(null)
    setComposing(true)
  }

  const close = () => {
    setComposing(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) return
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createOrganizationUpdate({
        organization_id: organizationId,
        title: form.title.trim(),
        content: form.content.trim(),
        image_url: form.image_url.trim() || undefined,
      })
      close()
      onUpdatesChanged?.()
    } catch (err: any) {
      setError(err.message || 'Failed to post update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#0a0a0a]">Latest Updates</h2>
        {isOwner && !composing && (
          <Button onClick={openCompose} className="bg-[#1b5858] hover:bg-[#103032]" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Post Update
          </Button>
        )}
      </div>

      {isOwner && composing && (
        <Card className="mb-6 border-[#e5e5e5] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Post New Update</h3>
            <button type="button" onClick={close} className="text-[#737373] hover:text-[#0a0a0a]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upd-title">Title *</Label>
              <Input
                id="upd-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's the headline?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upd-content">Content *</Label>
              <textarea
                id="upd-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Share progress, milestones, or impact stories..."
                className="h-40 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upd-image">Image URL (optional)</Label>
              <Input
                id="upd-image"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#1b5858] hover:bg-[#103032]">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Update
              </Button>
            </div>
          </form>
        </Card>
      )}

      {updates.length === 0 ? (
        <div className="rounded-lg bg-[#f5f5f5] py-12 text-center text-[#737373]">
          <MessageSquarePlus className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg">No updates yet.</p>
          <p className="mt-2 text-sm">
            {isOwner
              ? 'Click "Post Update" to share progress with your donors.'
              : 'Check back later for news from this organization.'}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute bottom-0 left-[23px] top-0 w-0.5 bg-[#f5f5f5]" />

          <div className="space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="relative flex gap-6">
                <div className="relative z-10 flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b5858]">
                    <MessageSquarePlus className="h-5 w-5 text-white" />
                  </div>
                </div>

                <Card className="flex-1 border-[#f5f5f5] p-6">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[#737373]">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(update.created_at)}</span>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold text-[#0a0a0a]">{update.title}</h3>

                  {update.image_url && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={update.image_url}
                        alt={update.title}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  )}

                  <p className="whitespace-pre-line text-base leading-relaxed text-[#0a0a0a]">
                    {update.content}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
