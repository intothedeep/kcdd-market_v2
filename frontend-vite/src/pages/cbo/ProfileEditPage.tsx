/**
 * CBO Profile Edit Page
 * Route: /cbo/profile/edit
 * Full edit form for organization profile
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  FileText,
  Phone,
  Palette,
  Users,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchOrganizationByUserId,
  updateOrganizationProfile,
  fetchCauseAreas,
  fetchIdentityCategories,
  saveOrganizationCauseAreas,
  saveOrganizationPopulations,
  type OrganizationProfile,
} from '@/lib/supabase'

const ORGANIZATION_TYPES = [
  '501(c)(3) Nonprofit',
  '501(c)(4) Social Welfare',
  'School/Educational Institution',
  'Faith-Based Organization',
  'Community Center',
  'Library',
  'Government Agency',
  'Healthcare Organization',
  'Other',
]

const ORGANIZATION_SIZES = [
  '1-5 employees',
  '6-10 employees',
  '11-25 employees',
  '26-50 employees',
  '51-100 employees',
  '100+ employees',
]

interface FormData {
  name: string
  tagline: string
  mission: string
  organization_type: string
  organization_size: string
  year_founded: string
  program_description: string
  technology_barriers: string
  service_area_description: string
  email: string
  phone: string
  website: string
  address: string
  zipcode: string
  ein: string
  logo_url: string
  cover_image_url: string
  social_links: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export function CBOProfileEdit() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    tagline: '',
    mission: '',
    organization_type: '',
    organization_size: '',
    year_founded: '',
    program_description: '',
    technology_barriers: '',
    service_area_description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    zipcode: '',
    ein: '',
    logo_url: '',
    cover_image_url: '',
    social_links: {},
  })

  // Cause areas and populations
  const [causeAreas, setCauseAreas] = useState<{ id: string; name: string }[]>([])
  const [selectedCauseAreas, setSelectedCauseAreas] = useState<string[]>([])
  const [populations, setPopulations] = useState<{ id: string; name: string }[]>([])
  const [selectedPopulations, setSelectedPopulations] = useState<string[]>([])

  useEffect(() => {
    if (isLoaded && user) {
      loadData()
    }
  }, [isLoaded, user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load organization, cause areas, and populations in parallel
      const [org, causes, pops] = await Promise.all([
        fetchOrganizationByUserId(user.id),
        fetchCauseAreas(),
        fetchIdentityCategories(),
      ])

      setCauseAreas(causes)
      setPopulations(pops)

      if (org) {
        setOrganization(org)

        // Populate form
        setFormData({
          name: org.name || '',
          tagline: org.tagline || '',
          mission: org.mission || '',
          organization_type: org.organization_type || '',
          organization_size: org.organization_size || '',
          year_founded: org.year_founded?.toString() || '',
          program_description: org.program_description || '',
          technology_barriers: org.technology_barriers || '',
          service_area_description: org.service_area_description || '',
          email: org.email || '',
          phone: org.phone || '',
          website: org.website || '',
          address: org.address || '',
          zipcode: org.zipcode || '',
          ein: org.ein || '',
          logo_url: org.logo_url || '',
          cover_image_url: org.cover_image_url || '',
          social_links: org.social_links || {},
        })

        // Set selected cause areas and populations
        setSelectedCauseAreas(org.cause_areas?.map((c) => c.id) || [])
        setSelectedPopulations(org.populations?.map((p) => p.id) || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }))
  }

  const toggleCauseArea = (causeAreaId: string) => {
    setSelectedCauseAreas((prev) =>
      prev.includes(causeAreaId) ? prev.filter((id) => id !== causeAreaId) : [...prev, causeAreaId]
    )
  }

  const togglePopulation = (populationId: string) => {
    setSelectedPopulations((prev) =>
      prev.includes(populationId)
        ? prev.filter((id) => id !== populationId)
        : [...prev, populationId]
    )
  }

  const handleSave = async () => {
    if (!organization) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Update organization profile
      await updateOrganizationProfile(organization.id, {
        name: formData.name,
        tagline: formData.tagline || null,
        mission: formData.mission,
        organization_type: formData.organization_type || null,
        organization_size: formData.organization_size || null,
        year_founded: formData.year_founded ? parseInt(formData.year_founded) : null,
        program_description: formData.program_description || null,
        technology_barriers: formData.technology_barriers || null,
        service_area_description: formData.service_area_description || null,
        email: formData.email,
        phone: formData.phone || null,
        website: formData.website || null,
        address: formData.address || null,
        zipcode: formData.zipcode,
        ein: formData.ein || null,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
        social_links: formData.social_links,
      } as any)

      // Update cause areas
      const causeAreaNames = causeAreas
        .filter((c) => selectedCauseAreas.includes(c.id))
        .map((c) => c.name)
      await saveOrganizationCauseAreas(organization.id, causeAreaNames)

      // Update populations
      await saveOrganizationPopulations(organization.id, selectedPopulations)

      setSuccessMessage('Profile saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <AlertCircle className="mb-6 h-16 w-16 text-amber-500" />
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">No Organization Found</h1>
        <p className="mb-6 text-[#737373]">Please complete your organization setup first.</p>
        <Button onClick={() => navigate('/cbo/setup')}>Go to Setup</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cbo/profile')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
            <h1 className="text-2xl font-bold text-[#0a0a0a]">Edit Organization Profile</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1b5858] hover:bg-[#164444]"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Info Section */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#1b5858]" />
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">Organization Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your organization name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">EIN</label>
                  <Input
                    value={formData.ein}
                    onChange={(e) => handleInputChange('ein', e.target.value)}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Tagline</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="A brief description of your organization"
                  maxLength={300}
                />
                <p className="text-xs text-[#737373]">{formData.tagline.length}/300 characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">Organization Type</label>
                  <Select
                    value={formData.organization_type}
                    onValueChange={(value) => handleInputChange('organization_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">Organization Size</label>
                  <Select
                    value={formData.organization_size}
                    onValueChange={(value) => handleInputChange('organization_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Year Founded</label>
                <Input
                  type="number"
                  value={formData.year_founded}
                  onChange={(e) => handleInputChange('year_founded', e.target.value)}
                  placeholder="e.g., 2015"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </Card>

          {/* Mission & Programs Section */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#1b5858]" />
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Programs & Services</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Mission Statement *</label>
                <Textarea
                  value={formData.mission}
                  onChange={(e) => handleInputChange('mission', e.target.value)}
                  placeholder="Describe your organization's mission..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Program Description</label>
                <Textarea
                  value={formData.program_description}
                  onChange={(e) => handleInputChange('program_description', e.target.value)}
                  placeholder="Describe the programs and services you offer..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Technology Challenges</label>
                <Textarea
                  value={formData.technology_barriers}
                  onChange={(e) => handleInputChange('technology_barriers', e.target.value)}
                  placeholder="What technology challenges does your organization face?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Service Area</label>
                <Textarea
                  value={formData.service_area_description}
                  onChange={(e) => handleInputChange('service_area_description', e.target.value)}
                  placeholder="Describe the geographic area you serve..."
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Cause Areas & Populations */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <Users className="h-5 w-5 text-[#1b5858]" />
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Focus Areas & Populations</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-[#0a0a0a]">Cause Areas</label>
                <div className="flex flex-wrap gap-2">
                  {causeAreas.map((cause) => (
                    <Badge
                      key={cause.id}
                      variant="secondary"
                      className={`cursor-pointer transition-colors ${
                        selectedCauseAreas.includes(cause.id)
                          ? 'bg-[#1b5858] text-white hover:bg-[#164444]'
                          : 'bg-[#f5f5f5] text-[#737373] hover:bg-[#eaeaea]'
                      }`}
                      onClick={() => toggleCauseArea(cause.id)}
                    >
                      {cause.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-[#0a0a0a]">Populations Served</label>
                <div className="grid grid-cols-2 gap-2">
                  {populations.map((pop) => (
                    <label
                      key={pop.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-[#f5f5f5]"
                    >
                      <Checkbox
                        checked={selectedPopulations.includes(pop.id)}
                        onCheckedChange={() => togglePopulation(pop.id)}
                      />
                      <span className="text-sm text-[#0a0a0a]">{pop.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#1b5858]" />
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@organization.org"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a0a0a]">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Website</label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourorganization.org"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Zipcode *</label>
                <Input
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                  placeholder="12345"
                  maxLength={10}
                />
              </div>
            </div>
          </Card>

          {/* Branding */}
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <Palette className="h-5 w-5 text-[#1b5858]" />
              <h2 className="text-lg font-semibold text-[#0a0a0a]">Branding</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Logo URL</label>
                <Input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-[#737373]">
                  Direct URL to your organization's logo image
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">Cover Image URL</label>
                <Input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
                <p className="text-xs text-[#737373]">
                  Banner image for your profile (recommended: 1200x300)
                </p>
              </div>

              <div className="border-t border-[#f5f5f5] pt-4">
                <h3 className="mb-4 text-sm font-medium text-[#0a0a0a]">Social Media Links</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-[#737373]">Facebook</label>
                    <Input
                      type="url"
                      value={formData.social_links.facebook || ''}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#737373]">Twitter/X</label>
                    <Input
                      type="url"
                      value={formData.social_links.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://x.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#737373]">Instagram</label>
                    <Input
                      type="url"
                      value={formData.social_links.instagram || ''}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-[#737373]">LinkedIn</label>
                    <Input
                      type="url"
                      value={formData.social_links.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => navigate('/cbo/profile')}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1b5858] hover:bg-[#164444]"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default CBOProfileEdit
