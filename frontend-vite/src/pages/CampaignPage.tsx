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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Checkbox } from '@/components/ui/checkbox'
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
  Loader2,
  Pencil,
  Save,
  X,
  Tag,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  HelpCircle,
  Clock,
  Send,
} from 'lucide-react'
import { supabase, updateCampaign, fetchCauseAreas } from '@/lib/supabase'

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
  created_by?: string
  organization_id?: string
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

interface FAQ {
  id: string
  question: string
  answer: string
  sort_order: number
}

interface CampaignUpdate {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
}

interface OutlineItem {
  id: string
  text: string
  level: number
}

export function CampaignPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isSignedIn } = useUser()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [allCauseAreas, setAllCauseAreas] = useState<CauseArea[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('campaign')
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  
  // Update posting state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newUpdateTitle, setNewUpdateTitle] = useState('')
  const [newUpdateContent, setNewUpdateContent] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    short_description: '',
    story_title: '',
    story_content: '',
    funding_goal: 0,
    contact_email: '',
    creator_name: '',
    creator_role: ''
  })
  const [selectedCauseAreaIds, setSelectedCauseAreaIds] = useState<string[]>([])

  useEffect(() => {
    if (slug) {
      fetchCampaign()
    }
    // Fetch all cause areas for the tag selector
    loadAllCauseAreas()
  }, [slug])

  const loadAllCauseAreas = async () => {
    try {
      const areas = await fetchCauseAreas()
      setAllCauseAreas(areas)
    } catch (err) {
      console.error('Error loading cause areas:', err)
    }
  }

  // Build outline from story content headings
  const buildOutline = (htmlContent: string): OutlineItem[] => {
    if (!htmlContent) return []
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    const items: OutlineItem[] = []
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      const text = heading.textContent?.trim() || ''
      if (text) {
        items.push({
          id: `heading-${index}`,
          text,
          level
        })
      }
    })
    
    return items
  }

  // Update outline when story content changes
  useEffect(() => {
    if (campaign?.story_content) {
      const outlineItems = buildOutline(campaign.story_content)
      setOutline(outlineItems)
    }
  }, [campaign?.story_content])

  // Fetch FAQs and updates when campaign loads
  useEffect(() => {
    if (campaign?.id) {
      loadFaqs()
      loadUpdates()
    }
  }, [campaign?.id])

  const loadFaqs = async () => {
    if (!campaign?.id) return
    try {
      const { data, error } = await supabase
        .from('campaign_faqs')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sort_order', { ascending: true })
      
      if (!error && data) {
        setFaqs(data)
      }
    } catch (err) {
      console.error('Error loading FAQs:', err)
    }
  }

  const loadUpdates = async () => {
    if (!campaign?.id) return
    try {
      const { data, error } = await supabase
        .from('campaign_updates')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setUpdates(data)
      }
    } catch (err) {
      console.error('Error loading updates:', err)
    }
  }

  const handlePostUpdate = async () => {
    if (!campaign?.id || !user?.id || !newUpdateTitle.trim() || !newUpdateContent.trim()) return
    
    setPostingUpdate(true)
    try {
      const { error } = await supabase
        .from('campaign_updates')
        .insert({
          campaign_id: campaign.id,
          title: newUpdateTitle,
          content: newUpdateContent,
          created_by: user.id
        })
      
      if (!error) {
        setNewUpdateTitle('')
        setNewUpdateContent('')
        setShowUpdateForm(false)
        loadUpdates()
      }
    } catch (err) {
      console.error('Error posting update:', err)
    } finally {
      setPostingUpdate(false)
    }
  }

  const scrollToHeading = (index: number) => {
    // Find the heading in the rendered content and scroll to it
    const contentEl = document.querySelector('.prose')
    if (!contentEl) return
    
    const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings[index]) {
      headings[index].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Check if current user is the campaign owner
  const isOwner = campaign && user && campaign.created_by === user.id

  // Populate edit form when campaign loads
  useEffect(() => {
    if (campaign) {
      setEditForm({
        title: campaign.title || '',
        short_description: campaign.short_description || '',
        story_title: campaign.story_title || '',
        story_content: campaign.story_content || '',
        funding_goal: campaign.funding_goal || 0,
        contact_email: campaign.contact_email || '',
        creator_name: campaign.creator_name || '',
        creator_role: campaign.creator_role || ''
      })
      setSelectedCauseAreaIds(campaign.cause_area_ids || [])
    }
  }, [campaign])

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setShowTagSelector(false)
    // Reset form to original values
    if (campaign) {
      setEditForm({
        title: campaign.title || '',
        short_description: campaign.short_description || '',
        story_title: campaign.story_title || '',
        story_content: campaign.story_content || '',
        funding_goal: campaign.funding_goal || 0,
        contact_email: campaign.contact_email || '',
        creator_name: campaign.creator_name || '',
        creator_role: campaign.creator_role || ''
      })
      setSelectedCauseAreaIds(campaign.cause_area_ids || [])
    }
  }

  const toggleCauseArea = (causeAreaId: string) => {
    setSelectedCauseAreaIds(prev => 
      prev.includes(causeAreaId)
        ? prev.filter(id => id !== causeAreaId)
        : [...prev, causeAreaId]
    )
  }

  const handleSaveEdit = async () => {
    if (!campaign) return
    
    setSaving(true)
    try {
      const updated = await updateCampaign(campaign.id, {
        title: editForm.title,
        short_description: editForm.short_description,
        story_title: editForm.story_title,
        story_content: editForm.story_content,
        funding_goal: editForm.funding_goal,
        contact_email: editForm.contact_email,
        creator_name: editForm.creator_name,
        creator_role: editForm.creator_role,
        cause_area_ids: selectedCauseAreaIds
      })
      
      if (updated) {
        setCampaign({ ...campaign, ...updated })
        // Update the displayed cause areas
        const newCauseAreas = allCauseAreas.filter(ca => selectedCauseAreaIds.includes(ca.id))
        setCauseAreas(newCauseAreas)
        setIsEditing(false)
        setShowTagSelector(false)
      }
    } catch (err) {
      console.error('Error saving campaign:', err)
    } finally {
      setSaving(false)
    }
  }

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
      <div className="max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="px-6 pt-7 pb-0">
          {/* Edit Mode Banner */}
          {isEditing && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                <span className="text-amber-800 font-medium">Editing Campaign</span>
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

          {/* Title with Edit Button */}
          <div className="flex items-start justify-between gap-4">
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="text-4xl font-bold h-auto py-2 border-dashed"
                placeholder="Campaign Title"
              />
            ) : (
              <h1 className="text-5xl font-bold text-[#0a0a0a] leading-tight mb-3">
                {campaign.title}
              </h1>
            )}
            
            {isOwner && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="flex-shrink-0"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Campaign
              </Button>
            )}
          </div>

          {/* Date and Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-sm text-[#737373]">
              {formatDate(campaign.created_at)}
            </span>
            
            {isEditing ? (
              <>
                {/* Selected tags in edit mode */}
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
                    onClick={() => setShowTagSelector(!showTagSelector)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                  
                  {/* Tag selector dropdown */}
                  {showTagSelector && (
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
              </>
            ) : (
              // Display mode
              causeAreas.map((area) => (
                <Badge 
                  key={area.id} 
                  variant="secondary"
                  className="bg-[#eaeaea] text-[#737373] font-normal rounded-full px-2 py-0.5"
                >
                  {area.name}
                </Badge>
              ))
            )}
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
                {faqs.length > 0 && (
                  <Badge className="ml-1.5 bg-[#171717] text-white text-xs px-1.5 py-0 min-w-[20px] h-5 rounded-full">
                    {faqs.length}
                  </Badge>
                )}
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
              <div className="w-[323px] flex-shrink-0 space-y-4">
                <h2 className="text-2xl font-semibold text-[#0a0a0a]">Outline</h2>
                
                {/* Dynamic outline from headings */}
                {outline.length > 0 ? (
                  <nav className="space-y-1">
                    {outline.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToHeading(index)}
                        className={`block text-left w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                          item.level === 1 ? 'font-semibold text-[#0a0a0a]' :
                          item.level === 2 ? 'pl-5 text-[#0a0a0a]' :
                          item.level === 3 ? 'pl-7 text-[#737373] text-sm' :
                          'pl-9 text-[#737373] text-sm'
                        }`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                ) : (
                  <p className="text-sm text-[#737373] italic">
                    Add headings (H1-H6) to your story to generate an outline
                  </p>
                )}

                {/* Short description */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-[#737373] mb-2">Summary</h3>
                  {isEditing ? (
                    <Textarea
                      value={editForm.short_description}
                      onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })}
                      className="min-h-[100px] border-dashed"
                      placeholder="Short description of your campaign..."
                    />
                  ) : (
                    <p className="text-base text-[#0a0a0a] leading-relaxed">
                      {campaign.short_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 space-y-6">
                {/* Story Title */}
                {isEditing ? (
                  <Input
                    value={editForm.story_title}
                    onChange={(e) => setEditForm({ ...editForm, story_title: e.target.value })}
                    className="text-3xl font-bold h-auto py-2 border-dashed"
                    placeholder="Story Title"
                  />
                ) : (
                  campaign.story_title && (
                    <h2 className="text-5xl font-extrabold text-[#0a0a0a]">
                      {campaign.story_title}
                    </h2>
                  )
                )}

                {/* Story Content */}
                {isEditing ? (
                  <div className="border border-dashed border-gray-300 rounded-lg">
                    <RichTextEditor
                      value={editForm.story_content}
                      onChange={(value) => setEditForm({ ...editForm, story_content: value })}
                      placeholder="Tell your campaign story..."
                    />
                  </div>
                ) : campaign.story_content ? (
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
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-6">Frequently Asked Questions</h2>
              
              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div 
                      key={faq.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-5 w-5 text-[#1b5858] flex-shrink-0" />
                          <span className="font-medium text-[#0a0a0a]">{faq.question}</span>
                        </div>
                        {expandedFaq === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-[#737373] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[#737373] flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 pl-12">
                          <p className="text-[#737373] leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[#737373] bg-gray-50 rounded-lg">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No FAQs have been added yet.</p>
                  <p className="text-sm mt-2">Check back later for updates.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="mt-0">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[#0a0a0a]">Campaign Updates</h2>
                
                {/* Post Update Button (only for owner) */}
                {isOwner && !showUpdateForm && (
                  <Button
                    onClick={() => setShowUpdateForm(true)}
                    className="bg-[#1b5858] hover:bg-[#164444]"
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Post Update
                  </Button>
                )}
              </div>

              {/* Update Form (for owner) */}
              {isOwner && showUpdateForm && (
                <Card className="p-6 mb-6 border-[#1b5858]">
                  <h3 className="font-semibold text-[#0a0a0a] mb-4">Share an Update with Supporters</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="update-title" className="text-sm font-medium text-[#0a0a0a]">
                        Update Title
                      </label>
                      <Input
                        id="update-title"
                        value={newUpdateTitle}
                        onChange={(e) => setNewUpdateTitle(e.target.value)}
                        placeholder="e.g., We reached 50% of our goal!"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="update-content" className="text-sm font-medium text-[#0a0a0a]">
                        Content
                      </label>
                      <Textarea
                        id="update-content"
                        value={newUpdateContent}
                        onChange={(e) => setNewUpdateContent(e.target.value)}
                        placeholder="Share news, progress, or thank your supporters..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowUpdateForm(false)
                          setNewUpdateTitle('')
                          setNewUpdateContent('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePostUpdate}
                        disabled={postingUpdate || !newUpdateTitle.trim() || !newUpdateContent.trim()}
                        className="bg-[#1b5858] hover:bg-[#164444]"
                      >
                        {postingUpdate ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Post Update
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Updates List */}
              {updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <Card key={update.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-[#1b5858] rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquarePlus className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-[#0a0a0a]">{update.title}</h3>
                          </div>
                          <p className="text-[#737373] leading-relaxed mb-3">{update.content}</p>
                          <div className="flex items-center gap-2 text-sm text-[#737373]">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(update.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-[#737373] bg-gray-50 rounded-lg">
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No updates have been posted yet.</p>
                  <p className="text-sm mt-2">
                    {isOwner 
                      ? 'Share news and progress with your supporters!' 
                      : 'Check back later for campaign updates.'}
                  </p>
                </div>
              )}
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
              {isEditing ? (
                <Input
                  type="email"
                  value={editForm.contact_email}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                  className="max-w-xs border-dashed"
                  placeholder="contact@example.com"
                />
              ) : (
                <a 
                  href={`mailto:${campaign.contact_email}`}
                  className="inline-flex items-center gap-2 text-[#ea580c] hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {campaign.contact_email}
                </a>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Padding */}
      <div className="h-20" />
      </div>
    </div>
  )
}

export default CampaignPage

