/**
 * Organization Profile Page (Public)
 * Route: /organizations/:id
 * Displays full organization profile for donors to view
 * Owners can edit inline like the campaign page
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowLeft, Loader2, ExternalLink, Pencil, Save, X, Plus, Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  OrganizationHero,
  OrganizationSidebar,
  OrganizationAboutTab,
  OrganizationCampaignsTab,
  OrganizationUpdatesTab,
  OrganizationTeamTab
} from '@/components/organization'
import {
  fetchOrganizationProfile,
  fetchOrganizationRequests,
  fetchOrganizationUpdates,
  fetchOrganizationTeamMembers,
  updateOrganizationProfile,
  fetchCauseAreas,
  fetchIdentityCategories,
  saveOrganizationCauseAreas,
  saveOrganizationPopulations,
  supabase,
  type OrganizationProfile,
  type OrganizationUpdate,
  type OrganizationTeamMember
} from '@/lib/supabase'

interface CauseArea {
  id: string
  name: string
  description?: string
}

interface IdentityCategory {
  id: string
  name: string
  description?: string
}

const ORGANIZATION_TYPES = [
  '501(c)(3) Nonprofit',
  '501(c)(4) Social Welfare',
  'School/Educational Institution',
  'Faith-Based Organization',
  'Community Center',
  'Library',
  'Government Agency',
  'Healthcare Organization',
  'Other'
]

const ORGANIZATION_SIZES = [
  '1-5 employees',
  '6-10 employees',
  '11-25 employees',
  '26-50 employees',
  '51-100 employees',
  '100+ employees'
]

interface EditForm {
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
  city: string
  state: string
  zipcode: string
  logo_url: string
  cover_image_url: string
  facebook_url: string
  twitter_url: string
  instagram_url: string
  linkedin_url: string
}

export function OrganizationProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [updates, setUpdates] = useState<OrganizationUpdate[]>([])
  const [teamMembers, setTeamMembers] = useState<OrganizationTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('about')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
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
    city: '',
    state: '',
    zipcode: '',
    logo_url: '',
    cover_image_url: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: ''
  })

  // File upload refs and states
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Cause areas and populations
  const [allCauseAreas, setAllCauseAreas] = useState<CauseArea[]>([])
  const [allPopulations, setAllPopulations] = useState<IdentityCategory[]>([])
  const [selectedCauseAreaIds, setSelectedCauseAreaIds] = useState<string[]>([])
  const [selectedPopulationIds, setSelectedPopulationIds] = useState<string[]>([])
  const [showCauseAreaSelector, setShowCauseAreaSelector] = useState(false)
  const [showPopulationSelector, setShowPopulationSelector] = useState(false)

  // Check if current user is the organization owner
  const isOwner = organization && user && organization.user_id === user.id

  useEffect(() => {
    if (id) {
      loadOrganizationData()
    }
  }, [id])

  // Load cause areas and populations for the dropdown
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const [causeAreasData, populationsData] = await Promise.all([
          fetchCauseAreas(),
          fetchIdentityCategories()
        ])
        setAllCauseAreas(causeAreasData)
        setAllPopulations(populationsData)
      } catch (err) {
        console.error('Error loading cause areas/populations:', err)
      }
    }
    loadSelections()
  }, [])

  // Populate edit form when organization loads
  useEffect(() => {
    if (organization) {
      const socialLinks = organization.social_links || {}
      setEditForm({
        name: organization.name || '',
        tagline: organization.tagline || '',
        mission: organization.mission || '',
        organization_type: organization.organization_type || '',
        organization_size: organization.organization_size || '',
        year_founded: organization.year_founded?.toString() || '',
        program_description: organization.program_description || '',
        technology_barriers: organization.technology_barriers || '',
        service_area_description: organization.service_area_description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        zipcode: organization.zipcode || '',
        logo_url: organization.logo_url || '',
        cover_image_url: organization.cover_image_url || '',
        facebook_url: socialLinks.facebook || '',
        twitter_url: socialLinks.twitter || '',
        instagram_url: socialLinks.instagram || '',
        linkedin_url: socialLinks.linkedin || ''
      })

      // Populate selected cause areas and populations
      if (organization.cause_areas) {
        setSelectedCauseAreaIds(organization.cause_areas.map((ca: any) => ca.id))
      }
      if (organization.populations) {
        setSelectedPopulationIds(organization.populations.map((p: any) => p.id))
      }
    }
  }, [organization])

  const loadOrganizationData = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      // Fetch all data in parallel
      const [org, reqs, upds, team] = await Promise.all([
        fetchOrganizationProfile(id),
        fetchOrganizationRequests(id),
        fetchOrganizationUpdates(id),
        fetchOrganizationTeamMembers(id)
      ])

      if (!org) {
        setError('Organization not found')
        return
      }

      setOrganization(org)
      setRequests(reqs)
      setUpdates(upds)
      setTeamMembers(team)
    } catch (err) {
      console.error('Error loading organization:', err)
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset file states
    setLogoFile(null)
    setCoverFile(null)
    setLogoPreview(null)
    setCoverPreview(null)
    setShowCauseAreaSelector(false)
    setShowPopulationSelector(false)
    // Reset form to original values
    if (organization) {
      const socialLinks = organization.social_links || {}
      setEditForm({
        name: organization.name || '',
        tagline: organization.tagline || '',
        mission: organization.mission || '',
        organization_type: organization.organization_type || '',
        organization_size: organization.organization_size || '',
        year_founded: organization.year_founded?.toString() || '',
        program_description: organization.program_description || '',
        technology_barriers: organization.technology_barriers || '',
        service_area_description: organization.service_area_description || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        zipcode: organization.zipcode || '',
        logo_url: organization.logo_url || '',
        cover_image_url: organization.cover_image_url || '',
        facebook_url: socialLinks.facebook || '',
        twitter_url: socialLinks.twitter || '',
        instagram_url: socialLinks.instagram || '',
        linkedin_url: socialLinks.linkedin || ''
      })
      // Reset cause areas and populations
      if (organization.cause_areas) {
        setSelectedCauseAreaIds(organization.cause_areas.map((ca: any) => ca.id))
      } else {
        setSelectedCauseAreaIds([])
      }
      if (organization.populations) {
        setSelectedPopulationIds(organization.populations.map((p: any) => p.id))
      } else {
        setSelectedPopulationIds([])
      }
    }
  }

  // File change handlers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setLogoPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setCoverPreview(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Toggle cause area selection
  const toggleCauseArea = (id: string) => {
    setSelectedCauseAreaIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Toggle population selection
  const togglePopulation = (id: string) => {
    setSelectedPopulationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Upload image to Supabase storage
  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('organization-images')
        .upload(fileName, file, { upsert: true })

      if (error) {
        console.warn('Storage upload failed, using base64 fallback:', error)
        // Fallback to base64
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      }

      const { data: urlData } = supabase.storage
        .from('organization-images')
        .getPublicUrl(data.path)
      return urlData.publicUrl
    } catch (err) {
      console.error('Image upload error:', err)
      return null
    }
  }

  const handleSaveEdit = async () => {
    if (!organization) return

    setSaving(true)
    try {
      let updates = { ...editForm }

      // Upload logo if changed
      if (logoFile) {
        const logoUrl = await uploadImage(logoFile, `logos/${organization.id}`)
        if (logoUrl) {
          updates.logo_url = logoUrl
        }
      }

      // Upload cover if changed
      if (coverFile) {
        const coverUrl = await uploadImage(coverFile, `covers/${organization.id}`)
        if (coverUrl) {
          updates.cover_image_url = coverUrl
        }
      }

      await updateOrganizationProfile(organization.id, {
        name: updates.name,
        tagline: updates.tagline || null,
        mission: updates.mission,
        organization_type: updates.organization_type || null,
        organization_size: updates.organization_size || null,
        year_founded: updates.year_founded ? parseInt(updates.year_founded) : null,
        program_description: updates.program_description || null,
        technology_barriers: updates.technology_barriers || null,
        service_area_description: updates.service_area_description || null,
        email: updates.email,
        phone: updates.phone || null,
        website: updates.website || null,
        address: updates.address || null,
        city: updates.city || null,
        state: updates.state || null,
        zipcode: updates.zipcode,
        logo_url: updates.logo_url || null,
        cover_image_url: updates.cover_image_url || null,
        social_links: {
          facebook: updates.facebook_url || undefined,
          twitter: updates.twitter_url || undefined,
          instagram: updates.instagram_url || undefined,
          linkedin: updates.linkedin_url || undefined
        }
      } as any)

      // Save cause areas and populations
      await Promise.all([
        saveOrganizationCauseAreas(organization.id, selectedCauseAreaIds),
        saveOrganizationPopulations(organization.id, selectedPopulationIds)
      ])

      // Update local state
      setOrganization({
        ...organization,
        name: updates.name,
        tagline: updates.tagline || null,
        mission: updates.mission,
        organization_type: updates.organization_type || null,
        organization_size: updates.organization_size || null,
        year_founded: updates.year_founded ? parseInt(updates.year_founded) : null,
        program_description: updates.program_description || null,
        technology_barriers: updates.technology_barriers || null,
        service_area_description: updates.service_area_description || null,
        email: updates.email,
        phone: updates.phone || null,
        website: updates.website || null,
        address: updates.address || null,
        city: updates.city || null,
        state: updates.state || null,
        zipcode: updates.zipcode,
        logo_url: updates.logo_url || null,
        cover_image_url: updates.cover_image_url || null,
        social_links: {
          facebook: updates.facebook_url || '',
          twitter: updates.twitter_url || '',
          instagram: updates.instagram_url || '',
          linkedin: updates.linkedin_url || ''
        },
        cause_areas: allCauseAreas.filter(ca => selectedCauseAreaIds.includes(ca.id)),
        populations: allPopulations.filter(p => selectedPopulationIds.includes(p.id))
      })

      // Reset file states
      setLogoFile(null)
      setCoverFile(null)
      setLogoPreview(null)
      setCoverPreview(null)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  // Calculate request stats
  const requestStats = {
    open: requests.filter(r => r.status === 'open').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    totalRaised: requests
      .filter(r => r.status === 'fulfilled')
      .reduce((sum, r) => sum + Number(r.amount), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-4">Organization Not Found</h1>
        <p className="text-[#737373] mb-6">
          The organization you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/requests">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Requests
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Edit Mode Banner */}
        {isEditing && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-amber-600" />
              <span className="text-amber-800 font-medium">Editing Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1b5858] hover:bg-[#164444]"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <Link
          to="/requests"
          className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#0a0a0a] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Link>

        {/* Hero Section */}
        {isEditing ? (
          <div className="relative">
            {/* Clickable Cover Image */}
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-[300px] bg-[#f5f5f5] rounded-[10px] overflow-hidden cursor-pointer group relative"
            >
              {coverPreview || editForm.cover_image_url ? (
                <img
                  src={coverPreview || editForm.cover_image_url}
                  alt={`${editForm.name} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ea580c]/10 to-[#1b5858]/10">
                  <ImageIcon className="h-16 w-16 text-[#737373] opacity-30" />
                </div>
              )}
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm">Click to change cover image</span>
                </div>
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />

            {/* Clickable Logo Overlay */}
            <div className="absolute -bottom-12 left-6">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="p-1 bg-white rounded-full shadow-lg cursor-pointer group relative"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#f5f5f5] relative">
                  {logoPreview || editForm.logo_url ? (
                    <img
                      src={logoPreview || editForm.logo_url}
                      alt={editForm.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ea580c] to-[#1b5858]">
                      <span className="text-3xl font-bold text-white">
                        {editForm.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>
        ) : (
          <OrganizationHero
            coverImageUrl={organization.cover_image_url}
            logoUrl={organization.logo_url}
            logoEmoji={organization.logo_emoji}
            name={organization.name}
            isOwner={isOwner || false}
            onEditClick={handleStartEdit}
          />
        )}

        {/* Header with Name */}
        <div className="mt-16 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-3xl font-bold h-auto py-2 border-dashed max-w-xl"
                    placeholder="Organization Name"
                  />
                  <Input
                    value={editForm.tagline}
                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                    className="text-lg h-auto py-1 border-dashed max-w-xl text-[#737373]"
                    placeholder="Add a tagline..."
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-[#0a0a0a] mb-2">
                    {organization.name}
                  </h1>
                  {organization.tagline && (
                    <p className="text-lg text-[#737373] mb-3">{organization.tagline}</p>
                  )}
                  {/* Display cause areas and populations as badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {organization.cause_areas?.map((area: any) => (
                      <Badge
                        key={area.id}
                        variant="secondary"
                        className="bg-[#eaeaea] text-[#737373] font-normal rounded-full px-2 py-0.5"
                      >
                        {area.name}
                      </Badge>
                    ))}
                    {organization.populations?.map((pop: any) => (
                      <Badge
                        key={pop.id}
                        variant="secondary"
                        className="bg-[#ea580c]/10 text-[#ea580c] font-normal rounded-full px-2 py-0.5"
                      >
                        {pop.name}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {organization.website && !isEditing && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#ea580c] hover:underline"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {isOwner && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="flex-shrink-0"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Tabs Content (Left) */}
          <div className="flex-1 min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-[#f5f5f5] p-[3px] rounded-lg w-full justify-start mb-6">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="campaigns"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  Campaigns
                  {requests.length > 0 && (
                    <span className="ml-1.5 text-xs bg-[#171717] text-white px-1.5 py-0.5 rounded-full">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="updates"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  Updates
                  {updates.length > 0 && (
                    <span className="ml-1.5 text-xs bg-[#171717] text-white px-1.5 py-0.5 rounded-full">
                      {updates.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  Team
                  {teamMembers.length > 0 && (
                    <span className="ml-1.5 text-xs bg-[#171717] text-white px-1.5 py-0.5 rounded-full">
                      {teamMembers.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-0">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Mission */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Mission Statement</label>
                      <Textarea
                        value={editForm.mission}
                        onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                        className="border-dashed min-h-[100px]"
                        placeholder="Your organization's mission..."
                      />
                    </div>

                    {/* Organization Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0a0a0a]">Organization Type</label>
                        <Select
                          value={editForm.organization_type}
                          onValueChange={(value) => setEditForm({ ...editForm, organization_type: value })}
                        >
                          <SelectTrigger className="border-dashed">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORGANIZATION_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0a0a0a]">Organization Size</label>
                        <Select
                          value={editForm.organization_size}
                          onValueChange={(value) => setEditForm({ ...editForm, organization_size: value })}
                        >
                          <SelectTrigger className="border-dashed">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORGANIZATION_SIZES.map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Year Founded</label>
                      <Input
                        type="number"
                        value={editForm.year_founded}
                        onChange={(e) => setEditForm({ ...editForm, year_founded: e.target.value })}
                        className="border-dashed max-w-[150px]"
                        placeholder="e.g., 2015"
                      />
                    </div>

                    {/* Programs */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Programs & Services</label>
                      <RichTextEditor
                        value={editForm.program_description}
                        onChange={(value) => setEditForm({ ...editForm, program_description: value })}
                        placeholder="Describe your programs and services..."
                      />
                    </div>

                    {/* Technology Challenges */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Technology Challenges</label>
                      <Textarea
                        value={editForm.technology_barriers}
                        onChange={(e) => setEditForm({ ...editForm, technology_barriers: e.target.value })}
                        className="border-dashed min-h-[80px]"
                        placeholder="What tech challenges does your organization face?"
                      />
                    </div>

                    {/* Service Area */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Service Area</label>
                      <Textarea
                        value={editForm.service_area_description}
                        onChange={(e) => setEditForm({ ...editForm, service_area_description: e.target.value })}
                        className="border-dashed"
                        placeholder="Geographic area you serve..."
                      />
                    </div>

                    {/* Contact Info */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-[#0a0a0a] mb-4">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Email</label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="border-dashed"
                            placeholder="contact@org.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Phone</label>
                          <Input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="border-dashed"
                            placeholder="(555) 555-5555"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Website</label>
                          <Input
                            type="url"
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            className="border-dashed"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Zipcode</label>
                          <Input
                            value={editForm.zipcode}
                            onChange={(e) => setEditForm({ ...editForm, zipcode: e.target.value })}
                            className="border-dashed"
                            placeholder="12345"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <label className="text-xs text-[#737373]">Address</label>
                        <Input
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="border-dashed"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">City</label>
                          <Input
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="border-dashed"
                            placeholder="Kansas City"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">State</label>
                          <Input
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            className="border-dashed"
                            placeholder="MO"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cause Areas */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-[#0a0a0a] mb-4">Cause Areas</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Selected cause areas as removable badges */}
                        {selectedCauseAreaIds.map((id) => {
                          const area = allCauseAreas.find(a => a.id === id)
                          if (!area) return null
                          return (
                            <Badge
                              key={area.id}
                              variant="secondary"
                              className="bg-[#1b5858] text-white font-normal rounded-full px-2 py-0.5 cursor-pointer hover:bg-[#164444] flex items-center gap-1"
                              onClick={() => toggleCauseArea(area.id)}
                            >
                              {area.name}
                              <X className="h-3 w-3" />
                            </Badge>
                          )
                        })}

                        {/* Add tag button */}
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs border-dashed"
                            onClick={() => setShowCauseAreaSelector(!showCauseAreaSelector)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Cause Area
                          </Button>

                          {/* Tag selector dropdown */}
                          {showCauseAreaSelector && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                              <div className="p-2">
                                <p className="text-xs text-[#737373] mb-2 px-2">Select cause areas:</p>
                                {allCauseAreas.map((area) => (
                                  <label
                                    key={area.id}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={selectedCauseAreaIds.includes(area.id)}
                                      onCheckedChange={() => toggleCauseArea(area.id)}
                                    />
                                    <span className="text-sm">{area.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Populations Served */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-[#0a0a0a] mb-4">Populations Served</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Selected populations as removable badges */}
                        {selectedPopulationIds.map((id) => {
                          const pop = allPopulations.find(p => p.id === id)
                          if (!pop) return null
                          return (
                            <Badge
                              key={pop.id}
                              variant="secondary"
                              className="bg-[#ea580c] text-white font-normal rounded-full px-2 py-0.5 cursor-pointer hover:bg-[#dc4c06] flex items-center gap-1"
                              onClick={() => togglePopulation(pop.id)}
                            >
                              {pop.name}
                              <X className="h-3 w-3" />
                            </Badge>
                          )
                        })}

                        {/* Add tag button */}
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs border-dashed"
                            onClick={() => setShowPopulationSelector(!showPopulationSelector)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Population
                          </Button>

                          {/* Tag selector dropdown */}
                          {showPopulationSelector && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                              <div className="p-2">
                                <p className="text-xs text-[#737373] mb-2 px-2">Select populations:</p>
                                {allPopulations.map((pop) => (
                                  <label
                                    key={pop.id}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={selectedPopulationIds.includes(pop.id)}
                                      onCheckedChange={() => togglePopulation(pop.id)}
                                    />
                                    <span className="text-sm">{pop.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-[#0a0a0a] mb-4">Social Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Facebook</label>
                          <Input
                            type="url"
                            value={editForm.facebook_url}
                            onChange={(e) => setEditForm({ ...editForm, facebook_url: e.target.value })}
                            className="border-dashed"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Twitter/X</label>
                          <Input
                            type="url"
                            value={editForm.twitter_url}
                            onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                            className="border-dashed"
                            placeholder="https://x.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Instagram</label>
                          <Input
                            type="url"
                            value={editForm.instagram_url}
                            onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                            className="border-dashed"
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">LinkedIn</label>
                          <Input
                            type="url"
                            value={editForm.linkedin_url}
                            onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                            className="border-dashed"
                            placeholder="https://linkedin.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <OrganizationAboutTab organization={organization} />
                )}
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0">
                <OrganizationCampaignsTab requests={requests} />
              </TabsContent>

              <TabsContent value="updates" className="mt-0">
                <OrganizationUpdatesTab updates={updates} />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <OrganizationTeamTab members={teamMembers} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (Right) */}
          <OrganizationSidebar
            organization={organization}
            requestStats={requestStats}
          />
        </div>

        {/* Bottom Padding */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default OrganizationProfilePage
