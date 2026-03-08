/**
 * Admin Users Management Page
 *
 * Allows admins to view and update user tiers and verification status.
 * These fields are hidden from regular users.
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Search, Filter, ChevronDown, Check, X, Shield, Building2, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import {
  USER_TYPE_LABELS,
  ORG_TIER_LABELS,
  VERIFICATION_STATUS_LABELS,
  ORG_TIERS,
  VERIFICATION_STATUS,
  type OrgTier,
  type VerificationStatus,
} from '@/constants/userTypes'

interface UserProfile {
  id: string
  user_type: 'donor' | 'cbo' | 'admin'
  org_tier: OrgTier
  verification_status: VerificationStatus
  is_vetted: boolean
  vetting_note: string | null
  created_at: string
  updated_at: string
  // Joined data
  donor_profile?: {
    display_name: string
    email: string
  }
  organization?: {
    name: string
    email: string
  }
}

export function AdminUsersPage() {
  const { user } = useUser()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterTier, setFilterTier] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          donor_profile:donor_profiles(display_name, email),
          organization:organizations(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateUserTier = async (userId: string, newTier: OrgTier) => {
    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ org_tier: newTier, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(u =>
        u.id === userId ? { ...u, org_tier: newTier } : u
      ))
    } catch (err) {
      console.error('Error updating tier:', err)
    } finally {
      setUpdating(null)
    }
  }

  const updateVerificationStatus = async (userId: string, newStatus: VerificationStatus) => {
    setUpdating(userId)
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

      setUsers(users.map(u =>
        u.id === userId ? {
          ...u,
          verification_status: newStatus,
          is_vetted: newStatus !== VERIFICATION_STATUS.UNVERIFIED
        } : u
      ))
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdating(null)
    }
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const displayName = user.donor_profile?.display_name ||
      user.organization?.name ||
      user.id
    const email = user.donor_profile?.email || user.organization?.email || ''

    const matchesSearch = !searchQuery ||
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filter
    const matchesType = !filterType || user.user_type === filterType

    // Tier filter
    const matchesTier = !filterTier || user.org_tier === filterTier

    // Status filter
    const matchesStatus = !filterStatus || user.verification_status === filterStatus

    return matchesSearch && matchesType && matchesTier && matchesStatus
  })

  const getTierBadgeColor = (tier: OrgTier) => {
    switch (tier) {
      case ORG_TIERS.INDIVIDUAL: return 'bg-gray-100 text-gray-800'
      case ORG_TIERS.SMALL_ORG: return 'bg-blue-100 text-blue-800'
      case ORG_TIERS.LARGE_ORG: return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: VerificationStatus) => {
    switch (status) {
      case VERIFICATION_STATUS.UNVERIFIED: return 'bg-yellow-100 text-yellow-800'
      case VERIFICATION_STATUS.VERIFIED: return 'bg-green-100 text-green-800'
      case VERIFICATION_STATUS.PREMIUM: return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'donor': return <User className="w-4 h-4" />
      case 'cbo': return <Building2 className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">User Management</h1>
        <p className="text-[#737373] mt-1">
          Manage user tiers and verification status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Donors</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.user_type === 'donor').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organizations</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.user_type === 'cbo').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified</CardDescription>
            <CardTitle className="text-2xl">
              {users.filter(u => u.verification_status !== 'unverified').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {filterType ? USER_TYPE_LABELS[filterType as keyof typeof USER_TYPE_LABELS] : 'User Type'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType(null)}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterType('donor')}>
                  Donor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('cbo')}>
                  Recipient Organization
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('admin')}>
                  Administrator
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tier Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {filterTier ? ORG_TIER_LABELS[filterTier as keyof typeof ORG_TIER_LABELS] : 'Tier'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterTier(null)}>
                  All Tiers
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(ORG_TIER_LABELS).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => setFilterTier(key)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {filterStatus ? VERIFICATION_STATUS_LABELS[filterStatus as keyof typeof VERIFICATION_STATUS_LABELS] : 'Status'}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus(null)}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => setFilterStatus(key)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(filterType || filterTier || filterStatus) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterType(null)
                  setFilterTier(null)
                  setFilterStatus(null)
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#737373]">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#737373]">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userProfile) => {
                  const displayName = userProfile.donor_profile?.display_name ||
                    userProfile.organization?.name ||
                    'Unknown'
                  const email = userProfile.donor_profile?.email ||
                    userProfile.organization?.email ||
                    ''

                  return (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-[#737373]">{email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getUserTypeIcon(userProfile.user_type)}
                          <span>{USER_TYPE_LABELS[userProfile.user_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 h-auto p-1"
                              disabled={updating === userProfile.id}
                            >
                              <Badge className={getTierBadgeColor(userProfile.org_tier)}>
                                {ORG_TIER_LABELS[userProfile.org_tier]}
                              </Badge>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Tier</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(ORG_TIERS).map(([key, value]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => updateUserTier(userProfile.id, value)}
                                className="gap-2"
                              >
                                {userProfile.org_tier === value && (
                                  <Check className="w-4 h-4" />
                                )}
                                {ORG_TIER_LABELS[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 h-auto p-1"
                              disabled={updating === userProfile.id}
                            >
                              <Badge className={getStatusBadgeColor(userProfile.verification_status)}>
                                {VERIFICATION_STATUS_LABELS[userProfile.verification_status]}
                              </Badge>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(VERIFICATION_STATUS).map(([key, value]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => updateVerificationStatus(userProfile.id, value)}
                                className="gap-2"
                              >
                                {userProfile.verification_status === value && (
                                  <Check className="w-4 h-4" />
                                )}
                                {VERIFICATION_STATUS_LABELS[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-[#737373]">
                        {new Date(userProfile.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
