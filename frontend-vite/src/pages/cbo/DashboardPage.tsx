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
} from 'lucide-react'
import { 
  fetchCBODashboardStats,
  fetchCBORequests,
  checkOnboardingStatus,
  getOrganizationByUserId,
  type CBODashboardStats,
  type RequestRecord
} from '@/lib/supabase'

// Demo data
const DEMO_STATS: CBODashboardStats = {
  totalReceived: 12450,
  activeRequests: 5,
  fulfilledRequests: 28,
  pendingRequests: 3
}

const DEMO_REQUESTS: RequestRecord[] = [
  {
    id: '1',
    description: 'Laptops for after-school program',
    amount: 2500,
    status: 'open',
    urgency: 'high',
    cause_area_name: 'Education',
    donor_email: null,
    created_at: '2024-12-20T10:00:00Z',
    claimed_at: null,
    fulfilled_at: null
  },
  {
    id: '2',
    description: 'Internet hotspots for families',
    amount: 800,
    status: 'claimed',
    urgency: 'medium',
    cause_area_name: 'Digital Access',
    donor_email: 'donor@example.com',
    created_at: '2024-12-18T14:00:00Z',
    claimed_at: '2024-12-19T09:00:00Z',
    fulfilled_at: null
  },
  {
    id: '3',
    description: 'Office supplies for volunteer center',
    amount: 350,
    status: 'fulfilled',
    urgency: 'low',
    cause_area_name: 'Community',
    donor_email: 'generous.donor@example.com',
    created_at: '2024-12-10T08:00:00Z',
    claimed_at: '2024-12-10T12:00:00Z',
    fulfilled_at: '2024-12-15T16:00:00Z'
  },
  {
    id: '4',
    description: 'Tablets for senior outreach program',
    amount: 1200,
    status: 'fulfilled',
    urgency: 'medium',
    cause_area_name: 'Senior Services',
    donor_email: 'tech.donor@example.com',
    created_at: '2024-12-05T11:00:00Z',
    claimed_at: '2024-12-06T10:00:00Z',
    fulfilled_at: '2024-12-12T14:00:00Z'
  },
  {
    id: '5',
    description: 'Printer for job training center',
    amount: 450,
    status: 'open',
    urgency: 'high',
    cause_area_name: 'Employment',
    donor_email: null,
    created_at: '2024-12-21T09:00:00Z',
    claimed_at: null,
    fulfilled_at: null
  }
]

// Sidebar sections enum
type SidebarSection = 
  | 'dashboard' 
  | 'requests' 
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
              <span>New Request</span>
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

// Manage Requests Content (with Create form)
function RequestsContent({ onCreateRequest }: { onCreateRequest: () => void }) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0a0a0a]">Create New Request</h2>
            <p className="text-sm text-[#737373]">Submit a new donation request</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Cancel
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Describe what you need and why..." rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Needed ($)</label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Select urgency
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem>Low</DropdownMenuItem>
                    <DropdownMenuItem>Medium</DropdownMenuItem>
                    <DropdownMenuItem>High</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cause Area</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select cause area
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem>Education</DropdownMenuItem>
                  <DropdownMenuItem>Digital Access</DropdownMenuItem>
                  <DropdownMenuItem>Employment</DropdownMenuItem>
                  <DropdownMenuItem>Senior Services</DropdownMenuItem>
                  <DropdownMenuItem>Community</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supporting Images (optional)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-[#737373]">Drop images here or click to upload</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button className="bg-[#1b5858] hover:bg-[#164444]">
                Submit Request
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0a0a0a]">Manage Requests</h2>
          <p className="text-sm text-[#737373]">Create and manage your donation requests</p>
        </div>
        <Button 
          className="bg-[#1b5858] hover:bg-[#164444]"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowCreateForm(true)}>
          <div className="h-12 w-12 bg-[#1b5858] rounded-lg flex items-center justify-center mx-auto mb-3">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-medium">New Request</h3>
          <p className="text-sm text-[#737373]">Create a donation request</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="font-medium">Pending Review</h3>
          <p className="text-sm text-[#737373]">3 requests awaiting review</p>
        </Card>
        <Card className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-medium">Completed</h3>
          <p className="text-sm text-[#737373]">28 requests fulfilled</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-medium mb-4">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-[#737373]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Be specific about what you need and why</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Include images to help donors understand your needs</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Set realistic urgency levels - high urgency requests get more attention</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <span>Update request status promptly when donations are received</span>
          </li>
        </ul>
      </Card>
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

// Settings Content
function SettingsContent({ organization, onOpenModal }: { organization: any, onOpenModal: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a0a0a]">Organization Settings</h2>
        <p className="text-sm text-[#737373]">Manage your organization profile and preferences</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-[#1b5858] rounded-lg flex items-center justify-center text-white text-xl font-semibold">
            {organization?.name?.[0] || 'O'}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{organization?.name || 'Your Organization'}</h3>
            <p className="text-sm text-[#737373]">Community-Based Organization</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Organization Profile</h3>
              <p className="text-sm text-[#737373]">Update your organization information</p>
            </div>
            <Button onClick={onOpenModal} className="bg-[#1b5858] hover:bg-[#164444]">
              Edit Profile
            </Button>
          </div>
          <Separator />
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
  const [stats, setStats] = useState<CBODashboardStats>(DEMO_STATS)
  const [requests, setRequests] = useState<RequestRecord[]>(DEMO_REQUESTS)
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

        const [statsData, requestsData] = await Promise.all([
          fetchCBODashboardStats(user.id),
          fetchCBORequests(user.id)
        ])

        if (requestsData && requestsData.length > 0) {
          setStats(statsData)
          setRequests(requestsData)
        }
      } else {
        setHasOrganization(false)
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

  const handleCreateRequest = () => {
    setActiveSection('requests')
  }

  // Get header title based on active section
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard'
      case 'requests': return 'My Requests'
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
            onCreateRequest={handleCreateRequest}
          />
        )
      case 'requests':
        return <RequestsContent onCreateRequest={handleCreateRequest} />
      case 'analytics':
        return <AnalyticsContent stats={stats} requests={requests} />
      case 'documents':
        return <DocumentsContent />
      case 'settings':
        return <SettingsContent organization={organization} onOpenModal={() => setShowOnboardingModal(true)} />
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
          {/* Organization Header */}
          {organization && sidebarOpen && (
            <div className="px-2 pb-4 mb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#1b5858] rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {organization.name?.[0] || 'O'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">{organization.name}</p>
                  <p className="text-xs text-[#737373]">Organization</p>
                </div>
              </div>
            </div>
          )}

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
              onClick={() => setActiveSection('requests')}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors ${
                activeSection === 'requests'
                  ? 'bg-[#1b5858] text-white' 
                  : 'text-[#0a0a0a] hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">My Requests</span>}
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
              onClick={handleCreateRequest}
            >
              <Plus className="h-4 w-4 mr-2" />
              {sidebarOpen && 'New Request'}
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
