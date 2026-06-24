/**
 * Campaign Creation Full-Page Form
 * A spacious, full-width form for creating campaigns
 * Designed to be embedded in the dashboard main content area
 */

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Pencil,
  Upload,
  Image,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Globe,
} from 'lucide-react'
import { createCampaign, supabase, getOrganizationDefaults, fetchCauseAreas } from '@/lib/supabase'

interface CampaignFormProps {
  organizationId?: string
  onCancel: () => void
  onComplete: () => void
}

interface SocialLinks {
  facebook: string
  twitter: string
  instagram: string
  linkedin: string
  youtube: string
  tiktok: string
  website: string
}

interface CampaignFormData {
  campaignTitle: string
  creatorName: string
  roleTitle: string
  receiveUpdates: boolean
  causeAreas: string[]
  fundingGoal: string
  shortDescription: string
  logoFile: File | null
  storyTitle: string
  campaignStory: string
  contactEmail: string
  socialLinks: SocialLinks
}

type FormDataValue = string | string[] | boolean | File | null | SocialLinks

const CAUSE_AREAS = [
  'Health & Medicine',
  'Education & Youth',
  'Gender Equality',
  'Mental Health & Wellbeing',
  'Poverty & Hunger Relief',
  'Housing & Homelessness',
  'Environment & Climate Action',
  'Animal Welfare',
  'LGBTQ+ Rights & Inclusion',
  'Children & Families',
  'Human Rights & Civil Liberties',
  'Refugees & Migration Support',
  'Civic Engagement & Democracy',
  'Digital Access',
  'Employment',
  'Senior Services',
]

const TOTAL_STEPS = 6

