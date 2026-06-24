/**
 * CBO Campaign Defaults Page
 * Route: /cbo/campaign-defaults
 *
 * W5-B1 (Phase C / Theme 4 — CBO productivity).
 * Lets CBO owners set per-org defaults that prefill the new-campaign
 * form (W5-B2). Logo, social links, phone, and email already come from
 * the organization profile and are intentionally out of scope here.
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

import {
  fetchCauseAreas,
  getOrganizationByUserId,
  getOrganizationDefaults,
  updateOrganizationDefaults,
  type OrganizationDefaults,
} from '@/lib/supabase'
import { routes } from '@/config'

interface CauseArea {
  id: string
  name: string
  description?: string | null
}

const EMPTY_DEFAULTS: OrganizationDefaults = {
  creator_name: '',
  creator_role: '',
  contact_email: '',
  cause_area_ids: [],
}

export function CampaignDefaultsPage() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])

  const [creatorName, setCreatorName] = useState('')
  const [creatorRole, setCreatorRole] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [selectedCauseAreaIds, setSelectedCauseAreaIds] = useState<string[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      navigate(routes.signIn)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const [orgRaw, areas] = await Promise.all([
          getOrganizationByUserId(user!.id),
          fetchCauseAreas(),
        ])
        if (cancelled) return

        // Supabase types infer this as `never` in the current codebase
        // (same pattern as cbo/DashboardPage.tsx); narrow to the shape we use.
        const org = orgRaw as { id: string } | null

        if (!org?.id) {
          toast({
            title: 'Organization not found',
            description: 'Finish CBO setup before configuring campaign defaults.',
            variant: 'destructive',
          })
          navigate(routes.cbo.setup)
          return
        }

        setOrgId(org.id)
        setCauseAreas(areas as CauseArea[])

        const current = await getOrganizationDefaults(org.id)
        const seed = current ?? EMPTY_DEFAULTS
        setCreatorName(seed.creator_name ?? '')
        setCreatorRole(seed.creator_role ?? '')
        setContactEmail(seed.contact_email ?? '')
        setSelectedCauseAreaIds(seed.cause_area_ids ?? [])
      } catch (err) {
        console.error('CampaignDefaultsPage load error:', err)
        if (!cancelled) {
          toast({
            title: 'Failed to load defaults',
            description: 'Refresh and try again.',
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isLoaded, user, navigate, toast])

  function toggleCauseArea(id: string) {
    setSelectedCauseAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    try {
      const payload: OrganizationDefaults = {
        creator_name: creatorName.trim() || undefined,
        creator_role: creatorRole.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        cause_area_ids: selectedCauseAreaIds,
      }

      await updateOrganizationDefaults(orgId, payload)
      toast({
        title: 'Defaults saved',
        description: 'Future campaigns will prefill from these values.',
      })
    } catch (err) {
      console.error('CampaignDefaultsPage save error:', err)
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b5858]" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(routes.cbo.dashboard)}
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Dashboard
        </Button>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[#0a0a0a]">Campaign defaults</h1>
        <p className="text-sm text-[#737373]">
          Set fields that are pre-filled when you create a new campaign. Logo, social links, phone,
          and email come automatically from your organization profile.
        </p>
      </header>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-[#0a0a0a]">Campaign creator</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="creator-name">Creator name</Label>
            <Input
              id="creator-name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="creator-role">Creator role</Label>
            <Input
              id="creator-role"
              value={creatorRole}
              onChange={(e) => setCreatorRole(e.target.value)}
              placeholder="e.g. Program Director"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Contact email for this campaign</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="campaigns@example.org"
            autoComplete="email"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="text-base font-semibold text-[#0a0a0a]">Cause areas</h2>
          <p className="text-xs text-[#737373]">
            Select the cause areas to pre-check on new campaigns.
          </p>
        </div>
        {causeAreas.length === 0 ? (
          <p className="text-sm text-[#737373]">No cause areas available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {causeAreas.map((area) => {
              const selected = selectedCauseAreaIds.includes(area.id)
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleCauseArea(area.id)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selected
                      ? 'border-[#1b5858] bg-[#1b5858] text-white'
                      : 'border-gray-300 bg-white text-[#0a0a0a] hover:bg-gray-50'
                  }`}
                >
                  {area.name}
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(routes.cbo.dashboard)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          Save defaults
        </Button>
      </div>
    </div>
  )
}

export default CampaignDefaultsPage
