/**
 * Campaign Creation Full-Page Form
 * A spacious, full-width form for creating campaigns
 * Designed to be embedded in the dashboard main content area
 */

import { useState, useRef } from 'react'
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
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react'
import { createCampaign, supabase } from '@/lib/supabase'

interface CampaignFormProps {
  organizationId?: string
  onCancel: () => void
  onComplete: () => void
}

interface FAQ {
  question: string
  answer: string
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
  faqs: FAQ[]
}

type FormDataValue = string | string[] | boolean | File | null | FAQ[]

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
    faqs: [{ question: '', answer: '' }],
  })

  const updateFormData = (field: keyof CampaignFormData, value: FormDataValue) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toggleCauseArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      causeAreas: prev.causeAreas.includes(area)
        ? prev.causeAreas.filter(a => a !== area)
        : [...prev.causeAreas, area]
    }))
  }

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }))
  }

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }))
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => 
        i === index ? { ...faq, [field]: value } : faq
      )
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
    if (currentStep === 4 && !formData.campaignStory.trim()) {
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

      // Save FAQs
      const validFaqs = formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim())
      if (validFaqs.length > 0 && campaign) {
        const campaignId = (campaign as { id: string }).id
        const faqsToInsert = validFaqs.map((faq, index) => ({
          campaign_id: campaignId,
          question: faq.question,
          answer: faq.answer,
          sort_order: index,
        }))
        
        await supabase.from('campaign_faqs').insert(faqsToInsert)
      }

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
  const stepTitles = ['Basic Info', 'Cause Areas', 'Funding', 'Your Story', 'FAQs', 'Review']

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 text-[#737373] hover:text-[#0a0a0a] transition-colors mb-2"
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
              <div key={title} className="flex flex-col items-center flex-1">
                <button
                  onClick={() => stepNum < currentStep && goToStep(stepNum)}
                  disabled={stepNum > currentStep}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    isCompleted
                      ? 'bg-[#1b5858] text-white cursor-pointer'
                      : isActive
                        ? 'bg-[#1b5858] text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepNum}
                </button>
                <span className={`text-xs mt-2 ${isActive ? 'text-[#0a0a0a] font-medium' : 'text-[#737373]'}`}>
                  {title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Content */}
      <Card className="p-8 mb-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Basic Information</h2>
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
                <label htmlFor="updates" className="text-sm text-[#737373] cursor-pointer">
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
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Select Cause Areas</h2>
              <p className="text-[#737373]">Choose the categories that best describe your campaign</p>
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
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1b5858] text-white shadow-md'
                        : 'bg-gray-100 text-[#737373] hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {area}
                  </button>
                )
              })}
            </div>

            {formData.causeAreas.length > 0 && (
              <p className="text-sm text-[#1b5858]">
                Selected: {formData.causeAreas.length} cause area{formData.causeAreas.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Funding Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Funding Details</h2>
              <p className="text-[#737373]">Set your goals and provide a brief description</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fundingGoal" className="text-sm font-medium text-[#0a0a0a]">
                  Funding Goal (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#737373] text-lg">$</span>
                  <Input
                    id="fundingGoal"
                    type="number"
                    value={formData.fundingGoal}
                    onChange={(e) => updateFormData('fundingGoal', e.target.value)}
                    placeholder="5,000"
                    className="h-12 text-lg pl-8"
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
                <p className="text-xs text-[#737373]">This will appear on campaign cards ({formData.shortDescription.length}/200 characters)</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Story */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Tell Your Story</h2>
              <p className="text-[#737373]">Share the details that will inspire donors to support your cause</p>
            </div>

            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Campaign Image</label>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1b5858] hover:bg-gray-50 transition-colors cursor-pointer"
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
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="font-medium text-[#0a0a0a]">Click to upload an image</p>
                      <p className="text-sm text-[#737373]">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

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
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Your Campaign Story *
                </label>
                <RichTextEditor
                  value={formData.campaignStory}
                  onChange={(value) => updateFormData('campaignStory', value)}
                  placeholder="Tell your story. Why should people support your campaign? What impact will their donation have? Be specific and personal..."
                  darkMode={false}
                  className="min-h-[300px]"
                />
                <p className="text-xs text-[#737373]">
                  Use the toolbar to format your text, add headings, lists, and links. A compelling story helps donors connect with your cause.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: FAQs */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Frequently Asked Questions</h2>
              <p className="text-[#737373]">Add FAQs to help potential donors understand your campaign better</p>
            </div>

            <div className="space-y-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#1b5858]">
                      <HelpCircle className="h-5 w-5" />
                      <span className="font-medium">FAQ #{index + 1}</span>
                    </div>
                    {formData.faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        aria-label={`Remove FAQ #${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor={`faq-question-${index}`} className="text-sm font-medium text-[#0a0a0a]">
                      Question
                    </label>
                    <Input
                      id={`faq-question-${index}`}
                      value={faq.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      placeholder="e.g., How will my donation be used?"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`faq-answer-${index}`} className="text-sm font-medium text-[#0a0a0a]">
                      Answer
                    </label>
                    <Textarea
                      id={`faq-answer-${index}`}
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      placeholder="Provide a clear, helpful answer..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFaq}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another FAQ
              </Button>
            </div>

            <p className="text-xs text-[#737373]">
              Tip: Common FAQs include questions about how funds will be used, your organization&apos;s mission, and how donors can stay updated.
            </p>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#0a0a0a] mb-1">Review & Launch</h2>
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[#0a0a0a] mb-4">Campaign Summary</h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Campaign Title', value: formData.campaignTitle, editStep: 1 },
                  { label: 'Creator', value: formData.creatorName, editStep: 1 },
                  { label: 'Role', value: formData.roleTitle, editStep: 1 },
                  { label: 'Funding Goal', value: formData.fundingGoal ? `$${parseFloat(formData.fundingGoal).toLocaleString()}` : 'Not set', editStep: 3 },
                  { label: 'Cause Areas', value: formData.causeAreas.length > 0 ? formData.causeAreas.join(', ') : 'None selected', editStep: 2 },
                  { label: 'Story Title', value: formData.storyTitle || 'Not set', editStep: 4 },
                  { label: 'FAQs', value: `${formData.faqs.filter(f => f.question.trim()).length} question(s)`, editStep: 5 },
                  { label: 'Contact Email', value: formData.contactEmail, editStep: 6 },
                ].map((item) => (
                  <div 
                    key={item.label}
                    className="flex items-start justify-between py-3 border-b border-gray-200 last:border-0"
                  >
                    <span className="text-sm text-[#737373]">{item.label}:</span>
                    <div className="flex items-start gap-2 text-right max-w-[60%]">
                      <span className="text-sm font-medium text-[#0a0a0a]">
                        {item.value}
                      </span>
                      {item.editStep !== 6 && (
                        <button
                          onClick={() => goToStep(item.editStep)}
                          className="p-1 text-[#737373] hover:text-[#1b5858] transition-colors flex-shrink-0"
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
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready to launch!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your campaign will be reviewed by our team and typically goes live within 24-48 hours.
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
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>
        
        {currentStep === TOTAL_STEPS ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.contactEmail}
            className="bg-[#1b5858] hover:bg-[#164444] text-white px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-[#1b5858] hover:bg-[#164444] text-white px-8"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

