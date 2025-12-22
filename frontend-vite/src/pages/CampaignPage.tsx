/**
 * Campaign Detail Page
 * Public page displaying campaign information, funding progress, and story
 * Route: /user/campaign/:slug or /campaign/:id
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  ArrowLeft, 
  Calendar, 
  Users, 
  Target,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  title: string
  creator_name: string
  creator_role: string
  cause_area_ids: string[]
  funding_goal: number
  amount_raised: number
  supporters_count: number
  short_description: string
  story_title: string
  story_content: string
  image_url: string | null
  logo_url: string | null
  contact_email: string
  status: string
  slug: string
  created_at: string
  organization: {
    id: string
    name: string
    mission: string
    logo: string | null
  }
}

interface CauseArea {
  id: string
  name: string
}

export function CampaignPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isSignedIn } = useUser()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('campaign')

  useEffect(() => {
    if (slug) {
      fetchCampaign()
    }
  }, [slug])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      
      // Fetch campaign by slug or id
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(id, name, mission, logo)
        `)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single()

      if (error) throw error

      setCampaign(data)

      // Fetch cause area names
      if (data.cause_area_ids && data.cause_area_ids.length > 0) {
        const { data: causes, error: causesError } = await supabase
          .from('cause_areas')
          .select('id, name')
          .in('id', data.cause_area_ids)

        if (!causesError && causes) {
          setCauseAreas(causes)
        }
      }
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError('Campaign not found')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = () => {
    if (!campaign) return 0
    return Math.min((campaign.amount_raised / campaign.funding_goal) * 100, 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSupport = () => {
    // TODO: Implement support flow (redirect to checkout)
    console.log('Support campaign:', campaign?.id)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = campaign?.title || 'Support this campaign'
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="text-2xl font-bold text-[#0a0a0a] mb-4">Campaign Not Found</h1>
        <p className="text-[#737373] mb-6">The campaign you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link to="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Section */}
      <div className="px-6 pt-7 pb-0">
        {/* Title */}
        <h1 className="text-5xl font-bold text-[#0a0a0a] leading-tight mb-3">
          {campaign.title}
        </h1>

        {/* Date and Tags */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-[#737373]">
            {formatDate(campaign.created_at)}
          </span>
          {causeAreas.map((area) => (
            <Badge 
              key={area.id} 
              variant="secondary"
              className="bg-[#eaeaea] text-[#737373] font-normal rounded-full px-2 py-0.5"
            >
              {area.name}
            </Badge>
          ))}
        </div>

        {/* Hero Section */}
        <div className="flex gap-5">
          {/* Main Image */}
          <div className="w-[824px] h-[515px] bg-[#f5f5f5] rounded-[10px] overflow-hidden flex-shrink-0">
            {campaign.image_url ? (
              <img 
                src={campaign.image_url} 
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#737373] flex flex-col items-center">
                  <Target className="h-16 w-16 mb-2 opacity-50" />
                  <span className="text-sm">Campaign Image</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Card className="flex-1 border-[#f5f5f5] p-2 rounded-[10px]">
            <div className="flex flex-col gap-5 h-full">
              {/* Creator Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-[42px] w-[42px]">
                    <AvatarImage src={campaign.logo_url || campaign.organization?.logo || undefined} />
                    <AvatarFallback className="bg-[#f5f5f5]">
                      {campaign.creator_name?.charAt(0) || campaign.organization?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-[#0a0a0a]">
                      {campaign.creator_name || campaign.organization?.name}
                    </p>
                    <p className="text-sm text-[#737373]">
                      {campaign.creator_role || 'Campaign Creator'}
                    </p>
                  </div>
                </div>
                
                {campaign.status === 'pending' && (
                  <Badge className="bg-[#f5cdb8] text-[#ea580c] hover:bg-[#f5cdb8]">
                    Pending Approval
                  </Badge>
                )}
                {campaign.status === 'active' && (
                  <Badge className="bg-[#d1fae5] text-[#059669] hover:bg-[#d1fae5]">
                    Active Campaign
                  </Badge>
                )}

                <p className="text-sm text-[#737373] leading-relaxed">
                  {campaign.short_description || campaign.organization?.mission}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full border border-[#ea580c] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ea580c] rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <div>
                  <p className="leading-8">
                    <span className="text-2xl font-semibold text-[#0a0a0a]">
                      {formatCurrency(campaign.amount_raised)} raised{' '}
                    </span>
                    <span className="text-base font-semibold text-[#747474]">
                      of {formatCurrency(campaign.funding_goal)}
                    </span>
                  </p>
                  <p className="text-sm text-[#747474]">
                    {campaign.supporters_count} Supporters
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex-1 flex flex-col justify-between py-2.5">
                <Button 
                  onClick={handleSupport}
                  className="w-full bg-[#ea580c] hover:bg-[#dc4c06] text-white rounded-full h-9"
                >
                  Support Campaign
                </Button>

                {/* Share Icons */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-1.5 bg-[#eaeaea] rounded-full hover:bg-[#dcdcdc] transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <Facebook className="h-3.5 w-3.5 text-[#737373]" />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-1.5 bg-[#eaeaea] rounded-full hover:bg-[#dcdcdc] transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="h-3.5 w-3.5 text-[#737373]" />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="p-1.5 bg-[#eaeaea] rounded-full hover:bg-[#dcdcdc] transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-[#737373]" />
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="p-1.5 bg-[#eaeaea] rounded-full hover:bg-[#dcdcdc] transition-colors"
                    aria-label="Share via Email"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#737373]" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-6 pt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="pb-5">
            <TabsList className="bg-[#f5f5f5] p-[3px] rounded-lg w-full justify-start">
              <TabsTrigger 
                value="campaign"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                Campaign
              </TabsTrigger>
              <TabsTrigger 
                value="faqs"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                FAQs
                <Badge className="ml-1.5 bg-[#171717] text-white text-xs px-1.5 py-0 min-w-[20px] h-5 rounded-full">
                  8
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="updates"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                Updates
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                About Us
              </TabsTrigger>
              <TabsTrigger 
                value="contact"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                Contact
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Campaign Content Tab */}
          <TabsContent value="campaign" className="mt-0">
            <div className="flex gap-2.5">
              {/* Outline Sidebar */}
              <div className="w-[323px] flex-shrink-0 space-y-6">
                <h2 className="text-2xl font-semibold text-[#0a0a0a]">Outline</h2>
                <p className="text-base text-[#0a0a0a] leading-relaxed">
                  {campaign.short_description}
                </p>
              </div>

              {/* Main Content */}
              <div className="flex-1 space-y-6">
                {/* Story Title */}
                {campaign.story_title && (
                  <h2 className="text-5xl font-extrabold text-[#0a0a0a]">
                    {campaign.story_title}
                  </h2>
                )}

                {/* Story Content */}
                {campaign.story_content ? (
                  <div 
                    className="prose prose-lg max-w-none text-[#0a0a0a]"
                    dangerouslySetInnerHTML={{ 
                      __html: campaign.story_content.replace(/\n/g, '<br />') 
                    }}
                  />
                ) : (
                  <p className="text-base text-[#0a0a0a] leading-relaxed">
                    {campaign.short_description || 'No story content yet.'}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-0">
            <div className="py-12 text-center text-[#737373]">
              <p className="text-lg">No FAQs have been added yet.</p>
              <p className="text-sm mt-2">Check back later for updates.</p>
            </div>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="mt-0">
            <div className="py-12 text-center text-[#737373]">
              <p className="text-lg">No updates have been posted yet.</p>
              <p className="text-sm mt-2">Check back later for campaign updates.</p>
            </div>
          </TabsContent>

          {/* About Us Tab */}
          <TabsContent value="about" className="mt-0">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-4">
                About {campaign.organization?.name}
              </h2>
              <p className="text-base text-[#0a0a0a] leading-relaxed">
                {campaign.organization?.mission || 'No organization description available.'}
              </p>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-0">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-4">
                Get in Touch
              </h2>
              <p className="text-base text-[#737373] mb-4">
                Have questions about this campaign? Reach out to us.
              </p>
              <a 
                href={`mailto:${campaign.contact_email}`}
                className="inline-flex items-center gap-2 text-[#ea580c] hover:underline"
              >
                <Mail className="h-4 w-4" />
                {campaign.contact_email}
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Padding */}
      <div className="h-20" />
    </div>
  )
}

export default CampaignPage

