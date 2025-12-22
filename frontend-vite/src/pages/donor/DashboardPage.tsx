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
  ShieldCheck,
  Download,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Target,
  Award,
} from 'lucide-react'
import { 
  fetchDonorDashboardStats, 
  fetchDonorDonations,
  checkOnboardingStatus,
  type DonorDashboardStats,
  type DonationRecord
} from '@/lib/supabase'

// Demo data
const DEMO_STATS: DonorDashboardStats = {
  totalDonations: 2847,
  requestsFulfilled: 12,
  requestsClaimed: 3,
  causesSupported: 5
}

const DEMO_DONATIONS: DonationRecord[] = [
  {
    id: '1',
    description: 'Laptop for remote learning student',
    amount: 450,
    status: 'fulfilled',
    urgency: 'high',
    organization_name: 'KC Youth Education',
    organization_logo_emoji: '📚',
    cause_area_name: 'Education',
    created_at: '2024-12-15T10:30:00Z',
    claimed_at: '2024-12-15T14:00:00Z',
    fulfilled_at: '2024-12-18T09:00:00Z'
  },
  {
    id: '2',
    description: 'Internet hotspot for family of 4',
    amount: 120,
    status: 'fulfilled',
    urgency: 'medium',
    organization_name: 'Digital Bridge KC',
    organization_logo_emoji: '🌐',
    cause_area_name: 'Digital Access',
    created_at: '2024-12-10T08:00:00Z',
    claimed_at: '2024-12-10T12:00:00Z',
    fulfilled_at: '2024-12-12T16:00:00Z'
  },
  {
    id: '3',
    description: 'Tablet for senior citizen tech classes',
    amount: 280,
    status: 'claimed',
    urgency: 'low',
    organization_name: 'Senior Tech Connect',
    organization_logo_emoji: '👴',
    cause_area_name: 'Senior Services',
    created_at: '2024-12-20T11:00:00Z',
    claimed_at: '2024-12-20T15:00:00Z',
    fulfilled_at: null
  },
  {
    id: '4',
    description: 'Computer monitors for nonprofit office',
    amount: 350,
    status: 'claimed',
    urgency: 'medium',
    organization_name: 'Community Action Network',
    organization_logo_emoji: '🏢',
    cause_area_name: 'Nonprofit Support',
    created_at: '2024-12-19T09:00:00Z',
    claimed_at: '2024-12-19T13:00:00Z',
    fulfilled_at: null
  },
  {
    id: '5',
    description: 'Webcam and headset for job interviews',
    amount: 85,
    status: 'fulfilled',
    urgency: 'high',
    organization_name: 'Employment First KC',
    organization_logo_emoji: '💼',
    cause_area_name: 'Employment',
    created_at: '2024-12-08T14:00:00Z',
    claimed_at: '2024-12-08T16:00:00Z',
    fulfilled_at: '2024-12-09T10:00:00Z'
  },
  {
    id: '6',
    description: 'Printer for small business startup',
    amount: 199,
    status: 'fulfilled',
    urgency: 'medium',
    organization_name: 'Entrepreneurship Hub',
    organization_logo_emoji: '🚀',
    cause_area_name: 'Small Business',
    created_at: '2024-12-05T10:00:00Z',
    claimed_at: '2024-12-05T11:30:00Z',
    fulfilled_at: '2024-12-07T14:00:00Z'
  }
]

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

