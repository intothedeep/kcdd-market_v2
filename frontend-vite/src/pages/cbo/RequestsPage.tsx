/**
 * CBO Requests Management Page
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Loader2, Clock, CheckCircle2, DollarSign, AlertCircle } from 'lucide-react'
import { fetchCBORequests, type RequestRecord } from '@/lib/supabase'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3 w-3" /> },
  claimed: {
    label: 'Claimed',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <DollarSign className="h-3 w-3" />,
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  denied: {
    label: 'Denied',
    color: 'bg-red-100 text-red-700',
    icon: <AlertCircle className="h-3 w-3" />,
  },
}

export function CBORequests() {
  const { user } = useUser()
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'claimed' | 'fulfilled'>('all')

  useEffect(() => {
    const loadRequests = async () => {
      if (!user?.id) return

      try {
        const data = await fetchCBORequests(user.id)
        setRequests(data)
      } catch (err) {
        console.error('Error loading requests:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [user?.id])

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-700',
      icon: null,
    }
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    }
    return (
      <Badge variant="outline" className={colors[urgency] || ''}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b5858]" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
          <p className="mt-1 text-[#737373]">Manage your technology and equipment requests</p>
        </div>
        <Link to={routes.cbo.newRequest}>
          <Button className="bg-[#1b5858] hover:bg-[#164444]">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-[#737373]">Total Requests</p>
          <p className="text-2xl font-bold">{requests.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#737373]">Open</p>
          <p className="text-2xl font-bold text-blue-600">
            {requests.filter((r) => r.status === 'open').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#737373]">Claimed</p>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter((r) => r.status === 'claimed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-[#737373]">Fulfilled</p>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter((r) => r.status === 'fulfilled').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="open">
            Open ({requests.filter((r) => r.status === 'open').length})
          </TabsTrigger>
          <TabsTrigger value="claimed">
            Claimed ({requests.filter((r) => r.status === 'claimed').length})
          </TabsTrigger>
          <TabsTrigger value="fulfilled">
            Fulfilled ({requests.filter((r) => r.status === 'fulfilled').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>View and manage your equipment requests</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-[#737373]" />
              <h3 className="mb-2 text-lg font-medium">No requests found</h3>
              <p className="mb-4 text-sm text-[#737373]">
                {filter === 'all'
                  ? 'Create your first request to get started!'
                  : `No ${filter} requests at the moment.`}
              </p>
              {filter === 'all' && (
                <Link to={routes.cbo.newRequest}>
                  <Button className="bg-[#1b5858] hover:bg-[#164444]">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="max-w-[300px]">
                      <span className="block truncate">{request.description}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(request.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-sm text-[#737373]">
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
