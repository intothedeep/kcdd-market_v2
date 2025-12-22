/**
 * CBO Dashboard Page
 * Styled to match Figma design with tab-based content switching
 */

import { useState, useEffect, useCallback } from 'react'
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
  type CBODashboardStats,
  type RequestRecord,
  type OrganizationQuestion
} from '@/lib/supabase'
import { Link } from 'react-router-dom'

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
          <p className="text-2xl font-semibold">342</p>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Banking Information</p>
              <p className="text-sm text-[#737373]">Manage payout settings</p>
            </div>
            <Button variant="outline" size="sm">Update</Button>
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
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#fafafa] p-2 flex flex-col transition-all duration-300`}>
        <div className="flex-1 space-y-2">
          {/* Main Navigation */}
          <nav className="space-y-1 p-2">
            <button 
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Dashboard</span>}
            </button>

            <button 
              onClick={() => setActiveSection('campaigns')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'campaigns'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
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
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'questions'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <MessageCircleQuestion className="w-4 h-4" />
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
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'analytics'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Analytics</span>}
            </button>

            <button 
              onClick={() => setActiveSection('documents')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'documents'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Documents</span>}
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="p-2">
            {sidebarOpen && (
              <h3 className="px-2 mb-2 text-xs font-medium text-[#0a0a0a] opacity-70">
                Quick Actions
              </h3>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleCreateCampaign}
            >
              <Plus className="h-4 w-4 mr-2" />
              {sidebarOpen && 'New Campaign'}
            </Button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-2 space-y-1 border-t border-gray-200 pt-2">
          <button 
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
              activeSection === 'settings'
                ? 'bg-[#1b5858] text-white' 
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>

          <button 
            onClick={() => setActiveSection('support')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
              activeSection === 'support'
                ? 'bg-[#1b5858] text-white' 
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm">Support</span>}
          </button>

          <button 
            onClick={() => setActiveSection('search')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
              activeSection === 'search'
                ? 'bg-[#1b5858] text-white' 
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Search className="w-4 h-4" />
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