// Stats data config
const getStatsCards = (stats: DonorDashboardStats) => [
  {
    title: "Total Donated",
    value: `$${stats.totalDonations.toLocaleString()}`,
    change: "+12%",
    changeLabel: "This month",
  },
  {
    title: "Requests Fulfilled",
    value: stats.requestsFulfilled.toString(),
    change: "+3",
    changeLabel: "This month",
  },
  {
    title: "In Progress",
    value: stats.requestsClaimed.toString(),
    change: "Active",
    changeLabel: "Awaiting completion",
  },
  {
    title: "Causes Supported",
    value: stats.causesSupported.toString(),
    change: "+1",
    changeLabel: "Different areas",
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
  setActiveTab
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
  const filteredDonations = donations.filter(d => {
    if (activeTab === 'all') return true
    return d.status === activeTab
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
                      checked={selectedRows.size === filteredDonations.length && filteredDonations.length > 0}
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
                    <TableCell>
                      {new Date(donation.created_at).toLocaleDateString()}
                    </TableCell>
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

// Browse Requests Content
function BrowseRequestsContent() {
  const openRequests = [
    { id: '1', org: 'KC Youth Center', description: 'Laptops for coding class', amount: 1200, urgency: 'high', cause: 'Education' },
    { id: '2', org: 'Digital Bridge', description: 'Internet hotspots for families', amount: 450, urgency: 'medium', cause: 'Digital Access' },
    { id: '3', org: 'Senior Connect', description: 'Tablets for seniors', amount: 800, urgency: 'low', cause: 'Senior Services' },
    { id: '4', org: 'Job Ready KC', description: 'Interview equipment', amount: 350, urgency: 'high', cause: 'Employment' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Browse Open Requests</h2>
          <p className="text-sm text-[#737373]">Find donation opportunities that match your interests</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search requests..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {openRequests.map((request) => (
          <Card key={request.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-[#0a0a0a]">{request.org}</h3>
                <p className="text-sm text-[#737373]">{request.description}</p>
              </div>
              <Badge variant="outline" className={
                request.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                request.urgency === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-green-50 text-green-700 border-green-200'
              }>
                {request.urgency}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{request.cause}</Badge>
                <span className="font-semibold">${request.amount}</span>
              </div>
              <Button size="sm" className="bg-[#1b5858] hover:bg-[#164444]">
                Claim Request
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Updates & Proof Content
function UpdatesContent({ donations }: { donations: DonationRecord[] }) {
  const fulfilledDonations = donations.filter(d => d.status === 'fulfilled')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Updates & Proof of Impact</h2>
        <p className="text-sm text-[#737373]">See how your donations are making a difference</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">127</p>
          <p className="text-sm text-[#737373]">People Helped</p>
        </Card>
        <Card className="p-5 text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">5</p>
          <p className="text-sm text-[#737373]">Causes Supported</p>
        </Card>
        <Card className="p-5 text-center">
          <Award className="h-8 w-8 mx-auto mb-2 text-[#1b5858]" />
          <p className="text-2xl font-semibold">12</p>
          <p className="text-sm text-[#737373]">Requests Fulfilled</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Recent Impact Updates</h3>
        {fulfilledDonations.slice(0, 4).map((donation) => (
          <Card key={donation.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-[#1b5858] rounded-lg flex items-center justify-center text-white font-semibold">
                {donation.organization_name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{donation.organization_name}</h4>
                  <span className="text-sm text-[#737373]">
                    {donation.fulfilled_at && new Date(donation.fulfilled_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[#737373]">{donation.description}</p>
                <p className="text-sm mt-2">
                  <span className="text-green-600 font-medium">✓ Fulfilled</span>
                  <span className="text-[#737373]"> · ${donation.amount} donation complete</span>
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Transfers Content
function TransfersContent() {
  const transfers = [
    { id: '1', date: '2024-12-15', amount: 450, method: 'Bank Transfer', status: 'completed' },
    { id: '2', date: '2024-12-10', amount: 120, method: 'Credit Card', status: 'completed' },
    { id: '3', date: '2024-12-05', amount: 280, method: 'Bank Transfer', status: 'completed' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Payouts / Transfers</h2>
          <p className="text-sm text-[#737373]">Track your payment history and manage payment methods</p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#737373]">Total Transferred</p>
              <p className="text-xl font-semibold">$2,847</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#737373]">This Month</p>
              <p className="text-xl font-semibold">$850</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{new Date(transfer.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">${transfer.amount}</TableCell>
                <TableCell>{transfer.method}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {transfer.status}
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
    </div>
  )
}

// Verification Status Content
function VerificationContent() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Verification Status</h2>
        <p className="text-sm text-[#737373]">Your account verification and compliance status</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-600">Account Verified</h3>
            <p className="text-sm text-[#737373]">Your account is fully verified and in good standing</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Email Verified</span>
            </div>
            <span className="text-sm text-[#737373]">Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Identity Verification</span>
            </div>
            <span className="text-sm text-[#737373]">Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Payment Method Added</span>
            </div>
            <span className="text-sm text-[#737373]">Completed</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Tax Documents Content
function DocumentsContent() {
  const documents = [
    { id: '1', name: 'Tax Receipt 2024', date: '2024-12-20', type: 'PDF' },
    { id: '2', name: 'Donation Summary Q4', date: '2024-12-01', type: 'PDF' },
    { id: '3', name: 'Annual Giving Statement', date: '2024-01-15', type: 'PDF' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Tax Documents</h2>
          <p className="text-sm text-[#737373]">Download your tax receipts and donation statements</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download All
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
              <p className="text-sm text-[#737373]">Update your personal information and preferences</p>
            </div>
            <Button onClick={onOpenModal} className="bg-[#1b5858] hover:bg-[#164444]">
              Edit Profile
            </Button>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-[#737373]">Receive updates about your donations</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-[#737373]">Control your data and visibility</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Accounts</p>
                <p className="text-sm text-[#737373]">Manage linked payment methods</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
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
        <p className="text-sm text-[#737373]">Get help with your account or donations</p>
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
            <p className="font-medium">How do I claim a donation request?</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <p className="font-medium">Where can I find my tax receipts?</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <p className="font-medium">How do I update my payment method?</p>
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
        <p className="text-sm text-[#737373]">Find donations, organizations, or documents</p>
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
        <p>Start typing to search across your donations, organizations, and documents</p>
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function DonorDashboard() {
  const { user, isLoaded } = useUser()
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>('campaign')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  
  // Data state
  const [stats, setStats] = useState<DonorDashboardStats>(DEMO_STATS)
  const [donations, setDonations] = useState<DonationRecord[]>(DEMO_DONATIONS)
  const [loading, setLoading] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(true)

  // Fetch real data
  const fetchData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const onboardingStatus = await checkOnboardingStatus(user.id, 'donor')
      setNeedsOnboarding(!onboardingStatus.onboarding_complete)

      const [statsData, donationsData] = await Promise.all([
        fetchDonorDashboardStats(user.id),
        fetchDonorDonations(user.id)
      ])

      if (donationsData && donationsData.length > 0) {
        setStats(statsData)
        setDonations(donationsData)
      }
    } catch (err) {
      console.log('Using demo data')
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
    const filteredDonations = donations.filter(d => activeTab === 'all' || d.status === activeTab)
    if (selectedRows.size === filteredDonations.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredDonations.map(d => d.id)))
    }
  }

  // Get header title based on active section
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'campaign': return 'Donations'
      case 'browse': return 'Browse Requests'
      case 'updates': return 'Updates & Proof'
      case 'transfers': return 'Payouts / Transfers'
      case 'verification': return 'Verification Status'
      case 'documents': return 'Tax Documents'
      case 'settings': return 'Account Information'
      case 'support': return 'Support'
      case 'search': return 'Search'
      default: return 'Dashboard'
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
        return <BrowseRequestsContent />
      case 'updates':
        return <UpdatesContent donations={donations} />
      case 'transfers':
        return <TransfersContent />
      case 'verification':
        return <VerificationContent />
      case 'documents':
        return <DocumentsContent />
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
    <div className="flex h-screen bg-[#fafafa]">
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
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#fafafa] p-2 flex flex-col transition-all duration-300`}>
        <div className="flex-1 space-y-2">
          {/* Main Navigation */}
          <nav className="space-y-1 p-2">
            <button 
              onClick={() => setActiveSection('campaign')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'campaign'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">My Campaign</span>}
            </button>

            <button 
              onClick={() => setActiveSection('browse')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'browse'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Browse Requests</span>}
            </button>

            <button 
              onClick={() => setActiveSection('updates')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'updates'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Updates & Proof</span>}
            </button>

            <button 
              onClick={() => setActiveSection('transfers')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'transfers'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Payouts / Transfers</span>}
            </button>

            <button 
              onClick={() => setActiveSection('verification')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'verification'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Verification Status</span>}
            </button>
          </nav>

          {/* Documents Section */}
          <div className="p-2">
            {sidebarOpen && (
              <h3 className="px-2 mb-2 text-xs font-medium text-[#0a0a0a] opacity-70">
                Documents
              </h3>
            )}
            <button 
              onClick={() => setActiveSection('documents')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'documents'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Tax Documents</span>}
            </button>
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
            {sidebarOpen && <span className="text-sm">Account Information</span>}
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
                  <span>Please complete your profile setup to get started donating.</span>
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
