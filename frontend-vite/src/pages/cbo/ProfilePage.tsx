/**
 * CBO Profile Page
 * Route: /cbo/profile
 * CBO views their own organization profile with edit options
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Pencil, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  OrganizationHero,
  OrganizationSidebar,
  OrganizationAboutTab,
  OrganizationCampaignsTab,
  OrganizationUpdatesTab,
  OrganizationTeamTab,
} from '@/components/organization'
import {
  fetchOrganizationByUserId,
  fetchOrganizationRequests,
  fetchOrganizationUpdates,
  fetchOrganizationTeamMembers,
  type OrganizationProfile,
  type OrganizationUpdate,
  type OrganizationTeamMember,
} from '@/lib/supabase'
import { routes } from '@/config'

export function CBOProfile() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [updates, setUpdates] = useState<OrganizationUpdate[]>([])
  const [teamMembers, setTeamMembers] = useState<OrganizationTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    if (isLoaded && user) {
      loadOrganizationData()
    }
  }, [isLoaded, user])

  const loadOrganizationData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const org = await fetchOrganizationByUserId(user.id)

      if (!org) {
        setError('no_organization')
        setLoading(false)
        return
      }

      // Fetch related data in parallel
      const [reqs, upds, team] = await Promise.all([
        fetchOrganizationRequests(org.id),
        fetchOrganizationUpdates(org.id),
        fetchOrganizationTeamMembers(org.id),
      ])

      setOrganization(org)
      setRequests(reqs)
      setUpdates(upds)
      setTeamMembers(team)
    } catch (err) {
      console.error('Error loading organization:', err)
      setError('Failed to load your organization profile')
    } finally {
      setLoading(false)
    }
  }

  // Calculate request stats
  const requestStats = organization
    ? {
        open: requests.filter((r) => r.status === 'open').length,
        fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
        totalRaised: requests
          .filter((r) => r.status === 'fulfilled')
          .reduce((sum, r) => sum + Number(r.amount), 0),
      }
    : undefined

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  // No organization yet - prompt to complete setup
  if (error === 'no_organization') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <AlertCircle className="mb-6 h-16 w-16 text-amber-500" />
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">Complete Your Profile</h1>
        <p className="mb-6 max-w-md text-center text-[#737373]">
          You haven't set up your organization profile yet. Complete the setup to start posting
          technology requests.
        </p>
        <Link to={routes.cbo.setup}>
          <Button className="bg-[#ea580c] hover:bg-[#dc4c06]">Complete Setup</Button>
        </Link>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">Error Loading Profile</h1>
        <p className="mb-6 text-[#737373]">{error}</p>
        <Button onClick={loadOrganizationData}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Organization Profile</h1>
          <div className="flex items-center gap-3">
            <Link to={`/organizations/${organization.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Profile
              </Button>
            </Link>
            <Link to="/cbo/profile/edit">
              <Button size="sm" className="bg-[#1b5858] hover:bg-[#164444]">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <OrganizationHero
          coverImageUrl={organization.cover_image_url}
          logoUrl={organization.logo_url}
          logoEmoji={organization.logo_emoji}
          name={organization.name}
          isOwner={true}
          onEditClick={() => navigate('/cbo/profile/edit')}
        />

        {/* Header with Name */}
        <div className="mb-6 mt-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-[#0a0a0a]">{organization.name}</h1>
              {organization.tagline && (
                <p className="text-lg text-[#737373]">{organization.tagline}</p>
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
                <OrganizationAboutTab organization={organization} />
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0">
                <OrganizationCampaignsTab requests={requests} />
              </TabsContent>

              <TabsContent value="updates" className="mt-0">
                <OrganizationUpdatesTab
                  updates={updates}
                  isOwner
                  organizationId={organization.id}
                  onUpdatesChanged={loadOrganizationData}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <OrganizationTeamTab
                  members={teamMembers}
                  isOwner
                  organizationId={organization.id}
                  onMembersChanged={loadOrganizationData}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (Right) */}
          <OrganizationSidebar
            organization={organization}
            requestStats={requestStats}
            showSupportButton={false}
          />
        </div>

        {/* Bottom Padding */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default CBOProfile
