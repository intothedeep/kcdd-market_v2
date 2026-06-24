/**
 * Admin Dashboard Page
 * Comprehensive admin panel with sidebar navigation
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
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
  Activity,
  Download,
  Mail,
  ExternalLink,
  User,
  LogIn,
  Plus,
  ClipboardList,
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
  fetchAdminActivity,
  logAdminActivity,
  type CampaignReport,
  type MonthlyDataPoint,
  type SupportFAQ,
} from '@/lib/supabase'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import {
  Flag,
  AlertTriangle,
  ShieldAlert,
  Ban,
  HelpCircle as HelpCircleIcon,
  type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { CampaignsAdminPage } from '@/pages/admin/CampaignsAdminPage'
import { AuditLogPage } from '@/pages/admin/AuditLogPage'
import { DonationsPage } from '@/pages/admin/DonationsPage'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  USER_TYPE_LABELS,
  ORG_TIER_LABELS,
  VERIFICATION_STATUS_LABELS,
  USER_TYPES,
  ORG_TIERS,
  VERIFICATION_STATUS,
  type UserType,
  type OrgTier,
  type VerificationStatus,
} from '@/constants/userTypes'

// ============ TYPES ============

interface DashboardStats {
  totalUsers: number
  totalDonors: number
  totalOrgs: number
  verifiedUsers: number
  totalRaised: number
  thisMonthDonations: number
  donationsToday: number
  donationsTodayCount: number
  donationsMonthCount: number
  totalCampaigns: number
  liveCampaigns: number
  pendingApprovals: number
  totalSupporters: number
}

interface UserProfile {
  id: string
  user_type: 'donor' | 'cbo' | 'admin'
  org_tier: OrgTier
  verification_status: VerificationStatus
  created_at: string
  updated_at: string
  // Captured from Clerk at user_profile upsert time so orphan rows (no
  // donor_profile / organization) still have a contact email and name.
  email?: string | null
  name?: string | null
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

interface ActivityItem {
  id: string
  type: 'user_joined' | 'campaign_action' | 'donation_made' | 'org_verified'
  description: string
  timestamp: string
  user?: string
}

// Humanize an admin_activity_log row into a short activity label.
function humanizeAction(action: string, entityType: string | null): string {
  const map: Record<string, string> = {
    campaign_approved: 'Campaign approved',
    campaign_rejected: 'Campaign rejected',
    campaign_restored: 'Campaign restored',
    user_verified: 'User verified',
    user_unverified: 'User set to unverified',
    user_deleted: 'User deleted',
    settings_updated: 'Settings updated',
  }
  if (map[action]) return map[action]
  const verb = action.replace(/_/g, ' ')
  const noun = entityType ? `${entityType} ` : ''
  return `${noun}${verb}`.trim().replace(/^\w/, (c) => c.toUpperCase())
}

// Sidebar sections
type SidebarSection =
  | 'overview'
  | 'users'
  | 'organizations'
  | 'reports'
  | 'pending'
  | 'audit'
  | 'donations'
  | 'settings'
  | 'support'

const SIDEBAR_SECTIONS: readonly SidebarSection[] = [
  'overview',
  'users',
  'organizations',
  'reports',
  'pending',
  'audit',
  'donations',
  'settings',
  'support',
]

const isSidebarSection = (value: string | null): value is SidebarSection =>
  value !== null && (SIDEBAR_SECTIONS as readonly string[]).includes(value)

// ============ EMPTY STATES ============

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalDonors: 0,
  totalOrgs: 0,
  verifiedUsers: 0,
  totalRaised: 0,
  thisMonthDonations: 0,
  donationsToday: 0,
  donationsTodayCount: 0,
  donationsMonthCount: 0,
  totalCampaigns: 0,
  liveCampaigns: 0,
  pendingApprovals: 0,
  totalSupporters: 0,
}

// ============ HELPER COMPONENTS ============

function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  loading = false,
  onClick,
}: {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  loading?: boolean
  onClick?: () => void
}) {
  const interactive = typeof onClick === 'function'
  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={
        interactive
          ? 'cursor-pointer p-5 transition-colors hover:border-[#ea580c] hover:bg-[#ea580c]/5'
          : 'p-5'
      }
    >
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
              <span
                className={
                  changeType === 'positive'
                    ? 'text-green-600'
                    : changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-[#737373]'
                }
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ea580c]/10">
          <Icon className="h-5 w-5 text-[#ea580c]" />
        </div>
      </div>
    </Card>
  )
}

// Renders an org logo with graceful fallback when Clearbit returns 404
// (common for smaller orgs that don't have a Clearbit profile).
function OrgLogo({ logoUrl, size = 'md' }: { logoUrl?: string | null; size?: 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const dims = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  const iconSize = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
  const showImage = logoUrl && !failed
  return (
    <div className={`flex ${dims} items-center justify-center rounded-lg bg-gray-200`}>
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          className={`${dims} rounded-lg object-cover`}
          onError={() => setFailed(true)}
        />
      ) : (
        <Building2 className={`${iconSize} text-gray-600`} />
      )}
    </div>
  )
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config: Record<string, { bg: string; text: string }> = {
    unverified: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    verified: { bg: 'bg-green-100', text: 'text-green-700' },
  }
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <Badge className={`${c.bg} ${c.text} border-0`}>{VERIFICATION_STATUS_LABELS[status]}</Badge>
  )
}

// ============ CONTENT COMPONENTS ============

// CSV Export Helper
function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Handle objects, nulls, and escape commas/quotes
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    ),
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
  onPendingClick,
  onExport,
  userGrowthData,
  donationTrendsData,
}: {
  stats: DashboardStats
  loading: boolean
  recentActivity: ActivityItem[]
  onRefresh: () => void
  onNavigate: (section: SidebarSection) => void
  onPendingClick: () => void
  onExport: () => void
  userGrowthData: MonthlyDataPoint[]
  donationTrendsData: MonthlyDataPoint[]
}) {
  const userGrowthChartData = userGrowthData.map((d) => ({ label: d.month, value: d.count }))
  const donationTrendsChartData = donationTrendsData.map((d) => ({
    label: d.month,
    value: d.amount || 0,
  }))
  return (
    <div className="space-y-6">
      {/* Stats Grid — fundraising + users */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Raised"
          value={`$${stats.totalRaised.toLocaleString()}`}
          change={`$${stats.thisMonthDonations.toLocaleString()} this month`}
          changeType="positive"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} loading={loading} />
        <StatCard
          title="Organizations"
          value={stats.totalOrgs}
          icon={Building2}
          loading={loading}
        />
        <StatCard title="Donors" value={stats.totalDonors} icon={Heart} loading={loading} />
      </div>

      {/* Donation totals — today + this month */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Donations Today"
          value={formatCurrency(stats.donationsToday)}
          change={`${stats.donationsTodayCount} today`}
          changeType="neutral"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Donations This Month"
          value={formatCurrency(stats.thisMonthDonations)}
          change={`${stats.donationsMonthCount} this month`}
          changeType="neutral"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Total Campaigns"
          value={stats.totalCampaigns}
          icon={ClipboardList}
          loading={loading}
        />
        <StatCard
          title="Live Campaigns"
          value={stats.liveCampaigns}
          icon={CheckCircle2}
          loading={loading}
        />
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          change="campaigns awaiting review"
          changeType="neutral"
          icon={Flag}
          loading={loading}
          onClick={onPendingClick}
        />
        <StatCard
          title="Total Supporters"
          value={stats.totalSupporters}
          icon={Heart}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">User Growth</h3>
            <Badge variant="outline" className="text-xs">
              Last 6 months
            </Badge>
          </div>
          {userGrowthChartData.length > 0 ? (
            <SimpleBarChart data={userGrowthChartData} color="#ea580c" />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-[#737373]">
              No user data available yet
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Donation Trends ($)</h3>
            <Badge variant="outline" className="text-xs">
              Last 6 months
            </Badge>
          </div>
          {donationTrendsChartData.some((d) => d.value > 0) ? (
            <SimpleBarChart data={donationTrendsChartData} color="#10b981" />
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-[#737373]">
              No donation data available yet
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-[#737373]">
              <Activity className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10">
                    {item.type === 'user_joined' && <Users className="h-4 w-4 text-[#ea580c]" />}
                    {item.type === 'campaign_action' && (
                      <ClipboardList className="h-4 w-4 text-[#ea580c]" />
                    )}
                    {item.type === 'donation_made' && <Heart className="h-4 w-4 text-[#ea580c]" />}
                    {item.type === 'org_verified' && <Shield className="h-4 w-4 text-[#ea580c]" />}
                  </div>
                  <div className="min-w-0 flex-1">
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
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={() => onNavigate('users')}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-[#ea580c] hover:text-[#ea580c]"
              onClick={() => onNavigate('organizations')}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm">Verify Orgs</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-[#ea580c] hover:text-[#ea580c]"
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
  onUpdateType,
  onDeleteUser,
  onImpersonate,
  onRefresh,
  onCreateUser,
}: {
  users: UserProfile[]
  loading: boolean
  onUpdateTier: (userId: string, tier: OrgTier) => void
  onUpdateStatus: (userId: string, status: VerificationStatus) => void
  onUpdateType: (userId: string, type: UserType) => void
  onDeleteUser: (userId: string) => Promise<void>
  onImpersonate: (userId: string, userType: UserType, displayName: string) => void
  onRefresh: () => void
  onCreateUser: (input: {
    user_type: UserType
    name: string
    email: string
    org_tier: OrgTier
    verification_status: VerificationStatus
  }) => Promise<void>
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userToDelete, setUserToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    user_type: 'donor' as UserType,
    name: '',
    email: '',
    org_tier: ORG_TIERS.INDIVIDUAL as OrgTier,
    verification_status: VERIFICATION_STATUS.UNVERIFIED as VerificationStatus,
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)

  const filteredUsers = users.filter((user) => {
    const displayName =
      user.donor_profile?.display_name || user.organization?.name || user.name || user.id
    const email = user.donor_profile?.email || user.organization?.email || user.email || ''

    const matchesSearch =
      !searchQuery ||
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filterType || user.user_type === filterType
    const matchesStatus = !filterStatus || user.verification_status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Type counts derived from the full loaded users array (not the filtered
  // view) so each tab badge shows the true total for that user_type.
  const typeCounts = {
    all: users.length,
    donor: users.filter((u) => u.user_type === 'donor').length,
    cbo: users.filter((u) => u.user_type === 'cbo').length,
    admin: users.filter((u) => u.user_type === 'admin').length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-[#737373]">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddUserOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add User
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              {filterStatus
                ? VERIFICATION_STATUS_LABELS[
                    filterStatus as keyof typeof VERIFICATION_STATUS_LABELS
                  ]
                : 'Status'}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>All Statuses</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterType || filterStatus || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterType(null)
              setFilterStatus(null)
              setSearchQuery('')
            }}
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* User-type tabs — filter the table by user_type. 'all' shows everyone. */}
      <Tabs
        value={filterType ?? 'all'}
        onValueChange={(v) => setFilterType(v === 'all' ? null : v)}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{typeCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="donor" className="gap-2">
            Donors
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{typeCounts.donor}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cbo" className="gap-2">
            CBOs
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{typeCounts.cbo}</Badge>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            Admins
            <Badge className="bg-gray-100 px-1.5 text-xs text-[#0a0a0a]">{typeCounts.admin}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
                        setSelectedRows(new Set(filteredUsers.map((u) => u.id)))
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
                  <TableCell colSpan={7} className="py-8 text-center text-[#737373]">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  // Orphaned profiles (no donor row, no org row) still need to
                  // be identifiable. Fall through: donor/org name → name
                  // captured from Clerk → id tail. Same for email — falls back
                  // to user_profiles.email (written at first upsert from
                  // Clerk's primaryEmailAddress) before giving up.
                  const idTail = user.id.length > 10 ? `…${user.id.slice(-8)}` : user.id
                  const displayName =
                    user.donor_profile?.display_name ||
                    user.organization?.name ||
                    user.name ||
                    `User ${idTail}`
                  const email =
                    user.donor_profile?.email ||
                    user.organization?.email ||
                    user.email ||
                    'no email on file'

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
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <Badge
                                className={
                                  user.user_type === 'admin'
                                    ? 'bg-red-100 text-red-700'
                                    : user.user_type === 'cbo'
                                      ? 'bg-teal-100 text-teal-700'
                                      : 'bg-blue-100 text-blue-700'
                                }
                              >
                                {USER_TYPE_LABELS[user.user_type]}
                              </Badge>
                              <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(USER_TYPES).map(([key, value]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => onUpdateType(user.id, value)}
                              >
                                {user.user_type === value && <Check className="mr-2 h-4 w-4" />}
                                {USER_TYPE_LABELS[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <Badge
                                className={
                                  user.org_tier === 'large_org'
                                    ? 'bg-purple-100 text-purple-700'
                                    : user.org_tier === 'small_org'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                }
                              >
                                {ORG_TIER_LABELS[user.org_tier]}
                              </Badge>
                              <ChevronDown className="ml-1 h-3 w-3" />
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
                                {user.org_tier === value && <Check className="mr-2 h-4 w-4" />}
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
                              <ChevronDown className="ml-1 h-3 w-3" />
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
                                {user.verification_status === value && (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
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
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onImpersonate(user.id, user.user_type, displayName)}
                            >
                              <LogIn className="mr-2 h-4 w-4" />
                              Impersonate
                            </DropdownMenuItem>
                            {email && (
                              <DropdownMenuItem
                                onClick={() => window.open(`mailto:${email}`, '_blank')}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setUserToDelete({ id: user.id, name: displayName })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                  {selectedUser.user_type === 'cbo' ? (
                    <Building2 className="h-6 w-6 text-gray-600" />
                  ) : selectedUser.user_type === 'admin' ? (
                    <Shield className="h-6 w-6 text-gray-600" />
                  ) : (
                    <User className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {selectedUser.donor_profile?.display_name ||
                      selectedUser.organization?.name ||
                      'Unknown'}
                  </p>
                  <p className="text-sm text-[#737373]">
                    {selectedUser.donor_profile?.email || selectedUser.organization?.email || ''}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-[#737373]">Type</p>
                  <Badge
                    className={
                      selectedUser.user_type === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : selectedUser.user_type === 'cbo'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {USER_TYPE_LABELS[selectedUser.user_type]}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-[#737373]">Tier</p>
                  <Badge
                    className={
                      selectedUser.org_tier === 'large_org'
                        ? 'bg-purple-100 text-purple-700'
                        : selectedUser.org_tier === 'small_org'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {ORG_TIER_LABELS[selectedUser.org_tier]}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-[#737373]">Status</p>
                  <VerificationBadge status={selectedUser.verification_status} />
                </div>
                <div>
                  <p className="font-medium text-[#737373]">Vetted</p>
                  <p>{VERIFICATION_STATUS_LABELS[selectedUser.verification_status]}</p>
                </div>
                <div>
                  <p className="font-medium text-[#737373]">Joined</p>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-[#737373]">Last Updated</p>
                  <p>{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-[#737373]">User ID</p>
                <p className="break-all font-mono text-xs">{selectedUser.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold">{userToDelete?.name}</span> and all their data? This
              includes their profile, organizations, campaigns, donations, and requests. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
              onClick={async (e) => {
                e.preventDefault()
                if (!userToDelete) return
                setDeleting(true)
                await onDeleteUser(userToDelete.id)
                setDeleting(false)
                setUserToDelete(null)
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog — admin manual user creation. No Clerk account is
          created; the synthetic user_profiles row is only useful for seeding
          test scenarios during user testing. */}
      <Dialog
        open={addUserOpen}
        onOpenChange={(open) => {
          setAddUserOpen(open)
          if (!open) {
            setAddUserError(null)
            setAddUserForm({
              user_type: 'donor',
              name: '',
              email: '',
              org_tier: ORG_TIERS.INDIVIDUAL,
              verification_status: VERIFICATION_STATUS.UNVERIFIED,
            })
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setAddUserError(null)
              if (!addUserForm.name.trim() && addUserForm.user_type !== 'admin') {
                setAddUserError('Name is required')
                return
              }
              if (!addUserForm.email.trim() && addUserForm.user_type !== 'admin') {
                setAddUserError('Email is required')
                return
              }
              setCreatingUser(true)
              try {
                await onCreateUser({
                  user_type: addUserForm.user_type,
                  name: addUserForm.name.trim(),
                  email: addUserForm.email.trim(),
                  org_tier:
                    addUserForm.user_type === 'cbo' ? addUserForm.org_tier : ORG_TIERS.INDIVIDUAL,
                  verification_status: addUserForm.verification_status,
                })
                setAddUserOpen(false)
              } catch (err) {
                setAddUserError(err instanceof Error ? err.message : 'Failed to create user')
              } finally {
                setCreatingUser(false)
              }
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium">User type</label>
              <div className="flex gap-2">
                {(['donor', 'cbo', 'admin'] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={addUserForm.user_type === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddUserForm((f) => ({ ...f, user_type: t }))}
                  >
                    {USER_TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {addUserForm.user_type === 'cbo' ? 'Organization name' : 'Display name'}
              </label>
              <Input
                value={addUserForm.name}
                onChange={(e) => setAddUserForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={addUserForm.user_type === 'cbo' ? 'Acme Community Org' : 'Jane Donor'}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={addUserForm.email}
                onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            {addUserForm.user_type === 'cbo' && (
              <div>
                <label className="mb-1 block text-sm font-medium">Tier</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORG_TIER_LABELS).map(([key, label]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={addUserForm.org_tier === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAddUserForm((f) => ({ ...f, org_tier: key as OrgTier }))}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Verification status</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={addUserForm.verification_status === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setAddUserForm((f) => ({
                        ...f,
                        verification_status: key as VerificationStatus,
                      }))
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {addUserError && <p className="text-sm text-red-600">{addUserError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddUserOpen(false)}
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create user'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Organizations Content
function OrganizationsContent({
  organizations,
  loading,
  onRefresh,
  onUpdateOrgStatus,
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

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      !searchQuery ||
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
      mission: org.mission || '',
    })
  }

  const handleSaveOrg = async () => {
    if (!selectedOrg) return

    setSaving(true)
    try {
      // Strip joined/virtual props that are not real columns on organizations
      const { user_profile: _up, ...orgColumns } = editValues
      const { error } = await supabase
        .from('organizations')
        .update({
          ...(orgColumns as Record<string, unknown>),
          updated_at: new Date().toISOString(),
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
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              {filterStatus
                ? VERIFICATION_STATUS_LABELS[
                    filterStatus as keyof typeof VERIFICATION_STATUS_LABELS
                  ]
                : 'Status'}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
              <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>
                {label}
              </DropdownMenuItem>
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
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-[#737373]">No organizations found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map((org) => (
            <Card key={org.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <OrgLogo logoUrl={org.logo_url} />
                  <div>
                    <h3 className="font-medium">{org.name}</h3>
                    <p className="text-xs text-[#737373]">
                      {org.city && org.state ? `${org.city}, ${org.state}` : 'Location not set'}
                    </p>
                  </div>
                </div>
                <VerificationBadge status={org.user_profile?.verification_status || 'unverified'} />
              </div>

              <p className="mb-3 line-clamp-2 text-sm text-[#737373]">
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

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewOrg(org)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditOrg(org)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Organization Detail/Edit Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <OrgLogo logoUrl={selectedOrg.logo_url} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold">
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
                    <label className="mb-1 block text-sm font-medium">Organization Name</label>
                    <Input
                      value={editValues.name || ''}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={editValues.email || ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Phone</label>
                      <Input
                        value={editValues.phone || ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Website</label>
                    <Input
                      value={editValues.website || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, website: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">City</label>
                      <Input
                        value={editValues.city || ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, city: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">State</label>
                      <Input
                        value={editValues.state || ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, state: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Mission</label>
                    <Textarea
                      value={editValues.mission || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, mission: e.target.value }))
                      }
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t pt-4">
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
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
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="text-sm text-[#737373]">Verification Status</p>
                      <div className="mt-1">
                        <VerificationBadge
                          status={selectedOrg.user_profile?.verification_status || 'unverified'}
                        />
                      </div>
                    </div>
                    {onUpdateOrgStatus && selectedOrg.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Status
                            <ChevronDown className="ml-1 h-4 w-4" />
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
                              {selectedOrg.user_profile?.verification_status === value && (
                                <Check className="mr-2 h-4 w-4" />
                              )}
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
                          className="flex items-center gap-1 font-medium text-[#ea580c] hover:underline"
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
                    <p className="mb-2 text-sm text-[#737373]">Mission</p>
                    <p className="rounded-lg bg-gray-50 p-4 text-sm">
                      {selectedOrg.mission || 'No mission statement provided'}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p className="text-sm text-[#737373]">Created</p>
                      <p className="text-sm">
                        {new Date(selectedOrg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#737373]">Last Updated</p>
                      <p className="text-sm">
                        {new Date(selectedOrg.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={closeModal}>
                      Close
                    </Button>
                    <Button
                      onClick={() => handleEditOrg(selectedOrg)}
                      className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                    >
                      <Edit className="mr-2 h-4 w-4" />
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

// Analytics Content
// Simple Bar Chart Component (no external library)
function SimpleBarChart({
  data,
  color = '#ea580c',
}: {
  data: { label: string; value: number }[]
  color?: string
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">{item.label}</span>
            <span className="font-medium">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Reports Content
function ReportsContent({
  reports,
  loading,
  onRefresh,
  userId,
}: {
  reports: CampaignReport[]
  loading: boolean
  onRefresh: () => void
  userId?: string
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewing' | 'resolved' | 'all'>(
    'pending'
  )
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const filteredReports =
    activeTab === 'all' ? reports : reports.filter((r) => r.status === activeTab)

  const reasonConfig: Record<string, { label: string; Icon: LucideIcon }> = {
    fraud: { label: 'Suspected Fraud', Icon: ShieldAlert },
    misleading: { label: 'Misleading Info', Icon: AlertTriangle },
    inappropriate: { label: 'Inappropriate', Icon: Ban },
    spam: { label: 'Spam', Icon: Mail },
    other: { label: 'Other', Icon: HelpCircleIcon },
  }

  const getReasonLabel = (reason: string) => {
    const config = reasonConfig[reason]
    if (!config) return reason
    const { label, Icon } = config
    return (
      <span className="inline-flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    )
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

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  ) => {
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
      <div className="flex h-64 items-center justify-center">
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
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.status === 'pending').length}
              </p>
              <p className="text-sm text-[#737373]">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.status === 'reviewing').length}
              </p>
              <p className="text-sm text-[#737373]">Reviewing</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reports.filter((r) => r.status === 'resolved').length}
              </p>
              <p className="text-sm text-[#737373]">Resolved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
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
            {reports.filter((r) => r.status === 'pending').length > 0 && (
              <Badge className="bg-amber-500 px-1.5 py-0 text-xs text-white">
                {reports.filter((r) => r.status === 'pending').length}
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
          <Flag className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 font-semibold text-[#0a0a0a]">No Reports</h3>
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
                  <div className="mb-2 flex items-center gap-3">
                    {getStatusBadge(report.status)}
                    <span className="text-sm font-medium">{getReasonLabel(report.reason)}</span>
                    <span className="text-xs text-[#737373]">
                      {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="mb-1 text-sm font-medium text-[#0a0a0a]">
                    Campaign: {(report as any).campaign?.title || report.campaign_id}
                  </p>

                  {report.description && (
                    <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-[#737373]">
                      "{report.description}"
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-[#737373]">
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
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="mb-1 text-xs font-medium text-blue-700">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{report.admin_notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex items-center gap-2">
                  {(report as any).campaign?.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`/campaign/${(report as any).campaign.slug}`, '_blank')
                      }
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {report.status !== 'reviewing' && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Mark as Reviewing
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'resolved' && (
                        <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                          <Check className="mr-2 h-4 w-4" />
                          Resolve Report
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'dismissed' && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Dismiss Report
                        </DropdownMenuItem>
                      )}
                      {report.status !== 'pending' && (
                        <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'pending')}>
                          <RefreshCw className="mr-2 h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">Resolve Report</h3>
            <p className="mb-4 text-sm text-[#737373]">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
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
    weeklySummary: false,
  })

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const settings = await fetchPlatformSettings()
        if (settings.platform_name) setPlatformName(settings.platform_name)
        if (settings.support_email) setSupportEmail(settings.support_email)
        if (typeof settings.maintenance_mode === 'boolean')
          setMaintenanceMode(settings.maintenance_mode)
        setNotifications({
          newUsers: settings.notify_new_users ?? true,
          newRequests: settings.notify_new_requests ?? true,
          donationsCompleted: settings.notify_donations_completed ?? true,
          weeklySummary: settings.notify_weekly_summary ?? false,
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
    setNotifications((prev) => ({ ...prev, [key]: newValue }))

    // Map notification keys to database keys
    const dbKeyMap: Record<string, string> = {
      newUsers: 'notify_new_users',
      newRequests: 'notify_new_requests',
      donationsCompleted: 'notify_donations_completed',
      weeklySummary: 'notify_weekly_summary',
    }
    await saveSetting(dbKeyMap[key], newValue)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
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
        <h3 className="mb-4 font-semibold">General Settings</h3>
        <div className="space-y-4">
          {/* Platform Name */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            {editingField === 'platformName' ? (
              <div className="flex flex-1 items-center gap-3">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('platformName', platformName)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </>
            )}
          </div>

          {/* Support Email */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            {editingField === 'supportEmail' ? (
              <div className="flex flex-1 items-center gap-3">
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  type="email"
                  className="max-w-xs"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-[#ea580c] hover:bg-[#ea580c]/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing('supportEmail', supportEmail)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              </>
            )}
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-[#737373]">
                {maintenanceMode ? (
                  <span className="font-medium text-amber-600">Currently enabled</span>
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
        <h3 className="mb-4 font-semibold">Admin Notifications</h3>
        <p className="mb-3 text-xs text-[#737373]">
          Toggles control which events trigger admin alerts. Delivery channel is in-app
          NotificationBell + Slack webhook (Slack configured at deployment).
        </p>
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
        <p className="mt-4 text-xs text-[#737373]">All settings are saved to the database</p>
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
      `,
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
      `,
    },
    'organization-verification': {
      title: 'Organization Verification',
      icon: Building2,
      content: `
## Verifying Organizations

### Verification Status Levels
- **Unverified**: Not yet verified
- **Verified**: Confirmed legitimate organization

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
      `,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Support</h2>
        <p className="text-sm text-[#737373]">Admin help and resources</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card
          className="cursor-pointer p-5 text-center transition-shadow hover:border-[#ea580c] hover:shadow-md"
          onClick={() =>
            (window.location.href = 'mailto:admin@kcdd.org?subject=Admin Support Request')
          }
        >
          <Mail className="mx-auto mb-3 h-8 w-8 text-[#ea580c]" />
          <h3 className="mb-1 font-medium">Email Support</h3>
          <p className="text-sm text-[#737373]">admin@kcdd.org</p>
        </Card>
        <Card
          className="cursor-pointer p-5 text-center transition-shadow hover:border-[#ea580c] hover:shadow-md"
          onClick={() => setShowDocsModal(true)}
        >
          <FileText className="mx-auto mb-3 h-8 w-8 text-[#ea580c]" />
          <h3 className="mb-1 font-medium">Documentation</h3>
          <p className="text-sm text-[#737373]">View admin docs</p>
        </Card>
        <Card
          className="cursor-pointer p-5 text-center transition-shadow hover:border-[#ea580c] hover:shadow-md"
          onClick={() => setShowHelpModal(true)}
        >
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-[#ea580c]" />
          <h3 className="mb-1 font-medium">Help Center</h3>
          <p className="text-sm text-[#737373]">FAQs and guides</p>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Quick Tips</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#ea580c]/10">
              <span className="text-sm font-medium text-[#ea580c]">1</span>
            </div>
            <div>
              <p className="text-sm font-medium">Managing Users</p>
              <p className="text-xs text-[#737373]">
                Change user roles and verification status from the Users section
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#ea580c]/10">
              <span className="text-sm font-medium text-[#ea580c]">2</span>
            </div>
            <div>
              <p className="text-sm font-medium">Verifying Organizations</p>
              <p className="text-xs text-[#737373]">
                Review organization details and update their verification status
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-[#ea580c]/10">
              <span className="text-sm font-medium text-[#ea580c]">3</span>
            </div>
            <div>
              <p className="text-sm font-medium">Handling Reports</p>
              <p className="text-xs text-[#737373]">
                Review flagged campaigns and take appropriate action
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Documentation Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedDocSection
                  ? documentationSections[selectedDocSection as keyof typeof documentationSections]
                      .title
                  : 'Admin Documentation'}
              </h3>
              <div className="flex items-center gap-2">
                {selectedDocSection && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDocSection(null)}>
                    Back to list
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDocsModal(false)
                    setSelectedDocSection(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedDocSection ? (
              <div className="prose prose-sm max-w-none flex-1 overflow-y-auto">
                <div className="whitespace-pre-line text-sm">
                  {documentationSections[
                    selectedDocSection as keyof typeof documentationSections
                  ].content
                    .split('\n')
                    .map((line, index) => {
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={index} className="mb-2 mt-4 text-lg font-semibold">
                            {line.replace('## ', '')}
                          </h2>
                        )
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={index} className="mb-1 mt-3 text-base font-medium">
                            {line.replace('### ', '')}
                          </h3>
                        )
                      }
                      if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*: (.+)/)
                        if (match) {
                          return (
                            <p key={index} className="my-1 ml-4">
                              <strong>{match[1]}</strong>: {match[2]}
                            </p>
                          )
                        }
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <p key={index} className="my-1 ml-4">
                            {line}
                          </p>
                        )
                      }
                      if (line.match(/^\d+\. /)) {
                        return (
                          <p key={index} className="my-1 ml-4">
                            {line}
                          </p>
                        )
                      }
                      if (line.trim()) {
                        return (
                          <p key={index} className="my-1">
                            {line}
                          </p>
                        )
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
                    className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
                  >
                    <section.icon className="h-5 w-5 text-[#ea580c]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-[#737373]">Click to read documentation</p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-[#737373]" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Help Center Modal with Real FAQs */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Help Center</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowHelpModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="border-b pb-3">
                <p className="mb-2 font-medium">Frequently Asked Questions</p>
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
                  <p className="py-4 text-center text-sm text-[#737373]">
                    No FAQs available. Add them in the database.
                  </p>
                ) : (
                  faqs.map((faq) => (
                    <details key={faq.id} className="group">
                      <summary className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                        <span className="pr-4 text-sm">{faq.question}</span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="p-2 pt-0 text-sm text-[#737373]">{faq.answer}</p>
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
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { startImpersonating } = useImpersonation()

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<SidebarSection>(() => {
    const param = searchParams.get('section')
    return isSidebarSection(param) ? param : 'overview'
  })

  // Sidebar tab <-> ?section= URL sync (preserves other params such as ?tab=).
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

  // Data state
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
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
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(
          `
          *,
          donor_profile:donor_profiles(display_name, email),
          organization:organizations(name, email)
        `
        )
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error loading users:', usersError)
      }

      // Fetch organizations, embedding the owner's verification_status +
      // org_tier so the Organizations tab can render its verification badge
      // and tier. The explicit FK hint (`!organizations_user_id_fkey`) is
      // required: without it PostgREST cannot disambiguate the join and the
      // embed errors out. (Both columns DO exist on user_profiles — see
      // 20260620000004_user_profiles_tier_status.sql.) Same pattern as
      // `getOrganizationProfile` in lib/supabase.ts.
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(
          '*, user_profile:user_profiles!organizations_user_id_fkey(verification_status, org_tier)'
        )
        .order('created_at', { ascending: false })

      if (orgsError) {
        console.error('Error loading organizations:', orgsError)
      }

      // Fetch campaign reports
      const reportsData = await fetchCampaignReports()

      // Fetch admin donation + campaign stats from the backend API.
      const donationTotals = await api
        .get<{
          totals?: {
            succeededToday?: { amount: number; count: number }
            succeededThisMonth?: { amount: number; count: number }
          }
        }>('/api/admin/donations', getToken)
        .catch((err) => {
          console.error('Error loading donation totals:', err)
          return { totals: undefined } as {
            totals?: {
              succeededToday?: { amount: number; count: number }
              succeededThisMonth?: { amount: number; count: number }
            }
          }
        })

      const campaignList = await api
        .get<{
          rows?: {
            status: string
            supporters_count: number
            amount_raised: number
          }[]
        }>('/api/admin/campaigns', getToken)
        .catch((err) => {
          console.error('Error loading campaigns:', err)
          return { rows: [] } as {
            rows?: { status: string; supporters_count: number; amount_raised: number }[]
          }
        })

      const campaignRows = campaignList.rows ?? []

      // Lifetime raised — SUM(campaigns.amount_raised). RLS exposes only live
      // campaigns to the admin JWT; acceptable for a lifetime-raised headline.
      const { data: raisedRows, error: raisedError } = await supabase
        .from('campaigns')
        .select('amount_raised')
      if (raisedError) {
        console.error('Error loading campaign totals:', raisedError)
      }
      const totalRaised = (raisedRows || []).reduce(
        (sum: number, c: any) => sum + Number(c.amount_raised || 0),
        0
      )

      // Calculate stats
      const usersArray = usersData || []

      // succeeded{Today,ThisMonth}.amount is in CENTS → dollars.
      const thisMonthDonations = (donationTotals.totals?.succeededThisMonth?.amount ?? 0) / 100
      const donationsToday = (donationTotals.totals?.succeededToday?.amount ?? 0) / 100
      const donationsTodayCount = donationTotals.totals?.succeededToday?.count ?? 0
      const donationsMonthCount = donationTotals.totals?.succeededThisMonth?.count ?? 0

      setStats({
        totalUsers: usersArray.length,
        totalDonors: usersArray.filter((u: any) => u.user_type === 'donor').length,
        totalOrgs: usersArray.filter((u: any) => u.user_type === 'cbo').length,
        verifiedUsers: usersArray.filter((u: any) => u.verification_status !== 'unverified').length,
        totalRaised,
        thisMonthDonations,
        donationsToday,
        donationsTodayCount,
        donationsMonthCount,
        totalCampaigns: campaignRows.length,
        liveCampaigns: campaignRows.filter((r) => r.status === 'live').length,
        pendingApprovals: campaignRows.filter(
          (r) => r.status === 'pending_new' || r.status === 'pending_edit'
        ).length,
        totalSupporters: campaignRows.reduce((sum, r) => sum + Number(r.supporters_count || 0), 0),
      })

      setUsers((usersData || []) as unknown as UserProfile[])
      setOrganizations((orgsData || []) as unknown as Organization[])
      setReports(reportsData || [])

      // Transform user-join + admin-action data into the activity feed.
      const activity: ActivityItem[] = []
      usersArray.slice(0, 3).forEach((u: any, i: number) => {
        activity.push({
          id: `user-${i}`,
          type: 'user_joined',
          description: `${u.donor_profile?.display_name || u.organization?.name || 'New user'} joined the platform`,
          timestamp: u.created_at,
        })
      })

      const adminActions = await fetchAdminActivity({ limit: 10 })
      adminActions.forEach((a) => {
        activity.push({
          id: `admin-${a.id}`,
          type: 'campaign_action',
          description: humanizeAction(a.action, a.entity_type),
          timestamp: a.created_at,
        })
      })

      setRecentActivity(
        activity
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
      )

      // Fetch chart data for the Overview charts.
      const [growthData, trendsData] = await Promise.all([
        fetchUserGrowthData(),
        fetchDonationTrendsData(getToken),
      ])
      setUserGrowthData(growthData)
      setDonationTrendsData(trendsData)
    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

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
      setUsers(users.map((u) => (u.id === userId ? { ...u, org_tier: newTier } : u)))
    } catch (err) {
      console.error('Error updating tier:', err)
    }
  }

  // Update user type
  const handleUpdateType = async (userId: string, newType: UserType) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ user_type: newType, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
      setUsers(users.map((u) => (u.id === userId ? { ...u, user_type: newType } : u)))
    } catch (err) {
      console.error('Error updating user type:', err)
    }
  }

  // Manually create a test user from the admin UI. There's no Clerk signup
  // behind these — id is a synthetic "manual_<uuid>" so it can't collide
  // with a real Clerk subject. Useful for seeding test scenarios mid-session.
  const handleCreateUser = async (input: {
    user_type: UserType
    name: string
    email: string
    org_tier: OrgTier
    verification_status: VerificationStatus
  }) => {
    const newId = `manual_${crypto.randomUUID()}`
    const now = new Date().toISOString()
    try {
      const { error: profileErr } = await supabase.from('user_profiles').insert({
        id: newId,
        user_type: input.user_type,
        org_tier: input.org_tier,
        verification_status: input.verification_status,
        email: input.email || null,
        name: input.name || null,
        created_at: now,
        updated_at: now,
      })
      if (profileErr) throw profileErr

      if (input.user_type === 'cbo') {
        const { error: orgErr } = await supabase.from('organizations').insert({
          id: crypto.randomUUID(),
          user_id: newId,
          name: input.name,
          email: input.email,
          mission: '',
          zipcode: '',
          created_at: now,
          updated_at: now,
        })
        if (orgErr) throw orgErr
      } else if (input.user_type === 'donor') {
        const { error: donorErr } = await supabase.from('donor_profiles').insert({
          id: crypto.randomUUID(),
          user_id: newId,
          display_name: input.name,
          email: input.email,
          created_at: now,
          updated_at: now,
        })
        if (donorErr) throw donorErr
      }
      // For 'admin' type, user_profiles row alone is enough.

      await fetchData()
    } catch (err) {
      console.error('Error creating user:', err)
      throw err
    }
  }

  // Delete user and all related data
  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete in order: dependent tables first, then user_profiles
      // Many-to-many / junction tables
      await supabase.from('donor_cause_areas').delete().eq('user_id', userId)
      await supabase.from('request_notifications').delete().eq('recipient_id', userId)

      // Get organization ID if user is a CBO
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (org) {
        // Delete org-related data
        await supabase.from('organization_cause_areas').delete().eq('organization_id', org.id)
        await supabase.from('organization_populations').delete().eq('organization_id', org.id)
        await supabase.from('organization_updates').delete().eq('organization_id', org.id)
        await supabase.from('organization_team_members').delete().eq('organization_id', org.id)
        await supabase.from('organization_documents').delete().eq('organization_id', org.id)
        // campaign_reports has no organization_id; it cascades from campaigns(id)
        // ON DELETE CASCADE when the org's campaigns are deleted below.

        // Delete campaigns and their children
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('organization_id', org.id)
        if (campaigns) {
          const campaignIds = campaigns.map((c) => c.id)
          if (campaignIds.length > 0) {
            await supabase.from('campaign_questions').delete().in('campaign_id', campaignIds)
            await supabase.from('campaigns').delete().in('id', campaignIds)
          }
        }

        // Delete requests and their children
        const { data: requests } = await supabase
          .from('requests')
          .select('id')
          .eq('organization_id', org.id)
        if (requests) {
          const requestIds = requests.map((r) => r.id)
          if (requestIds.length > 0) {
            await supabase
              .from('request_challenge_categories')
              .delete()
              .in('request_id', requestIds)
            await supabase.from('request_identity_categories').delete().in('request_id', requestIds)
            await supabase.from('request_history').delete().in('request_id', requestIds)
            await supabase.from('fulfillment_records').delete().in('request_id', requestIds)
            await supabase.from('payment_transactions').delete().in('request_id', requestIds)
            await supabase.from('requests').delete().in('id', requestIds)
          }
        }

        await supabase.from('payment_transactions').delete().eq('organization_id', org.id)
        await supabase.from('organizations').delete().eq('user_id', userId)
      }

      // Delete donor-related data
      await supabase.from('fulfillment_records').delete().eq('donor_id', userId)
      await supabase.from('donor_documents').delete().eq('user_id', userId)
      await supabase.from('donor_profiles').delete().eq('user_id', userId)

      // Nullify donor references on requests (don't delete the request)
      await supabase.from('requests').update({ donor_id: null }).eq('donor_id', userId)
      await supabase
        .from('request_history')
        .update({ changed_by_id: null })
        .eq('changed_by_id', userId)

      // Delete the user profile itself
      const { error } = await supabase.from('user_profiles').delete().eq('id', userId)
      if (error) throw error

      // W4-B / YELLOW Y1: audit log on successful hard-cascade user deletion.
      // Only logs after the user_profiles delete succeeds; if any earlier step
      // threw, we land in the catch below and skip the audit write.
      if (user?.id) {
        await logAdminActivity(user.id, 'user_deleted', 'user', userId, {
          deleted_by_clerk_id: user.id,
          cascaded_tables: [
            'donor_cause_areas',
            'request_notifications',
            'organization_*',
            'campaigns',
            'user_profiles',
          ],
        })
      }

      // Remove from local state
      setUsers(users.filter((u) => u.id !== userId))
      setOrganizations(organizations.filter((o) => o.user_id !== userId))
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  // Impersonate a user
  const handleImpersonate = (userId: string, userType: UserType, displayName: string) => {
    startImpersonating({ userId, userType, displayName })
    // Navigate to the appropriate dashboard
    if (userType === 'cbo') {
      navigate('/cbo/dashboard')
    } else if (userType === 'admin') {
      navigate('/admin')
    } else {
      navigate('/donor/dashboard')
    }
  }

  // Update verification status
  const handleUpdateStatus = async (userId: string, newStatus: VerificationStatus) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          verification_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                verification_status: newStatus,
              }
            : u
        )
      )
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Get header title
  const getHeaderTitle = () => {
    switch (activeSection) {
      case 'overview':
        return 'Dashboard Overview'
      case 'users':
        return 'User Management'
      case 'organizations':
        return 'Organizations'
      case 'reports':
        return 'Campaign Reports'
      case 'pending':
        return 'Campaigns'
      case 'audit':
        return 'Admin Audit Log'
      case 'donations':
        return 'Donations'
      case 'settings':
        return 'Settings'
      case 'support':
        return 'Support'
      default:
        return 'Admin Dashboard'
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
            userGrowthData={userGrowthData}
            donationTrendsData={donationTrendsData}
            onRefresh={fetchData}
            onNavigate={selectSection}
            onPendingClick={() => {
              // Land on the Campaigns section pre-filtered to pending-new
              // campaigns awaiting review (CampaignsAdminPage reads ?tab=).
              // Set both ?section= and ?tab= without wiping each other.
              setActiveSection('pending')
              setSearchParams(
                (prev) => {
                  prev.set('section', 'pending')
                  prev.set('tab', 'pending_new')
                  return prev
                },
                { replace: true }
              )
            }}
            onExport={() => {
              // Export all data as separate CSV files
              if (users.length > 0) {
                exportToCSV(
                  users.map((u) => ({
                    id: u.id,
                    user_type: u.user_type,
                    org_tier: u.org_tier,
                    verification_status: u.verification_status,
                    created_at: u.created_at,
                    display_name: u.donor_profile?.display_name || u.organization?.name || '',
                    email: u.donor_profile?.email || u.organization?.email || '',
                  })),
                  'users_export'
                )
              }
              if (organizations.length > 0) {
                exportToCSV(
                  organizations.map((o) => ({
                    id: o.id,
                    name: o.name,
                    email: o.email,
                    phone: o.phone,
                    city: o.city,
                    state: o.state,
                    mission: o.mission,
                    created_at: o.created_at,
                  })),
                  'organizations_export'
                )
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
            onUpdateType={handleUpdateType}
            onDeleteUser={handleDeleteUser}
            onImpersonate={handleImpersonate}
            onRefresh={fetchData}
            onCreateUser={handleCreateUser}
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
      case 'reports':
        return (
          <ReportsContent
            reports={reports}
            loading={loading}
            onRefresh={fetchData}
            userId={user?.id}
          />
        )
      case 'pending':
        return <CampaignsAdminPage embedded />
      case 'audit':
        return <AuditLogPage embedded />
      case 'donations':
        return <DonationsPage embedded />
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
    <div className="flex h-full bg-[#fafafa]">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col overflow-hidden border-r border-gray-200 bg-white p-2 transition-all duration-300`}
      >
        {/* Logo */}
        <div className="mb-2 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#ea580c]">
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
        <nav className="flex-1 space-y-1 overflow-hidden p-2">
          <button
            onClick={() => selectSection('overview')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'overview'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Overview</span>}
          </button>

          <button
            onClick={() => selectSection('users')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'users'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Users</span>}
          </button>

          <button
            onClick={() => selectSection('organizations')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'organizations'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Building2 className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Organizations</span>}
          </button>

          <button
            onClick={() => selectSection('pending')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'pending'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <ClipboardList className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Campaigns</span>}
          </button>

          <button
            onClick={() => selectSection('reports')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'reports'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Flag className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && (
              <span className="flex items-center gap-2 text-sm">
                Reports
                {reports.filter((r) => r.status === 'pending').length > 0 && (
                  <Badge className="h-5 min-w-[20px] bg-red-500 px-1.5 py-0 text-xs text-white">
                    {reports.filter((r) => r.status === 'pending').length}
                  </Badge>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => selectSection('donations')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'donations'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Donations</span>}
          </button>

          <button
            onClick={() => selectSection('audit')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'audit'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Activity className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Audit Log</span>}
          </button>
        </nav>

        {/* Footer Navigation */}
        <div className="space-y-1 overflow-hidden border-t border-gray-200 p-2 pt-2">
          <button
            onClick={() => selectSection('settings')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'settings'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Settings</span>}
          </button>

          <button
            onClick={() => selectSection('support')}
            className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
              activeSection === 'support'
                ? 'bg-[#ea580c] text-white'
                : 'text-[#0a0a0a] hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Support</span>}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ea580c]/10 font-medium text-[#ea580c]">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0a0a0a]">
                  {user?.firstName || 'Admin'}
                </p>
                <p className="text-xs text-[#737373]">Administrator</p>
              </div>
            </div>
          </div>
        )}
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
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#ea580c]" />
              <span className="text-sm font-medium">{getHeaderTitle()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">{renderContent()}</div>
        </div>
      </main>
    </div>
  )
}
