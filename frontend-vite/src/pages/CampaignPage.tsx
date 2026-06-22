/**
 * Campaign Detail Page
 * Public page displaying campaign information, funding progress, and story
 * Route: /user/campaign/:slug or /campaign/:id
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Checkbox } from '@/components/ui/checkbox'
import { sanitizeStoryHtml } from '@/lib/sanitizeStoryHtml'
import { formatRelativeTime } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  ArrowLeft,
  Target,
  Loader2,
  Pencil,
  Save,
  X,
  Plus,
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
  ShieldAlert,
  AlertTriangle,
  Ban,
  type LucideIcon,
} from 'lucide-react'
import {
  supabase,
  fetchCauseAreas,
  submitCampaignReport,
  type CampaignReportReason,
} from '@/lib/supabase'
import { api } from '@/lib/api'
import { CampaignDonateModal } from '@/components/CampaignDonateModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Flag } from 'lucide-react'
import {
  buildPublishedCampaignView,
  type PublishedCampaignContent,
  type PublishedCampaignView,
} from '@/types/PublishedCampaignView'

// `Campaign` interface superseded by `PublishedCampaignView` (A7a).
// The page state and JSX now consume the view adapter so donor-visible
// content is sourced from the published campaign_details row per D-public-page.

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

// Pull a YouTube video ID out of a watch/embed/short/youtu.be URL.
// Returns null when src is not a YouTube URL (regular image).
function parseYouTubeId(src: string): string | null {
  try {
    const u = new URL(src)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1) || null
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)
      if (m) return m[1]
    }
  } catch {
    /* not a URL */
  }
  return null
}

