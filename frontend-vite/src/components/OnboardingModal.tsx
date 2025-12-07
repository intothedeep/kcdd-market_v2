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

import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { saveOrganizationOnboarding, saveDonorOnboarding, completeOnboarding, saveOrganizationCauseAreas } from '@/lib/supabase'

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
    causeAreas: []
  })

  const totalSteps = 2 // Both user types get 2 steps

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }))
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
  }

  const toggleCauseArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      causeAreas: prev.causeAreas.includes(area)
        ? prev.causeAreas.filter(a => a !== area)
        : [...prev.causeAreas, area]
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
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
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
            logo: formData.logo
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
            causeAreas: formData.causeAreas
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
      setCurrentStep(prev => prev + 1)
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
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#103032] rounded-[10px] overflow-hidden flex max-w-[1114px] w-full mx-4 h-[645px]">
        {/* Left Panel - Decorative (changes color based on step) */}
        <div className={`hidden md:block w-[542px] shrink-0 ${leftPanelColor} rounded-tr-[20px] rounded-br-[20px]`} />
        
        {/* Right Panel - Form */}
        <div className="flex-1 p-[30px] overflow-y-auto flex flex-col w-[572px]">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>

          {/* Step 1: Organization/Profile Details */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-[14px] flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {userType === 'cbo' ? 'Complete Your Organization Profile' : 'Complete Your Profile'}
              </h2>

              {/* Logo Upload */}
              <div className="flex flex-col gap-2">
                <Label className="text-white text-sm font-medium">
                  {userType === 'cbo' ? 'Organization Logo:' : 'Profile Picture:'}
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-[#183c3f] border border-[#1b5858] rounded-full h-9 px-2 cursor-pointer hover:bg-[#1b5858]/50 transition-colors w-full">
                    <span className="bg-[#c4e5c1] text-[#1b5858] text-sm font-medium px-2 py-0.5 rounded-full">
                      Choose file
                    </span>
                    <span className="text-white text-sm truncate">
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
                      className="size-9 rounded-full object-cover shrink-0"
                    />
                  )}
                </div>
                <p className="text-white/70 text-sm">
                  Upload a profile picture (PNG, JPG, GIF supported). Recommended size: 200x200px or larger.
                </p>
              </div>

              {/* Organization/Display Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="org-name" className="text-white text-sm font-medium">
                  {userType === 'cbo' ? 'Organization Name:' : 'Display Name:'}
                </Label>
                <Input
                  id="org-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={userType === 'cbo' ? 'Enter organization name' : 'Enter your display name'}
                  className="h-9 bg-[#183c3f] border-[#1b5858] text-white placeholder:text-white/50 rounded-lg"
                />
              </div>

              {/* Website & EIN Row */}
              <div className="flex gap-2.5">
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="website" className="text-white text-sm font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.org"
                    className="h-9 bg-[#183c3f] border-[#1b5858] text-white placeholder:text-white/50 rounded-lg"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="ein" className="text-white text-sm font-medium">
                    {userType === 'cbo' ? 'EIN (TAX ID)' : 'Phone (Optional)'}
                  </Label>
                  <Input
                    id="ein"
                    value={formData.ein}
                    onChange={(e) => setFormData(prev => ({ ...prev, ein: e.target.value }))}
                    placeholder={userType === 'cbo' ? 'XX-XXXXXXX' : '(555) 123-4567'}
                    className="h-9 bg-[#183c3f] border-[#1b5858] text-white placeholder:text-white/50 rounded-lg"
                  />
                </div>
              </div>

              {/* Description/Bio */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-white text-sm font-medium">
                  {userType === 'cbo' ? 'Description of Organization:' : 'Bio (Optional):'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={userType === 'cbo' ? 'Tell us about your organization and its mission...' : 'Tell us a bit about yourself...'}
                  className="min-h-[80px] bg-[#183c3f] border-[#1b5858] text-white placeholder:text-white/50 rounded-lg resize-none"
                />
              </div>

              {/* Newsletter Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="updates"
                  checked={formData.wantsUpdates}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, wantsUpdates: checked === true }))
                  }
                  className="mt-0.5 border-white/50 data-[state=checked]:bg-[#c4e5c1] data-[state=checked]:border-[#c4e5c1]"
                />
                <Label htmlFor="updates" className="text-white text-sm font-medium cursor-pointer">
                  I'd like to receive updates and news from the company.
                </Label>
              </div>

              {/* Info Alert */}
              <div className="bg-[#1b5858] border border-white/10 rounded-[10px] p-3">
                <div className="flex gap-3">
                  <AlertCircle className="size-5 text-[#c4e5c1] shrink-0 mt-0.5" />
                  <div className="text-white text-sm">
                    <p className="font-bold mb-1">Account Approval Process</p>
                    {userType === 'cbo' ? (
                      <p>
                        <span className="font-bold">Organizations: </span>
                        Your account will be reviewed by our team. You'll receive an email once approved.
                      </p>
                    ) : (
                      <p>
                        <span className="font-bold">Donors: </span>
                        Your account will be immediately active and ready to browse and claim requests.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cause Areas Selection */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-[10px] flex-1">
              <div className="flex flex-col gap-2.5">
                <h2 className="text-[30px] font-bold text-white">
                  Preferred Cause Areas
                </h2>
                <p className="text-base text-white">
                  {userType === 'cbo' 
                    ? 'Select the cause areas your organization focuses on'
                    : 'Select the cause areas you\'re interested in supporting'}
                </p>
              </div>

              {/* Cause Area Tags */}
              <div className="flex flex-wrap gap-[14px] mt-2">
                {CAUSE_AREAS.map((area) => {
                  const isSelected = formData.causeAreas.includes(area)
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleCauseArea(area)}
                      className={`h-9 px-4 rounded-lg text-sm font-medium transition-all shadow-sm ${
                        isSelected
                          ? 'bg-[#f5f5f5] text-[#171717]'
                          : 'bg-transparent border border-[#e5e5e5] text-white hover:bg-white/10'
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
          {error && (
            <p className="text-red-400 text-sm font-medium mt-2">{error}</p>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-2.5 mt-6 pt-4">
            {/* Skip Link (only on step 2) */}
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-[#dbf938] text-sm font-medium underline hover:opacity-80 transition-opacity"
              >
                Skip for now
              </button>
            )}
            
            {/* Skip button for step 1 / spacer */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="text-white/50 text-sm font-medium hover:text-white/70 transition-colors"
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
                  className="h-9 px-4 rounded-lg border-[#e5e5e5] text-white bg-transparent hover:bg-white/10"
                >
                  Previous
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="h-9 px-4 rounded-lg bg-white text-[#0a0a0a] hover:bg-white/90"
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
