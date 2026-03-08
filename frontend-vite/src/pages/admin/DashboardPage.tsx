/**
 * Admin Dashboard Page
 * Comprehensive admin panel with sidebar navigation
 */

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  CheckCircle2,
  PanelLeft,
  MoreVertical,
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  HelpCircle,
  Search,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Heart,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  RefreshCw,
  Loader2,
  BarChart3,
  Activity,
  Filter,
  Download,
  Mail,
  ExternalLink,
  User,
} from 'lucide-react'
import {
  supabase,
  fetchCampaignReports,
  updateCampaignReportStatus,
  fetchPlatformSettings,
  updatePlatformSettings,
  fetchUserGrowthData,
  fetchDonationTrendsData,
  fetchSupportFAQs,
  logAdminActivity,
  type CampaignReport,
  type MonthlyDataPoint,
  type SupportFAQ
} from '@/lib/supabase'
import { Textarea } from '@/components/ui/textarea'
import { Flag, AlertTriangle } from 'lucide-react'
import {
  USER_TYPE_LABELS,
  ORG_TIER_LABELS,
  VERIFICATION_STATUS_LABELS,
  ORG_TIERS,
  VERIFICATION_STATUS,
  type OrgTier,
  type VerificationStatus,
} from '@/constants/userTypes'

// ============ TYPES ============

interface DashboardStats {
  totalUsers: number
  totalDonors: number
  totalOrgs: number
  verifiedUsers: number
  totalRequests: number
  openRequests: number
  claimedRequests: number
  fulfilledRequests: number
  totalDonations: number
  thisMonthDonations: number
}

interface UserProfile {
  id: string
  user_type: 'donor' | 'cbo' | 'admin'
  org_tier: OrgTier
  verification_status: VerificationStatus
  is_vetted: boolean
  created_at: string
  updated_at: string
  donor_profile?: {
    display_name: string
    email: string
  }
  organization?: {
    name: string
    email: string
  }
}

interface Organization {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  website: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  mission: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  // Joined data
  user_profile?: {
    verification_status: VerificationStatus
    org_tier: OrgTier
  }
}

interface Request {
  id: string
  organization_id: string
  description: string
  amount: number
  status: 'open' | 'claimed' | 'fulfilled' | 'denied'
  urgency: 'low' | 'medium' | 'high'
  created_at: string
  claimed_at: string | null
  fulfilled_at: string | null
  organization?: {
    name: string
  }
  cause_area?: {
    name: string
  }
}

interface ActivityItem {
  id: string
  type: 'user_joined' | 'request_created' | 'donation_made' | 'org_verified'
  description: string
  timestamp: string
  user?: string
}

// Sidebar sections
type SidebarSection =
  | 'overview'
  | 'users'
  | 'organizations'
  | 'requests'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'support'

// ============ EMPTY STATES ============

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalDonors: 0,
  totalOrgs: 0,
  verifiedUsers: 0,
  totalRequests: 0,
  openRequests: 0,
  claimedRequests: 0,
  fulfilledRequests: 0,
  totalDonations: 0,
  thisMonthDonations: 0,
}

// ============ HELPER COMPONENTS ============

function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  loading = false
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  loading?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-[#737373]">{title}</p>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
          {change && (
            <div className="flex items-center gap-1 text-sm">
              {changeType === 'positive' && <TrendingUp className="h-3 w-3 text-green-600" />}
              {changeType === 'negative' && <TrendingDown className="h-3 w-3 text-red-600" />}
              <span className={
                changeType === 'positive' ? 'text-green-600' :
                changeType === 'negative' ? 'text-red-600' :
                'text-[#737373]'
              }>{change}</span>
            </div>
          )}
        </div>
        <div className="h-10 w-10 bg-[#ea580c]/10 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5 text-[#ea580c]" />
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
    claimed: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Claimed' },
    fulfilled: { bg: 'bg-green-100', text: 'text-green-700', label: 'Fulfilled' },
    denied: { bg: 'bg-red-100', text: 'text-red-700', label: 'Denied' },
  }
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  return (
    <Badge className={`${c.bg} ${c.text} border-0`}>
      {c.label}
    </Badge>
  )
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-red-100', text: 'text-red-700' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
    low: { bg: 'bg-green-100', text: 'text-green-700' },
  }
  const c = config[urgency] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <Badge className={`${c.bg} ${c.text} border-0 capitalize`}>
      {urgency}
    </Badge>
  )
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config: Record<string, { bg: string; text: string }> = {
    unverified: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    verified: { bg: 'bg-green-100', text: 'text-green-700' },
    premium: { bg: 'bg-purple-100', text: 'text-purple-700' },
  }
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <Badge className={`${c.bg} ${c.text} border-0`}>
      {VERIFICATION_STATUS_LABELS[status]}
    </Badge>
  )
}

// ============ CONTENT COMPONENTS ============

