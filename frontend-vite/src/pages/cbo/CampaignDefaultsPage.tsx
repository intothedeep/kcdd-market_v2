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
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface FaqDraft {
  question: string
  answer: string
}

const EMPTY_DEFAULTS: OrganizationDefaults = {
  creator_name: '',
  creator_role: '',
  contact_email: '',
  cause_area_ids: [],
  faqs: [],
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
  const [faqs, setFaqs] = useState<FaqDraft[]>([])

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
        setFaqs(seed.faqs ?? [])
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

  function addFaq() {
    setFaqs((prev) => [...prev, { question: '', answer: '' }])
  }

  function updateFaq(index: number, field: 'question' | 'answer', value: string) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    try {
      const trimmedFaqs = faqs
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question.length > 0 || f.answer.length > 0)

      const payload: OrganizationDefaults = {
        creator_name: creatorName.trim() || undefined,
        creator_role: creatorRole.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        cause_area_ids: selectedCauseAreaIds,
        faqs: trimmedFaqs,
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

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0a0a0a]">FAQs</h2>
            <p className="text-xs text-[#737373]">
              These FAQs will pre-populate the campaign FAQ section.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFaq}>
            <Plus className="mr-1 h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-sm text-[#737373]">No FAQs yet. Click "Add FAQ" to start.</p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((faq, index) => (
              <li key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#737373]">FAQ #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFaq(index)}
                    aria-label={`Remove FAQ ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`faq-q-${index}`}>Question</Label>
                  <Input
                    id={`faq-q-${index}`}
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Question donors might ask"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`faq-a-${index}`}>Answer</Label>
                  <Textarea
                    id={`faq-a-${index}`}
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="Default answer"
                    rows={3}
                  />
                </div>
              </li>
            ))}
          </ul>
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
