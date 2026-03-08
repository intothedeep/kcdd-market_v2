/**
 * Campaign Creation Multi-Step Form Modal
 * Based on Figma design with 5 steps:
 * 1. Basic Info - Campaign title, creator name, role
 * 2. Cause Areas - Select cause areas
 * 3. Funding Details - Goal and description
 * 4. Story - Logo, title, and story
 * 5. Contact & Review - Final review with editable summary
 */

import { useState, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { X, Loader2, CheckCircle2, Pencil } from 'lucide-react'
import { createCampaign, supabase } from '@/lib/supabase'

interface CampaignFormModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  organizationId?: string
}

interface CampaignFormData {
  // Step 1
  campaignTitle: string
  creatorName: string
  roleTitle: string
  receiveUpdates: boolean

  // Step 2
  causeAreas: string[]

  // Step 3
  fundingGoal: string
  shortDescription: string

  // Step 4
  logoFile: File | null
  storyTitle: string
  campaignStory: string

  // Step 5
  contactEmail: string
}

type FormDataValue = string | string[] | boolean | File | null

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

const TOTAL_STEPS = 5

export function CampaignFormModal({
  isOpen,
  onClose,
  onComplete,
  organizationId,
}: CampaignFormModalProps) {
  const { user } = useUser()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  })

  if (!isOpen) return null

  const updateFormData = (field: keyof CampaignFormData, value: FormDataValue) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleCauseArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      causeAreas: prev.causeAreas.includes(area)
        ? prev.causeAreas.filter((a) => a !== area)
        : [...prev.causeAreas, area],
    }))
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    if (!user?.id || !organizationId) {
      console.error('Missing user or organization ID')
      return
    }

    setIsSubmitting(true)
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

      // Upload logo if provided
      let logoUrl: string | undefined = undefined
      if (formData.logoFile) {
        try {
          const fileExt = formData.logoFile.name.split('.').pop()
          const fileName = `campaign-${user.id}-${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('campaign-images')
            .upload(fileName, formData.logoFile)

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('campaign-images')
              .getPublicUrl(fileName)
            logoUrl = urlData.publicUrl
          }
        } catch (uploadError) {
          console.error('Error uploading logo:', uploadError)
          // Continue even if logo upload fails
        }
      }

      // Create the campaign
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
      })

      onComplete()

      // Navigate to the campaign page
      const campaignSlug = (campaign as { slug?: string }).slug
      if (campaignSlug) {
        navigate(`/campaign/${campaignSlug}`)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
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

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Campaign Title */}
      <div className="space-y-2">
        <label htmlFor="campaignTitle" className="text-sm font-medium text-white">
          Campaign Title:
        </label>
        <Input
          id="campaignTitle"
          value={formData.campaignTitle}
          onChange={(e) => updateFormData('campaignTitle', e.target.value)}
          placeholder="Enter campaign title"
          className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
        />
      </div>

      {/* Creator Name & Role Title */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="creatorName" className="text-sm font-medium text-white">
            Creator Name
          </label>
          <Input
            id="creatorName"
            value={formData.creatorName}
            onChange={(e) => updateFormData('creatorName', e.target.value)}
            placeholder="Your name"
            className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="roleTitle" className="text-sm font-medium text-white">
            Role Title
          </label>
          <Input
            id="roleTitle"
            value={formData.roleTitle}
            onChange={(e) => updateFormData('roleTitle', e.target.value)}
            placeholder="e.g. Executive Director"
            className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
          />
        </div>
      </div>

      {/* Checkbox */}
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="updates"
          checked={formData.receiveUpdates}
          onCheckedChange={(checked) => updateFormData('receiveUpdates', checked === true)}
          className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#103032]"
        />
        <label htmlFor="updates" className="cursor-pointer text-sm text-white">
          I&apos;d like to receive updates and news from the company.
        </label>
      </div>

      {/* Info Alert */}
      <Alert className="border-white/10 bg-[#1b5858] text-white">
        <AlertTitle className="font-bold">Campaign Approval Process</AlertTitle>
        <AlertDescription>
          <strong>CBOs:</strong> Your campaign will be reviewed by our team and approved within
          24-48 hours before going live.
        </AlertDescription>
      </Alert>
    </div>
  )

  // Step 2: Cause Areas
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">What Describes Your Campaign?</h3>
        <p className="text-white/80">Select the cause areas your campaign focuses on</p>
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
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-[#f5f5f5] text-[#171717]'
                  : 'border border-white/30 bg-transparent text-white hover:bg-white/10'
              }`}
            >
              {area}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Step 3: Funding Details
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">Campaign Details</h3>
        <p className="text-white/80">Set your goals and details.</p>
      </div>

      {/* Funding Goal */}
      <div className="space-y-2">
        <label htmlFor="fundingGoal" className="text-sm font-medium text-white">
          Funding Goal (USD) *
        </label>
        <Input
          id="fundingGoal"
          type="number"
          value={formData.fundingGoal}
          onChange={(e) => updateFormData('fundingGoal', e.target.value)}
          placeholder="5000"
          className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
        />
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <label htmlFor="shortDescription" className="text-sm font-medium text-white">
          Short Description *
        </label>
        <Textarea
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => updateFormData('shortDescription', e.target.value)}
          placeholder="Briefly describe what you're raising funds for..."
          rows={4}
          className="resize-none border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
        />
      </div>
    </div>
  )

  // Step 4: Story
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">Campaign Details</h3>
        <p className="text-white/80">Set your goals and details.</p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <label htmlFor="logoUpload" className="text-sm font-medium text-white">
          Organization Logo:
        </label>
        <div
          role="button"
          tabIndex={0}
          onClick={handleFileClick}
          onKeyDown={handleFileKeyDown}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-[#1b5858] bg-[#183c3f] px-2 py-1 transition-colors hover:bg-[#1b5858]/50"
        >
          <span className="rounded-full bg-[#c4e5c1] px-3 py-1 text-sm font-medium text-[#1b5858]">
            Choose file
          </span>
          <span className="flex-1 truncate text-sm text-white/70">
            {formData.logoFile?.name || 'No file chosen'}
          </span>
        </div>
        <input
          id="logoUpload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-sm text-white/60">
          Upload a profile picture (PNG, JPG, GIF supported). Recommended size: 200x200px or larger.
        </p>
      </div>

      {/* Story Title */}
      <div className="space-y-2">
        <label htmlFor="storyTitle" className="text-sm font-medium text-white">
          Story Title *
        </label>
        <Input
          id="storyTitle"
          value={formData.storyTitle}
          onChange={(e) => updateFormData('storyTitle', e.target.value)}
          placeholder="Give your campaign story a headline"
          className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
        />
      </div>

      {/* Campaign Story - Rich Text Editor */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-white">Campaign Story *</span>
        <RichTextEditor
          value={formData.campaignStory}
          onChange={(value) => updateFormData('campaignStory', value)}
          placeholder="Tell your story. Why should people support your campaign? Use formatting to make your story engaging..."
          darkMode={true}
        />
        <p className="text-xs text-white/50">
          Use the toolbar above to format your text, add headings, lists, and links.
        </p>
      </div>
    </div>
  )

  // Step 5: Contact & Review (Dark theme matching other steps)
  const renderStep5 = () => {
    const summaryItems = [
      { label: 'Campaign Title', value: formData.campaignTitle, editStep: 1 },
      { label: 'Creator', value: formData.creatorName, editStep: 1 },
      { label: 'Role', value: formData.roleTitle, editStep: 1 },
      {
        label: 'Funding Goal',
        value: formData.fundingGoal
          ? `$${parseFloat(formData.fundingGoal).toLocaleString()}`
          : '$0',
        editStep: 3,
      },
      {
        label: 'Tags',
        value:
          formData.causeAreas.length > 0
            ? formData.causeAreas.slice(0, 3).join(', ') +
              (formData.causeAreas.length > 3 ? '...' : '')
            : null,
        editStep: 2,
      },
      { label: 'Story Title', value: formData.storyTitle, editStep: 4 },
    ]

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Review & Launch</h3>
          <p className="text-white/80">Review your campaign details before publishing</p>
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <label htmlFor="contactEmail" className="text-sm font-medium text-white">
            Contact Email *
          </label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
            placeholder="your.email@example.com"
            className="border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50 focus-visible:ring-[#1b5858]"
          />
          {!formData.contactEmail && <p className="text-sm text-red-400">Email is required</p>}
        </div>

        {/* Campaign Summary */}
        <div className="rounded-lg border border-[#1b5858] bg-[#183c3f] p-4">
          <h4 className="mb-4 text-lg font-semibold text-white">Campaign Summary</h4>

          <div className="space-y-3">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between border-b border-white/10 py-2 last:border-0"
              >
                <span className="text-sm text-white/60">{item.label}:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{item.value || 'Not set'}</span>
                  <button
                    onClick={() => goToStep(item.editStep)}
                    className="p-1 text-white/40 transition-colors hover:text-[#dbf938]"
                    aria-label={`Edit ${item.label}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready to launch notice */}
        <Alert className="border-[#dbf938]/30 bg-[#1b5858] text-white">
          <CheckCircle2 className="h-4 w-4 text-[#dbf938]" />
          <AlertTitle className="font-bold text-[#dbf938]">Ready to launch</AlertTitle>
          <AlertDescription className="text-white/80">
            Review your information and click &quot;Create Campaign&quot; to publish your campaign.
            Your campaign will be reviewed before going live.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      default:
        return null
    }
  }

  const handleBackdropClick = () => {
    onClose()
  }

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // All steps use the same dark theme modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
      />

      {/* Modal */}
      <div className="relative mx-4 flex h-[600px] w-full max-w-4xl overflow-hidden rounded-[20px] bg-[#1b5858] shadow-2xl">
        {/* Left Panel - White */}
        <div className="hidden w-[400px] items-center justify-center rounded-br-[20px] rounded-tr-[20px] bg-white p-8 md:flex">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#1b5858]">
              <span className="text-4xl font-bold text-white">KC</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#0a0a0a]">Create Campaign</h2>
            <p className="text-[#737373]">
              Step {currentStep} of {TOTAL_STEPS}
            </p>

            {/* Progress dots */}
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-[#1b5858]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Dark */}
        <div className="flex flex-1 flex-col bg-[#103032] p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-white/60 transition-colors hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Mobile step indicator */}
          <div className="mb-6 text-center md:hidden">
            <p className="text-sm text-white/60">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i + 1 <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">{renderCurrentStep()}</div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
            {/* Skip link - only show on steps 2-4 */}
            {currentStep > 1 && currentStep < TOTAL_STEPS && (
              <button
                onClick={handleSkip}
                className="text-sm font-medium text-[#dbf938] underline transition-colors hover:text-[#e5ff66]"
              >
                Skip for now
              </button>
            )}
            {(currentStep === 1 || currentStep === TOTAL_STEPS) && <div />}

            {/* Navigation buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`border-white/30 text-white hover:bg-white/10 ${
                  currentStep === 1 ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                Previous
              </Button>
              {currentStep === TOTAL_STEPS ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.contactEmail}
                  className="bg-[#dbf938] text-[#0a0a0a] hover:bg-[#e5ff66]"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Campaign'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-white text-[#0a0a0a] hover:bg-white/90"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