// CSV Export Helper
function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Handle objects, nulls, and escape commas/quotes
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// Overview Content
function OverviewContent({
  stats,
  loading,
  recentActivity,
  onRefresh,
  onNavigate,
  onExport
}: {
  stats: DashboardStats
  loading: boolean
  recentActivity: ActivityItem[]
  onRefresh: () => void
  onNavigate: (section: SidebarSection) => void
  onExport: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Organizations"
          value={stats.totalOrgs}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          title="Open Requests"
          value={stats.openRequests}
          change={`${stats.claimedRequests} in progress`}
          changeType="neutral"
          icon={FileText}
          loading={loading}
        />
        <StatCard
          title="Total Donations"
          value={`$${stats.totalDonations.toLocaleString()}`}
          change={`$${stats.thisMonthDonations.toLocaleString()} this month`}
          changeType="positive"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Donors"
          value={stats.totalDonors}
          icon={Heart}
          loading={loading}
        />
        <StatCard
          title="Verified Users"
          value={stats.verifiedUsers}
          icon={Shield}
          loading={loading}
        />
        <StatCard
          title="Fulfilled Requests"
          value={stats.fulfilledRequests}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={FileText}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-[#737373]">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-[#ea580c]/10 rounded-full flex items-center justify-center">
                    {item.type === 'user_joined' && <Users className="h-4 w-4 text-[#ea580c]" />}
                    {item.type === 'request_created' && <FileText className="h-4 w-4 text-[#ea580c]" />}
                    {item.type === 'donation_made' && <Heart className="h-4 w-4 text-[#ea580c]" />}
                    {item.type === 'org_verified' && <Shield className="h-4 w-4 text-[#ea580c]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-[#737373]">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={() => onNavigate('users')}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={() => onNavigate('organizations')}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm">Verify Orgs</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={() => onNavigate('requests')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Review Requests</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={onExport}
            >
              <Download className="h-5 w-5" />
              <span className="text-sm">Export Data</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Users Management Content
function UsersContent({
  users,
  loading,
  onUpdateTier,
  onUpdateStatus,
  onRefresh
}: {
  users: UserProfile[]
  loading: boolean
  onUpdateTier: (userId: string, tier: OrgTier) => void
  onUpdateStatus: (userId: string, status: VerificationStatus) => void
  onRefresh: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const filteredUsers = users.filter(user => {
    const displayName = user.donor_profile?.display_name || user.organization?.name || user.id
    const email = user.donor_profile?.email || user.organization?.email || ''

    const matchesSearch = !searchQuery ||
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || user.user_type === filterType
    const matchesStatus = !filterStatus || user.verification_status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-[#737373]">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              {filterType ? USER_TYPE_LABELS[filterType as keyof typeof USER_TYPE_LABELS] : 'User Type'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType(null)}>All Types</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterType('donor')}>Donors</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('cbo')}>Organizations</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('admin')}>Admins</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {filterStatus ? VERIFICATION_STATUS_LABELS[filterStatus as keyof typeof VERIFICATION_STATUS_LABELS] : 'Status'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>All Statuses</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>{label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterType || filterStatus || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={() => {
            setFilterType(null)
            setFilterStatus(null)
            setSearchQuery('')
          }}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={() => {
                      if (selectedRows.size === filteredUsers.length) {
                        setSelectedRows(new Set())
                      } else {
                        setSelectedRows(new Set(filteredUsers.map(u => u.id)))
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#737373]">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = user.donor_profile?.display_name || user.organization?.name || 'Unknown'
                  const email = user.donor_profile?.email || user.organization?.email || ''

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(user.id)}
                          onCheckedChange={() => toggleRowSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.user_type === 'cbo' ? (
                              <Building2 className="h-4 w-4 text-gray-600" />
                            ) : user.user_type === 'admin' ? (
                              <Shield className="h-4 w-4 text-gray-600" />
                            ) : (
                              <User className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            <p className="text-xs text-[#737373]">{email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {USER_TYPE_LABELS[user.user_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <Badge className={
                                user.org_tier === 'large_org' ? 'bg-purple-100 text-purple-700' :
                                user.org_tier === 'small_org' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {ORG_TIER_LABELS[user.org_tier]}
                              </Badge>
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Tier</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(ORG_TIERS).map(([key, value]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => onUpdateTier(user.id, value)}
                              >
                                {user.org_tier === value && <Check className="h-4 w-4 mr-2" />}
                                {ORG_TIER_LABELS[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <VerificationBadge status={user.verification_status} />
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(VERIFICATION_STATUS).map(([key, value]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => onUpdateStatus(user.id, value)}
                              >
                                {user.verification_status === value && <Check className="h-4 w-4 mr-2" />}
                                {VERIFICATION_STATUS_LABELS[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-[#737373]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// Organizations Content
function OrganizationsContent({
  organizations,
  loading,
  onRefresh,
  onUpdateOrgStatus
}: {
  organizations: Organization[]
  loading: boolean
  onRefresh: () => void
  onUpdateOrgStatus?: (userId: string, status: VerificationStatus) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState<Partial<Organization>>({})
  const [saving, setSaving] = useState(false)

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !filterStatus || org.user_profile?.verification_status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org)
    setEditMode(false)
    setEditValues({})
  }

  const handleEditOrg = (org: Organization) => {
    setSelectedOrg(org)
    setEditMode(true)
    setEditValues({
      name: org.name,
      email: org.email,
      phone: org.phone || '',
      website: org.website || '',
      city: org.city || '',
      state: org.state || '',
      mission: org.mission || ''
    })
  }

  const handleSaveOrg = async () => {
    if (!selectedOrg) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...editValues,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id)

      if (error) throw error

      setSelectedOrg(null)
      setEditMode(false)
      onRefresh()
    } catch (err) {
      console.error('Error updating organization:', err)
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    setSelectedOrg(null)
    setEditMode(false)
    setEditValues({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Organizations</h2>
          <p className="text-sm text-[#737373]">{organizations.length} registered organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {filterStatus ? VERIFICATION_STATUS_LABELS[filterStatus as keyof typeof VERIFICATION_STATUS_LABELS] : 'Status'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>{label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredOrgs.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-[#737373]">No organizations found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map((org) => (
            <Card key={org.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{org.name}</h3>
                    <p className="text-xs text-[#737373]">
                      {org.city && org.state ? `${org.city}, ${org.state}` : 'Location not set'}
                    </p>
                  </div>
                </div>
                <VerificationBadge status={org.user_profile?.verification_status || 'unverified'} />
              </div>

              <p className="text-sm text-[#737373] mb-3 line-clamp-2">
                {org.mission || 'No mission statement'}
              </p>

              <div className="space-y-1 text-sm">
                {org.email && (
                  <div className="flex items-center gap-2 text-[#737373]">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{org.email}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-[#737373]">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{org.website}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewOrg(org)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditOrg(org)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Organization Detail/Edit Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  {selectedOrg.logo_url ? (
                    <img src={selectedOrg.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {editMode ? 'Edit Organization' : 'Organization Details'}
                  </h3>
                  <p className="text-sm text-[#737373]">{selectedOrg.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              {editMode ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Organization Name</label>
                    <Input
                      value={editValues.name || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        value={editValues.email || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <Input
                        value={editValues.phone || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <Input
                      value={editValues.website || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <Input
                        value={editValues.city || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <Input
                        value={editValues.state || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mission</label>
                    <Textarea
                      value={editValues.mission || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, mission: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={closeModal} disabled={saving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveOrg}
                      disabled={saving}
                      className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-[#737373]">Verification Status</p>
                      <div className="mt-1">
                        <VerificationBadge status={selectedOrg.user_profile?.verification_status || 'unverified'} />
                      </div>
                    </div>
                    {onUpdateOrgStatus && selectedOrg.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Status
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {Object.entries(VERIFICATION_STATUS).map(([key, value]) => (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => {
                                onUpdateOrgStatus(selectedOrg.user_id, value)
                                closeModal()
                              }}
                            >
                              {selectedOrg.user_profile?.verification_status === value && <Check className="h-4 w-4 mr-2" />}
                              {VERIFICATION_STATUS_LABELS[value]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#737373]">Email</p>
                      <p className="font-medium">{selectedOrg.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#737373]">Phone</p>
                      <p className="font-medium">{selectedOrg.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#737373]">Website</p>
                      {selectedOrg.website ? (
                        <a
                          href={selectedOrg.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#ea580c] hover:underline flex items-center gap-1"
                        >
                          {selectedOrg.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="font-medium">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-[#737373]">Location</p>
                      <p className="font-medium">
                        {selectedOrg.city && selectedOrg.state
                          ? `${selectedOrg.city}, ${selectedOrg.state}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Mission */}
                  <div>
                    <p className="text-sm text-[#737373] mb-2">Mission</p>
                    <p className="text-sm bg-gray-50 p-4 rounded-lg">
                      {selectedOrg.mission || 'No mission statement provided'}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-[#737373]">Created</p>
                      <p className="text-sm">{new Date(selectedOrg.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#737373]">Last Updated</p>
                      <p className="text-sm">{new Date(selectedOrg.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={closeModal}>
                      Close
                    </Button>
                    <Button
                      onClick={() => handleEditOrg(selectedOrg)}
                      className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Organization
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Requests Content
function RequestsContent({
  requests,
  loading,
  onRefresh,
  onUpdateStatus
}: {
  requests: Request[]
  loading: boolean
  onRefresh: () => void
  onUpdateStatus: (requestId: string, status: string) => void
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRequests = requests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status === activeTab
    const matchesSearch = !searchQuery ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesTab && matchesSearch
  })

  const statusCounts = {
    all: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    claimed: requests.filter(r => r.status === 'claimed').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    denied: requests.filter(r => r.status === 'denied').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Requests Management</h2>
          <p className="text-sm text-[#737373]">{requests.length} total requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="open">Open ({statusCounts.open})</TabsTrigger>
            <TabsTrigger value="claimed">Claimed ({statusCounts.claimed})</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled ({statusCounts.fulfilled})</TabsTrigger>
            <TabsTrigger value="denied">Denied ({statusCounts.denied})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search requests..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cause Area</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#737373]">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <span className="font-medium">{request.organization?.name || 'Unknown'}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="truncate block">{request.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.cause_area?.name || 'General'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(request.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={request.urgency} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-[#737373]">
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onUpdateStatus(request.id, 'open')}>
                            Mark as Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(request.id, 'fulfilled')}>
                            Mark as Fulfilled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(request.id, 'denied')} className="text-red-600">
                            Deny Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// Analytics Content
// Simple Bar Chart Component (no external library)
function SimpleBarChart({
  data,
  color = '#ea580c'
}: {
  data: { label: string; value: number }[]
  color?: string
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">{item.label}</span>
            <span className="font-medium">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Donut Chart Component (CSS-based)
function SimpleDonutChart({
  data,
  total
}: {
  data: { label: string; value: number; color: string }[]
  total: number
}) {
  let cumulativePercent = 0

  const getConicGradient = () => {
    if (total === 0) return 'conic-gradient(#e5e5e5 0% 100%)'

    const segments = data.map(item => {
      const percent = (item.value / total) * 100
      const start = cumulativePercent
      cumulativePercent += percent
      return `${item.color} ${start}% ${cumulativePercent}%`
    }).join(', ')

    return `conic-gradient(${segments})`
  }

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-32 h-32 rounded-full relative"
        style={{ background: getConicGradient() }}
      >
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold">{total}</p>
            <p className="text-xs text-[#737373]">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-[#737373]">{item.label}</span>
            <span className="text-sm font-medium ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsContent({
  stats,
  loading,
  userGrowthData,
  donationTrendsData
}: {
  stats: DashboardStats
  loading: boolean
  userGrowthData: MonthlyDataPoint[]
  donationTrendsData: MonthlyDataPoint[]
}) {
  // User type distribution data
  const userTypeData = [
    { label: 'Donors', value: stats.totalDonors, color: '#ea580c' },
    { label: 'Organizations', value: stats.totalOrgs, color: '#3b82f6' },
    { label: 'Admins', value: Math.max(stats.totalUsers - stats.totalDonors - stats.totalOrgs, 0), color: '#8b5cf6' },
  ]

  // Request status distribution for donut chart
  const requestStatusData = [
    { label: 'Open', value: stats.openRequests, color: '#3b82f6' },
    { label: 'Claimed', value: stats.claimedRequests, color: '#f59e0b' },
    { label: 'Fulfilled', value: stats.fulfilledRequests, color: '#10b981' },
  ]

  // Transform data for charts (real data from database)
  const userGrowthChartData = userGrowthData.map(d => ({
    label: d.month,
    value: d.count
  }))

  const donationTrendsChartData = donationTrendsData.map(d => ({
    label: d.month,
    value: d.amount || 0
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-sm text-[#737373]">Platform performance and insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} loading={loading} />
        <StatCard title="Total Donations" value={`$${stats.totalDonations.toLocaleString()}`} icon={DollarSign} loading={loading} />
        <StatCard title="Requests Fulfilled" value={stats.fulfilledRequests} icon={CheckCircle2} loading={loading} />
        <StatCard title="Organizations" value={stats.totalOrgs} icon={Building2} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">User Growth</h3>
            <Badge variant="outline" className="text-xs">Last 6 months (Real Data)</Badge>
          </div>
          {userGrowthChartData.length > 0 ? (
            <SimpleBarChart data={userGrowthChartData} color="#ea580c" />
          ) : (
            <div className="h-32 flex items-center justify-center text-[#737373] text-sm">
              No user data available yet
            </div>
          )}
        </Card>

        {/* User Type Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">User Distribution</h3>
          <SimpleDonutChart
            data={userTypeData}
            total={stats.totalUsers}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Trends */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Donation Trends ($)</h3>
            <Badge variant="outline" className="text-xs">Last 6 months (Real Data)</Badge>
          </div>
          {donationTrendsChartData.some(d => d.value > 0) ? (
            <SimpleBarChart data={donationTrendsChartData} color="#10b981" />
          ) : (
            <div className="h-32 flex items-center justify-center text-[#737373] text-sm">
              No donation data available yet
            </div>
          )}
        </Card>

        {/* Request Status */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Request Status</h3>
          <SimpleDonutChart
            data={requestStatusData}
            total={stats.totalRequests}
          />
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Platform Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-[#737373] mb-1">Verification Rate</p>
            <p className="text-2xl font-bold">
              {stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%
            </p>
            <p className="text-xs text-[#737373]">{stats.verifiedUsers} verified</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-[#737373] mb-1">Fulfillment Rate</p>
            <p className="text-2xl font-bold">
              {stats.totalRequests > 0 ? Math.round((stats.fulfilledRequests / stats.totalRequests) * 100) : 0}%
            </p>
            <p className="text-xs text-[#737373]">{stats.fulfilledRequests} fulfilled</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-[#737373] mb-1">Avg. Donation</p>
            <p className="text-2xl font-bold">
              ${stats.fulfilledRequests > 0 ? Math.round(stats.totalDonations / stats.fulfilledRequests).toLocaleString() : 0}
            </p>
            <p className="text-xs text-[#737373]">per request</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-[#737373] mb-1">This Month</p>
            <p className="text-2xl font-bold text-[#ea580c]">
              ${stats.thisMonthDonations.toLocaleString()}
            </p>
            <p className="text-xs text-[#737373]">in donations</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Reports Content
function ReportsContent({
  reports,
  loading,
  onRefresh,
  userId
}: {
  reports: CampaignReport[]
  loading: boolean
  onRefresh: () => void
  userId?: string
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewing' | 'resolved' | 'all'>('pending')
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const filteredReports = activeTab === 'all'
    ? reports
    : reports.filter(r => r.status === activeTab)

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      fraud: '🚨 Suspected Fraud',
      misleading: '⚠️ Misleading Info',
      inappropriate: '🚫 Inappropriate',
      spam: '📧 Spam',
      other: '❓ Other'
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-700">Reviewing</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-700">Dismissed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleUpdateStatus = async (reportId: string, newStatus: 'pending' | 'reviewing' | 'resolved' | 'dismissed') => {
    setUpdating(true)
    try {
      await updateCampaignReportStatus(reportId, newStatus, userId, adminNotes)
      setSelectedReport(null)
      setAdminNotes('')
      onRefresh()
    } catch (err) {
      console.error('Error updating report:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Campaign Reports</h2>
          <p className="text-sm text-[#737373]">Review and manage reported campaigns</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p>
              <p className="text-sm text-[#737373]">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.status === 'reviewing').length}</p>
              <p className="text-sm text-[#737373]">Reviewing</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.filter(r => r.status === 'resolved').length}</p>
              <p className="text-sm text-[#737373]">Resolved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Flag className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-sm text-[#737373]">Total Reports</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-[#0a0a0a] mb-2">No Reports</h3>
          <p className="text-sm text-[#737373]">
            {activeTab === 'pending' ? 'No pending reports to review' : 'No reports found'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className={`p-4 ${report.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(report.status)}
                    <span className="text-sm font-medium">{getReasonLabel(report.reason)}</span>
                    <span className="text-xs text-[#737373]">
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[#0a0a0a] mb-1">
                    Campaign: {(report as any).campaign?.title || report.campaign_id}
                  </p>

                  {report.description && (
                    <p className="text-sm text-[#737373] mt-2 p-3 bg-gray-50 rounded-lg">
                      "{report.description}"
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-[#737373]">
                    {report.reporter_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {report.reporter_email}
                      </span>
                    )}
                    {report.reporter_id && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User ID: {report.reporter_id.slice(0, 12)}...
                      </span>
                    )}
                  </div>

                  {report.admin_notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{report.admin_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {(report as any).campaign?.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/campaign/${(report as any).campaign.slug}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {report.status !== 'reviewing' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'reviewing')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as Reviewing
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'resolved' && (
                        <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                          <Check className="h-4 w-4 mr-2" />
                          Resolve Report
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'dismissed' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'dismissed')}>
                          <X className="h-4 w-4 mr-2" />
                          Dismiss Report
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'pending' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'pending')}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reopen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-lg mb-4">Resolve Report</h3>
            <p className="text-sm text-[#737373] mb-4">
              Add notes about how this report was resolved (optional)
            </p>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g., Campaign was reviewed and found to be legitimate..."
              rows={4}
              className="mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null)
                  setAdminNotes('')
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Resolve
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Settings Content
function SettingsContent({ userId }: { userId?: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Settings state
  const [platformName, setPlatformName] = useState('KC Digital Drive')
  const [supportEmail, setSupportEmail] = useState('support@kcdd.org')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

  // Notification settings
  const [notifications, setNotifications] = useState({
    newUsers: true,
    newRequests: true,
    donationsCompleted: true,
    weeklySummary: false
  })

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const settings = await fetchPlatformSettings()
        if (settings.platform_name) setPlatformName(settings.platform_name)
        if (settings.support_email) setSupportEmail(settings.support_email)
        if (typeof settings.maintenance_mode === 'boolean') setMaintenanceMode(settings.maintenance_mode)
        setNotifications({
          newUsers: settings.notify_new_users ?? true,
          newRequests: settings.notify_new_requests ?? true,
          donationsCompleted: settings.notify_donations_completed ?? true,
          weeklySummary: settings.notify_weekly_summary ?? false
        })
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Save a single setting to database
  const saveSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      await updatePlatformSettings({ [key]: value }, userId)
      setLastSaved(new Date())
      // Log the activity
      if (userId) {
        await logAdminActivity(userId, 'settings_updated', 'settings', key, { value })
      }
    } catch (err) {
      console.error('Error saving setting:', err)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field)
    setTempValue(currentValue)
  }

  const saveEdit = async () => {
    if (editingField === 'platformName') {
      setPlatformName(tempValue)
      await saveSetting('platform_name', tempValue)
    } else if (editingField === 'supportEmail') {
      setSupportEmail(tempValue)
      await saveSetting('support_email', tempValue)
    }
    setEditingField(null)
    setTempValue('')
  }

  const cancelEdit = () => {
    setEditingField(null)
    setTempValue('')
  }

  const toggleMaintenanceMode = async () => {
    const newValue = !maintenanceMode
    setMaintenanceMode(newValue)
    await saveSetting('maintenance_mode', newValue)
  }

  const toggleNotification = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key]
    setNotifications(prev => ({ ...prev, [key]: newValue }))

    // Map notification keys to database keys
    const dbKeyMap: Record<string, string> = {
      newUsers: 'notify_new_users',
      newRequests: 'notify_new_requests',
      donationsCompleted: 'notify_donations_completed',
      weeklySummary: 'notify_weekly_summary'
    }
    await saveSetting(dbKeyMap[key], newValue)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-sm text-[#737373]">Platform configuration and preferences</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-[#737373]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
        {!saving && lastSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Saved to database
          </div>
        )}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">General Settings</h3>
        <div className="space-y-4">
          {/* Platform Name */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {editingField === 'platformName' ? (
              <div className="flex-1 flex items-center gap-3">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-[#ea580c] hover:bg-[#ea580c]/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">Platform Name</p>
                  <p className="text-sm text-[#737373]">{platformName}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEditing('platformName', platformName)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </>
            )}
          </div>

          {/* Support Email */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {editingField === 'supportEmail' ? (
              <div className="flex-1 flex items-center gap-3">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  type="email"
                  className="max-w-xs"
                  autoFocus
                />
                <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-[#ea580c] hover:bg-[#ea580c]/90">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium">Support Email</p>
                  <p className="text-sm text-[#737373]">{supportEmail}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEditing('supportEmail', supportEmail)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </>
            )}
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-[#737373]">
                {maintenanceMode ? (
                  <span className="text-amber-600 font-medium">Currently enabled</span>
                ) : (
                  'Currently disabled'
                )}
              </p>
            </div>
            <Button
              variant={maintenanceMode ? 'default' : 'outline'}
              size="sm"
              onClick={toggleMaintenanceMode}
              disabled={saving}
              className={maintenanceMode ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              {maintenanceMode ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>New user registrations</span>
            <Checkbox
              checked={notifications.newUsers}
              onCheckedChange={() => toggleNotification('newUsers')}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>New donation requests</span>
            <Checkbox
              checked={notifications.newRequests}
              onCheckedChange={() => toggleNotification('newRequests')}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Donations completed</span>
            <Checkbox
              checked={notifications.donationsCompleted}
              onCheckedChange={() => toggleNotification('donationsCompleted')}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Weekly summary report</span>
            <Checkbox
              checked={notifications.weeklySummary}
              onCheckedChange={() => toggleNotification('weeklySummary')}
              disabled={saving}
            />
          </div>
        </div>
        <p className="text-xs text-[#737373] mt-4">
          All settings are saved to the database
        </p>
      </Card>
    </div>
  )
}

// Support Content
function SupportContent() {
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [selectedDocSection, setSelectedDocSection] = useState<string | null>(null)
  const [faqs, setFaqs] = useState<SupportFAQ[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(true)

  // Fetch FAQs from database on mount
  useEffect(() => {
    const loadFaqs = async () => {
      setLoadingFaqs(true)
      try {
        const data = await fetchSupportFAQs('all')
        setFaqs(data)
      } catch (error) {
        console.error('Error loading FAQs:', error)
      } finally {
        setLoadingFaqs(false)
      }
    }
    loadFaqs()
  }, [])

  // Documentation sections with real content
  const documentationSections = {
    'getting-started': {
      title: 'Getting Started Guide',
      icon: FileText,
      content: `
## Welcome to the Admin Dashboard

As an administrator, you have access to powerful tools to manage the KC DIME platform.

### Dashboard Overview
- **Overview**: Quick stats and recent activity
- **Users**: Manage all platform users
- **Organizations**: Verify and manage CBOs
- **Requests**: View and manage donation requests
- **Analytics**: Platform growth and trends
- **Reports**: Handle flagged campaigns
- **Settings**: Configure platform settings

### Quick Actions
From the Overview page, you can:
- Navigate directly to management sections
- Export platform data as CSV files
- View key metrics at a glance

### Getting Help
Use the Help Center for FAQs or email admin@kcdd.org for support.
      `
    },
    'user-management': {
      title: 'User Management',
      icon: Users,
      content: `
## Managing Users

### User Types
- **Donors**: Individual contributors who make donations
- **CBO**: Community-Based Organizations that create requests
- **Admin**: Platform administrators with full access

### User Actions
1. **View Users**: See all registered users in the Users section
2. **Change Tier**: Click on the tier badge to change user tier
3. **Update Status**: Modify verification status as needed
4. **Search**: Use the search bar to find specific users

### User Tiers
- **Free**: Basic access
- **Pro**: Enhanced features
- **Enterprise**: Full platform access

### Best Practices
- Regularly review new user registrations
- Verify CBO accounts promptly
- Monitor user activity for suspicious behavior
      `
    },
    'organization-verification': {
      title: 'Organization Verification',
      icon: Building2,
      content: `
## Verifying Organizations

### Verification Status Levels
- **Pending**: Awaiting initial review
- **Unverified**: Not yet verified
- **Verified**: Confirmed legitimate organization
- **Premium**: Top-tier verified status

### Verification Process
1. Review organization details in the Organizations section
2. Click "View" to see full organization information
3. Verify:
   - Organization name and mission
   - Contact information
   - Website and social media
   - EIN/Tax status (if applicable)
4. Update status using the dropdown menu

### Red Flags to Watch For
- Incomplete profile information
- Missing or invalid contact details
- Suspicious website or social media
- Reports from other users

### After Verification
- Verified organizations can create campaigns
- Premium organizations get featured placement
      `
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Support</h2>
        <p className="text-sm text-[#737373]">Admin help and resources</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card
          className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer hover:border-[#ea580c]"
          onClick={() => window.location.href = 'mailto:admin@kcdd.org?subject=Admin Support Request'}
        >
          <Mail className="h-8 w-8 mx-auto mb-3 text-[#ea580c]" />
          <h3 className="font-medium mb-1">Email Support</h3>
          <p className="text-sm text-[#737373]">admin@kcdd.org</p>
        </Card>
        <Card
          className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer hover:border-[#ea580c]"
          onClick={() => setShowDocsModal(true)}
        >
          <FileText className="h-8 w-8 mx-auto mb-3 text-[#ea580c]" />
          <h3 className="font-medium mb-1">Documentation</h3>
          <p className="text-sm text-[#737373]">View admin docs</p>
        </Card>
        <Card
          className="p-5 text-center hover:shadow-md transition-shadow cursor-pointer hover:border-[#ea580c]"
          onClick={() => setShowHelpModal(true)}
        >
          <HelpCircle className="h-8 w-8 mx-auto mb-3 text-[#ea580c]" />
          <h3 className="font-medium mb-1">Help Center</h3>
          <p className="text-sm text-[#737373]">FAQs and guides</p>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Tips</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-6 w-6 bg-[#ea580c]/10 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-[#ea580c]">1</span>
            </div>
            <div>
              <p className="text-sm font-medium">Managing Users</p>
              <p className="text-xs text-[#737373]">Change user roles and verification status from the Users section</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-6 w-6 bg-[#ea580c]/10 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-[#ea580c]">2</span>
            </div>
            <div>
              <p className="text-sm font-medium">Verifying Organizations</p>
              <p className="text-xs text-[#737373]">Review organization details and update their verification status</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-6 w-6 bg-[#ea580c]/10 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-[#ea580c]">3</span>
            </div>
            <div>
              <p className="text-sm font-medium">Handling Reports</p>
              <p className="text-xs text-[#737373]">Review flagged campaigns and take appropriate action</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {selectedDocSection
                  ? documentationSections[selectedDocSection as keyof typeof documentationSections].title
                  : 'Admin Documentation'
                }
              </h3>
              <div className="flex items-center gap-2">
                {selectedDocSection && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDocSection(null)}
                  >
                    Back to list
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => {
                  setShowDocsModal(false)
                  setSelectedDocSection(null)
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedDocSection ? (
              <div className="overflow-y-auto flex-1 prose prose-sm max-w-none">
                <div className="text-sm whitespace-pre-line">
                  {documentationSections[selectedDocSection as keyof typeof documentationSections].content
                    .split('\n')
                    .map((line, index) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h2>
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-base font-medium mt-3 mb-1">{line.replace('### ', '')}</h3>
                      }
                      if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*: (.+)/)
                        if (match) {
                          return (
                            <p key={index} className="ml-4 my-1">
                              <strong>{match[1]}</strong>: {match[2]}
                            </p>
                          )
                        }
                      }
                      if (line.startsWith('- ')) {
                        return <p key={index} className="ml-4 my-1">{line}</p>
                      }
                      if (line.match(/^\d+\. /)) {
                        return <p key={index} className="ml-4 my-1">{line}</p>
                      }
                      if (line.trim()) {
                        return <p key={index} className="my-1">{line}</p>
                      }
                      return null
                    })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(documentationSections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDocSection(key)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <section.icon className="h-5 w-5 text-[#ea580c]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-[#737373]">Click to read documentation</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-[#737373] -rotate-90" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Help Center Modal with Real FAQs */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Help Center</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-1">
              <div className="border-b pb-3">
                <p className="font-medium mb-2">Frequently Asked Questions</p>
                <p className="text-xs text-[#737373]">
                  {loadingFaqs ? 'Loading...' : `${faqs.length} questions from database`}
                </p>
              </div>
              <div className="space-y-3">
                {loadingFaqs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ea580c]" />
                  </div>
                ) : faqs.length === 0 ? (
                  <p className="text-sm text-[#737373] text-center py-4">
                    No FAQs available. Add them in the database.
                  </p>
                ) : (
                  faqs.map((faq) => (
                    <details key={faq.id} className="group">
                      <summary className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                        <span className="text-sm pr-4">{faq.question}</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 flex-shrink-0" />
                      </summary>
                      <p className="text-sm text-[#737373] p-2 pt-0">
                        {faq.answer}
                      </p>
                    </details>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function AdminDashboard() {
  const { user, isLoaded } = useUser()

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>('overview')

  // Data state
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [reports, setReports] = useState<CampaignReport[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userGrowthData, setUserGrowthData] = useState<MonthlyDataPoint[]>([])
  const [donationTrendsData, setDonationTrendsData] = useState<MonthlyDataPoint[]>([])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select(`
          *,
          donor_profile:donor_profiles(display_name, email),
          organization:organizations(name, email)
        `)
        .order('created_at', { ascending: false })

      // Fetch organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select(`
          *,
          user_profile:user_profiles(verification_status, org_tier)
        `)
        .order('created_at', { ascending: false })

      // Fetch requests
      const { data: requestsData } = await supabase
        .from('requests')
        .select(`
          *,
          organization:organizations(name),
          cause_area:cause_areas(name)
        `)
        .order('created_at', { ascending: false })

      // Fetch campaign reports
      const reportsData = await fetchCampaignReports()

      // Calculate stats
      const usersArray = usersData || []
      const requestsArray = requestsData || []

      // Calculate donations (fulfilled requests)
      const fulfilledRequests = requestsArray.filter((r: any) => r.status === 'fulfilled')
      const totalDonations = fulfilledRequests.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

      // This month donations
      const now = new Date()
      const thisMonthDonations = fulfilledRequests
        .filter((r: any) => {
          const date = new Date(r.fulfilled_at || r.created_at)
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })
        .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

      setStats({
        totalUsers: usersArray.length,
        totalDonors: usersArray.filter((u: any) => u.user_type === 'donor').length,
        totalOrgs: usersArray.filter((u: any) => u.user_type === 'cbo').length,
        verifiedUsers: usersArray.filter((u: any) => u.verification_status !== 'unverified').length,
        totalRequests: requestsArray.length,
        openRequests: requestsArray.filter((r: any) => r.status === 'open').length,
        claimedRequests: requestsArray.filter((r: any) => r.status === 'claimed').length,
        fulfilledRequests: fulfilledRequests.length,
        totalDonations,
        thisMonthDonations,
      })

      setUsers(usersData || [])
      setOrganizations(orgsData || [])
      setRequests(requestsData || [])
      setReports(reportsData || [])

      // Transform real user/request data into activity feed format
      const activity: ActivityItem[] = []
      usersArray.slice(0, 3).forEach((u: any, i: number) => {
        activity.push({
          id: `user-${i}`,
          type: 'user_joined',
          description: `${u.donor_profile?.display_name || u.organization?.name || 'New user'} joined the platform`,
          timestamp: u.created_at,
        })
      })
      requestsArray.slice(0, 2).forEach((r: any, i: number) => {
        activity.push({
          id: `request-${i}`,
          type: 'request_created',
          description: `${r.organization?.name || 'Organization'} created a new request`,
          timestamp: r.created_at,
        })
      })
      setRecentActivity(activity.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5))

      // Fetch chart data for analytics
      const [growthData, trendsData] = await Promise.all([
        fetchUserGrowthData(),
        fetchDonationTrendsData()
      ])
      setUserGrowthData(growthData)
      setDonationTrendsData(trendsData)

    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoaded) {
      fetchData()
    }
  }, [isLoaded, fetchData])

  // Update user tier
  const handleUpdateTier = async (userId: string, newTier: OrgTier) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ org_tier: newTier, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map(u => u.id === userId ? { ...u, org_tier: newTier } : u))
    } catch (err) {
      console.error('Error updating tier:', err)
    }
  }

  // Update verification status
  const handleUpdateStatus = async (userId: string, newStatus: VerificationStatus) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          verification_status: newStatus,
          is_vetted: newStatus !== VERIFICATION_STATUS.UNVERIFIED,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        verification_status: newStatus,
        is_vetted: newStatus !== VERIFICATION_STATUS.UNVERIFIED
      } : u))
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Update request status
  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      if (newStatus === 'fulfilled') {
        updates.fulfilled_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', requestId)

      if (error) throw error
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: newStatus as any } : r))
    } catch (err) {
      console.error('Error updating request status:', err)
    }
  }

  // Get header title
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'overview': return 'Dashboard Overview'
      case 'users': return 'User Management'
      case 'organizations': return 'Organizations'
      case 'requests': return 'Requests'
      case 'reports': return 'Campaign Reports'
      case 'analytics': return 'Analytics'
      case 'settings': return 'Settings'
      case 'support': return 'Support'
      default: return 'Admin Dashboard'
    }
  }

  // Render content
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewContent
            stats={stats}
            loading={loading}
            recentActivity={recentActivity}
            onRefresh={fetchData}
            onNavigate={setActiveSection}
            onExport={() => {
              // Export all data as separate CSV files
              if (users.length > 0) {
                exportToCSV(users.map(u => ({
                  id: u.id,
                  user_type: u.user_type,
                  org_tier: u.org_tier,
                  verification_status: u.verification_status,
                  is_vetted: u.is_vetted,
                  created_at: u.created_at,
                  display_name: u.donor_profile?.display_name || u.organization?.name || '',
                  email: u.donor_profile?.email || u.organization?.email || ''
                })), 'users_export')
              }
              if (organizations.length > 0) {
                exportToCSV(organizations.map(o => ({
                  id: o.id,
                  name: o.name,
                  email: o.email,
                  phone: o.phone,
                  city: o.city,
                  state: o.state,
                  mission: o.mission,
                  created_at: o.created_at
                })), 'organizations_export')
              }
              if (requests.length > 0) {
                exportToCSV(requests.map(r => ({
                  id: r.id,
                  organization: r.organization?.name || '',
                  description: r.description,
                  amount: r.amount,
                  status: r.status,
                  urgency: r.urgency,
                  cause_area: r.cause_area?.name || '',
                  created_at: r.created_at
                })), 'requests_export')
              }
            }}
          />
        )
      case 'users':
        return (
          <UsersContent
            users={users}
            loading={loading}
            onUpdateTier={handleUpdateTier}
            onUpdateStatus={handleUpdateStatus}
            onRefresh={fetchData}
          />
        )
      case 'organizations':
        return (
          <OrganizationsContent
            organizations={organizations}
            loading={loading}
            onRefresh={fetchData}
            onUpdateOrgStatus={(userId, status) => {
              handleUpdateStatus(userId, status)
              fetchData() // Refresh to update org list
            }}
          />
        )
      case 'requests':
        return (
          <RequestsContent
            requests={requests}
            loading={loading}
            onRefresh={fetchData}
            onUpdateStatus={handleUpdateRequestStatus}
          />
        )
      case 'reports':
        return (
          <ReportsContent
            reports={reports}
            loading={loading}
            onRefresh={fetchData}
            userId={user?.id}
          />
        )
      case 'analytics':
        return <AnalyticsContent stats={stats} loading={loading} userGrowthData={userGrowthData} donationTrendsData={donationTrendsData} />
      case 'settings':
        return <SettingsContent />
      case 'support':
        return <SupportContent />
      default:
        return null
    }
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 p-2 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <div className="p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#ea580c] rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="whitespace-nowrap">
                <span className="font-semibold text-[#0a0a0a]">KCDD Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-hidden">
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Overview</span>}
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'users'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Users</span>}
          </button>

          <button
            onClick={() => setActiveSection('organizations')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'organizations'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Organizations</span>}
          </button>

          <button
            onClick={() => setActiveSection('requests')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'requests'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Requests</span>}
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'reports'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Flag className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm flex items-center gap-2">
                Reports
                {reports.filter(r => r.status === 'pending').length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px]">
                    {reports.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'analytics'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Analytics</span>}
          </button>
        </nav>

        {/* Footer Navigation */}
        <div className="p-2 space-y-1 border-t border-gray-200 pt-2 overflow-hidden">
          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'settings'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={() => setActiveSection('support')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'support'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Support</span>}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#ea580c]/10 flex items-center justify-center text-[#ea580c] font-medium">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0a0a0a] truncate">
                  {user?.firstName || 'Admin'}
                </p>
                <p className="text-xs text-[#737373]">Administrator</p>
              </div>
            </div>
          </div>
        )}
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
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#ea580c]" />
              <span className="text-sm font-medium">{getHeaderTitle()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
