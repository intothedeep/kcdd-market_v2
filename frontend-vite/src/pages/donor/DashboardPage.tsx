/**
 * Donor Dashboard Page
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { OnboardingModal } from '@/components/OnboardingModal'
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
  Heart,
  BarChart3,
  FileText,
  Settings,
  HelpCircle,
  Search,
  AlertTriangle,
  Loader2,
  Download,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Users,
  Target,
  Award,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  RefreshCw,
  Check,
  CircleDot,
} from 'lucide-react'
import {
  fetchDonorDashboardStats,
  fetchDonorDonations,
  fetchOpenRequests,
  fetchDonorDocuments,
  checkOnboardingStatus,
  type DonorDashboardStats,
  type DonationRecord,
  type DonorDocument,
} from '@/lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_HOURS } from '@/constants/contact'
import { IconByName } from '@/components/ui/icon-picker'

// Default empty states
const EMPTY_STATS: DonorDashboardStats = {
  totalDonations: 0,
  requestsFulfilled: 0,
  requestsClaimed: 0,
  causesSupported: 0,
}

// Sidebar sections enum
type SidebarSection =
  | 'campaign'
  | 'browse'
  | 'updates'
  | 'transfers'
  | 'verification'
  | 'documents'
  | 'settings'
  | 'support'
  | 'search'

const SIDEBAR_SECTIONS: readonly SidebarSection[] = [
  'campaign',
  'browse',
  'updates',
  'transfers',
  'verification',
  'documents',
  'settings',
  'support',
  'search',
]

const isSidebarSection = (value: string | null): value is SidebarSection =>
  value !== null && (SIDEBAR_SECTIONS as readonly string[]).includes(value)

// Stats data config
const getStatsCards = (stats: DonorDashboardStats) => [
  {
    title: 'Total Donated',
    value: `$${stats.totalDonations.toLocaleString()}`,
    change: 'Lifetime',
    changeLabel: 'Tax-deductible',
  },
  {
    title: 'Requests Fulfilled',
    value: stats.requestsFulfilled.toString(),
    change: 'Completed',
    changeLabel: 'Requests funded',
  },
  {
    title: 'In Progress',
    value: stats.requestsClaimed.toString(),
    change: 'Active',
    changeLabel: 'Awaiting completion',
  },
  {
    title: 'Causes Supported',
    value: stats.causesSupported.toString(),
    change: 'Areas',
    changeLabel: 'Supported',
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
        <Loader className="h-3 w-3" />
        <span className="font-semibold">In Process</span>
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 bg-white">
      <span className="font-semibold capitalize">{status}</span>
    </Badge>
  )
}

// ============ CONTENT COMPONENTS ============

// Campaign/Dashboard Content (Main view)
function CampaignContent({
  stats,
  donations,
  loading,
  selectedRows,
  toggleRowSelection,
  toggleAllRows,
  activeTab,
  setActiveTab,
}: {
  stats: DonorDashboardStats
  donations: DonationRecord[]
  loading: boolean
  selectedRows: Set<string>
  toggleRowSelection: (id: string) => void
  toggleAllRows: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}) {
  const statsCards = getStatsCards(stats)
  const filteredDonations = donations.filter((d) => {
    if (activeTab === 'all') return true
    return d.status === activeTab
  })

  return (
    <>
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <p className="text-[#737373]">{stat.title}</p>
                {loading ? (
                  <div className="flex h-9 items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <p className="text-[30px] font-semibold leading-9">{stat.value}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stat.change}</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-sm text-[#737373]">{stat.changeLabel}</p>
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
              <TabsTrigger value="claimed">In Progress</TabsTrigger>
              <TabsTrigger value="fulfilled">Completed</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
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
                <DropdownMenuItem>Organization</DropdownMenuItem>
                <DropdownMenuItem>Cause Area</DropdownMenuItem>
                <DropdownMenuItem>Status</DropdownMenuItem>
                <DropdownMenuItem>Amount</DropdownMenuItem>
                <DropdownMenuItem>Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              <span>New Donation</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
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
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 16 16">
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
                      checked={
                        selectedRows.size === filteredDonations.length &&
                        filteredDonations.length > 0
                      }
                      onCheckedChange={toggleAllRows}
                    />
                  </TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Cause Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 16 16">
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
                        checked={selectedRows.has(donation.id)}
                        onCheckedChange={() => toggleRowSelection(donation.id)}
                      />
                    </TableCell>
                    <TableCell>{donation.organization_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{donation.cause_area_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={donation.status} />
                    </TableCell>
                    <TableCell>${donation.amount}</TableCell>
                    <TableCell>{new Date(donation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Download Receipt</DropdownMenuItem>
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
            {selectedRows.size} of {filteredDonations.length} row(s) selected.
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    10
                    <ChevronDown className="ml-1 h-4 w-4" />
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

// Open request type for browse section
interface OpenRequest {
  id: string
  description: string
  amount: number
  urgency: 'low' | 'medium' | 'high'
  organization: { name: string; logo_emoji?: string } | null
  cause_area: { name: string; id?: string } | null
  created_at: string
}

// Sort options
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'urgency'

// Amount range options
const AMOUNT_RANGES = [
  { label: 'Any amount', min: 0, max: Infinity },
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $500', min: 100, max: 500 },
  { label: '$500 - $1,000', min: 500, max: 1000 },
  { label: '$1,000 - $5,000', min: 1000, max: 5000 },
  { label: 'Over $5,000', min: 5000, max: Infinity },
]

// Browse Requests Content
function BrowseRequestsContent({
  requests,
  loading,
  onClaimRequest,
  claimingId,
  onRefresh,
}: {
  requests: OpenRequest[]
  loading: boolean
  onClaimRequest: (requestId: string) => void
  claimingId: string | null
  onRefresh: () => void
}) {
  const navigate = useNavigate()

  // View state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUrgency, setSelectedUrgency] = useState<string[]>([])
  const [selectedCauseAreas, setSelectedCauseAreas] = useState<string[]>([])
  const [selectedAmountRange, setSelectedAmountRange] = useState(0) // index into AMOUNT_RANGES
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // Get unique cause areas from requests
  const causeAreas = Array.from(
    new Set(requests.map((r) => r.cause_area?.name).filter(Boolean))
  ) as string[]

  // Filter and sort logic
  const filteredRequests = requests
    .filter((request) => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matches =
          request.description?.toLowerCase().includes(searchLower) ||
          request.organization?.name?.toLowerCase().includes(searchLower) ||
          request.cause_area?.name?.toLowerCase().includes(searchLower)
        if (!matches) return false
      }

      // Urgency filter
      if (selectedUrgency.length > 0 && !selectedUrgency.includes(request.urgency)) {
        return false
      }

      // Cause area filter
      if (
        selectedCauseAreas.length > 0 &&
        !selectedCauseAreas.includes(request.cause_area?.name || '')
      ) {
        return false
      }

      // Amount range filter
      const range = AMOUNT_RANGES[selectedAmountRange]
      const amount = Number(request.amount)
      if (amount < range.min || amount > range.max) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'amount_high':
          return Number(b.amount) - Number(a.amount)
        case 'amount_low':
          return Number(a.amount) - Number(b.amount)
        case 'urgency': {
          const urgencyOrder = { high: 0, medium: 1, low: 2 }
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        }
        default:
          return 0
      }
    })

  // Check if any filters are active
  const hasActiveFilters =
    selectedUrgency.length > 0 || selectedCauseAreas.length > 0 || selectedAmountRange !== 0

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedUrgency([])
    setSelectedCauseAreas([])
    setSelectedAmountRange(0)
  }

  // Toggle urgency filter
  const toggleUrgency = (urgency: string) => {
    setSelectedUrgency((prev) =>
      prev.includes(urgency) ? prev.filter((u) => u !== urgency) : [...prev, urgency]
    )
  }

  // Toggle cause area filter
  const toggleCauseArea = (causeArea: string) => {
    setSelectedCauseAreas((prev) =>
      prev.includes(causeArea) ? prev.filter((c) => c !== causeArea) : [...prev, causeArea]
    )
  }

  // Urgency badge component
  const UrgencyBadge = ({ urgency }: { urgency: string }) => (
    <Badge
      variant="outline"
      className={
        urgency === 'high'
          ? 'border-red-200 bg-red-50 text-red-700'
          : urgency === 'medium'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-green-200 bg-green-50 text-green-700'
      }
    >
      {urgency}
    </Badge>
  )

  // Sort label helper
  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest':
        return 'Newest'
      case 'oldest':
        return 'Oldest'
      case 'amount_high':
        return 'Highest $'
      case 'amount_low':
        return 'Lowest $'
      case 'urgency':
        return 'Urgent'
      default:
        return 'Sort'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Browse Open Requests</h2>
          <p className="text-sm text-[#737373]">
            {loading ? 'Loading...' : `${filteredRequests.length} donation opportunities available`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
            <ExternalLink className="mr-1 h-4 w-4" />
            Full Page
          </Button>
        </div>
      </div>

      {/* Toolbar - Clean inline filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search requests..."
            className="h-9 bg-white pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Urgency Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 ${selectedUrgency.length > 0 ? 'border-[#1b5858] bg-[#1b5858]/5' : ''}`}
            >
              Urgency
              {selectedUrgency.length > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1b5858] text-xs text-white">
                  {selectedUrgency.length}
                </span>
              )}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {['high', 'medium', 'low'].map((urgency) => (
                <button
                  key={urgency}
                  onClick={() => toggleUrgency(urgency)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedUrgency.includes(urgency) ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      selectedUrgency.includes(urgency)
                        ? 'border-[#1b5858] bg-[#1b5858]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedUrgency.includes(urgency) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="flex-1 text-left capitalize">{urgency}</span>
                  <CircleDot
                    className={`h-3 w-3 ${
                      urgency === 'high'
                        ? 'text-red-500'
                        : urgency === 'medium'
                          ? 'text-amber-500'
                          : 'text-green-500'
                    }`}
                  />
                </button>
              ))}
            </div>
            {selectedUrgency.length > 0 && (
              <button
                onClick={() => setSelectedUrgency([])}
                className="mt-2 w-full border-t pt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            )}
          </PopoverContent>
        </Popover>

        {/* Cause Area Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 ${selectedCauseAreas.length > 0 ? 'border-[#1b5858] bg-[#1b5858]/5' : ''}`}
            >
              Cause Area
              {selectedCauseAreas.length > 0 && (
                <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1b5858] text-xs text-white">
                  {selectedCauseAreas.length}
                </span>
              )}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            {causeAreas.length > 0 ? (
              <>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {causeAreas.map((cause) => (
                    <button
                      key={cause}
                      onClick={() => toggleCauseArea(cause)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        selectedCauseAreas.includes(cause) ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          selectedCauseAreas.includes(cause)
                            ? 'border-[#1b5858] bg-[#1b5858]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedCauseAreas.includes(cause) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="flex-1 text-left">{cause}</span>
                    </button>
                  ))}
                </div>
                {selectedCauseAreas.length > 0 && (
                  <button
                    onClick={() => setSelectedCauseAreas([])}
                    className="mt-2 w-full border-t pt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear selection
                  </button>
                )}
              </>
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500">No cause areas available</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Amount Range Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 ${selectedAmountRange !== 0 ? 'border-[#1b5858] bg-[#1b5858]/5' : ''}`}
            >
              {selectedAmountRange !== 0 ? AMOUNT_RANGES[selectedAmountRange].label : 'Amount'}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="start">
            <div className="space-y-1">
              {AMOUNT_RANGES.map((range, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAmountRange(index)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedAmountRange === index ? 'bg-[#1b5858] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <ArrowUpDown className="mr-1 h-4 w-4" />
              {getSortLabel()}
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="start">
            <div className="space-y-1">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'amount_high', label: 'Amount: High to Low' },
                { value: 'amount_low', label: 'Amount: Low to High' },
                { value: 'urgency', label: 'Most Urgent First' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    sortBy === option.value ? 'bg-[#1b5858] text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Clear filters button - only show when filters active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 text-gray-500 hover:text-gray-700"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}

        {/* View toggle */}
        <div className="flex items-center overflow-hidden rounded-lg border">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 ${viewMode === 'cards' ? 'bg-[#1b5858] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 ${viewMode === 'table' ? 'bg-[#1b5858] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active filters chips - shown below toolbar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedUrgency.map((u) => (
            <Badge
              key={u}
              className={`cursor-pointer gap-1 pr-1 ${
                u === 'high'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : u === 'medium'
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              onClick={() => toggleUrgency(u)}
            >
              {u}
              <X className="ml-0.5 h-3 w-3" />
            </Badge>
          ))}
          {selectedCauseAreas.map((c) => (
            <Badge
              key={c}
              className="cursor-pointer gap-1 bg-[#1b5858]/10 pr-1 text-[#1b5858] hover:bg-[#1b5858]/20"
              onClick={() => toggleCauseArea(c)}
            >
              {c}
              <X className="ml-0.5 h-3 w-3" />
            </Badge>
          ))}
          {selectedAmountRange !== 0 && (
            <Badge
              className="cursor-pointer gap-1 bg-gray-100 pr-1 text-gray-700 hover:bg-gray-200"
              onClick={() => setSelectedAmountRange(0)}
            >
              {AMOUNT_RANGES[selectedAmountRange].label}
              <X className="ml-0.5 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-12 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-1 text-lg font-medium text-[#0a0a0a]">
            {hasActiveFilters ? 'No matching requests' : 'No open requests'}
          </h3>
          <p className="mb-4 text-sm text-[#737373]">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms'
              : 'Check back later for new donation opportunities'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="grid grid-cols-2 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-5 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <IconByName
                      name={request.organization?.logo_emoji || 'building2'}
                      size={20}
                      className="text-[#737373]"
                    />
                    <h3 className="truncate font-medium text-[#0a0a0a]">
                      {request.organization?.name || 'Unknown Organization'}
                    </h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#737373]">{request.description}</p>
                </div>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{request.cause_area?.name || 'General'}</Badge>
                  <span className="font-semibold">${Number(request.amount).toLocaleString()}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-[#1b5858] hover:bg-[#164444]"
                  onClick={() => onClaimRequest(request.id)}
                  disabled={claimingId === request.id}
                >
                  {claimingId === request.id ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ...
                    </>
                  ) : (
                    'Donate'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Organization</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cause Area</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconByName
                        name={request.organization?.logo_emoji || 'building2'}
                        size={16}
                        className="text-[#737373]"
                      />
                      <span className="font-medium">{request.organization?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="block truncate">{request.description}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.cause_area?.name || 'General'}</Badge>
                  </TableCell>
                  <TableCell>
                    <UrgencyBadge urgency={request.urgency} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${Number(request.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-[#1b5858] hover:bg-[#164444]"
                      onClick={() => onClaimRequest(request.id)}
                      disabled={claimingId === request.id}
                    >
                      {claimingId === request.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Donate'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredRequests.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredRequests.length} of {requests.length} requests
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
            View All Requests
          </Button>
        </div>
      )}
    </div>
  )
}

// Updates & Proof Content
function UpdatesContent({
  donations,
  stats,
}: {
  donations: DonationRecord[]
  stats: DonorDashboardStats
}) {
  const fulfilledDonations = donations.filter((d) => d.status === 'fulfilled')

  // Calculate estimated people helped (assume avg 2 people per donation)
  const estimatedPeopleHelped = fulfilledDonations.length * 2

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Updates & Proof of Impact</h2>
        <p className="text-sm text-[#737373]">See how your donations are making a difference</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-[#1b5858]" />
          <p className="text-2xl font-semibold">{estimatedPeopleHelped}</p>
          <p className="text-sm text-[#737373]">People Helped</p>
        </Card>
        <Card className="p-5 text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-[#1b5858]" />
          <p className="text-2xl font-semibold">{stats.causesSupported}</p>
          <p className="text-sm text-[#737373]">Causes Supported</p>
        </Card>
        <Card className="p-5 text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-[#1b5858]" />
          <p className="text-2xl font-semibold">{stats.requestsFulfilled}</p>
          <p className="text-sm text-[#737373]">Requests Fulfilled</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Recent Impact Updates</h3>
        {fulfilledDonations.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No fulfilled donations yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Your impact stories will appear here once donations are completed.
            </p>
          </Card>
        ) : (
          fulfilledDonations.slice(0, 4).map((donation) => (
            <Card key={donation.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1b5858] font-semibold text-white">
                  <IconByName
                    name={donation.organization_logo_emoji || 'building2'}
                    size={20}
                    className="text-white"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{donation.organization_name}</h4>
                    <span className="text-sm text-[#737373]">
                      {donation.fulfilled_at &&
                        new Date(donation.fulfilled_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[#737373]">{donation.description}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium text-green-600">✓ Fulfilled</span>
                    <span className="text-[#737373]"> · ${donation.amount} donation complete</span>
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

// Transfers Content - Shows donor's payment history from fulfilled donations
function TransfersContent({
  donations,
  stats,
}: {
  donations: DonationRecord[]
  stats: DonorDashboardStats
}) {
  // Get fulfilled and claimed donations (actual transactions)
  const transfers = donations
    .filter((d) => d.status === 'fulfilled' || d.status === 'claimed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Calculate this month's total
  const now = new Date()
  const thisMonth = donations
    .filter((d) => {
      if (d.status !== 'fulfilled' && d.status !== 'claimed') return false
      const date = new Date(d.fulfilled_at || d.claimed_at || d.created_at)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    .reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Payment History</h2>
          <p className="text-sm text-[#737373]">Track your donation payments and transactions</p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#737373]">Total Donated</p>
              <p className="text-xl font-semibold">${stats.totalDonations.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#737373]">This Month</p>
              <p className="text-xl font-semibold">${thisMonth.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {transfers.length === 0 ? (
        <Card className="p-8 text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No payment history yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Your transactions will appear here once you make donations.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {new Date(
                      transfer.fulfilled_at || transfer.claimed_at || transfer.created_at
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconByName
                        name={transfer.organization_logo_emoji || 'building2'}
                        size={16}
                        className="text-[#737373]"
                      />
                      <span>{transfer.organization_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${transfer.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        transfer.status === 'fulfilled'
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                      }
                    >
                      {transfer.status === 'fulfilled' ? 'Completed' : 'Processing'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// Tax Documents Content
function DocumentsContent({
  documents,
  loading,
}: {
  documents: DonorDocument[]
  loading: boolean
}) {
  const handleDownload = (doc: DonorDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    } else {
      alert(`Document "${doc.name}" is not available for download yet.`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Tax Documents</h2>
          <p className="text-sm text-[#737373]">
            Download your tax receipts and donation statements
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={documents.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No documents available yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Documents will appear here once you make your first donation.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{doc.name}</h4>
                    <p className="text-sm text-[#737373]">
                      {doc.type} · {doc.size || 'PDF'} ·{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      doc.status === 'ready'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }
                  >
                    {doc.status === 'ready' ? 'Ready' : 'Processing'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={doc.status !== 'ready'}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Settings Content
function SettingsContent({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Account Information</h2>
        <p className="text-sm text-[#737373]">Manage your profile and preferences</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Profile Settings</h3>
              <p className="text-sm text-[#737373]">
                Update your personal information and preferences
              </p>
            </div>
            <Button onClick={onOpenModal} className="bg-[#1b5858] hover:bg-[#164444]">
              Edit Profile
            </Button>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-[#737373]">Control your data and visibility</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Accounts</p>
                <p className="text-sm text-[#737373]">Manage linked payment methods</p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Support Content
function SupportContent() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How do I claim a donation request?',
      answer:
        'To claim a donation request, browse the available requests on the Requests page. Click on any request to view details, then click the "Donate" button. You can donate the full amount or a partial amount. After payment, the organization will be notified and you\'ll receive a confirmation email.',
    },
    {
      question: 'Where can I find my tax receipts?',
      answer:
        'All your tax receipts are available in the Tax Documents section of your dashboard. You can download individual donation receipts or generate an annual summary for tax filing purposes. Receipts are automatically generated after each successful donation.',
    },
    {
      question: 'How do I update my payment method?',
      answer:
        'To update your payment method, go to Settings in your dashboard. Under the Payment Methods section, you can add a new card or remove existing ones. Your payment information is securely stored and processed through Stripe.',
    },
    {
      question: 'Are my donations tax-deductible?',
      answer:
        "Yes, all donations made through KC Digital Drive are tax-deductible. We partner only with verified 501(c)(3) nonprofit organizations. You'll receive a tax receipt for each donation which includes the organization's EIN number.",
    },
    {
      question: 'How do I contact an organization I donated to?',
      answer:
        'You can view organization details by clicking on their name in your donation history. Each organization profile includes contact information. You can also send messages through the platform if the organization has messaging enabled.',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Support</h2>
        <p className="text-sm text-[#737373]">Get help with your account or donations</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer p-5 text-center transition-shadow hover:shadow-md">
          <Mail className="mx-auto mb-3 h-8 w-8 text-[#1b5858]" />
          <h3 className="mb-1 font-medium">Email Support</h3>
          <p className="text-sm text-[#737373]">{SUPPORT_EMAIL}</p>
        </Card>
        <Card className="cursor-pointer p-5 text-center transition-shadow hover:shadow-md">
          <Phone className="mx-auto mb-3 h-8 w-8 text-[#1b5858]" />
          <h3 className="mb-1 font-medium">Phone Support</h3>
          <p className="text-sm text-[#737373]">{SUPPORT_PHONE}</p>
        </Card>
        <Card className="cursor-pointer p-5 text-center transition-shadow hover:shadow-md">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#1b5858]" />
          <h3 className="mb-1 font-medium">Live Chat</h3>
          <p className="text-sm text-[#737373]">{SUPPORT_HOURS}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-medium">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`cursor-pointer rounded-lg p-3 transition-colors ${
                expandedFaq === index ? 'bg-[#c4e5c1]' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{faq.question}</p>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    expandedFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {expandedFaq === index && (
                <p className="mt-2 border-t border-gray-200 pt-2 text-sm text-gray-600">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
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
        <p className="text-sm text-[#737373]">Find donations, organizations, or documents</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search for anything..." className="h-12 pl-12 text-lg" />
      </div>

      <div className="py-12 text-center text-[#737373]">
        <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>Start typing to search across your donations, organizations, and documents</p>
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function DonorDashboard() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const { toast } = useToast()

  // State
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>(() => {
    const param = searchParams.get('section')
    return isSidebarSection(param) ? param : 'campaign'
  })

  // Sidebar tab <-> ?section= URL sync (preserves other params).
  const selectSection = (section: SidebarSection) => {
    setActiveSection(section)
    setSearchParams(
      (prev) => {
        prev.set('section', section)
        return prev
      },
      { replace: true }
    )
  }
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)

  // Data state
  const [stats, setStats] = useState<DonorDashboardStats>(EMPTY_STATS)
  const [donations, setDonations] = useState<DonationRecord[]>([])
  const [documents, setDocuments] = useState<DonorDocument[]>([])
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [openRequestsLoading, setOpenRequestsLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(true)

  // Fetch open requests
  const fetchOpenRequestsData = useCallback(async () => {
    setOpenRequestsLoading(true)
    try {
      const data = await fetchOpenRequests()
      setOpenRequests(data || [])
    } catch (err) {
      console.error('Error fetching open requests:', err)
      setOpenRequests([])
    } finally {
      setOpenRequestsLoading(false)
    }
  }, [])

  // Fetch real data
  const fetchData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setDocumentsLoading(true)
    try {
      const onboardingStatus = await checkOnboardingStatus(user.id, 'donor')
      setNeedsOnboarding(!onboardingStatus.onboarding_complete)

      const [statsData, donationsData, documentsData] = await Promise.all([
        fetchDonorDashboardStats(user.id),
        fetchDonorDonations(user.id),
        fetchDonorDocuments(user.id),
      ])

      setStats(statsData || EMPTY_STATS)
      setDonations(donationsData || [])
      setDocuments(documentsData || [])
    } catch (err) {
      console.error('Error fetching donor data:', err)
      setStats(EMPTY_STATS)
      setDonations([])
      setDocuments([])
    } finally {
      setLoading(false)
      setDocumentsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchData()
      fetchOpenRequestsData()
    }
  }, [isLoaded, user?.id, fetchData, fetchOpenRequestsData])

  // Handle claiming a request - navigates to checkout
  const handleClaimRequest = async (requestId: string) => {
    if (!user?.id) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to donate.',
        variant: 'destructive',
      })
      return
    }

    // Navigate to checkout page for this request
    navigate(`/checkout/${requestId}`)
  }

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
    const filteredDonations = donations.filter((d) => activeTab === 'all' || d.status === activeTab)
    if (selectedRows.size === filteredDonations.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredDonations.map((d) => d.id)))
    }
  }

  // Get header title based on active section
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'campaign':
        return 'My Donations'
      case 'browse':
        return 'Browse Campaigns'
      case 'updates':
        return 'Updates & Proof'
      case 'transfers':
        return 'Payment History'
      case 'documents':
        return 'Tax Documents'
      case 'settings':
        return 'Account Information'
      case 'support':
        return 'Support'
      case 'search':
        return 'Search'
      default:
        return 'Dashboard'
    }
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'campaign':
        return (
          <CampaignContent
            stats={stats}
            donations={donations}
            loading={loading}
            selectedRows={selectedRows}
            toggleRowSelection={toggleRowSelection}
            toggleAllRows={toggleAllRows}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )
      case 'browse':
        return (
          <BrowseRequestsContent
            requests={openRequests}
            loading={openRequestsLoading}
            onClaimRequest={handleClaimRequest}
            claimingId={null}
            onRefresh={fetchOpenRequestsData}
          />
        )
      case 'updates':
        return <UpdatesContent donations={donations} stats={stats} />
      case 'transfers':
        return <TransfersContent donations={donations} stats={stats} />
      case 'documents':
        return <DocumentsContent documents={documents} loading={documentsLoading} />
      case 'settings':
        return <SettingsContent onOpenModal={() => setShowOnboardingModal(true)} />
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

  return (
    <div className="flex h-full bg-[#fafafa]">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={() => {
          setShowOnboardingModal(false)
          setNeedsOnboarding(false)
          fetchData()
        }}
        userType="donor"
      />

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col overflow-hidden bg-[#fafafa] p-2 transition-all duration-300`}
      >
        <div className="flex-1 space-y-2 overflow-hidden">
          {/* Main Navigation */}
          <nav className="space-y-1 p-2">
            <button
              onClick={() => selectSection('campaign')}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
                activeSection === 'campaign'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">My Donations</span>}
            </button>

            {/* W7-10 Phase 1: Browse Requests sidebar nav removed (campaigns-only).
                Reversible — uncomment to restore. The 'browse' render branch +
                BrowseRequestsContent remain defined but unreachable. */}
            {/* <button
              onClick={() => selectSection('browse')}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
                activeSection === 'browse'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <Heart className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Browse Campaigns</span>}
            </button> */}

            <button
              onClick={() => selectSection('updates')}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
                activeSection === 'updates'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Updates & Proof</span>}
            </button>

            <button
              onClick={() => selectSection('transfers')}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
                activeSection === 'transfers'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Payment History</span>}
            </button>
          </nav>

          {/* Documents Section */}
          <div className="p-2">
            {sidebarOpen && (
              <h3 className="mb-2 whitespace-nowrap px-2 text-xs font-medium text-[#0a0a0a] opacity-70">
                Documents
              </h3>
            )}
            <button
              onClick={() => selectSection('documents')}
              className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
                activeSection === 'documents'
                  ? 'bg-[#1b5858] text-white'
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Tax Documents</span>}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="space-y-1 overflow-hidden border-t border-gray-200 p-2 pt-2">
          <button
            onClick={() => selectSection('settings')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
              activeSection === 'settings'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Account Information</span>}
          </button>

          <button
            onClick={() => selectSection('support')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
              activeSection === 'support'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Support</span>}
          </button>

          <button
            onClick={() => selectSection('search')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 transition-colors ${
              activeSection === 'search'
                ? 'bg-[#1b5858] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Search</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-2">
        <div className="flex h-full flex-col rounded-[14px] bg-white shadow-sm">
          {/* Header */}
          <div className="flex h-[49px] items-center gap-2 border-b border-[#e5e5e5] px-6">
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
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Complete Your Profile</AlertTitle>
                <AlertDescription className="flex items-center justify-between text-amber-700">
                  <span>Please complete your profile setup to get started donating.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setShowOnboardingModal(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
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