// Render story HTML stored in campaign_details.content.story_content (post-REFB).
// Story bodies come from a TipTap rich-text editor (CBO authoring) and pass
// through admin review, but we sanitize via DOMPurify at render time as
// defense-in-depth against XSS payloads that survive eyeball review (H5-B / M3).
function renderStoryHtml(content: string): string {
  const looksLikeHtml = /<\/?[a-z][\s\S]*?>/i.test(content)
  const html = looksLikeHtml ? content : content.replace(/\n/g, '<br />')
  return sanitizeStoryHtml(html)
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
  const { user, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [campaign, setCampaign] = useState<PublishedCampaignView | null>(null)
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
  const [showDonateModal, setShowDonateModal] = useState(false)
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
    phone: '',
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

  // Build outline from story content headings.
  // Normalize so the shallowest heading in the document becomes level 1
  // (e.g. a story that starts at h2 still gets a clean top-level outline).
  const buildOutline = (htmlContent: string): OutlineItem[] => {
    if (!htmlContent) return []

    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length === 0) return []

    const rawLevels = Array.from(headings).map((h) => parseInt(h.tagName.charAt(1)))
    const minLevel = Math.min(...rawLevels)

    const items: OutlineItem[] = []
    headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || ''
      if (text) {
        items.push({
          id: `heading-${index}`,
          text,
          level: parseInt(heading.tagName.charAt(1)) - minLevel + 1,
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

  // SEO: write <meta name="last-modified"> from the canonical
  // `last_edit_approved_at` so crawlers see the approved content
  // timestamp (NOT the unapproved-edit cadence in `last_edited_at`).
  useEffect(() => {
    if (!campaign?.last_edit_approved_at) return
    let tag = document.querySelector('meta[name="last-modified"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'last-modified')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', new Date(campaign.last_edit_approved_at).toISOString())
  }, [campaign?.last_edit_approved_at])

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
      const { error } = await supabase.from('campaign_questions').insert({
        campaign_id: campaign.id,
        question: newQuestion.trim(),
        submitter_name: questionName.trim() || null,
        submitter_email: questionEmail.trim() || null,
        status: 'pending',
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
          answered_by: user?.id,
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
      await supabase.from('campaign_questions').update({ status: 'rejected' }).eq('id', questionId)

      loadSubmittedQuestions()
    } catch (err) {
      console.error('Error rejecting question:', err)
    }
  }

  const loadCampaignImages = async () => {
    if (!campaign?.id) return
    try {
      const { data, error } = await (supabase.from('campaign_images') as any)
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
  const hasSocialLinks =
    campaign &&
    (campaign.facebook_url ||
      campaign.twitter_url ||
      campaign.instagram_url ||
      campaign.linkedin_url ||
      campaign.youtube_url ||
      campaign.tiktok_url ||
      campaign.website_url)

  const handlePostUpdate = async () => {
    if (!campaign?.id || !user?.id || !newUpdateTitle.trim() || !newUpdateContent.trim()) return

    setPostingUpdate(true)
    try {
      const { error } = await supabase.from('campaign_updates').insert({
        campaign_id: campaign.id,
        title: newUpdateTitle,
        content: newUpdateContent,
        created_by: user.id,
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
        phone: (campaign as any).phone || '',
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
        phone: (campaign as any).phone || '',
      })
      setSelectedCauseAreaIds(campaign.cause_area_ids || [])
    }
  }

  const toggleCauseArea = (causeAreaId: string) => {
    setSelectedCauseAreaIds((prev) =>
      prev.includes(causeAreaId) ? prev.filter((id) => id !== causeAreaId) : [...prev, causeAreaId]
    )
  }

  const handleSaveEdit = async () => {
    if (!campaign) return

    setSaving(true)
    try {
      // Post-REFB content edits MUST go through the state machine.
      // The backend route inserts a new campaign_details row with
      // status pending_*_approval; the page does NOT mutate the
      // campaigns row directly.
      const content = {
        title: editForm.title,
        short_description: editForm.short_description,
        story_title: editForm.story_title,
        story_content: editForm.story_content,
        funding_goal: editForm.funding_goal,
        contact_email: editForm.contact_email,
        creator_name: editForm.creator_name,
        creator_role: editForm.creator_role,
        cause_area_ids: selectedCauseAreaIds,
        facebook_url: editForm.facebook_url || null,
        twitter_url: editForm.twitter_url || null,
        instagram_url: editForm.instagram_url || null,
        linkedin_url: editForm.linkedin_url || null,
        youtube_url: editForm.youtube_url || null,
        tiktok_url: editForm.tiktok_url || null,
        website_url: editForm.website_url || null,
        phone: editForm.phone || null,
      }

      await api.post(
        `/api/campaigns/${campaign.id}/submit-edit`,
        { content, change_summary: null },
        getToken
      )

      // Optimistic UI: reflect the just-submitted content locally.
      // The new content is pending admin approval — donors won't see
      // it until then, but the editor sees their own draft.
      setCampaign({ ...campaign, ...content } as PublishedCampaignView)
      const newCauseAreas = allCauseAreas.filter((ca) => selectedCauseAreaIds.includes(ca.id))
      setCauseAreas(newCauseAreas)
      setIsEditing(false)
      setShowTagSelector(false)
    } catch (err) {
      console.error('Error saving campaign:', err)
    } finally {
      setSaving(false)
    }
  }

  const fetchCampaign = async () => {
    try {
      setLoading(true)

      // Fetch campaign by slug or id. The raw URL param is untrusted: an
      // unescaped slug interpolated into PostgREST .or() lets the caller
      // inject extra filter clauses (commas, dots, parens are PostgREST
      // metacharacters). Resolve which column to match first, then run a
      // single .eq() with the validated value — and reject anything that
      // matches neither shape.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const SLUG_RE = /^[a-z0-9-]+$/i
      const column: 'id' | 'slug' | null = !slug
        ? null
        : UUID_RE.test(slug)
          ? 'id'
          : SLUG_RE.test(slug)
            ? 'slug'
            : null
      if (!column || !slug) {
        throw new Error('Campaign not found')
      }
      const query = supabase.from('campaigns').select(
        `
          *,
          organization:organizations(id, name, slug, mission, logo_url, stripe_charges_enabled)
        `
      )
      const { data, error } = await query.eq(column, slug).single()

      if (error) throw error

      // Post-REFB: campaigns has no published_detail_id pointer. Fetch the
      // latest approved campaign_details row in a separate query and overlay
      // its content onto the live row. Live row still owns identity +
      // runtime counters (amount_raised, supporters_count, organization join).
      const { data: approvedDetail } = await supabase
        .from('campaign_details')
        .select('content, version')
        .eq('campaign_id', (data as { id: string }).id)
        .eq('status', 'approved')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      // approvedDetail is typed `never` by the supabase generic for tables that
      // don't yet exist in `src/types/database.types.ts`. Cast through unknown.
      const content =
        (approvedDetail as unknown as { content?: PublishedCampaignContent } | null)?.content ??
        null

      const view = buildPublishedCampaignView(data as Record<string, unknown>, content)
      setCampaign(view)

      // Fetch cause area names from the (content-sourced) view
      if (view.cause_area_ids && view.cause_area_ids.length > 0) {
        const { data: causes, error: causesError } = await supabase
          .from('cause_areas')
          .select('id, name')
          .in('id', view.cause_area_ids)

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
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSupport = () => {
    // Open the in-page donate modal instead of navigating to the full
    // /campaign/:slug/donate page so the donor keeps their place. The route
    // is still available as a fallback for direct/share links.
    if (campaign) setShowDonateModal(true)
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
        description: reportDescription || null,
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

  const _handleShare = (platform: string) => {
    const url = window.location.href
    const title = campaign?.title || 'Support this campaign'

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">Campaign Not Found</h1>
        <p className="mb-6 text-[#737373]">
          The campaign you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    )
  }

  if (campaign.hasContent === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-6">
        <h1 className="mb-4 text-2xl font-bold text-[#0a0a0a]">Campaign Awaiting Review</h1>
        <p className="mb-6 max-w-md text-center text-[#737373]">
          This campaign has not yet been approved for public viewing. Please check back later.
        </p>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-[1200px]">
        {/* Header Section */}
        <div className="px-6 pb-0 pt-7">
          {/* Edit Mode Banner */}
          {isEditing && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">Editing Campaign</span>
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

          {/* Above-the-fold org identity — Theme 3 / W4-E */}
          {campaign.organization && (
            <Link
              to={`/organizations/${campaign.organization.slug || campaign.organization.id}`}
              className="group mb-3 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 hover:border-[hsl(var(--brand-primary))] hover:bg-white"
              aria-label={`View ${campaign.organization.name} organization profile`}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={campaign.organization.logo_url || undefined} alt="" />
                <AvatarFallback className="text-[10px]">
                  {campaign.organization.name?.slice(0, 2).toUpperCase() || 'OR'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-neutral-800 group-hover:text-[hsl(var(--brand-primary))]">
                {campaign.organization.name}
              </span>
              <span className="text-xs text-neutral-500 group-hover:text-[hsl(var(--brand-primary))]">
                View organization profile →
              </span>
            </Link>
          )}

          {/* Title with Edit Button */}
          <div className="flex items-start justify-between gap-4">
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="h-auto border-dashed py-2 text-4xl font-bold"
                placeholder="Campaign Title"
              />
            ) : (
              <h1 className="mb-3 text-5xl font-bold leading-tight text-[#0a0a0a]">
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
                <Pencil className="mr-1 h-4 w-4" />
                Edit Campaign
              </Button>
            )}
          </div>

          {/* Date and Tags */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#737373]">{formatDate(campaign.created_at)}</span>

            {/*
              W4-A: "Updated" badge — visible when this campaign has received
              an admin-approved edit at least 1 minute after first approval.
              The 1-minute threshold rejects backfill artifacts from
              20260616000003_campaigns_metadata_only.sql L77-83 where both
              timestamps default to created_at. Reuses existing columns; no
              new RPC / table / dep.
            */}
            {campaign.last_edit_approved_at != null &&
              campaign.first_approved_at != null &&
              new Date(campaign.last_edit_approved_at).getTime() -
                new Date(campaign.first_approved_at).getTime() >
                60_000 && (
                <Badge
                  variant="secondary"
                  title={new Date(campaign.last_edit_approved_at).toLocaleString()}
                  aria-label={`Updated ${new Date(campaign.last_edit_approved_at).toISOString()}`}
                  className="rounded-full bg-[#eaeaea] px-2 py-0.5 font-normal text-[#737373]"
                >
                  Updated {formatRelativeTime(campaign.last_edit_approved_at)}
                </Badge>
              )}

            {isEditing ? (
              <>
                {/* Selected tags in edit mode */}
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
                    onClick={() => setShowTagSelector(!showTagSelector)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Tag
                  </Button>

                  {/* Tag selector dropdown */}
                  {showTagSelector && (
                    <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="p-2">
                        <p className="mb-2 px-2 text-xs text-[#737373]">Select cause areas:</p>
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
              </>
            ) : (
              // Display mode
              causeAreas.map((area) => (
                <Badge
                  key={area.id}
                  variant="secondary"
                  className="rounded-full bg-[#eaeaea] px-2 py-0.5 font-normal text-[#737373]"
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
              {/* Main Display Image (or embedded YouTube video) */}
              <div className="relative h-[460px] w-full overflow-hidden rounded-[10px] bg-[#f5f5f5]">
                {(() => {
                  const src = selectedImage || campaign.image_url || ''
                  if (!src) {
                    return (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center text-[#737373]">
                          <Target className="mb-2 h-16 w-16 opacity-50" />
                          <span className="text-sm">Campaign Media</span>
                        </div>
                      </div>
                    )
                  }
                  const ytId = parseYouTubeId(src)
                  if (ytId) {
                    return (
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                        title={campaign.title}
                        frameBorder={0}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  }
                  return (
                    <>
                      <img src={src} alt={campaign.title} className="h-full w-full object-cover" />
                      {src.includes('kcdd_placeholder=1') && (
                        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                          Placeholder photo
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Image Thumbnails */}
              {campaignImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {/* Logo as first thumbnail if exists */}
                  {campaign.logo_url && (
                    <button
                      onClick={() => setSelectedImage(campaign.logo_url!)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === campaign.logo_url
                          ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={campaign.logo_url}
                        alt="Organization logo"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )}

                  {/* Gallery images */}
                  {campaignImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === img.image_url
                          ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={img.caption || undefined}
                    >
                      <img
                        src={img.image_url}
                        alt={img.caption || 'Campaign gallery'}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <Card className="flex-1 rounded-[10px] border-[#f5f5f5] p-2">
              <div className="flex h-full flex-col gap-5">
                {/* Creator Info */}
                <div className="space-y-2.5">
                  <Link
                    to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                    className="group flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
                  >
                    <Avatar className="h-[42px] w-[42px] transition-all group-hover:ring-2 group-hover:ring-[hsl(var(--brand-primary))] group-hover:ring-offset-2">
                      <AvatarImage
                        src={campaign.logo_url || campaign.organization?.logo_url || undefined}
                      />
                      <AvatarFallback className="bg-[#f5f5f5]">
                        {campaign.creator_name?.charAt(0) ||
                          campaign.organization?.name?.charAt(0) ||
                          'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-[#0a0a0a] transition-colors group-hover:text-[hsl(var(--brand-primary))] group-hover:underline">
                        {campaign.creator_name || campaign.organization?.name}
                      </p>
                      <p className="text-sm text-[#737373]">
                        {campaign.creator_role || 'Campaign Creator'}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-400 group-hover:text-[hsl(var(--brand-primary))]">
                        View organization profile <span aria-hidden="true">→</span>
                      </span>
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

                  <p className="text-sm leading-relaxed text-[#737373]">
                    {campaign.short_description || campaign.organization?.mission}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full overflow-hidden rounded-full border border-[#ea580c]">
                    <div
                      className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
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
                    <p className="text-sm text-[#747474]">{campaign.supporters_count} Supporters</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-1 flex-col justify-between py-2.5">
                  <div className="space-y-2">
                    <Button
                      onClick={handleSupport}
                      className="h-9 w-full rounded-full bg-[#ea580c] text-white hover:bg-[#dc4c06]"
                    >
                      Support Campaign
                    </Button>

                    {/* Report Button - only show if not owner */}
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReportModal(true)}
                        className="h-8 w-full text-[#737373] hover:bg-red-50 hover:text-red-600"
                      >
                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                        Report Campaign
                      </Button>
                    )}
                  </div>

                  {/* Social Links - Only show if campaign has social links */}
                  {hasSocialLinks && (
                    <div className="space-y-2">
                      <p className="text-center text-xs text-[#737373]">Follow us</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {campaign.facebook_url && (
                          <a
                            href={campaign.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
                            aria-label="TikTok"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-white">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                          </a>
                        )}
                        {campaign.website_url && (
                          <a
                            href={campaign.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-[#1b5858] p-2 transition-opacity hover:opacity-80"
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
              <TabsList className="w-full justify-start rounded-lg bg-[#f5f5f5] p-[3px]">
                <TabsTrigger
                  value="campaign"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Campaign
                </TabsTrigger>
                <TabsTrigger
                  value="faqs"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  FAQs
                  {faqs.length > 0 && (
                    <Badge className="ml-1.5 h-5 min-w-[20px] rounded-full bg-[#171717] px-1.5 py-0 text-xs text-white">
                      {faqs.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="updates"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Updates
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  About Us
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
                  {/* YELLOW Y4: hide the Outline heading entirely for visitors
                      when there's no outline to render. Owners still see the
                      heading + empty-state CTA so they're nudged to publish. */}
                  {(outline.length > 0 || isOwner) && (
                    <>
                      <h2 className="text-2xl font-semibold text-[#0a0a0a]">Outline</h2>

                      {/* Dynamic outline from headings */}
                      {outline.length > 0 ? (
                        <nav className="space-y-0.5">
                          {outline.map((item, index) => (
                            <button
                              key={item.id}
                              onClick={() => scrollToHeading(index)}
                              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm leading-snug transition-colors hover:bg-gray-100 ${
                                item.level === 1
                                  ? 'font-semibold text-[#0a0a0a]'
                                  : item.level === 2
                                    ? 'pl-5 text-[#404040]'
                                    : item.level === 3
                                      ? 'pl-7 text-xs text-[#737373]'
                                      : 'pl-9 text-xs text-[#737373]'
                              }`}
                            >
                              {item.text}
                            </button>
                          ))}
                        </nav>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50/50 p-4 text-sm">
                          <p className="mb-2 text-neutral-700">
                            Visitors can jump to sections of your story using this outline.
                          </p>
                          <p className="mb-3 text-neutral-600">
                            Add H1–H3 headings to your story, then approve to publish.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartEdit}
                            className="border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white"
                          >
                            Edit campaign
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Short description */}
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="mb-2 text-sm font-medium text-[#737373]">Summary</h3>
                    {isEditing ? (
                      <Textarea
                        value={editForm.short_description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, short_description: e.target.value })
                        }
                        className="min-h-[100px] border-dashed"
                        placeholder="Short description of your campaign..."
                      />
                    ) : (
                      <p className="text-base leading-relaxed text-[#0a0a0a]">
                        {campaign.short_description}
                      </p>
                    )}
                  </div>

                  {/* Organization — surfaced here so visitors don't have to
                      switch to the About Us tab to see who runs the campaign. */}
                  {campaign.organization && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="mb-2 text-sm font-medium text-[#737373]">Organization</h3>
                      <Link
                        to={`/organizations/${campaign.organization.slug || campaign.organization.id || campaign.organization_id}`}
                        className="group flex items-center gap-3"
                      >
                        {campaign.organization.logo_url ? (
                          <img
                            src={campaign.organization.logo_url}
                            alt={campaign.organization.name}
                            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-[#737373]">
                            {campaign.organization.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="text-sm font-medium text-[#0a0a0a] group-hover:text-[#ea580c] group-hover:underline">
                          {campaign.organization.name}
                        </span>
                      </Link>
                      {campaign.organization.mission && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#404040]">
                          {campaign.organization.mission}
                        </p>
                      )}
                      <Link
                        to={`/organizations/${campaign.organization.slug || campaign.organization.id || campaign.organization_id}`}
                        className="mt-2 inline-flex items-center text-sm font-medium text-[#ea580c] hover:underline"
                      >
                        View organization profile →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                  {/* Story Title */}
                  {isEditing ? (
                    <Input
                      value={editForm.story_title}
                      onChange={(e) => setEditForm({ ...editForm, story_title: e.target.value })}
                      className="h-auto border-dashed py-2 text-3xl font-bold"
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
                    <div className="rounded-lg border border-dashed border-gray-300">
                      <RichTextEditor
                        value={editForm.story_content}
                        onChange={(value) => setEditForm({ ...editForm, story_content: value })}
                        placeholder="Tell your campaign story..."
                      />
                    </div>
                  ) : campaign.story_content ? (
                    <div
                      className="campaign-story max-w-none text-base leading-relaxed text-[#0a0a0a]
                                 [&_a]:font-medium [&_a]:text-[#ea580c] [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#ea580c]
                                 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#404040] [&_h2]:mb-3 [&_h2]:mt-8
                                 [&_h2]:text-2xl [&_h2]:font-semibold
                                 [&_h2]:tracking-tight [&_h2]:text-[#0a0a0a] first:[&_h2]:mt-0 [&_h3]:mb-2 [&_h3]:mt-6
                                 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#0a0a0a] [&_iframe]:mt-2 [&_iframe]:w-full
                                 [&_iframe]:rounded-lg
                                 [&_li]:pl-1 [&_ol]:mb-4
                                 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6
                                 [&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:font-semibold
                                 [&_strong]:text-[#0a0a0a] [&_ul]:mb-4 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6"
                      dangerouslySetInnerHTML={{
                        __html: renderStoryHtml(campaign.story_content),
                      }}
                    />
                  ) : (
                    <p className="text-base leading-relaxed text-[#0a0a0a]">
                      {campaign.short_description || 'No story content yet.'}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs" className="mt-0">
              <div className="max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-[#0a0a0a]">
                    Frequently Asked Questions
                  </h2>
                  {!showQuestionForm && (
                    <Button
                      variant="outline"
                      onClick={() => setShowQuestionForm(true)}
                      className="border-[#1b5858] text-[#1b5858] hover:bg-[#1b5858] hover:text-white"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask a Question
                    </Button>
                  )}
                </div>

                {/* Question Submission Form */}
                {showQuestionForm && (
                  <Card className="mb-6 border-[#1b5858] p-6">
                    {questionSubmitted ? (
                      <div className="py-4 text-center">
                        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
                        <h3 className="mb-1 font-semibold text-[#0a0a0a]">Question Submitted!</h3>
                        <p className="text-sm text-[#737373]">
                          The campaign organizer will review your question and may add it to the
                          FAQs.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h3 className="mb-4 font-semibold text-[#0a0a0a]">
                          Ask the Campaign Organizer
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label
                              htmlFor="question-text"
                              className="text-sm font-medium text-[#0a0a0a]"
                            >
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
                              <label
                                htmlFor="question-name"
                                className="text-sm font-medium text-[#0a0a0a]"
                              >
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
                              <label
                                htmlFor="question-email"
                                className="text-sm font-medium text-[#0a0a0a]"
                              >
                                Email (optional)
                              </label>
                              <Input
                                id="question-email"
                                type="email"
                                value={questionEmail}
                                onChange={(e) => setQuestionEmail(e.target.value)}
                                placeholder="john@example.com"
                              />
                              <p className="text-xs text-[#737373]">
                                Get notified when your question is answered
                              </p>
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
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
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
                {isOwner && submittedQuestions.filter((q) => q.status === 'pending').length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#0a0a0a]">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Pending Questions (
                      {submittedQuestions.filter((q) => q.status === 'pending').length})
                    </h3>
                    <div className="space-y-3">
                      {submittedQuestions
                        .filter((q) => q.status === 'pending')
                        .map((question) => (
                          <Card key={question.id} className="border-amber-200 bg-amber-50 p-4">
                            <div className="mb-3 flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-[#0a0a0a]">{question.question}</p>
                                <p className="mt-1 text-xs text-[#737373]">
                                  {question.submitter_name && `From: ${question.submitter_name} • `}
                                  {new Date(question.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {answeringQuestionId === question.id ? (
                              <div className="mt-4 space-y-3 border-t border-amber-200 pt-4">
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
                                    className="cursor-pointer text-sm text-[#737373]"
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
                                  className="border-red-200 text-red-600 hover:bg-red-50"
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
                {faqs.length > 0 ||
                submittedQuestions.filter((q) => q.status === 'answered' && q.is_public).length >
                  0 ? (
                  <Accordion type="single" collapsible className="space-y-3">
                    {/* Static FAQs */}
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="rounded-lg border border-gray-200 px-4 data-[state=open]:bg-gray-50"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            <HelpCircle className="h-5 w-5 flex-shrink-0 text-[#1b5858]" />
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
                      .filter((q) => q.status === 'answered' && q.is_public)
                      .map((question) => (
                        <AccordionItem
                          key={question.id}
                          value={question.id}
                          className="rounded-lg border border-gray-200 px-4 data-[state=open]:bg-gray-50"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <MessageCircle className="h-5 w-5 flex-shrink-0 text-[#ea580c]" />
                              <span className="font-medium text-[#0a0a0a]">
                                {question.question}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pl-8 text-[#737373]">
                            {question.answer}
                            {question.submitter_name && (
                              <p className="mt-2 text-xs text-[#a3a3a3]">
                                Asked by {question.submitter_name}
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                ) : (
                  <div className="rounded-lg bg-gray-50 py-12 text-center text-[#737373]">
                    <HelpCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-lg">No FAQs have been added yet.</p>
                    <p className="mt-2 text-sm">Be the first to ask a question!</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowQuestionForm(true)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask a Question
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="mt-0">
              <div className="max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-[#0a0a0a]">Campaign Updates</h2>

                  {/* Post Update Button (only for owner) */}
                  {isOwner && !showUpdateForm && (
                    <Button
                      onClick={() => setShowUpdateForm(true)}
                      className="bg-[#1b5858] hover:bg-[#164444]"
                    >
                      <MessageSquarePlus className="mr-2 h-4 w-4" />
                      Post Update
                    </Button>
                  )}
                </div>

                {/* Update Form (for owner) */}
                {isOwner && showUpdateForm && (
                  <Card className="mb-6 border-[#1b5858] p-6">
                    <h3 className="mb-4 font-semibold text-[#0a0a0a]">
                      Share an Update with Supporters
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="update-title"
                          className="text-sm font-medium text-[#0a0a0a]"
                        >
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
                        <label
                          htmlFor="update-content"
                          className="text-sm font-medium text-[#0a0a0a]"
                        >
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
                      <div className="flex items-center justify-end gap-3">
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
                          disabled={
                            postingUpdate || !newUpdateTitle.trim() || !newUpdateContent.trim()
                          }
                          className="bg-[#1b5858] hover:bg-[#164444]"
                        >
                          {postingUpdate ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
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
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1b5858]">
                            <MessageSquarePlus className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <h3 className="font-semibold text-[#0a0a0a]">{update.title}</h3>
                            </div>
                            <p className="mb-3 leading-relaxed text-[#737373]">{update.content}</p>
                            <div className="flex items-center gap-2 text-sm text-[#737373]">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(update.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 py-12 text-center text-[#737373]">
                    <MessageSquarePlus className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-lg">No updates have been posted yet.</p>
                    <p className="mt-2 text-sm">
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
                <h2 className="mb-4 text-2xl font-semibold text-[#0a0a0a]">
                  About{' '}
                  <Link
                    to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                    className="text-[#ea580c] hover:underline"
                  >
                    {campaign.organization?.name}
                  </Link>
                </h2>
                <p className="mb-4 text-base leading-relaxed text-[#0a0a0a]">
                  {campaign.organization?.mission || 'No organization description available.'}
                </p>
                <Link
                  to={`/organizations/${campaign.organization?.slug || campaign.organization?.id || campaign.organization_id}`}
                  className="inline-flex items-center font-medium text-[#ea580c] hover:underline"
                >
                  View Organization Profile →
                </Link>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="mt-0">
              <div className="max-w-2xl space-y-8">
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-[#0a0a0a]">Get in Touch</h2>
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
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editForm.contact_email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, contact_email: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="contact@example.com"
                        />
                      ) : (
                        <a
                          href={`mailto:${campaign.contact_email}`}
                          className="text-[#0a0a0a] transition-colors hover:text-[#ea580c]"
                        >
                          {campaign.contact_email || 'No email provided'}
                        </a>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
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
                          className="text-[#0a0a0a] transition-colors hover:text-[#ea580c]"
                        >
                          {campaign.phone}
                        </a>
                      ) : (
                        <span className="text-[#737373]">No phone provided</span>
                      )}
                    </div>

                    {/* Website */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      {isEditing ? (
                        <Input
                          type="url"
                          value={editForm.website_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, website_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://yourwebsite.com"
                        />
                      ) : campaign.website_url ? (
                        <a
                          href={campaign.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0a0a0a] transition-colors hover:text-[#ea580c]"
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
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <Facebook className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={editForm.facebook_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, facebook_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      {/* Twitter/X */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <Twitter className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={editForm.twitter_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, twitter_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://x.com/yourhandle"
                        />
                      </div>
                      {/* Instagram */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <Instagram className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={editForm.instagram_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, instagram_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://instagram.com/yourhandle"
                        />
                      </div>
                      {/* LinkedIn */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <Linkedin className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={editForm.linkedin_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, linkedin_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://linkedin.com/company/yourorg"
                        />
                      </div>
                      {/* YouTube */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <Youtube className="h-5 w-5 text-white" />
                        </div>
                        <Input
                          value={editForm.youtube_url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, youtube_url: e.target.value })
                          }
                          className="flex-1 border-dashed"
                          placeholder="https://youtube.com/@yourchannel"
                        />
                      </div>
                      {/* TikTok - no Lucide icon available, using custom SVG */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#1b5858]">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
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
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
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
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
                        >
                          <Twitter className="h-5 w-5" />X / Twitter
                        </a>
                      )}
                      {campaign.instagram_url && (
                        <a
                          href={campaign.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
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
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
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
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
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
                          className="flex items-center gap-2 rounded-lg bg-[#1b5858] px-4 py-2 text-white transition-opacity hover:opacity-90"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                          TikTok
                        </a>
                      )}
                      {!campaign.facebook_url &&
                        !campaign.twitter_url &&
                        !campaign.instagram_url &&
                        !campaign.linkedin_url &&
                        !campaign.youtube_url &&
                        !campaign.tiktok_url && (
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

      {/* In-page donation modal */}
      <CampaignDonateModal
        open={showDonateModal}
        onOpenChange={setShowDonateModal}
        campaign={campaign}
      />

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
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <h3 className="mb-1 font-semibold text-[#0a0a0a]">Report Submitted</h3>
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
                  {(
                    [
                      { value: 'fraud', label: 'Suspected fraud or scam', Icon: ShieldAlert },
                      { value: 'misleading', label: 'Misleading information', Icon: AlertTriangle },
                      { value: 'inappropriate', label: 'Inappropriate content', Icon: Ban },
                      { value: 'spam', label: 'Spam or fake campaign', Icon: Mail },
                      { value: 'other', label: 'Other concern', Icon: HelpCircle },
                    ] as { value: string; label: string; Icon: LucideIcon }[]
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReportReason(option.value as CampaignReportReason)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        reportReason === option.value
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <option.Icon className="h-5 w-5" />
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
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {submittingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="mr-2 h-4 w-4" />
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
