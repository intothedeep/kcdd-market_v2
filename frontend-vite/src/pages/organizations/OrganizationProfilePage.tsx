/**
 * Organization Profile Page (Public)
 * Route: /organizations/:id
 * Displays full organization profile for donors to view
 * Owners can edit inline like the campaign page
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Pencil,
  Save,
  X,
  Plus,
  Upload,
  ImageIcon,
} from 'lucide-react'
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
import { VERIFICATION_STATUS } from '@/constants/userTypes'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  OrganizationHero,
  OrganizationSidebar,
  OrganizationAboutTab,
  OrganizationCampaignsTab,
  OrganizationUpdatesTab,
  OrganizationTeamTab,
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
  type OrganizationTeamMember,
} from '@/lib/supabase'

interface CauseArea {
  id: string
  name: string
  description?: string | null
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
    linkedin_url: '',
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
          fetchIdentityCategories(),
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
        linkedin_url: socialLinks.linkedin || '',
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
      // The route param can be either the org id or its public slug; resolve
      // the org first so the dependent fetches use the real id.
      const org = await fetchOrganizationProfile(id)

      if (!org) {
        setError('Organization not found')
        return
      }

      const [reqs, upds, team] = await Promise.all([
        fetchOrganizationRequests(org.id),
        fetchOrganizationUpdates(org.id),
        fetchOrganizationTeamMembers(org.id),
      ])

      // Approval gate: only the owner can see an unvetted org's profile.
      // RLS should handle this server-side, but the app uses Clerk (not
      // Supabase Auth) so auth.uid() is null and the RLS policy can't
      // identify the owner — this client-side check is defense-in-depth.
      const isVetted =
        (org as any).user_profile?.verification_status === VERIFICATION_STATUS.VERIFIED
      const isViewerTheOwner = user && org.user_id === user.id
      if (!isVetted && !isViewerTheOwner) {
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
        linkedin_url: socialLinks.linkedin || '',
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
    setSelectedCauseAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Toggle population selection
  const togglePopulation = (id: string) => {
    setSelectedPopulationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

      const { data: urlData } = supabase.storage.from('organization-images').getPublicUrl(data.path)
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
      const updates = { ...editForm }

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
          linkedin: updates.linkedin_url || undefined,
        },
      } as any)

      // Save cause areas and populations
      await Promise.all([
        saveOrganizationCauseAreas(organization.id, selectedCauseAreaIds),
        saveOrganizationPopulations(organization.id, selectedPopulationIds),
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
          linkedin: updates.linkedin_url || '',
        },
        cause_areas: allCauseAreas.filter((ca) => selectedCauseAreaIds.includes(ca.id)),
        populations: allPopulations.filter((p) => selectedPopulationIds.includes(p.id)),
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
    open: requests.filter((r) => r.status === 'open').length,
    fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
    totalRaised: requests
      .filter((r) => r.status === 'fulfilled')
      .reduce((sum, r) => sum + Number(r.amount), 0),
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">Organization Not Found</h1>
        <p className="mb-6 text-[#737373]">
          The organization you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/campaigns">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Requests
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Edit Mode Banner */}
        {isEditing && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Editing Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1b5858] hover:bg-[#164444]"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <Link
          to="/campaigns"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#737373] transition-colors hover:text-[#0a0a0a]"
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
              className="group relative h-[300px] w-full cursor-pointer overflow-hidden rounded-[10px] bg-[#f5f5f5]"
            >
              {coverPreview || editForm.cover_image_url ? (
                <img
                  src={coverPreview || editForm.cover_image_url}
                  alt={`${editForm.name} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ea580c]/10 to-[#1b5858]/10">
                  <ImageIcon className="h-16 w-16 text-[#737373] opacity-30" />
                </div>
              )}
              {/* Upload Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="text-center text-white">
                  <Upload className="mx-auto mb-2 h-8 w-8" />
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
                className="group relative cursor-pointer rounded-full bg-white p-1 shadow-lg"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[#f5f5f5]">
                  {logoPreview || editForm.logo_url ? (
                    <img
                      src={logoPreview || editForm.logo_url}
                      alt={editForm.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ea580c] to-[#1b5858]">
                      <span className="text-3xl font-bold text-white">
                        {editForm.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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
        <div className="mb-6 mt-16">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-auto max-w-xl border-dashed py-2 text-3xl font-bold"
                    placeholder="Organization Name"
                  />
                  <Input
                    value={editForm.tagline}
                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                    className="h-auto max-w-xl border-dashed py-1 text-lg text-[#737373]"
                    placeholder="Add a tagline..."
                  />
                </div>
              ) : (
                <>
                  <h1 className="mb-2 text-4xl font-bold text-[#0a0a0a]">{organization.name}</h1>
                  {organization.tagline && (
                    <p className="mb-3 text-lg text-[#737373]">{organization.tagline}</p>
                  )}
                  {/* Display cause areas and populations as badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {organization.cause_areas?.map((area: any) => (
                      <Badge
                        key={area.id}
                        variant="secondary"
                        className="rounded-full bg-[#eaeaea] px-2 py-0.5 font-normal text-[#737373]"
                      >
                        {area.name}
                      </Badge>
                    ))}
                    {organization.populations?.map((pop: any) => (
                      <Badge
                        key={pop.id}
                        variant="secondary"
                        className="rounded-full bg-[#ea580c]/10 px-2 py-0.5 font-normal text-[#ea580c]"
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
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Tabs Content (Left) */}
          <div className="min-w-0 flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 w-full justify-start rounded-lg bg-[#f5f5f5] p-[3px]">
                <TabsTrigger
                  value="about"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="campaigns"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Campaigns
                  {requests.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-[#171717] px-1.5 py-0.5 text-xs text-white">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="updates"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Updates
                  {updates.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-[#171717] px-1.5 py-0.5 text-xs text-white">
                      {updates.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Team
                  {teamMembers.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-[#171717] px-1.5 py-0.5 text-xs text-white">
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
                      <label className="text-sm font-medium text-[#0a0a0a]">
                        Mission Statement
                      </label>
                      <Textarea
                        value={editForm.mission}
                        onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                        className="min-h-[100px] border-dashed"
                        placeholder="Your organization's mission..."
                      />
                    </div>

                    {/* Organization Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0a0a0a]">
                          Organization Type
                        </label>
                        <Select
                          value={editForm.organization_type}
                          onValueChange={(value) =>
                            setEditForm({ ...editForm, organization_type: value })
                          }
                        >
                          <SelectTrigger className="border-dashed">
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
                        <label className="text-sm font-medium text-[#0a0a0a]">
                          Organization Size
                        </label>
                        <Select
                          value={editForm.organization_size}
                          onValueChange={(value) =>
                            setEditForm({ ...editForm, organization_size: value })
                          }
                        >
                          <SelectTrigger className="border-dashed">
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
                        value={editForm.year_founded}
                        onChange={(e) => setEditForm({ ...editForm, year_founded: e.target.value })}
                        className="max-w-[150px] border-dashed"
                        placeholder="e.g., 2015"
                      />
                    </div>

                    {/* Programs */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">
                        Programs & Services
                      </label>
                      <RichTextEditor
                        value={editForm.program_description}
                        onChange={(value) =>
                          setEditForm({ ...editForm, program_description: value })
                        }
                        placeholder="Describe your programs and services..."
                      />
                    </div>

                    {/* Technology Challenges */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">
                        Technology Challenges
                      </label>
                      <Textarea
                        value={editForm.technology_barriers}
                        onChange={(e) =>
                          setEditForm({ ...editForm, technology_barriers: e.target.value })
                        }
                        className="min-h-[80px] border-dashed"
                        placeholder="What tech challenges does your organization face?"
                      />
                    </div>

                    {/* Service Area */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0a0a0a]">Service Area</label>
                      <Textarea
                        value={editForm.service_area_description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, service_area_description: e.target.value })
                        }
                        className="border-dashed"
                        placeholder="Geographic area you serve..."
                      />
                    </div>

                    {/* Contact Info */}
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-4 text-sm font-medium text-[#0a0a0a]">
                        Contact Information
                      </h3>
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
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-4 text-sm font-medium text-[#0a0a0a]">Cause Areas</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Selected cause areas as removable badges */}
                        {selectedCauseAreaIds.map((id) => {
                          const area = allCauseAreas.find((a) => a.id === id)
                          if (!area) return null
                          return (
                            <Badge
                              key={area.id}
                              variant="secondary"
                              className="flex cursor-pointer items-center gap-1 rounded-full bg-[#1b5858] px-2 py-0.5 font-normal text-white hover:bg-[#164444]"
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
                            className="h-6 border-dashed text-xs"
                            onClick={() => setShowCauseAreaSelector(!showCauseAreaSelector)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Cause Area
                          </Button>

                          {/* Tag selector dropdown */}
                          {showCauseAreaSelector && (
                            <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              <div className="p-2">
                                <p className="mb-2 px-2 text-xs text-[#737373]">
                                  Select cause areas:
                                </p>
                                {allCauseAreas.map((area) => (
                                  <label
                                    key={area.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
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
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-4 text-sm font-medium text-[#0a0a0a]">
                        Populations Served
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Selected populations as removable badges */}
                        {selectedPopulationIds.map((id) => {
                          const pop = allPopulations.find((p) => p.id === id)
                          if (!pop) return null
                          return (
                            <Badge
                              key={pop.id}
                              variant="secondary"
                              className="flex cursor-pointer items-center gap-1 rounded-full bg-[#ea580c] px-2 py-0.5 font-normal text-white hover:bg-[#dc4c06]"
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
                            className="h-6 border-dashed text-xs"
                            onClick={() => setShowPopulationSelector(!showPopulationSelector)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add Population
                          </Button>

                          {/* Tag selector dropdown */}
                          {showPopulationSelector && (
                            <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              <div className="p-2">
                                <p className="mb-2 px-2 text-xs text-[#737373]">
                                  Select populations:
                                </p>
                                {allPopulations.map((pop) => (
                                  <label
                                    key={pop.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
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
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-4 text-sm font-medium text-[#0a0a0a]">Social Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Facebook</label>
                          <Input
                            type="url"
                            value={editForm.facebook_url}
                            onChange={(e) =>
                              setEditForm({ ...editForm, facebook_url: e.target.value })
                            }
                            className="border-dashed"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Twitter/X</label>
                          <Input
                            type="url"
                            value={editForm.twitter_url}
                            onChange={(e) =>
                              setEditForm({ ...editForm, twitter_url: e.target.value })
                            }
                            className="border-dashed"
                            placeholder="https://x.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">Instagram</label>
                          <Input
                            type="url"
                            value={editForm.instagram_url}
                            onChange={(e) =>
                              setEditForm({ ...editForm, instagram_url: e.target.value })
                            }
                            className="border-dashed"
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-[#737373]">LinkedIn</label>
                          <Input
                            type="url"
                            value={editForm.linkedin_url}
                            onChange={(e) =>
                              setEditForm({ ...editForm, linkedin_url: e.target.value })
                            }
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
                <OrganizationUpdatesTab
                  updates={updates}
                  isOwner={isOwner || false}
                  organizationId={organization?.id}
                  onUpdatesChanged={loadOrganizationData}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <OrganizationTeamTab
                  members={teamMembers}
                  isOwner={isOwner || false}
                  organizationId={organization?.id}
                  onMembersChanged={loadOrganizationData}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (Right) */}
          <OrganizationSidebar organization={organization} requestStats={requestStats} />
        </div>

        {/* Bottom Padding */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default OrganizationProfilePage