export function CampaignForm({ organizationId, onCancel, onComplete }: CampaignFormProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CampaignFormData>({
    campaignTitle: '',
    creatorName: user?.fullName || '',
    roleTitle: '',
    receiveUpdates: true,
    causeAreas: [],
    fundingGoal: '',
    shortDescription: '',
    logoFile: null,
    storyTitle: '',
    campaignStory: '',
    contactEmail: user?.primaryEmailAddress?.emailAddress || '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      website: '',
    },
  })

  // W5-B2: Track which fields the user has touched. Any field in this Set
  // will NEVER be overwritten by the late-arriving defaults fetch. The Set
  // is consulted only on prefill; it does not gate normal user editing.
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())

  const markDirty = (field: string) => {
    setDirtyFields((prev) => {
      if (prev.has(field)) return prev
      const next = new Set(prev)
      next.add(field)
      return next
    })
  }

  // W5-B2: On mount, fetch the org's default_campaign_template and prefill
  // the 5 target fields, but ONLY where (a) the field is empty AND (b) the
  // user hasn't touched it yet. cause_area_ids are stored as cause_areas.id
  // (UUIDs) but formData.causeAreas holds cause area NAMES — we fetch the
  // cause_areas table in parallel and translate id -> name client-side so
  // the existing submit pipeline (name -> id lookup in handleSubmit) works.
  //
  // Form is create-only (no mode discriminator on CampaignFormProps), so
  // no edit-mode guard is needed.
  useEffect(() => {
    if (!organizationId) return
    let cancelled = false
    ;(async () => {
      try {
        const [defaults, allCauseAreas] = await Promise.all([
          getOrganizationDefaults(organizationId),
          fetchCauseAreas(),
        ])
        if (cancelled || !defaults) return

        // Translate UUID ids -> names; drop unknown ids.
        const idToName = new Map<string, string>(
          (allCauseAreas as Array<{ id: string; name: string }>).map((ca) => [ca.id, ca.name])
        )
        const defaultCauseNames =
          defaults.cause_area_ids
            ?.map((id) => idToName.get(id))
            .filter((name): name is string => Boolean(name)) ?? []

        setFormData((prev) => {
          const next = { ...prev }
          if (!dirtyFields.has('creatorName') && !prev.creatorName && defaults.creator_name) {
            next.creatorName = defaults.creator_name
          }
          if (!dirtyFields.has('roleTitle') && !prev.roleTitle && defaults.creator_role) {
            next.roleTitle = defaults.creator_role
          }
          if (!dirtyFields.has('contactEmail') && !prev.contactEmail && defaults.contact_email) {
            next.contactEmail = defaults.contact_email
          }
          if (
            !dirtyFields.has('causeAreas') &&
            prev.causeAreas.length === 0 &&
            defaultCauseNames.length > 0
          ) {
            next.causeAreas = defaultCauseNames
          }
          return next
        })
      } catch (err) {
        // Defaults are a UX nicety — never block the form on fetch failure.
        console.error('CampaignForm prefill error:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // dirtyFields is read via closure; intentionally excluded from deps so
    // this effect runs once on mount and does not re-fire on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const updateFormData = (field: keyof CampaignFormData, value: FormDataValue) => {
    markDirty(field)
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toggleCauseArea = (area: string) => {
    markDirty('causeAreas')
    setFormData((prev) => ({
      ...prev,
      causeAreas: prev.causeAreas.includes(area)
        ? prev.causeAreas.filter((a) => a !== area)
        : [...prev.causeAreas, area],
    }))
  }

  const updateSocialLink = (platform: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !formData.campaignTitle.trim()) {
      setError('Please enter a campaign title')
      return
    }
    if (currentStep === 3 && !formData.fundingGoal) {
      setError('Please enter a funding goal')
      return
    }
    if (currentStep === 5 && !formData.campaignStory.trim()) {
      setError('Please write your campaign story')
      return
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('You must be logged in to create a campaign')
      return
    }

    if (!organizationId) {
      setError('Organization not found. Please complete your organization setup first.')
      return
    }

    if (!formData.contactEmail) {
      setError('Please provide a contact email')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Look up cause area IDs from names
      let causeAreaIds: string[] = []
      if (formData.causeAreas.length > 0) {
        const { data: causeAreaRecords } = await supabase
          .from('cause_areas')
          .select('id')
          .in('name', formData.causeAreas)

        if (causeAreaRecords) {
          causeAreaIds = causeAreaRecords.map((ca: { id: string }) => ca.id)
        }
      }

      // Upload logo if provided. If the user picked a file, an upload error must
      // surface (don't silently create the campaign without the logo).
      let logoUrl: string | undefined = undefined
      if (formData.logoFile) {
        const fileExt = formData.logoFile.name.split('.').pop()
        const fileName = `campaign-${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, formData.logoFile)

        if (uploadError) {
          console.error('Error uploading logo:', uploadError)
          throw new Error(uploadError.message)
        }

        const { data: urlData } = supabase.storage
          .from('campaign-images')
          .getPublicUrl(fileName)
        logoUrl = urlData.publicUrl
      }

      // Create the campaign with social links
      const campaign = await createCampaign({
        organization_id: organizationId,
        created_by: user.id,
        title: formData.campaignTitle,
        creator_name: formData.creatorName,
        creator_role: formData.roleTitle,
        cause_area_ids: causeAreaIds,
        funding_goal: parseFloat(formData.fundingGoal) || 0,
        short_description: formData.shortDescription,
        story_title: formData.storyTitle,
        story_content: formData.campaignStory,
        contact_email: formData.contactEmail,
        logo_url: logoUrl,
        facebook_url: formData.socialLinks.facebook || undefined,
        twitter_url: formData.socialLinks.twitter || undefined,
        instagram_url: formData.socialLinks.instagram || undefined,
        linkedin_url: formData.socialLinks.linkedin || undefined,
        youtube_url: formData.socialLinks.youtube || undefined,
        tiktok_url: formData.socialLinks.tiktok || undefined,
        website_url: formData.socialLinks.website || undefined,
      })

      onComplete()

      // Navigate to the campaign page
      const campaignSlug = (campaign as { slug?: string }).slug
      if (campaignSlug) {
        navigate(`/campaign/${campaignSlug}`)
      }
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError('Failed to create campaign. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData('logoFile', file)
    }
  }

  // Step titles for progress indicator
  const stepTitles = [
    'Basic Info',
    'Cause Areas',
    'Funding',
    'Media & Social',
    'Your Story',
    'Review',
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="mb-2 flex items-center gap-2 text-[#737373] transition-colors hover:text-[#0a0a0a]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Create New Campaign</h1>
          <p className="text-[#737373]">Share your cause and connect with donors</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {stepTitles.map((title, index) => {
            const stepNum = index + 1
            const isActive = stepNum === currentStep
            const isCompleted = stepNum < currentStep

            return (
              <div key={title} className="flex flex-1 flex-col items-center">
                <button
                  onClick={() => stepNum < currentStep && goToStep(stepNum)}
                  disabled={stepNum > currentStep}
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-colors ${
                    isCompleted
                      ? 'cursor-pointer bg-[#1b5858] text-white'
                      : isActive
                        ? 'bg-[#1b5858] text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                </button>
                <span
                  className={`mt-2 text-xs ${isActive ? 'font-medium text-[#0a0a0a]' : 'text-[#737373]'}`}
                >
                  {title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <Card className="mb-6 p-8">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Basic Information</h2>
              <p className="text-[#737373]">Tell us about your campaign</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="campaignTitle" className="text-sm font-medium text-[#0a0a0a]">
                  Campaign Title *
                </label>
                <Input
                  id="campaignTitle"
                  value={formData.campaignTitle}
                  onChange={(e) => updateFormData('campaignTitle', e.target.value)}
                  placeholder="Give your campaign a compelling title"
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="creatorName" className="text-sm font-medium text-[#0a0a0a]">
                    Your Name
                  </label>
                  <Input
                    id="creatorName"
                    value={formData.creatorName}
                    onChange={(e) => updateFormData('creatorName', e.target.value)}
                    placeholder="Your full name"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="roleTitle" className="text-sm font-medium text-[#0a0a0a]">
                    Your Role
                  </label>
                  <Input
                    id="roleTitle"
                    value={formData.roleTitle}
                    onChange={(e) => updateFormData('roleTitle', e.target.value)}
                    placeholder="e.g. Executive Director"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="updates"
                  checked={formData.receiveUpdates}
                  onCheckedChange={(checked) => updateFormData('receiveUpdates', checked === true)}
                />
                <label htmlFor="updates" className="cursor-pointer text-sm text-[#737373]">
                  I&apos;d like to receive updates and tips about running successful campaigns
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cause Areas */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Select Cause Areas</h2>
              <p className="text-[#737373]">
                Choose the categories that best describe your campaign
              </p>
            </div>

            <div className="flex flex-wrap gap-3" role="group" aria-label="Cause areas">
              {CAUSE_AREAS.map((area) => {
                const isSelected = formData.causeAreas.includes(area)
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleCauseArea(area)}
                    aria-pressed={isSelected}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1b5858] text-white shadow-md'
                        : 'border border-gray-200 bg-gray-100 text-[#737373] hover:bg-gray-200'
                    }`}
                  >
                    {area}
                  </button>
                )
              })}
            </div>

            {formData.causeAreas.length > 0 && (
              <p className="text-sm text-[#1b5858]">
                Selected: {formData.causeAreas.length} cause area
                {formData.causeAreas.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Funding Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Funding Details</h2>
              <p className="text-[#737373]">Set your goals and provide a brief description</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fundingGoal" className="text-sm font-medium text-[#0a0a0a]">
                  Funding Goal (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#737373]">
                    $
                  </span>
                  <Input
                    id="fundingGoal"
                    type="number"
                    value={formData.fundingGoal}
                    onChange={(e) => updateFormData('fundingGoal', e.target.value)}
                    placeholder="5,000"
                    className="h-12 pl-8 text-lg"
                  />
                </div>
                <p className="text-xs text-[#737373]">Set a realistic goal that you can achieve</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="shortDescription" className="text-sm font-medium text-[#0a0a0a]">
                  Short Description *
                </label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => updateFormData('shortDescription', e.target.value)}
                  placeholder="Briefly describe what you're raising funds for and how it will make an impact..."
                  rows={4}
                  className="resize-none text-base"
                />
                <p className="text-xs text-[#737373]">
                  This will appear on campaign cards ({formData.shortDescription.length}/200
                  characters)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Media & Social Links */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Media & Social Links</h2>
              <p className="text-[#737373]">
                Add images and connect your social media to help donors find you
              </p>
            </div>

            <div className="space-y-6">
              {/* Main Logo/Image Upload */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-[#0a0a0a]">Campaign Logo/Avatar</span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-[#1b5858] hover:bg-gray-50"
                  aria-label="Upload campaign logo or avatar"
                >
                  {formData.logoFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <Image className="h-8 w-8 text-[#1b5858]" />
                      <div className="text-left">
                        <p className="font-medium text-[#0a0a0a]">{formData.logoFile.name}</p>
                        <p className="text-sm text-[#737373]">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                      <p className="font-medium text-[#0a0a0a]">Upload Logo or Avatar</p>
                      <p className="text-sm text-[#737373]">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-[#0a0a0a]">
                  Social Media Links (Optional)
                </h3>
                <p className="text-xs text-[#737373]">
                  Add your social media profiles so donors can follow your work
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1877f2]">
                      <Facebook className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.facebook}
                      onChange={(e) => updateSocialLink('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-black">
                      <Twitter className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.twitter}
                      onChange={(e) => updateSocialLink('twitter', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4]">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.instagram}
                      onChange={(e) => updateSocialLink('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0077b5]">
                      <Linkedin className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yours"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#ff0000]">
                      <Youtube className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.youtube}
                      onChange={(e) => updateSocialLink('youtube', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-black">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-white">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    </div>
                    <Input
                      value={formData.socialLinks.tiktok}
                      onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@yourhandle"
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center gap-3 md:col-span-2">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <Input
                      value={formData.socialLinks.website}
                      onChange={(e) => updateSocialLink('website', e.target.value)}
                      placeholder="https://yourwebsite.org"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Story */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Tell Your Story</h2>
              <p className="text-[#737373]">
                Share the details that will inspire donors to support your cause
              </p>
            </div>

            <div className="space-y-4">
              {/* Story Title */}
              <div className="space-y-2">
                <label htmlFor="storyTitle" className="text-sm font-medium text-[#0a0a0a]">
                  Story Headline
                </label>
                <Input
                  id="storyTitle"
                  value={formData.storyTitle}
                  onChange={(e) => updateFormData('storyTitle', e.target.value)}
                  placeholder="A compelling headline for your story"
                  className="h-12 text-base"
                />
              </div>

              {/* Campaign Story - Rich Text Editor */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-[#0a0a0a]">Your Campaign Story *</span>
                <RichTextEditor
                  value={formData.campaignStory}
                  onChange={(value) => updateFormData('campaignStory', value)}
                  placeholder="Tell your story. Why should people support your campaign? What impact will their donation have? Be specific and personal..."
                  darkMode={false}
                  className="min-h-[300px]"
                />
                <p className="text-xs text-[#737373]">
                  Use the toolbar to format your text, add headings, lists, and links. A compelling
                  story helps donors connect with your cause.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-1 text-xl font-semibold text-[#0a0a0a]">Review & Launch</h2>
              <p className="text-[#737373]">Review your campaign details before publishing</p>
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-sm font-medium text-[#0a0a0a]">
                Contact Email *
              </label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormData('contactEmail', e.target.value)}
                placeholder="your.email@example.com"
                className="h-12"
              />
            </div>

            {/* Campaign Summary */}
            <div className="rounded-lg bg-gray-50 p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#0a0a0a]">Campaign Summary</h3>

              <div className="space-y-3">
                {[
                  { label: 'Campaign Title', value: formData.campaignTitle, editStep: 1 },
                  { label: 'Creator', value: formData.creatorName, editStep: 1 },
                  { label: 'Role', value: formData.roleTitle, editStep: 1 },
                  {
                    label: 'Funding Goal',
                    value: formData.fundingGoal
                      ? `$${parseFloat(formData.fundingGoal).toLocaleString()}`
                      : 'Not set',
                    editStep: 3,
                  },
                  {
                    label: 'Cause Areas',
                    value:
                      formData.causeAreas.length > 0
                        ? formData.causeAreas.join(', ')
                        : 'None selected',
                    editStep: 2,
                  },
                  {
                    label: 'Logo',
                    value: formData.logoFile ? formData.logoFile.name : 'Not set',
                    editStep: 4,
                  },
                  {
                    label: 'Social Links',
                    value:
                      Object.values(formData.socialLinks).filter((v) => v).length > 0
                        ? `${Object.values(formData.socialLinks).filter((v) => v).length} linked`
                        : 'None added',
                    editStep: 4,
                  },
                  { label: 'Story Title', value: formData.storyTitle || 'Not set', editStep: 5 },
                  { label: 'Contact Email', value: formData.contactEmail, editStep: 6 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between border-b border-gray-200 py-3 last:border-0"
                  >
                    <span className="text-sm text-[#737373]">{item.label}:</span>
                    <div className="flex max-w-[60%] items-start gap-2 text-right">
                      <span className="text-sm font-medium text-[#0a0a0a]">{item.value}</span>
                      {item.editStep !== 6 && (
                        <button
                          onClick={() => goToStep(item.editStep)}
                          className="flex-shrink-0 p-1 text-[#737373] transition-colors hover:text-[#1b5858]"
                          aria-label={`Edit ${item.label}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready notice */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready to launch!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your campaign will be reviewed by our team and typically goes live within 24-48
                hours.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </Card>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          className="px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep === TOTAL_STEPS ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.contactEmail}
            className="bg-[#1b5858] px-8 text-white hover:bg-[#164444]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} className="bg-[#1b5858] px-8 text-white hover:bg-[#164444]">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
