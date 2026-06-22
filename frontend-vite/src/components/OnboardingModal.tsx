/**
 * ========================================
 * ONBOARDING MODAL COMPONENT
 * ========================================
 *
 * Location: src/components/OnboardingModal.tsx
 *
 * DESCRIPTION:
 * Multi-step modal that appears after signup to collect organization information.
 * Step 1: Organization details
 * Step 2: Cause areas selection
 * Shows a warning on dashboard if not completed.
 *
 * ========================================
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X, Loader2, AlertCircle } from 'lucide-react'
import {
  saveOrganizationOnboarding,
  saveDonorOnboarding,
  completeOnboarding,
  saveOrganizationCauseAreas,
} from '@/lib/supabase'

// Available cause areas
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
]

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userType: 'cbo' | 'donor'
}

interface OrganizationFormData {
  logo: File | null
  name: string
  website: string
  ein: string
  description: string
  wantsUpdates: boolean
  causeAreas: string[]
}

export function OnboardingModal({ isOpen, onClose, onComplete, userType }: OnboardingModalProps) {
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<OrganizationFormData>({
    logo: null,
    name: '',
    website: '',
    ein: '',
    description: '',
    wantsUpdates: false,
    causeAreas: [],
  })

  // Prefill display name for donors from Clerk profile when modal opens.
  useEffect(() => {
    if (!isOpen) return
    if (formData.name) return
    if (userType !== 'donor') return
    const first = user?.firstName?.trim()
    const last = user?.lastName?.trim()
    const fromName = [first, last].filter(Boolean).join(' ')
    const fromEmail = user?.primaryEmailAddress?.emailAddress?.split('@')[0]
    const guess = fromName || fromEmail
    if (guess) setFormData((prev) => ({ ...prev, name: guess }))
  }, [isOpen, userType, user, formData.name])

  const totalSteps = 2 // Both user types get 2 steps

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }))
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
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
    setError(null)

    // Validate step 1
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError(userType === 'cbo' ? 'Organization name is required' : 'Display name is required')
        return
      }
      if (userType === 'cbo' && !formData.description.trim()) {
        setError('Organization description is required')
        return
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('User not found. Please sign in again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (userType === 'cbo') {
        // Save organization data
        try {
          const org = await saveOrganizationOnboarding(user.id, {
            name: formData.name,
            website: formData.website || null,
            ein: formData.ein || null,
            mission: formData.description,
            email: user.primaryEmailAddress?.emailAddress || '',
            logo: formData.logo,
          })

          // Save cause areas if any selected (non-blocking)
          if (formData.causeAreas.length > 0 && org) {
            try {
              await saveOrganizationCauseAreas(org.id, formData.causeAreas)
            } catch (caError) {
              console.warn('Could not save cause areas:', caError)
            }
          }
        } catch (orgError) {
          console.error('Organization save error:', orgError)
          throw orgError
        }
      } else {
        // Save donor profile data (try, but don't fail onboarding if it fails)
        try {
          await saveDonorOnboarding(user.id, {
            displayName: formData.name,
            website: formData.website || null,
            phone: formData.ein || null,
            bio: formData.description || null,
            email: user.primaryEmailAddress?.emailAddress || '',
            logo: formData.logo,
            causeAreas: formData.causeAreas,
          })
        } catch (donorError) {
          console.warn('Could not save donor profile (table may not exist):', donorError)
          // Continue anyway - we'll just mark onboarding complete
        }
      }

      // Mark onboarding as complete
      await completeOnboarding(user.id, formData.wantsUpdates)

      onComplete()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  // Determine left panel color based on step
  const leftPanelColor = currentStep === 1 ? 'bg-[#c4e5c1]' : 'bg-[#dbf938]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-4 flex h-[720px] w-full max-w-[1114px] overflow-hidden rounded-[10px] bg-[#103032]">
        {/* Left Panel - Decorative (changes color based on step) */}
        <div
          className={`hidden w-[542px] shrink-0 md:block ${leftPanelColor} rounded-br-[20px] rounded-tr-[20px]`}
        />

        {/* Right Panel - Form */}
        <div className="flex w-[572px] flex-1 flex-col overflow-y-auto p-[30px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>

          {/* Step 1: Organization/Profile Details */}
          {currentStep === 1 && (
            <div className="flex flex-1 flex-col gap-[14px]">
              <h2 className="mb-2 text-2xl font-bold text-white">
                {userType === 'cbo'
                  ? 'Complete Your Organization Profile'
                  : 'Complete Your Profile'}
              </h2>

              {/* Logo Upload */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-white">
                  {userType === 'cbo' ? 'Organization Logo:' : 'Profile Picture:'}
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-full border border-[#1b5858] bg-[#183c3f] px-2 transition-colors hover:bg-[#1b5858]/50">
                    <span className="rounded-full bg-[#c4e5c1] px-2 py-0.5 text-sm font-medium text-[#1b5858]">
                      Choose file
                    </span>
                    <span className="truncate text-sm text-white">
                      {formData.logo ? formData.logo.name : 'No file chosen'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm text-white/70">
                  Upload a profile picture (PNG, JPG, GIF supported). Recommended size: 200x200px or
                  larger.
                </p>
              </div>

              {/* Organization/Display Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="org-name" className="text-sm font-medium text-white">
                  {userType === 'cbo' ? 'Organization Name:' : 'Display Name:'}
                </Label>
                <Input
                  id="org-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={
                    userType === 'cbo' ? 'Enter organization name' : 'Enter your display name'
                  }
                  className="h-9 rounded-lg border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50"
                />
              </div>

              {/* Website + EIN for orgs only; donors just see Phone */}
              {userType === 'cbo' ? (
                <div className="flex gap-2.5">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="website" className="text-sm font-medium text-white">
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, website: e.target.value }))
                      }
                      placeholder="https://example.org"
                      className="h-9 rounded-lg border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="ein" className="text-sm font-medium text-white">
                      EIN (TAX ID)
                    </Label>
                    <Input
                      id="ein"
                      value={formData.ein}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ein: e.target.value }))}
                      placeholder="XX-XXXXXXX"
                      className="h-9 rounded-lg border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ein" className="text-sm font-medium text-white">
                    Phone (Optional)
                  </Label>
                  <Input
                    id="ein"
                    value={formData.ein}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ein: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="h-9 rounded-lg border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50"
                  />
                </div>
              )}

              {/* Description (CBO only — donors don't need a bio for tax receipts) */}
              {userType === 'cbo' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" className="text-sm font-medium text-white">
                    Description of Organization:
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Tell us about your organization and its mission..."
                    className="min-h-[80px] resize-none rounded-lg border-[#1b5858] bg-[#183c3f] text-white placeholder:text-white/50"
                  />
                </div>
              )}

              {/* Newsletter Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="updates"
                  checked={formData.wantsUpdates}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, wantsUpdates: checked === true }))
                  }
                  className="mt-0.5 border-white/50 data-[state=checked]:border-[#c4e5c1] data-[state=checked]:bg-[#c4e5c1]"
                />
                <Label htmlFor="updates" className="cursor-pointer text-sm font-medium text-white">
                  I&apos;d like to receive updates and news from the company.
                </Label>
              </div>

              {/* Info Alert */}
              <div className="rounded-[10px] border border-white/10 bg-[#1b5858] p-3">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-[#c4e5c1]" />
                  <div className="text-sm text-white">
                    <p className="mb-1 font-bold">Account Approval Process</p>
                    {userType === 'cbo' ? (
                      <p>
                        <span className="font-bold">Organizations: </span>
                        Your account will be reviewed by our team. You&apos;ll receive an email once
                        approved.
                      </p>
                    ) : (
                      <p>
                        <span className="font-bold">Donors: </span>
                        Your account will be immediately active and ready to browse and claim
                        requests.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cause Areas Selection */}
          {currentStep === 2 && (
            <div className="flex flex-1 flex-col gap-[10px]">
              <div className="flex flex-col gap-2.5">
                <h2 className="text-[30px] font-bold text-white">Preferred Cause Areas</h2>
                <p className="text-base text-white">
                  {userType === 'cbo'
                    ? 'Select the cause areas your organization focuses on'
                    : "Select the cause areas you're interested in supporting"}
                </p>
              </div>

              {/* Cause Area Tags */}
              <div className="mt-2 flex flex-wrap gap-[14px]">
                {CAUSE_AREAS.map((area) => {
                  const isSelected = formData.causeAreas.includes(area)
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleCauseArea(area)}
                      className={`h-9 rounded-lg px-4 text-sm font-semibold shadow-sm transition-all ${
                        isSelected
                          ? 'bg-white text-[#0a0a0a] ring-2 ring-white/70'
                          : 'border-2 border-white/50 bg-transparent text-white hover:border-white/80 hover:bg-white/10'
                      }`}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && <p className="mt-2 text-sm font-medium text-red-400">{error}</p>}

          {/* Footer Buttons */}
          <div className="mt-auto flex items-center justify-between gap-2.5 pt-6">
            {/* Skip Link (only on step 2) */}
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm font-medium text-[#dbf938] underline transition-opacity hover:opacity-80"
              >
                Skip for now
              </button>
            )}

            {/* Skip button for step 1 / spacer */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-white/50 transition-colors hover:text-white/70"
              >
                Skip for now
              </button>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2.5">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                  className="h-9 rounded-lg border-[#e5e5e5] bg-transparent px-4 text-white hover:bg-white/10"
                >
                  Previous
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="h-9 rounded-lg bg-white px-4 text-[#0a0a0a] hover:bg-white/90"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : currentStep < totalSteps ? (
                  'Next'
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
