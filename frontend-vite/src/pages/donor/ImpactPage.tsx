/**
 * Donor Impact Report Page
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sidebar, SidebarGroup, SidebarItem, SidebarFooter } from '@/components/ui/sidebar'
import { 
  Settings,
  LayoutDashboard,
  Heart,
  BarChart3,
  FileText,
  HelpCircle,
  PanelLeft,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Award,
  Target,
  Loader2
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { fetchDonorImpactData, type DonorImpactData } from '@/lib/supabase'

export function DonorImpact() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [impactData, setImpactData] = useState<DonorImpactData | null>(null)
  const [loading, setLoading] = useState(true)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        const data = await fetchDonorImpactData(user.id)
        setImpactData(data)
      } catch (error) {
        console.error('Error loading impact data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user?.id) {
      loadData()
    }
  }, [isLoaded, user?.id])

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  // Handle case where no impact data exists yet
  const summary = impactData?.summary || { total_donated: 0, lives_impacted: 0, organizations_helped: 0, months_active: 0 }
  const topCauses = impactData?.topCauses || []
  const monthlyData = impactData?.monthlyData || []
  const recentImpact = impactData?.recentImpact || []

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 border-r border-gray-200 bg-white overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && <span className="font-semibold text-gray-900">KC Digital Drive</span>}
          </div>
        </div>
        
        <SidebarGroup label={sidebarOpen ? "Menu" : undefined}>
          <SidebarItem 
            icon={<LayoutDashboard className="h-4 w-4 text-gray-700" />} 
            active={isActive('/donor/dashboard')}
            onClick={() => navigate('/donor/dashboard')}
          >
            {sidebarOpen && "Dashboard"}
          </SidebarItem>
          <SidebarItem 
            icon={<Heart className="h-4 w-4 text-gray-700" />}
            active={isActive('/requests')}
            onClick={() => navigate('/requests')}
          >
            {sidebarOpen && "Browse Requests"}
          </SidebarItem>
          <SidebarItem 
            icon={<BarChart3 className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/impact')}
            onClick={() => navigate('/donor/impact')}
          >
            {sidebarOpen && "Impact Report"}
          </SidebarItem>
          <SidebarItem 
            icon={<FileText className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/documents')}
            onClick={() => navigate('/donor/documents')}
          >
            {sidebarOpen && "Tax Documents"}
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup label={sidebarOpen ? "Account" : undefined}>
          <SidebarItem 
            icon={<Settings className="h-4 w-4 text-gray-700" />}
            onClick={() => navigate('/donor/dashboard')}
          >
            {sidebarOpen && "Settings"}
          </SidebarItem>
          <SidebarItem 
            icon={<HelpCircle className="h-4 w-4 text-gray-700" />}
            active={isActive('/donor/support')}
            onClick={() => navigate('/donor/support')}
          >
            {sidebarOpen && "Support"}
          </SidebarItem>
        </SidebarGroup>

        <SidebarFooter>
          <div className={`flex items-center gap-3 p-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
              {user?.firstName?.[0] || 'D'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8 p-0">
                <PanelLeft className="h-4 w-4" />
              </Button>
              <div>
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                  <Link to="/" className="hover:text-gray-700">Home</Link>
                  <span>/</span>
                  <Link to="/donor/dashboard" className="hover:text-gray-700">Dashboard</Link>
                  <span>/</span>
                  <span className="text-gray-900">Impact Report</span>
                </nav>
                <h1 className="text-xl font-semibold text-gray-900 mt-1">Your Impact</h1>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 6 months
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-700 text-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm opacity-80">Total Donated</span>
              </div>
              <p className="text-3xl font-bold">${summary.total_donated.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Lives Impacted</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.lives_impacted}</p>
            </Card>
            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Organizations Helped</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.organizations_helped}</p>
            </Card>
            <Card className="p-6 bg-white border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Months Active</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.months_active}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Chart */}
            <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Donation History</h2>
              {monthlyData.length > 0 ? (
                <div className="flex items-end gap-4 h-48">
                  {monthlyData.map((item, i) => {
                    const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gray-900 rounded-t"
                          style={{ height: `${(item.amount / maxAmount) * 100}%` }}
                        />
                        <span className="text-xs text-gray-500">{item.month}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  <p>No donation history yet. Start donating to see your impact!</p>
                </div>
              )}
            </Card>

            {/* Top Causes */}
            <Card className="p-6 bg-white border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Causes</h2>
              {topCauses.length > 0 ? (
                <div className="space-y-4">
                  {topCauses.map((cause, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{cause.name}</span>
                        <span className="text-gray-500">${cause.amount}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${cause.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No causes supported yet.</p>
              )}
            </Card>
          </div>

          {/* Recent Impact */}
          <Card className="mt-6 p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Impact Stories</h2>
            {recentImpact.length > 0 ? (
              <div className="space-y-4">
                {recentImpact.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-sm text-gray-500">{item.organization_name} • {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Fulfilled</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No impact stories yet.</p>
                <p className="text-sm mt-2">Start donating to see your positive impact!</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  )
}
