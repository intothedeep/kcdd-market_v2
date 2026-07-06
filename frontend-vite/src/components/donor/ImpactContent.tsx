/**
 * ImpactContent — the donor Impact Report, rendered as a dashboard section
 * (/donor/dashboard?section=impact). Self-contained: fetches its own impact
 * data. The surrounding sidebar/header come from the donor DashboardPage.
 */
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, MapPin, Award, Target, Loader2 } from 'lucide-react'
import { fetchDonorImpactData, type DonorImpactData } from '@/lib/supabase'

export function ImpactContent() {
  const { user, isLoaded } = useUser()
  const [impactData, setImpactData] = useState<DonorImpactData | null>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  const summary = impactData?.summary || {
    total_donated: 0,
    lives_impacted: 0,
    organizations_helped: 0,
    months_active: 0,
  }
  const topCauses = impactData?.topCauses || []
  const monthlyData = impactData?.monthlyData || []
  const recentImpact = impactData?.recentImpact || []

  return (
    <div>
      {/* Hero Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-700 p-6 text-white">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm opacity-80">Total Donated</span>
          </div>
          <p className="text-3xl font-bold">${summary.total_donated.toLocaleString()}</p>
        </Card>
        <Card className="border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Lives Impacted</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.lives_impacted}</p>
        </Card>
        <Card className="border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Organizations Helped</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.organizations_helped}</p>
        </Card>
        <Card className="border border-gray-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">Months Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.months_active}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Chart */}
        <Card className="border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Donation History</h2>
          {monthlyData.length > 0 ? (
            <div className="flex h-48 items-end gap-4">
              {monthlyData.map((item, i) => {
                const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1)
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t bg-gray-900"
                      style={{ height: `${(item.amount / maxAmount) * 100}%` }}
                    />
                    <span className="text-xs text-gray-500">{item.month}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-gray-500">
              <p>No donation history yet. Start donating to see your impact!</p>
            </div>
          )}
        </Card>

        {/* Top Causes */}
        <Card className="border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Causes</h2>
          {topCauses.length > 0 ? (
            <div className="space-y-4">
              {topCauses.map((cause, i) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-700">{cause.name}</span>
                    <span className="text-gray-500">${cause.amount}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gray-900"
                      style={{ width: `${cause.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">No causes supported yet.</p>
          )}
        </Card>
      </div>

      {/* Recent Impact */}
      <Card className="mt-6 border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Impact Stories</h2>
        {recentImpact.length > 0 ? (
          <div className="space-y-4">
            {recentImpact.map((item, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                  <Target className="h-5 w-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-sm text-gray-500">
                    {item.organization_name} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Fulfilled
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Target className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No impact stories yet.</p>
            <p className="mt-2 text-sm">Start donating to see your positive impact!</p>
          </div>
        )}
      </Card>
    </div>
  )
}
