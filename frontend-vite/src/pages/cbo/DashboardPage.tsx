/**
 * CBO Dashboard Page
 * Styled to match Figma design with tab-based content switching
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OnboardingModal } from '@/components/OnboardingModal'
import { CampaignForm } from '@/components/CampaignForm'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Columns2,
  Loader,
  PanelLeft,
  Plus,
  TrendingUp,
  MoreVertical,
  LayoutDashboard,
  List,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  Search,
  AlertTriangle,
  Loader2,
  Building2,
  Clock,
  Upload,
  Image,
  Users,
  Target,
  Award,
  Mail,
  Phone,
  MessageCircle,
  DollarSign,
  Calendar,
  Download,
  MessageCircleQuestion,
  Send,
  X,
} from 'lucide-react'
import {
  fetchCBODashboardStats,
  fetchCBORequests,
  checkOnboardingStatus,
  getOrganizationByUserId,
  getCampaignsByOrganization,
  fetchOrganizationQuestions,
  answerQuestion,
  dismissQuestion,
  fetchCauseAreas,
  fetchIdentityCategories,
  saveOrganizationCauseAreas,
  saveOrganizationPopulations,
  supabase,
  type CBODashboardStats,
  type RequestRecord,
  type OrganizationQuestion
} from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { StripeConnectCard } from '@/components/StripeConnectButton'
import { useStripeConnect } from '@/hooks/useStripeConnect'

// Campaign type
interface Campaign {
  id: string
  title: string
  slug: string
  status: string
  funding_goal: number
  amount_raised?: number
  supporters_count?: number
  created_at: string
}

// Default empty states
const EMPTY_STATS: CBODashboardStats = {
  totalReceived: 0,
  activeRequests: 0,
  fulfilledRequests: 0,
  pendingRequests: 0
}

// Sidebar sections enum
type SidebarSection =
  | 'dashboard'
  | 'profile'
  | 'campaigns'
  | 'create-campaign'
  | 'questions'
  | 'analytics'
  | 'documents'
  | 'settings'
  | 'support'
  | 'search'

// Stats data config
const getStatsCards = (stats: CBODashboardStats) => [
  {
    title: "Total Received",
    value: `$${stats.totalReceived.toLocaleString()}`,
    change: "+18%",
    changeLabel: "This month",
  },
  {
    title: "Open Requests",
    value: stats.pendingRequests.toString(),
    change: "Awaiting donors",
    changeLabel: "Active listings",
  },
  {
    title: "In Progress",
    value: stats.activeRequests.toString(),
    change: "Claimed",
    changeLabel: "Being fulfilled",
  },
  {
    title: "Fulfilled",
    value: stats.fulfilledRequests.toString(),
    change: "+5",
    changeLabel: "This month",
  },
]

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  if (status === 'fulfilled') {
    return (
      <Badge variant="outline" className="gap-1 bg-white">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span className="font-semibold">Done</span>
      </Badge>
    )
  }
  if (status === 'claimed') {
    return (
      <Badge variant="outline" className="gap-1 bg-white">
        <Clock className="h-3 w-3 text-blue-500" />
        <span className="font-semibold">In Process</span>
      </Badge>
    )
  }
  if (status === 'open') {
    return (
      <Badge variant="outline" className="gap-1 bg-white">
        <Loader className="h-3 w-3 text-amber-500" />
        <span className="font-semibold">Open</span>
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 bg-white">
      <span className="font-semibold capitalize">{status}</span>
    </Badge>
  )
}

// Urgency Badge Component
function UrgencyBadge({ urgency }: { urgency: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-green-50 text-green-700 border-green-200'
  }
  return (
    <Badge variant="outline" className={colors[urgency] || 'bg-gray-50'}>
      <span className="font-semibold capitalize">{urgency}</span>
    </Badge>
  )
}

// ============ CONTENT COMPONENTS ============

// Dashboard Content (Main view)
function DashboardContent({ 
  stats, 
  requests, 
  loading,
  selectedRows,
  toggleRowSelection,
  toggleAllRows,
  activeTab,
  setActiveTab,
  onCreateRequest
}: {
  stats: CBODashboardStats
  requests: RequestRecord[]
  loading: boolean
  selectedRows: Set<string>
  toggleRowSelection: (id: string) => void
  toggleAllRows: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  onCreateRequest: () => void
}) {
  const statsCards = getStatsCards(stats)
  const filteredRequests = requests.filter(r => {
    if (activeTab === 'all') return true
    return r.status === activeTab
  })

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <p className="text-[#737373]">{stat.title}</p>
                {loading ? (
                  <div className="h-9 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <p className="text-[30px] font-semibold leading-9">
                    {stat.value}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stat.change}</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-sm text-[#737373]">
                  {stat.changeLabel}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="claimed">In Progress</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns2 className="h-4 w-4" />
                  <span>Customize Columns</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Description</DropdownMenuItem>
                <DropdownMenuItem>Cause Area</DropdownMenuItem>
                <DropdownMenuItem>Urgency</DropdownMenuItem>
                <DropdownMenuItem>Status</DropdownMenuItem>
                <DropdownMenuItem>Amount</DropdownMenuItem>
                <DropdownMenuItem>Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              size="sm"
              className="bg-[#1b5858] hover:bg-[#164444]"
              onClick={onCreateRequest}
            >
              <Plus className="h-4 w-4" />
              <span>New Campaign</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 16 16">
                        <circle cx="6" cy="4" r="1" fill="currentColor" />
                        <circle cx="10" cy="4" r="1" fill="currentColor" />
                        <circle cx="6" cy="8" r="1" fill="currentColor" />
                        <circle cx="10" cy="8" r="1" fill="currentColor" />
                        <circle cx="6" cy="12" r="1" fill="currentColor" />
                        <circle cx="10" cy="12" r="1" fill="currentColor" />
                      </svg>
                    </div>
                  </TableHead>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedRows.size === filteredRequests.length && filteredRequests.length > 0}
                      onCheckedChange={toggleAllRows}
                    />
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cause Area</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 16 16">
                          <circle cx="6" cy="4" r="1" fill="currentColor" />
                          <circle cx="10" cy="4" r="1" fill="currentColor" />
                          <circle cx="6" cy="8" r="1" fill="currentColor" />
                          <circle cx="10" cy="8" r="1" fill="currentColor" />
                          <circle cx="6" cy="12" r="1" fill="currentColor" />
                          <circle cx="10" cy="12" r="1" fill="currentColor" />
                        </svg>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.has(request.id)}
                        onCheckedChange={() => toggleRowSelection(request.id)}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{request.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.cause_area_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={request.urgency} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>${request.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {selectedRows.size} of {filteredRequests.length} row(s) selected.
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    10
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>10</DropdownMenuItem>
                  <DropdownMenuItem>20</DropdownMenuItem>
                  <DropdownMenuItem>50</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span>Page 1 of 1</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Manage Campaigns Content
function CampaignsContent({ campaigns, onCreateCampaign }: { campaigns: Campaign[], onCreateCampaign: () => void }) {
  const pendingCampaigns = campaigns.filter(c => c.status === 'pending')
  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const completedCampaigns = campaigns.filter(c => c.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">My Campaigns</h2>
          <p className="text-sm text-[#737373]">Create and manage your donation campaigns</p>
        </div>
        <Button 
          className="bg-[#1b5858] hover:bg-[#164444]"
          onClick={onCreateCampaign}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={onCreateCampaign}>
          <div className="h-12 w-12 bg-[#1b5858] rounded-lg flex items-center justify-center mx-auto mb-3">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-medium">New Campaign</h3>
          <p className="text-sm text-[#737373]">Create a donation campaign</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="font-medium">Pending Review</h3>
          <p className="text-sm text-[#737373]">{pendingCampaigns.length} campaigns awaiting review</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-medium">Completed</h3>
          <p className="text-sm text-[#737373]">{completedCampaigns.length} campaigns completed</p>
        </Card>
      </div>

      {/* Active/Recent Campaigns List */}
      {campaigns.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Your Campaigns</h3>
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      to={`/campaign/${campaign.slug}`}
                      className="font-medium text-[#0a0a0a] hover:text-[#1b5858] hover:underline"
                    >
                      {campaign.title}
                    </Link>
                    <Badge 
                      variant="outline" 
                      className={
                        campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        campaign.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#737373]">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Goal: ${campaign.funding_goal?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Raised: ${campaign.amount_raised?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {campaign.supporters_count || 0} supporters
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/campaign/${campaign.slug}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                      <DropdownMenuItem>View Analytics</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1b5858] rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, ((campaign.amount_raised || 0) / (campaign.funding_goal || 1)) * 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-[#737373] mt-1">
                  {Math.round(((campaign.amount_raised || 0) / (campaign.funding_goal || 1)) * 100)}% funded
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {campaigns.length === 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-[#737373]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Tell a compelling story about your cause and impact</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Include images to help donors connect with your mission</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Set realistic funding goals to build trust with donors</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Post regular updates to keep supporters engaged</span>
            </li>
          </ul>
        </Card>
      )}
    </div>
  )
}

