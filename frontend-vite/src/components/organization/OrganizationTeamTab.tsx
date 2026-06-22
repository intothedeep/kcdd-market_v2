/**
 * Organization Team Tab Component
 * Grid of team member cards with avatar, name, role, bio, and email.
 * When isOwner=true: shows add/edit/remove controls.
 */

import { useState } from 'react'
import { Mail, Users, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createOrganizationTeamMember,
  updateOrganizationTeamMember,
  deleteOrganizationTeamMember,
  type OrganizationTeamMember,
} from '@/lib/supabase'

interface OrganizationTeamTabProps {
  members: OrganizationTeamMember[]
  isOwner?: boolean
  organizationId?: string
  onMembersChanged?: () => void
}

type EditingState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; member: OrganizationTeamMember }

const emptyForm = { name: '', role: '', bio: '', email: '', photo_url: '' }

export function OrganizationTeamTab({
  members,
  isOwner = false,
  organizationId,
  onMembersChanged,
}: OrganizationTeamTabProps) {
  const [editing, setEditing] = useState<EditingState>({ mode: 'closed' })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const openAdd = () => {
    setForm(emptyForm)
    setError(null)
    setEditing({ mode: 'add' })
  }

  const openEdit = (member: OrganizationTeamMember) => {
    setForm({
      name: member.name,
      role: member.role || '',
      bio: member.bio || '',
      email: member.email || '',
      photo_url: member.photo_url || '',
    })
    setError(null)
    setEditing({ mode: 'edit', member })
  }

  const close = () => {
    setEditing({ mode: 'closed' })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) return
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (editing.mode === 'add') {
        await createOrganizationTeamMember({
          organization_id: organizationId,
          name: form.name.trim(),
          role: form.role.trim() || undefined,
          bio: form.bio.trim() || undefined,
          email: form.email.trim() || undefined,
          photo_url: form.photo_url.trim() || undefined,
        })
      } else if (editing.mode === 'edit') {
        await updateOrganizationTeamMember(editing.member.id, {
          name: form.name.trim(),
          role: form.role.trim() || undefined,
          bio: form.bio.trim() || undefined,
          email: form.email.trim() || undefined,
          photo_url: form.photo_url.trim() || undefined,
        })
      }
      close()
      onMembersChanged?.()
    } catch (err: any) {
      setError(err.message || 'Failed to save team member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member: OrganizationTeamMember) => {
    if (!confirm(`Remove ${member.name} from the team?`)) return
    try {
      await deleteOrganizationTeamMember(member.id)
      onMembersChanged?.()
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const showForm = editing.mode !== 'closed'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#0a0a0a]">Our Team</h2>
        {isOwner && !showForm && (
          <Button onClick={openAdd} className="bg-[#1b5858] hover:bg-[#103032]" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Team Member
          </Button>
        )}
      </div>

      {isOwner && showForm && (
        <Card className="mb-6 border-[#e5e5e5] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              {editing.mode === 'add' ? 'Add Team Member' : 'Edit Team Member'}
            </h3>
            <button type="button" onClick={close} className="text-[#737373] hover:text-[#0a0a0a]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tm-name">Name *</Label>
                <Input
                  id="tm-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tm-role">Role / Title</Label>
                <Input
                  id="tm-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Executive Director"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tm-email">Email</Label>
              <Input
                id="tm-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@example.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tm-photo">Photo URL</Label>
              <Input
                id="tm-photo"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tm-bio">Bio</Label>
              <textarea
                id="tm-bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A short bio..."
                className="h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#1b5858] hover:bg-[#103032]">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing.mode === 'add' ? 'Add Member' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {members.length === 0 ? (
        <div className="rounded-lg bg-[#f5f5f5] py-12 text-center text-[#737373]">
          <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg">No team members listed.</p>
          <p className="mt-2 text-sm">
            {isOwner
              ? 'Click "Add Team Member" to introduce your team to donors.'
              : 'This organization has not added team members yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card
              key={member.id}
              className="group relative border-[#f5f5f5] p-6 transition-shadow hover:shadow-md"
            >
              {isOwner && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(member)}
                    className="rounded-md p-1.5 text-[#737373] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(member)}
                    className="rounded-md p-1.5 text-[#737373] hover:bg-red-50 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <Avatar className="mb-4 h-20 w-20">
                  {member.photo_url && <AvatarImage src={member.photo_url} alt={member.name} />}
                  <AvatarFallback className="bg-[#1b5858] text-xl text-white">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-lg font-semibold text-[#0a0a0a]">{member.name}</h3>

                {member.role && <p className="mb-3 text-sm text-[#ea580c]">{member.role}</p>}

                {member.bio && (
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#737373]">
                    {member.bio}
                  </p>
                )}

                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 text-sm text-[#1b5858] transition-colors hover:text-[#ea580c]"
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
