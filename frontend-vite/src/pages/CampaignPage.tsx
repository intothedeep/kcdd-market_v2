/**
 * Campaign Detail Page
 * Public page displaying campaign information, funding progress, and story
 * Route: /user/campaign/:slug or /campaign/:id
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Instagram,
  Youtube,
  Globe,
  Phone,
} from 'lucide-react'
import { supabase, updateCampaign, fetchCauseAreas, submitCampaignReport, type CampaignReportReason } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Flag } from 'lucide-react'

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
  // Social links
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
  website_url?: string
  phone?: string
  organization: {
    id: string
    name: string
    slug: string
    mission: string
    logo_url: string | null
  }
}

interface CampaignImage {
  id: string
  image_url: string
  caption: string | null
  is_featured: boolean
  sort_order: number
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

interface SubmittedQuestion {
  id: string
  question: string
  submitter_email: string | null
  submitter_name: string | null
  status: 'pending' | 'answered' | 'rejected'
  answer: string | null
  is_public: boolean
  created_at: string
}

export function CampaignPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [allCauseAreas, setAllCauseAreas] = useState<CauseArea[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [submittedQuestions, setSubmittedQuestions] = useState<SubmittedQuestion[]>([])
  const [campaignImages, setCampaignImages] = useState<CampaignImage[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('campaign')
  const [showTagSelector, setShowTagSelector] = useState(false)
  
  // Question submission state
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [questionName, setQuestionName] = useState('')
  const [questionEmail, setQuestionEmail] = useState('')
  const [submittingQuestion, setSubmittingQuestion] = useState(false)
  const [questionSubmitted, setQuestionSubmitted] = useState(false)
  
  // Question answering state (for owners)
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [makePublic, setMakePublic] = useState(true)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  
  // Update posting state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [newUpdateTitle, setNewUpdateTitle] = useState('')
  const [newUpdateContent, setNewUpdateContent] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)
  
  // Report campaign state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<CampaignReportReason | ''>('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportEmail, setReportEmail] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)

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
    creator_role: '',
    // Social & contact
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: '',
    website_url: '',
    phone: ''
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

  // Fetch FAQs, updates, submitted questions, and images when campaign loads
  useEffect(() => {
    if (campaign?.id) {
      loadFaqs()
      loadUpdates()
      loadSubmittedQuestions()
      loadCampaignImages()
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

  const loadSubmittedQuestions = async () => {
    if (!campaign?.id) return
    try {
      // If owner, load all questions; otherwise just public answered ones
      let query = supabase
        .from('campaign_questions')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
      
      if (!isOwner) {
        query = query.eq('is_public', true).eq('status', 'answered')
      }
      
      const { data, error } = await query
      
      if (!error && data) {
        setSubmittedQuestions(data)
      }
    } catch (err) {
      console.error('Error loading submitted questions:', err)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!campaign?.id || !newQuestion.trim()) return
    
    setSubmittingQuestion(true)
    try {
      const { error } = await supabase
        .from('campaign_questions')
        .insert({
          campaign_id: campaign.id,
          question: newQuestion.trim(),
          submitter_name: questionName.trim() || null,
          submitter_email: questionEmail.trim() || null,
          status: 'pending'
        })
      
      if (!error) {
        setQuestionSubmitted(true)
        setNewQuestion('')
        setQuestionName('')
        setQuestionEmail('')
        setTimeout(() => {
          setQuestionSubmitted(false)
          setShowQuestionForm(false)
        }, 3000)
      }
    } catch (err) {
      console.error('Error submitting question:', err)
    } finally {
      setSubmittingQuestion(false)
    }
  }

  const handleAnswerQuestion = async (questionId: string) => {
    if (!answerText.trim()) return
    
    setSubmittingAnswer(true)
    try {
      const { error } = await supabase
        .from('campaign_questions')
        .update({
          answer: answerText.trim(),
          status: 'answered',
          is_public: makePublic,
          answered_at: new Date().toISOString(),
          answered_by: user?.id
        })
        .eq('id', questionId)
      
      if (!error) {
        setAnsweringQuestionId(null)
        setAnswerText('')
        setMakePublic(true)
        loadSubmittedQuestions()
        // If made public, also reload FAQs as it might show there
        if (makePublic) {
          loadFaqs()
        }
      }
    } catch (err) {
      console.error('Error answering question:', err)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const handleRejectQuestion = async (questionId: string) => {
    try {
      await supabase
        .from('campaign_questions')
        .update({ status: 'rejected' })
        .eq('id', questionId)
      
      loadSubmittedQuestions()
    } catch (err) {
      console.error('Error rejecting question:', err)
    }
  }

  const loadCampaignImages = async () => {
    if (!campaign?.id) return
    try {
      const { data, error } = await (supabase
        .from('campaign_images') as any)
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('sort_order', { ascending: true })
      
      if (!error && data) {
        setCampaignImages(data)
        // Set featured image as selected
        const featured = data.find((img: CampaignImage) => img.is_featured)
        if (featured) {
          setSelectedImage(featured.image_url)
        } else if (data.length > 0) {
          setSelectedImage(data[0].image_url)
        }
      }
    } catch (err) {
      console.error('Error loading campaign images:', err)
    }
  }

  // Check if campaign has any social links
  const hasSocialLinks = campaign && (
    campaign.facebook_url || 
    campaign.twitter_url || 
    campaign.instagram_url || 
    campaign.linkedin_url || 
    campaign.youtube_url || 
    campaign.tiktok_url ||
    campaign.website_url
  )

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
        creator_role: campaign.creator_role || '',
        facebook_url: campaign.facebook_url || '',
        twitter_url: campaign.twitter_url || '',
        instagram_url: campaign.instagram_url || '',
        linkedin_url: campaign.linkedin_url || '',
        youtube_url: campaign.youtube_url || '',
        tiktok_url: campaign.tiktok_url || '',
        website_url: campaign.website_url || '',
        phone: (campaign as any).phone || ''
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
        creator_role: campaign.creator_role || '',
        facebook_url: campaign.facebook_url || '',
        twitter_url: campaign.twitter_url || '',
        instagram_url: campaign.instagram_url || '',
        linkedin_url: campaign.linkedin_url || '',
        youtube_url: campaign.youtube_url || '',
        tiktok_url: campaign.tiktok_url || '',
        website_url: campaign.website_url || '',
        phone: (campaign as any).phone || ''
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
        cause_area_ids: selectedCauseAreaIds,
        // Social links and contact
        facebook_url: editForm.facebook_url || null,
        twitter_url: editForm.twitter_url || null,
        instagram_url: editForm.instagram_url || null,
        linkedin_url: editForm.linkedin_url || null,
        youtube_url: editForm.youtube_url || null,
        tiktok_url: editForm.tiktok_url || null,
        website_url: editForm.website_url || null,
        phone: editForm.phone || null
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
    if (campaign?.slug) {
      navigate(`/campaign/${campaign.slug}/donate`)
    }
  }

  const handleReportCampaign = async () => {
    if (!campaign?.id || !reportReason) return

    setSubmittingReport(true)
    try {
      await submitCampaignReport({
        campaign_id: campaign.id,
        reporter_id: user?.id || null,
        reporter_email: reportEmail || user?.emailAddresses?.[0]?.emailAddress || null,
        reason: reportReason,
        description: reportDescription || null
      })

      setReportSubmitted(true)
      setTimeout(() => {
        setShowReportModal(false)
        setReportSubmitted(false)
        setReportReason('')
        setReportDescription('')
        setReportEmail('')
      }, 3000)
    } catch (err) {
      console.error('Error submitting report:', err)
    } finally {
      setSubmittingReport(false)
    }
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
          {/* Main Image and Gallery */}
          <div className="w-[824px] flex-shrink-0 space-y-3">
            {/* Main Display Image */}
            <div className="w-full h-[460px] bg-[#f5f5f5] rounded-[10px] overflow-hidden">
              {selectedImage || campaign.image_url ? (
                <img 
                  src={selectedImage || campaign.image_url || ''} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-[#737373] flex flex-col items-center">
                    <Target className="h-16 w-16 mb-2 opacity-50" />
                    <span className="text-sm">Campaign Media</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {campaignImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* Logo as first thumbnail if exists */}
                {campaign.logo_url && (
                  <button
                    onClick={() => setSelectedImage(campaign.logo_url!)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === campaign.logo_url 
                        ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={campaign.logo_url} 
                      alt="Organization logo"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
                
                {/* Gallery images */}
                {campaignImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img.image_url 
                        ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={img.caption || undefined}
                  >
                    <img 
                      src={img.image_url} 
                      alt={img.caption || 'Campaign gallery'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Card className="flex-1 border-[#f5f5f5] p-2 rounded-[10px]">
            <div className="flex flex-col gap-5 h-full">
              {/* Creator Info */}
              <div className="space-y-2.5">
                <Link
                  to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-[42px] w-[42px]">
                    <AvatarImage src={campaign.logo_url || campaign.organization?.logo_url || undefined} />
                    <AvatarFallback className="bg-[#f5f5f5]">
                      {campaign.creator_name?.charAt(0) || campaign.organization?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-[#0a0a0a] hover:text-[#ea580c] transition-colors">
                      {campaign.creator_name || campaign.organization?.name}
                    </p>
                    <p className="text-sm text-[#737373]">
                      {campaign.creator_role || 'Campaign Creator'}
                    </p>
                  </div>
                </Link>
                
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
                <div className="space-y-2">
                  <Button
                    onClick={handleSupport}
                    className="w-full bg-[#ea580c] hover:bg-[#dc4c06] text-white rounded-full h-9"
                  >
                    Support Campaign
                  </Button>

                  {/* Report Button - only show if not owner */}
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReportModal(true)}
                      className="w-full text-[#737373] hover:text-red-600 hover:bg-red-50 h-8"
                    >
                      <Flag className="h-3.5 w-3.5 mr-1.5" />
                      Report Campaign
                    </Button>
                  )}
                </div>

                {/* Social Links - Only show if campaign has social links */}
                {hasSocialLinks && (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-[#737373]">Follow us</p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {campaign.facebook_url && (
                        <a
                          href={campaign.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {campaign.twitter_url && (
                        <a
                          href={campaign.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="Twitter/X"
                        >
                          <Twitter className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {campaign.instagram_url && (
                        <a
                          href={campaign.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {campaign.linkedin_url && (
                        <a
                          href={campaign.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {campaign.youtube_url && (
                        <a
                          href={campaign.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="YouTube"
                        >
                          <Youtube className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {campaign.tiktok_url && (
                        <a
                          href={campaign.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="TikTok"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white fill-current">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </a>
                      )}
                      {campaign.website_url && (
                        <a
                          href={campaign.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-[#1b5858] rounded-full hover:opacity-80 transition-opacity"
                          aria-label="Website"
                        >
                          <Globe className="h-4 w-4 text-white" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[#0a0a0a]">Frequently Asked Questions</h2>
                {!showQuestionForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowQuestionForm(true)}
                    className="border-[#1b5858] text-[#1b5858] hover:bg-[#1b5858] hover:text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                )}
              </div>

              {/* Question Submission Form */}
              {showQuestionForm && (
                <Card className="p-6 mb-6 border-[#1b5858]">
                  {questionSubmitted ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-[#0a0a0a] mb-1">Question Submitted!</h3>
                      <p className="text-sm text-[#737373]">
                        The campaign organizer will review your question and may add it to the FAQs.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-[#0a0a0a] mb-4">Ask the Campaign Organizer</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="question-text" className="text-sm font-medium text-[#0a0a0a]">
                            Your Question *
                          </label>
                          <Textarea
                            id="question-text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="What would you like to know about this campaign?"
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="question-name" className="text-sm font-medium text-[#0a0a0a]">
                              Your Name (optional)
                            </label>
                            <Input
                              id="question-name"
                              value={questionName}
                              onChange={(e) => setQuestionName(e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="question-email" className="text-sm font-medium text-[#0a0a0a]">
                              Email (optional)
                            </label>
                            <Input
                              id="question-email"
                              type="email"
                              value={questionEmail}
                              onChange={(e) => setQuestionEmail(e.target.value)}
                              placeholder="john@example.com"
                            />
                            <p className="text-xs text-[#737373]">Get notified when your question is answered</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowQuestionForm(false)
                              setNewQuestion('')
                              setQuestionName('')
                              setQuestionEmail('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSubmitQuestion}
                            disabled={submittingQuestion || !newQuestion.trim()}
                            className="bg-[#1b5858] hover:bg-[#164444]"
                          >
                            {submittingQuestion ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Question
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              )}

              {/* Owner's Pending Questions Section */}
              {isOwner && submittedQuestions.filter(q => q.status === 'pending').length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-[#0a0a0a] mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Pending Questions ({submittedQuestions.filter(q => q.status === 'pending').length})
                  </h3>
                  <div className="space-y-3">
                    {submittedQuestions
                      .filter(q => q.status === 'pending')
                      .map((question) => (
                        <Card key={question.id} className="p-4 border-amber-200 bg-amber-50">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <p className="font-medium text-[#0a0a0a]">{question.question}</p>
                              <p className="text-xs text-[#737373] mt-1">
                                {question.submitter_name && `From: ${question.submitter_name} • `}
                                {new Date(question.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          {answeringQuestionId === question.id ? (
                            <div className="space-y-3 mt-4 pt-4 border-t border-amber-200">
                              <Textarea
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Write your answer..."
                                rows={3}
                                className="resize-none bg-white"
                              />
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`public-${question.id}`}
                                  checked={makePublic}
                                  onCheckedChange={(checked) => setMakePublic(checked === true)}
                                />
                                <label 
                                  htmlFor={`public-${question.id}`} 
                                  className="text-sm text-[#737373] cursor-pointer"
                                >
                                  Add to public FAQs
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setAnsweringQuestionId(null)
                                    setAnswerText('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAnswerQuestion(question.id)}
                                  disabled={submittingAnswer || !answerText.trim()}
                                  className="bg-[#1b5858] hover:bg-[#164444]"
                                >
                                  {submittingAnswer ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Submit Answer'
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => setAnsweringQuestionId(question.id)}
                                className="bg-[#1b5858] hover:bg-[#164444]"
                              >
                                Answer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectQuestion(question.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                </div>
              )}
              
              {/* FAQs Accordion */}
              {faqs.length > 0 || submittedQuestions.filter(q => q.status === 'answered' && q.is_public).length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                  {/* Static FAQs */}
                  {faqs.map((faq) => (
                    <AccordionItem 
                      key={faq.id} 
                      value={faq.id}
                      className="border border-gray-200 rounded-lg px-4 data-[state=open]:bg-gray-50"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <HelpCircle className="h-5 w-5 text-[#1b5858] flex-shrink-0" />
                          <span className="font-medium text-[#0a0a0a]">{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-8 text-[#737373]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  
                  {/* Answered public questions */}
                  {submittedQuestions
                    .filter(q => q.status === 'answered' && q.is_public)
                    .map((question) => (
                      <AccordionItem 
                        key={question.id} 
                        value={question.id}
                        className="border border-gray-200 rounded-lg px-4 data-[state=open]:bg-gray-50"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <MessageCircle className="h-5 w-5 text-[#ea580c] flex-shrink-0" />
                            <span className="font-medium text-[#0a0a0a]">{question.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-8 text-[#737373]">
                          {question.answer}
                          {question.submitter_name && (
                            <p className="text-xs mt-2 text-[#a3a3a3]">
                              Asked by {question.submitter_name}
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              ) : (
                <div className="py-12 text-center text-[#737373] bg-gray-50 rounded-lg">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No FAQs have been added yet.</p>
                  <p className="text-sm mt-2">Be the first to ask a question!</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowQuestionForm(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
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
                About{' '}
                <Link
                  to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                  className="text-[#ea580c] hover:underline"
                >
                  {campaign.organization?.name}
                </Link>
              </h2>
              <p className="text-base text-[#0a0a0a] leading-relaxed mb-4">
                {campaign.organization?.mission || 'No organization description available.'}
              </p>
              <Link
                to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                className="inline-flex items-center text-[#ea580c] hover:underline font-medium"
              >
                View Organization Profile →
              </Link>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-0">
            <div className="max-w-2xl space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-2">
                  Get in Touch
                </h2>
                <p className="text-base text-[#737373]">
                  Have questions about this campaign? Reach out to us.
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#0a0a0a]">Contact Information</h3>
                <div className="grid gap-4">
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editForm.contact_email}
                        onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="contact@example.com"
                      />
                    ) : (
                      <a 
                        href={`mailto:${campaign.contact_email}`}
                        className="text-[#0a0a0a] hover:text-[#ea580c] transition-colors"
                      >
                        {campaign.contact_email || 'No email provided'}
                      </a>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="(555) 555-5555"
                      />
                    ) : campaign.phone ? (
                      <a 
                        href={`tel:${campaign.phone}`}
                        className="text-[#0a0a0a] hover:text-[#ea580c] transition-colors"
                      >
                        {campaign.phone}
                      </a>
                    ) : (
                      <span className="text-[#737373]">No phone provided</span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    {isEditing ? (
                      <Input
                        type="url"
                        value={editForm.website_url}
                        onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://yourwebsite.com"
                      />
                    ) : campaign.website_url ? (
                      <a 
                        href={campaign.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0a0a0a] hover:text-[#ea580c] transition-colors"
                      >
                        {campaign.website_url}
                      </a>
                    ) : (
                      <span className="text-[#737373]">No website provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#0a0a0a]">Follow Us</h3>
                {isEditing ? (
                  <div className="grid gap-3">
                    {/* Facebook */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Facebook className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        value={editForm.facebook_url}
                        onChange={(e) => setEditForm({ ...editForm, facebook_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    {/* Twitter/X */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Twitter className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        value={editForm.twitter_url}
                        onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://x.com/yourhandle"
                      />
                    </div>
                    {/* Instagram */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        value={editForm.instagram_url}
                        onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>
                    {/* LinkedIn */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Linkedin className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        value={editForm.linkedin_url}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://linkedin.com/company/yourorg"
                      />
                    </div>
                    {/* YouTube */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                      <Input
                        value={editForm.youtube_url}
                        onChange={(e) => setEditForm({ ...editForm, youtube_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://youtube.com/@yourchannel"
                      />
                    </div>
                    {/* TikTok - no Lucide icon available, using custom SVG */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1b5858] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      </div>
                      <Input
                        value={editForm.tiktok_url}
                        onChange={(e) => setEditForm({ ...editForm, tiktok_url: e.target.value })}
                        className="flex-1 border-dashed"
                        placeholder="https://tiktok.com/@yourhandle"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {campaign.facebook_url && (
                      <a
                        href={campaign.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Facebook className="h-5 w-5" />
                        Facebook
                      </a>
                    )}
                    {campaign.twitter_url && (
                      <a
                        href={campaign.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Twitter className="h-5 w-5" />
                        X / Twitter
                      </a>
                    )}
                    {campaign.instagram_url && (
                      <a
                        href={campaign.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Instagram className="h-5 w-5" />
                        Instagram
                      </a>
                    )}
                    {campaign.linkedin_url && (
                      <a
                        href={campaign.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Linkedin className="h-5 w-5" />
                        LinkedIn
                      </a>
                    )}
                    {campaign.youtube_url && (
                      <a
                        href={campaign.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Youtube className="h-5 w-5" />
                        YouTube
                      </a>
                    )}
                    {campaign.tiktok_url && (
                      <a
                        href={campaign.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1b5858] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                        TikTok
                      </a>
                    )}
                    {!campaign.facebook_url && !campaign.twitter_url && !campaign.instagram_url && 
                     !campaign.linkedin_url && !campaign.youtube_url && !campaign.tiktok_url && (
                      <p className="text-[#737373]">No social media links provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Padding */}
      <div className="h-20" />
      </div>

      {/* Report Campaign Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Report Campaign
            </DialogTitle>
            <DialogDescription>
              Help us keep our community safe. Reports are reviewed by our team.
            </DialogDescription>
          </DialogHeader>

          {reportSubmitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-[#0a0a0a] mb-1">Report Submitted</h3>
              <p className="text-sm text-[#737373]">
                Thank you for helping keep our community safe. We'll review your report shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Reason Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Why are you reporting this campaign? *
                </label>
                <div className="grid gap-2">
                  {[
                    { value: 'fraud', label: 'Suspected fraud or scam', icon: '🚨' },
                    { value: 'misleading', label: 'Misleading information', icon: '⚠️' },
                    { value: 'inappropriate', label: 'Inappropriate content', icon: '🚫' },
                    { value: 'spam', label: 'Spam or fake campaign', icon: '📧' },
                    { value: 'other', label: 'Other concern', icon: '❓' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReportReason(option.value as CampaignReportReason)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        reportReason === option.value
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="report-description" className="text-sm font-medium text-[#0a0a0a]">
                  Additional details (optional)
                </label>
                <Textarea
                  id="report-description"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide any additional information that might help us investigate..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Email (if not signed in) */}
              {!isSignedIn && (
                <div className="space-y-2">
                  <label htmlFor="report-email" className="text-sm font-medium text-[#0a0a0a]">
                    Your email (optional)
                  </label>
                  <Input
                    id="report-email"
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                  <p className="text-xs text-[#737373]">
                    We may contact you if we need more information
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                    setReportDescription('')
                    setReportEmail('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReportCampaign}
                  disabled={submittingReport || !reportReason}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {submittingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CampaignPage