// Organization Profile Content with Inline Editing
function ProfileContent({
  organization,
  onRefresh
}: {
  organization: any
  onRefresh: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // File upload refs and state
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Cause areas and populations
  const [allCauseAreas, setAllCauseAreas] = useState<{ id: string; name: string }[]>([])
  const [allPopulations, setAllPopulations] = useState<{ id: string; name: string }[]>([])
  const [selectedCauseAreas, setSelectedCauseAreas] = useState<string[]>([])
  const [selectedPopulations, setSelectedPopulations] = useState<string[]>([])

  const [editForm, setEditForm] = useState({
    name: organization?.name || '',
    tagline: organization?.tagline || '',
    mission: organization?.mission || '',
    program_description: organization?.program_description || '',
    technology_barriers: organization?.technology_barriers || '',
    service_area_description: organization?.service_area_description || '',
    organization_type: organization?.organization_type || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    website: organization?.website || '',
    address: organization?.address || '',
    city: organization?.city || '',
    state: organization?.state || '',
    zipcode: organization?.zipcode || '',
    year_founded: organization?.year_founded || '',
    organization_size: organization?.organization_size || '',
    logo_url: organization?.logo_url || '',
    cover_image_url: organization?.cover_image_url || '',
    // Social links
    facebook: organization?.social_links?.facebook || '',
    twitter: organization?.social_links?.twitter || '',
    instagram: organization?.social_links?.instagram || '',
    linkedin: organization?.social_links?.linkedin || '',
    youtube: organization?.social_links?.youtube || '',
    tiktok: organization?.social_links?.tiktok || '',
  })

  // Load cause areas and populations on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [causeAreas, populations] = await Promise.all([
          fetchCauseAreas(),
          fetchIdentityCategories()
        ])
        setAllCauseAreas(causeAreas)
        setAllPopulations(populations)
      } catch (err) {
        console.error('Error loading options:', err)
      }
    }
    loadOptions()
  }, [])

  // Update form when organization changes
  useEffect(() => {
    if (organization) {
      setEditForm({
        name: organization.name || '',
        tagline: organization.tagline || '',
        mission: organization.mission || '',
        program_description: organization.program_description || '',
        technology_barriers: organization.technology_barriers || '',
        service_area_description: organization.service_area_description || '',
        organization_type: organization.organization_type || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        zipcode: organization.zipcode || '',
        year_founded: organization.year_founded || '',
        organization_size: organization.organization_size || '',
        logo_url: organization.logo_url || '',
        cover_image_url: organization.cover_image_url || '',
        facebook: organization.social_links?.facebook || '',
        twitter: organization.social_links?.twitter || '',
        instagram: organization.social_links?.instagram || '',
        linkedin: organization.social_links?.linkedin || '',
        youtube: organization.social_links?.youtube || '',
        tiktok: organization.social_links?.tiktok || '',
      })
      // Set selected cause areas and populations
      setSelectedCauseAreas(organization.cause_areas?.map((ca: any) => ca.id) || [])
      setSelectedPopulations(organization.populations?.map((p: any) => p.id) || [])
    }
  }, [organization])

  // Calculate profile completeness
  const profileFields = [
    organization?.name,
    organization?.mission,
    organization?.email,
    organization?.tagline,
    organization?.program_description,
    organization?.logo_url,
    organization?.cover_image_url,
    organization?.website,
    organization?.phone,
  ]
  const filledFields = profileFields.filter(Boolean).length
  const completeness = Math.round((filledFields / profileFields.length) * 100)

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Handle cover file selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}_${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('organization-images')
        .upload(fileName, file, { upsert: true })

      if (error) {
        console.error('Upload error:', error)
        // If storage bucket doesn't exist, fall back to data URL
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('organization-images')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (err) {
      console.error('Upload failed:', err)
      // Fallback to data URL
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }
  }

  const handleSave = async () => {
    if (!organization?.id) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      let logoUrl = editForm.logo_url
      let coverUrl = editForm.cover_image_url

      // Upload images if new files selected
      if (logoFile) {
        const url = await uploadImage(logoFile, `logos/${organization.id}`)
        if (url) logoUrl = url
      }
      if (coverFile) {
        const url = await uploadImage(coverFile, `covers/${organization.id}`)
        if (url) coverUrl = url
      }

      // Prepare update data with social links
      const updateData = {
        ...editForm,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        social_links: {
          facebook: editForm.facebook || null,
          twitter: editForm.twitter || null,
          instagram: editForm.instagram || null,
          linkedin: editForm.linkedin || null,
          youtube: editForm.youtube || null,
          tiktok: editForm.tiktok || null,
        }
      }

      const { updateOrganization } = await import('@/lib/supabase')
      const { error } = await updateOrganization(organization.id, updateData)

      if (error) {
        setSaveMessage(`Error: ${error.message}`)
        return
      }

      // Save cause areas and populations
      await Promise.all([
        saveOrganizationCauseAreas(organization.id, selectedCauseAreas.map(id => {
          const ca = allCauseAreas.find(c => c.id === id)
          return ca?.name || ''
        }).filter(Boolean)),
        saveOrganizationPopulations(organization.id, selectedPopulations)
      ])

      setSaveMessage('Profile updated successfully!')
      setIsEditing(false)
      setLogoFile(null)
      setLogoPreview(null)
      setCoverFile(null)
      setCoverPreview(null)
      onRefresh()
    } catch (err) {
      console.error('Save error:', err)
      setSaveMessage('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSaveMessage(null)
    setLogoFile(null)
    setLogoPreview(null)
    setCoverFile(null)
    setCoverPreview(null)
    // Reset form to original values
    if (organization) {
      setEditForm({
        name: organization.name || '',
        tagline: organization.tagline || '',
        mission: organization.mission || '',
        program_description: organization.program_description || '',
        technology_barriers: organization.technology_barriers || '',
        service_area_description: organization.service_area_description || '',
        organization_type: organization.organization_type || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        zipcode: organization.zipcode || '',
        year_founded: organization.year_founded || '',
        organization_size: organization.organization_size || '',
        logo_url: organization.logo_url || '',
        cover_image_url: organization.cover_image_url || '',
        facebook: organization.social_links?.facebook || '',
        twitter: organization.social_links?.twitter || '',
        instagram: organization.social_links?.instagram || '',
        linkedin: organization.social_links?.linkedin || '',
        youtube: organization.social_links?.youtube || '',
        tiktok: organization.social_links?.tiktok || '',
      })
      setSelectedCauseAreas(organization.cause_areas?.map((ca: any) => ca.id) || [])
      setSelectedPopulations(organization.populations?.map((p: any) => p.id) || [])
    }
  }

  const toggleCauseArea = (id: string) => {
    setSelectedCauseAreas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const togglePopulation = (id: string) => {
    setSelectedPopulations(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const organizationTypes = [
    '501(c)(3) Nonprofit',
    '501(c)(4) Social Welfare',
    'Religious Organization',
    'Educational Institution',
    'Government Agency',
    'Community Organization',
    'Other'
  ]

  return (
    <div className="space-y-6">
      {/* Header with Edit/Save buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Organization Profile</h2>
          <p className="text-sm text-[#737373]">Manage how your organization appears to donors</p>
        </div>
        <div className="flex items-center gap-2">
          {organization?.slug && !isEditing && (
            <Link to={`/organizations/${organization.slug}`}>
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-1" />
                View Public Profile
              </Button>
            </Link>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1b5858] hover:bg-[#164444]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-[#1b5858] hover:bg-[#164444]"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Editing Banner */}
      {isEditing && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Editing Mode</AlertTitle>
          <AlertDescription className="text-amber-700">
            Make changes to your profile below. Click "Save Changes" when done.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Message */}
      {saveMessage && (
        <Alert className={saveMessage.startsWith('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={saveMessage.startsWith('Error') ? 'text-red-700' : 'text-green-700'}>
            {saveMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Card with Clickable Images */}
      <Card className="overflow-hidden">
        {/* Cover Image - Clickable when editing */}
        <div
          className={`h-40 bg-gradient-to-br from-[#1b5858]/20 to-[#ea580c]/10 relative ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
          onClick={() => isEditing && coverInputRef.current?.click()}
        >
          {(coverPreview || editForm.cover_image_url || organization?.cover_image_url) && (
            <img
              src={coverPreview || editForm.cover_image_url || organization?.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <div className="text-white text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Click to change cover image</p>
              </div>
            </div>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        <div className="p-6 -mt-12 relative">
          {/* Logo - Clickable when editing */}
          <div className="flex items-end gap-4 mb-4">
            <div
              className={`h-24 w-24 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white overflow-hidden relative ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}`}
              onClick={() => isEditing && logoInputRef.current?.click()}
            >
              {(logoPreview || editForm.logo_url || organization?.logo_url) ? (
                <img
                  src={logoPreview || editForm.logo_url || organization?.logo_url}
                  alt={organization?.name}
                  className="w-full h-full object-cover"
                />
              ) : organization?.logo_emoji ? (
                <span className="text-3xl">{organization.logo_emoji}</span>
              ) : (
                <Building2 className="h-8 w-8 text-[#1b5858]" />
              )}
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <div className="flex-1 pb-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Organization Name"
                    className="text-lg font-semibold"
                  />
                  <Input
                    value={editForm.tagline}
                    onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                    placeholder="Tagline (e.g., Bridging the digital divide)"
                    className="text-sm"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-[#0a0a0a]">
                    {organization?.name || 'Your Organization'}
                  </h3>
                  {organization?.tagline && (
                    <p className="text-sm text-[#737373]">{organization.tagline}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Organization Type when editing */}
          {isEditing && (
            <div className="mb-4">
              <label className="text-xs text-[#737373]">Organization Type</label>
              <select
                value={editForm.organization_type}
                onChange={(e) => setEditForm({ ...editForm, organization_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Select type...</option>
                {organizationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-[#f5f5f5] rounded-lg">
              <p className="text-2xl font-semibold text-[#1b5858]">{completeness}%</p>
              <p className="text-xs text-[#737373]">Profile Complete</p>
            </div>
            <div className="text-center p-3 bg-[#f5f5f5] rounded-lg">
              {isEditing ? (
                <Input
                  type="number"
                  value={editForm.year_founded}
                  onChange={(e) => setEditForm({ ...editForm, year_founded: e.target.value })}
                  placeholder="2020"
                  className="text-center text-lg font-semibold h-8"
                />
              ) : (
                <p className="text-2xl font-semibold text-[#1b5858]">
                  {organization?.year_founded || '—'}
                </p>
              )}
              <p className="text-xs text-[#737373]">Founded</p>
            </div>
            <div className="text-center p-3 bg-[#f5f5f5] rounded-lg">
              {isEditing ? (
                <Input
                  value={editForm.organization_size}
                  onChange={(e) => setEditForm({ ...editForm, organization_size: e.target.value })}
                  placeholder="1-10"
                  className="text-center text-lg font-semibold h-8"
                />
              ) : (
                <p className="text-2xl font-semibold text-[#1b5858]">
                  {organization?.organization_size || '—'}
                </p>
              )}
              <p className="text-xs text-[#737373]">Team Size</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Mission & Programs */}
      <Card className="p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-[#1b5858]" />
          Mission & Programs
        </h3>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#737373]">Mission Statement</label>
              <Textarea
                value={editForm.mission}
                onChange={(e) => setEditForm({ ...editForm, mission: e.target.value })}
                placeholder="Your organization's mission..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#737373]">Program Description</label>
              <Textarea
                value={editForm.program_description}
                onChange={(e) => setEditForm({ ...editForm, program_description: e.target.value })}
                placeholder="Describe your programs and services..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#737373]">Technology Barriers</label>
              <Textarea
                value={editForm.technology_barriers}
                onChange={(e) => setEditForm({ ...editForm, technology_barriers: e.target.value })}
                placeholder="Describe the technology challenges your community faces..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#737373]">Service Area Description</label>
              <Textarea
                value={editForm.service_area_description}
                onChange={(e) => setEditForm({ ...editForm, service_area_description: e.target.value })}
                placeholder="Describe the geographic area you serve..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[#737373] mb-1">Mission</p>
              <p className="text-[#0a0a0a]">{organization?.mission || 'No mission set'}</p>
            </div>
            {organization?.program_description && (
              <div>
                <p className="text-sm font-medium text-[#737373] mb-1">Programs</p>
                <p className="text-[#0a0a0a]">{organization.program_description}</p>
              </div>
            )}
            {organization?.technology_barriers && (
              <div>
                <p className="text-sm font-medium text-[#737373] mb-1">Technology Barriers</p>
                <p className="text-[#0a0a0a]">{organization.technology_barriers}</p>
              </div>
            )}
            {organization?.service_area_description && (
              <div>
                <p className="text-sm font-medium text-[#737373] mb-1">Service Area</p>
                <p className="text-[#0a0a0a]">{organization.service_area_description}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Cause Areas & Populations */}
      {isEditing && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1b5858]" />
            Focus Areas & Populations
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-[#737373] mb-2 block">Cause Areas</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allCauseAreas.map(ca => (
                  <label key={ca.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Checkbox
                      checked={selectedCauseAreas.includes(ca.id)}
                      onCheckedChange={() => toggleCauseArea(ca.id)}
                    />
                    <span className="text-sm">{ca.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#737373] mb-2 block">Populations Served</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allPopulations.map(pop => (
                  <label key={pop.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Checkbox
                      checked={selectedPopulations.includes(pop.id)}
                      onCheckedChange={() => togglePopulation(pop.id)}
                    />
                    <span className="text-sm">{pop.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Display cause areas and populations when not editing */}
      {!isEditing && (organization?.cause_areas?.length > 0 || organization?.populations?.length > 0) && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1b5858]" />
            Focus Areas & Populations
          </h3>
          <div className="space-y-4">
            {organization?.cause_areas?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#737373] mb-2">Cause Areas</p>
                <div className="flex flex-wrap gap-2">
                  {organization.cause_areas.map((ca: any) => (
                    <Badge key={ca.id} variant="outline" className="bg-[#1b5858]/10 text-[#1b5858] border-[#1b5858]/20">
                      {ca.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {organization?.populations?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#737373] mb-2">Populations Served</p>
                <div className="flex flex-wrap gap-2">
                  {organization.populations.map((pop: any) => (
                    <Badge key={pop.id} variant="outline" className="bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/20">
                      {pop.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contact & Location */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#737373]" />
            Contact Info
          </h4>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#737373]">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="contact@organization.org"
                />
              </div>
              <div>
                <label className="text-xs text-[#737373]">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div>
                <label className="text-xs text-[#737373]">Website</label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://yourorganization.org"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-[#0a0a0a]">{organization?.email || 'No email set'}</p>
              <p className="text-[#737373]">{organization?.phone || 'No phone set'}</p>
              {organization?.website && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1b5858] hover:underline"
                >
                  {organization.website}
                </a>
              )}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#737373]" />
            Location
          </h4>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#737373]">Street Address</label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#737373]">City</label>
                  <Input
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="Kansas City"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#737373]">State</label>
                  <Input
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="MO"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#737373]">ZIP</label>
                  <Input
                    value={editForm.zipcode}
                    onChange={(e) => setEditForm({ ...editForm, zipcode: e.target.value })}
                    placeholder="64101"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              {organization?.address && (
                <p className="text-[#0a0a0a]">{organization.address}</p>
              )}
              <p className="text-[#737373]">
                {[organization?.city, organization?.state, organization?.zipcode]
                  .filter(Boolean)
                  .join(', ') || 'No address set'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Social Links */}
      {isEditing && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1b5858]" />
            Social Media Links
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1877f2] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <Input
                value={editForm.facebook}
                onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <Input
                value={editForm.twitter}
                onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                placeholder="https://x.com/yourhandle"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <Input
                value={editForm.instagram}
                onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0077b5] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <Input
                value={editForm.linkedin}
                onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/yourorg"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff0000] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <Input
                value={editForm.youtube}
                onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </div>
              <Input
                value={editForm.tiktok}
                onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@yourhandle"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Display social links when not editing */}
      {!isEditing && organization?.social_links && Object.values(organization.social_links).some(Boolean) && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1b5858]" />
            Social Media
          </h3>
          <div className="flex flex-wrap gap-3">
            {organization.social_links.facebook && (
              <a href={organization.social_links.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1877f2] rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            )}
            {organization.social_links.twitter && (
              <a href={organization.social_links.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}
            {organization.social_links.instagram && (
              <a href={organization.social_links.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            )}
            {organization.social_links.linkedin && (
              <a href={organization.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#0077b5] rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            )}
            {organization.social_links.youtube && (
              <a href={organization.social_links.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#ff0000] rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            )}
            {organization.social_links.tiktok && (
              <a href={organization.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-lg flex items-center justify-center hover:opacity-80">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Profile Completeness Tips - Only show when not editing */}
      {!isEditing && completeness < 100 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#1b5858]" />
            Complete Your Profile
          </h3>
          <p className="text-sm text-[#737373] mb-4">
            A complete profile helps donors understand your mission and increases trust.
          </p>
          <div className="space-y-3">
            {!organization?.logo_url && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Image className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Add a logo to make your profile stand out</span>
              </div>
            )}
            {!organization?.cover_image_url && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Image className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Add a cover image to showcase your work</span>
              </div>
            )}
            {!organization?.tagline && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <FileText className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Add a tagline to summarize your mission</span>
              </div>
            )}
            {!organization?.program_description && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <FileText className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-800">Describe your programs and services</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// Questions Content
function QuestionsContent({ 
  questions, 
  onRefresh,
  userId 
}: { 
  questions: OrganizationQuestion[]
  onRefresh: () => void
  userId: string
}) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'answered' | 'rejected'>('all')
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [makePublic, setMakePublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredQuestions = filterStatus === 'all' 
    ? questions 
    : questions.filter(q => q.status === filterStatus)

  const pendingCount = questions.filter(q => q.status === 'pending').length
  const answeredCount = questions.filter(q => q.status === 'answered').length
  const rejectedCount = questions.filter(q => q.status === 'rejected').length

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return
    setIsSubmitting(true)
    try {
      await answerQuestion(questionId, answerText, makePublic, userId)
      setAnsweringId(null)
      setAnswerText('')
      setMakePublic(true)
      onRefresh()
    } catch (err) {
      console.error('Error answering question:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async (questionId: string) => {
    try {
      await dismissQuestion(questionId)
      onRefresh()
    } catch (err) {
      console.error('Error dismissing question:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Questions</h2>
          <p className="text-sm text-[#737373]">Manage questions from potential donors and supporters</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
        <TabsList className="bg-[#f5f5f5]">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-white">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="answered" className="data-[state=active]:bg-white">
            Answered ({answeredCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
            Dismissed ({rejectedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircleQuestion className="h-12 w-12 mx-auto text-[#737373] mb-4" />
          <h3 className="font-medium text-[#0a0a0a] mb-2">
            {filterStatus === 'all' ? 'No questions yet' : `No ${filterStatus} questions`}
          </h3>
          <p className="text-sm text-[#737373]">
            {filterStatus === 'all' 
              ? 'Questions from potential donors will appear here'
              : `You don't have any ${filterStatus} questions`
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card 
              key={question.id} 
              className={`p-4 ${
                question.status === 'pending' 
                  ? 'border-amber-200 bg-amber-50/50' 
                  : question.status === 'answered'
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-200 bg-gray-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Campaign Badge */}
                  <Badge className="bg-[#1b5858] text-white hover:bg-[#1b5858] mb-2">
                    {question.campaign_title}
                  </Badge>
                  
                  {/* Question */}
                  <p className="font-medium text-[#0a0a0a] mb-2">{question.question}</p>
                  
                  {/* Submitter Info */}
                  <div className="flex items-center gap-4 text-xs text-[#737373]">
                    {question.submitter_name && (
                      <span>From: {question.submitter_name}</span>
                    )}
                    {question.submitter_email && (
                      <span>{question.submitter_email}</span>
                    )}
                    <span>{formatDate(question.created_at)}</span>
                  </div>

                  {/* Answer Display (if answered) */}
                  {question.status === 'answered' && question.answer && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-sm text-[#737373] mb-1">Your answer:</p>
                      <p className="text-sm text-[#0a0a0a]">{question.answer}</p>
                      {question.is_public && (
                        <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Answer Form (if answering) */}
                  {answeringId === question.id && (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your answer..."
                        className="min-h-[100px]"
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`public-${question.id}`}
                          checked={makePublic}
                          onCheckedChange={(checked) => setMakePublic(checked as boolean)}
                        />
                        <label htmlFor={`public-${question.id}`} className="text-sm text-[#737373]">
                          Make this answer public (will show in FAQs)
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-[#1b5858] hover:bg-[#164444]"
                          onClick={() => handleAnswer(question.id)}
                          disabled={isSubmitting || !answerText.trim()}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnsweringId(null)
                            setAnswerText('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {question.status === 'pending' && answeringId !== question.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-[#1b5858] hover:bg-[#164444]"
                      onClick={() => setAnsweringId(question.id)}
                    >
                      Answer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(question.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Analytics Content
function AnalyticsContent({ stats, requests }: { stats: CBODashboardStats, requests: RequestRecord[] }) {
  const fulfilledRequests = requests.filter(r => r.status === 'fulfilled')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Analytics & Impact</h2>
        <p className="text-sm text-[#737373]">Track your organization's impact and performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">{stats.fulfilledRequests}</p>
          <p className="text-sm text-[#737373]">People Helped</p>
        </Card>
        <Card className="p-5 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">${stats.totalReceived.toLocaleString()}</p>
          <p className="text-sm text-[#737373]">Total Received</p>
        </Card>
        <Card className="p-5 text-center">
          <Award className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">{stats.fulfilledRequests}</p>
          <p className="text-sm text-[#737373]">Requests Fulfilled</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Monthly Donations</h3>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-[#737373]">
          <BarChart3 className="h-8 w-8 mr-2" />
          <span>Chart visualization coming soon</span>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-medium">Recent Fulfilled Requests</h3>
        {fulfilledRequests.slice(0, 3).map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{request.description}</h4>
                <p className="text-sm text-[#737373]">${request.amount} · {request.cause_area_name}</p>
              </div>
              <span className="text-sm text-green-600 font-medium">
                ✓ Fulfilled {request.fulfilled_at && new Date(request.fulfilled_at).toLocaleDateString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Documents Content
function DocumentsContent() {
  const documents = [
    { id: '1', name: 'Tax Exempt Certificate', date: '2024-01-15', type: 'PDF' },
    { id: '2', name: '501(c)(3) Determination Letter', date: '2023-06-01', type: 'PDF' },
    { id: '3', name: 'Annual Report 2023', date: '2024-03-15', type: 'PDF' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Documents</h2>
          <p className="text-sm text-[#737373]">Manage your organization documents</p>
        </div>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-[#737373]">{doc.type} · {new Date(doc.date).toLocaleDateString()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Settings Content with full organization editing
function SettingsContent({ organization, onOpenModal, onRefresh }: { organization: any, onOpenModal: () => void, onRefresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Stripe Connect status
  const { status: stripeStatus, loading: stripeLoading, refetch: refetchStripe } = useStripeConnect(organization?.id)
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    mission: organization?.mission || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    website: organization?.website || '',
    address: organization?.address || '',
    city: organization?.city || '',
    state: organization?.state || '',
    zipcode: organization?.zipcode || '',
    description: organization?.description || '',
    facebook_url: organization?.facebook_url || '',
    twitter_url: organization?.twitter_url || '',
    instagram_url: organization?.instagram_url || '',
    linkedin_url: organization?.linkedin_url || '',
    youtube_url: organization?.youtube_url || '',
    tiktok_url: organization?.tiktok_url || '',
  })

  // Update form when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        mission: organization.mission || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        zipcode: organization.zipcode || '',
        description: organization.description || '',
        facebook_url: organization.facebook_url || '',
        twitter_url: organization.twitter_url || '',
        instagram_url: organization.instagram_url || '',
        linkedin_url: organization.linkedin_url || '',
        youtube_url: organization.youtube_url || '',
        tiktok_url: organization.tiktok_url || '',
      })
    }
  }, [organization])

  const handleSave = async () => {
    if (!organization?.id) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const { updateOrganization } = await import('@/lib/supabase')
      const { error } = await updateOrganization(organization.id, formData)
      
      if (error) {
        setSaveMessage(`Error: ${error.message}`)
      } else {
        setSaveMessage('Organization updated successfully!')
        setIsEditing(false)
        onRefresh()
      }
    } catch (err) {
      setSaveMessage('Failed to update organization')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Organization Settings</h2>
          <p className="text-sm text-[#737373]">Manage your organization profile, contact info, and social links</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#1b5858] hover:bg-[#164444]">
            Edit Organization
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#1b5858] hover:bg-[#164444]">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {saveMessage && (
        <Alert className={saveMessage.startsWith('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      {/* Organization Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-[#1b5858] rounded-lg flex items-center justify-center text-white text-xl font-semibold">
            {formData.name?.[0] || 'O'}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-lg font-semibold mb-1"
                placeholder="Organization Name"
              />
            ) : (
              <>
                <h3 className="font-semibold text-lg">{formData.name || 'Your Organization'}</h3>
                <p className="text-sm text-[#737373]">Community-Based Organization</p>
              </>
            )}
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-[#0a0a0a] mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-[#737373]">Mission Statement</label>
                {isEditing ? (
                  <Textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    className="mt-1"
                    rows={3}
                    placeholder="Your organization's mission..."
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.mission || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[#737373]">Description</label>
                {isEditing ? (
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                    placeholder="A longer description of your organization..."
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.description || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info Section */}
          <div>
            <h3 className="font-medium text-[#0a0a0a] mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#737373]">Email</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                    placeholder="contact@example.org"
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.email || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[#737373]">Phone</label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                    placeholder="(555) 555-5555"
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.phone || 'Not set'}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-[#737373]">Website</label>
                {isEditing ? (
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1"
                    placeholder="https://yourorganization.org"
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">
                    {formData.website ? (
                      <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-[#1b5858] hover:underline">
                        {formData.website}
                      </a>
                    ) : 'Not set'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Section */}
          <div>
            <h3 className="font-medium text-[#0a0a0a] mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-[#737373]">Street Address</label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1"
                    placeholder="123 Main Street"
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.address || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[#737373]">City</label>
                {isEditing ? (
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1"
                    placeholder="Kansas City"
                  />
                ) : (
                  <p className="text-[#0a0a0a] mt-1">{formData.city || 'Not set'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#737373]">State</label>
                  {isEditing ? (
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-1"
                      placeholder="MO"
                    />
                  ) : (
                    <p className="text-[#0a0a0a] mt-1">{formData.state || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[#737373]">ZIP Code</label>
                  {isEditing ? (
                    <Input
                      value={formData.zipcode}
                      onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                      className="mt-1"
                      placeholder="64101"
                    />
                  ) : (
                    <p className="text-[#0a0a0a] mt-1">{formData.zipcode || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Media Section */}
          <div>
            <h3 className="font-medium text-[#0a0a0a] mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" /> Social Media Links
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877f2] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.facebook_url || 'Not connected'}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.twitter_url}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                    placeholder="https://x.com/yourhandle"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.twitter_url || 'Not connected'}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/yourhandle"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.instagram_url || 'Not connected'}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0077b5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/yourorg"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.linkedin_url || 'Not connected'}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff0000] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/@yourchannel"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.youtube_url || 'Not connected'}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                {isEditing ? (
                  <Input
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@yourhandle"
                    className="flex-1"
                  />
                ) : (
                  <span className="text-[#0a0a0a]">{formData.tiktok_url || 'Not connected'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stripe Connect Payment Settings */}
      {organization?.id && (
        <StripeConnectCard
          organizationId={organization.id}
          stripeAccountId={stripeStatus?.accountId || null}
          chargesEnabled={stripeStatus?.chargesEnabled || false}
          payoutsEnabled={stripeStatus?.payoutsEnabled || false}
          onboardingComplete={stripeStatus?.onboardingComplete || false}
          onStatusChange={refetchStripe}
        />
      )}

      {/* Quick Settings Card */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Team Members</p>
              <p className="text-sm text-[#737373]">Manage who can access this account</p>
            </div>
            <Button variant="outline" size="sm">Manage Team</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-[#737373]">Configure email and push notifications</p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Support Content
function SupportContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Support</h2>
        <p className="text-sm text-[#737373]">Get help with your account</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <Mail className="h-8 w-8 mx-auto mb-3 text-[#1b5858]" />
          <h3 className="font-medium mb-1">Email Support</h3>
          <p className="text-sm text-[#737373]">support@kcdd.org</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <Phone className="h-8 w-8 mx-auto mb-3 text-[#1b5858]" />
          <h3 className="font-medium mb-1">Phone Support</h3>
          <p className="text-sm text-[#737373]">(816) 555-0123</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <MessageCircle className="h-8 w-8 mx-auto mb-3 text-[#1b5858]" />
          <h3 className="font-medium mb-1">Live Chat</h3>
          <p className="text-sm text-[#737373]">Available 9am-5pm</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Frequently Asked Questions</h3>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <p className="font-medium">How do I create a donation request?</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <p className="font-medium">How long does it take to get a request fulfilled?</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <p className="font-medium">How do I update my organization profile?</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Search Content
function SearchContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Search</h2>
        <p className="text-sm text-[#737373]">Find requests, donors, or documents</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Search for anything..." 
          className="pl-12 h-12 text-lg"
        />
      </div>

      <div className="text-center py-12 text-[#737373]">
        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Start typing to search across your requests and documents</p>
      </div>
    </div>
  )
}

// No Organization state
function NoOrganizationState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#fafafa]">
      <div className="max-w-md text-center p-8">
        <div className="h-16 w-16 bg-[#1b5858] rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-2">Welcome to KCDD Market</h2>
        <p className="text-[#737373] mb-6">
          Set up your organization profile to start receiving donations and connecting with donors.
        </p>
        <Button 
          onClick={onSetup}
          className="bg-[#1b5858] hover:bg-[#164444] text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Set Up Organization
        </Button>
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function CBODashboard() {
  const { user, isLoaded } = useUser()
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>('dashboard')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  
  // Data state
  const [stats, setStats] = useState<CBODashboardStats>(EMPTY_STATS)
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [questions, setQuestions] = useState<OrganizationQuestion[]>([])
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(true)
  const [hasOrganization, setHasOrganization] = useState(true)

  // Fetch real data
  const fetchData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const onboardingStatus = await checkOnboardingStatus(user.id, 'cbo')
      setNeedsOnboarding(!onboardingStatus.onboarding_complete)

      const org = await getOrganizationByUserId(user.id)
      if (org) {
        setOrganization(org)
        setHasOrganization(true)

        const [statsData, requestsData, campaignsData, questionsData] = await Promise.all([
          fetchCBODashboardStats(user.id),
          fetchCBORequests(user.id),
          getCampaignsByOrganization(org.id),
          fetchOrganizationQuestions(org.id)
        ])

        setStats(statsData || EMPTY_STATS)
        setRequests(requestsData || [])
        setCampaigns(campaignsData || [])
        setQuestions(questionsData || [])
      } else {
        setHasOrganization(false)
      }
    } catch (err) {
      console.error('Error fetching CBO data:', err)
      setStats(EMPTY_STATS)
      setRequests([])
      setCampaigns([])
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchData()
    }
  }, [isLoaded, user?.id, fetchData])

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const toggleAllRows = () => {
    const filteredRequests = requests.filter(r => activeTab === 'all' || r.status === activeTab)
    if (selectedRows.size === filteredRequests.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredRequests.map(r => r.id)))
    }
  }

  const handleSetup = () => {
    setShowOnboardingModal(true)
  }

  const handleCreateCampaign = () => {
    setActiveSection('create-campaign')
  }

  const fetchQuestions = useCallback(async () => {
    if (!organization?.id) return
    try {
      const questionsData = await fetchOrganizationQuestions(organization.id)
      if (questionsData) {
        setQuestions(questionsData)
      }
    } catch (err) {
      console.error('Error fetching questions:', err)
    }
  }, [organization?.id])

  // Get header title based on active section
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard'
      case 'profile': return 'Organization Profile'
      case 'campaigns': return 'My Campaigns'
      case 'create-campaign': return 'Create Campaign'
      case 'questions': return 'Questions'
      case 'analytics': return 'Analytics'
      case 'documents': return 'Documents'
      case 'settings': return 'Settings'
      case 'support': return 'Support'
      case 'search': return 'Search'
      default: return 'Dashboard'
    }
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardContent 
            stats={stats}
            requests={requests}
            loading={loading}
            selectedRows={selectedRows}
            toggleRowSelection={toggleRowSelection}
            toggleAllRows={toggleAllRows}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onCreateRequest={handleCreateCampaign}
          />
        )
      case 'profile':
        return <ProfileContent organization={organization} onRefresh={fetchData} />
      case 'campaigns':
        return <CampaignsContent campaigns={campaigns} onCreateCampaign={handleCreateCampaign} />
      case 'create-campaign':
        return (
          <CampaignForm
            organizationId={organization?.id}
            onCancel={() => setActiveSection('campaigns')}
            onComplete={() => {
              setActiveSection('campaigns')
              fetchData()
            }}
          />
        )
      case 'questions':
        return (
          <QuestionsContent 
            questions={questions} 
            onRefresh={fetchQuestions}
            userId={user?.id || ''}
          />
        )
      case 'analytics':
        return <AnalyticsContent stats={stats} requests={requests} />
      case 'documents':
        return <DocumentsContent />
      case 'settings':
        return <SettingsContent organization={organization} onOpenModal={() => setShowOnboardingModal(true)} onRefresh={fetchData} />
      case 'support':
        return <SupportContent />
      case 'search':
        return <SearchContent />
      default:
        return null
    }
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b5858]" />
      </div>
    )
  }

  // No organization state
  if (!loading && !hasOrganization) {
    return (
      <>
        <OnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={() => {
            setShowOnboardingModal(false)
            setNeedsOnboarding(false)
            setHasOrganization(true)
            fetchData()
          }}
          userType="cbo"
        />
        <NoOrganizationState onSetup={handleSetup} />
      </>
    )
  }

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={() => {
          setShowOnboardingModal(false)
          setNeedsOnboarding(false)
          setHasOrganization(true)
          fetchData()
        }}
        userType="cbo"
      />


      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#fafafa] p-2 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Main Navigation */}
          <nav className="space-y-1 p-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'dashboard'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'profile'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Organization Profile</span>}
            </button>

            <button
              onClick={() => setActiveSection('campaigns')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'campaigns'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm flex-1 flex items-center justify-between">
                  My Campaigns
                  {campaigns.length > 0 && (
                    <span className="bg-[#1b5858]/10 text-[#1b5858] px-1.5 py-0.5 rounded text-xs">
                      {campaigns.length}
                    </span>
                  )}
                </span>
              )}
            </button>

            {/* Campaign Links in Sidebar */}
            {sidebarOpen && campaigns.length > 0 && (
              <div className="ml-6 space-y-1 mt-1">
                {campaigns.slice(0, 5).map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaign/${campaign.slug}`}
                    className="block px-2 py-1.5 text-xs text-[#737373] hover:text-[#0a0a0a] hover:bg-gray-100 rounded truncate"
                  >
                    {campaign.title}
                  </Link>
                ))}
                {campaigns.length > 5 && (
                  <button
                    onClick={() => setActiveSection('campaigns')}
                    className="block px-2 py-1.5 text-xs text-[#1b5858] hover:underline"
                  >
                    View all ({campaigns.length})
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setActiveSection('questions')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'questions'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <MessageCircleQuestion className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm flex-1 flex items-center justify-between">
                  Questions
                  {questions.filter(q => q.status === 'pending').length > 0 && (
                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">
                      {questions.filter(q => q.status === 'pending').length}
                    </span>
                  )}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('analytics')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'analytics'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Analytics</span>}
            </button>

            <button
              onClick={() => setActiveSection('documents')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'documents'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Documents</span>}
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="p-2">
            {sidebarOpen && (
              <h3 className="px-2 mb-2 text-xs font-medium text-[#0a0a0a] opacity-70 whitespace-nowrap">
                Quick Actions
              </h3>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start whitespace-nowrap"
              onClick={handleCreateCampaign}
            >
              <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
              {sidebarOpen && 'New Campaign'}
            </Button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-2 space-y-1 border-t border-gray-200 pt-2 overflow-hidden">
          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'settings'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={() => setActiveSection('support')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'support'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Support</span>}
          </button>

          <button
            onClick={() => setActiveSection('search')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'search'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Search</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 overflow-auto">
        <div className="bg-white rounded-[14px] shadow-sm h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-6 h-[49px] border-b border-[#e5e5e5]">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-sm">{getHeaderTitle()}</div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Onboarding Alert */}
            {needsOnboarding && (
              <Alert className="mb-6 bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Complete Your Profile</AlertTitle>
                <AlertDescription className="text-amber-700 flex items-center justify-between">
                  <span>Please complete your organization profile to start receiving donations.</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setShowOnboardingModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Complete Setup
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
