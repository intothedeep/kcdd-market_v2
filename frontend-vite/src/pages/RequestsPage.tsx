/**
 * Browse Campaigns & Requests Page
 * Shows active campaigns as cards for donors to browse and support
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOpenRequests, getActiveCampaigns, supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Search, Target, Users, TrendingUp, Loader2 } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  slug: string
  creator_name: string
  short_description: string
  funding_goal: number
  amount_raised: number
  supporters_count: number
  image_url: string | null
  logo_url: string | null
  cause_area_ids: string[]
  created_at: string
  organization: {
    id: string
    name: string
    logo: string | null
  }
}

interface CauseArea {
  id: string
  name: string
}

export function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('campaigns')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load campaigns, requests, and cause areas in parallel
        const [campaignsData, requestsData, causeAreasData] = await Promise.all([
          getActiveCampaigns(50),
          fetchOpenRequests(),
          supabase.from('cause_areas').select('id, name')
        ])
        
        setCampaigns(campaignsData || [])
        setRequests(requestsData || [])
        setCauseAreas(causeAreasData.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCauseAreaNames = (causeAreaIds: string[]) => {
    return causeAreas
      .filter(ca => causeAreaIds.includes(ca.id))
      .map(ca => ca.name)
      .slice(0, 2) // Show max 2 tags
  }

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100)
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRequests = requests.filter(request =>
    request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">
            Browse Campaigns
          </h1>
          <p className="text-[#737373] mt-2 text-lg">
            Support verified Kansas City organizations making a difference in our community
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#737373]" />
          <Input
            type="search"
            placeholder="Search campaigns, organizations, or causes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-white border-[#e5e5e5] text-base"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#f5f5f5] p-1 rounded-lg mb-6">
            <TabsTrigger 
              value="campaigns"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-6"
            >
              Campaigns ({filteredCampaigns.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-6"
            >
              Quick Requests ({filteredRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-0">
            {filteredCampaigns.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-[#737373] mb-4" />
                  <p className="text-[#737373] text-lg">No active campaigns at this time.</p>
                  <p className="text-[#737373] text-sm mt-1">Check back soon for new opportunities to give.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <Link 
                    key={campaign.id} 
                    to={`/campaign/${campaign.slug}`}
                    className="group"
                  >
                    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200 border-[#e5e5e5]">
                      {/* Campaign Image */}
                      <div className="aspect-video bg-[#f5f5f5] relative overflow-hidden">
                        {campaign.image_url ? (
                          <img 
                            src={campaign.image_url} 
                            alt={campaign.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1b5858] to-[#103032]">
                            {campaign.logo_url ? (
                              <img 
                                src={campaign.logo_url} 
                                alt={campaign.organization?.name}
                                className="h-16 w-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                  {campaign.organization?.name?.charAt(0) || 'C'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Cause Area Tags */}
                        {campaign.cause_area_ids?.length > 0 && (
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            {getCauseAreaNames(campaign.cause_area_ids).map((name) => (
                              <Badge 
                                key={name} 
                                variant="secondary"
                                className="bg-white/90 text-[#0a0a0a] text-xs"
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-2">
                        <CardDescription className="text-[#ea580c] font-medium">
                          {campaign.organization?.name}
                        </CardDescription>
                        <CardTitle className="line-clamp-2 text-lg group-hover:text-[#ea580c] transition-colors">
                          {campaign.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="flex-1 pb-3">
                        <p className="text-sm text-[#737373] line-clamp-2">
                          {campaign.short_description}
                        </p>
                      </CardContent>

                      <CardFooter className="pt-0 flex-col items-stretch gap-3">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-[#e5e5e5] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#ea580c] rounded-full transition-all duration-500"
                              style={{ width: `${calculateProgress(campaign.amount_raised, campaign.funding_goal)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-[#0a0a0a]">
                              {formatCurrency(campaign.amount_raised)}
                            </span>
                            <span className="text-[#737373]">
                              of {formatCurrency(campaign.funding_goal)}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-[#737373]">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{campaign.supporters_count} supporters</span>
                          </div>
                          <span>{formatRelativeTime(campaign.created_at)}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            {filteredRequests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-[#737373] mb-4" />
                  <p className="text-[#737373] text-lg">No open requests at this time.</p>
                  <p className="text-[#737373] text-sm mt-1">Check back soon for new opportunities.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="flex flex-col border-[#e5e5e5]">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardDescription className="text-[#ea580c] font-medium">
                            {request.organization?.name}
                          </CardDescription>
                          <CardTitle className="line-clamp-2 text-lg mt-1">
                            {request.description}
                          </CardTitle>
                        </div>
                        <Badge variant={
                          request.urgency === 'high' ? 'destructive' :
                          request.urgency === 'medium' ? 'default' : 'secondary'
                        }>
                          {request.urgency}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#737373]">Amount needed:</span>
                          <span className="font-semibold text-[#0a0a0a]">
                            {formatCurrency(request.amount)}
                          </span>
                        </div>
                        {request.cause_area && (
                          <div className="flex justify-between">
                            <span className="text-[#737373]">Cause area:</span>
                            <span className="text-[#0a0a0a]">{request.cause_area.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[#737373]">Posted:</span>
                          <span className="text-[#0a0a0a]">{formatRelativeTime(request.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link to={`/checkout/${request.id}`} className="w-full">
                        <Button className="w-full bg-[#ea580c] hover:bg-[#dc4c06]">
                          Donate Now
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
