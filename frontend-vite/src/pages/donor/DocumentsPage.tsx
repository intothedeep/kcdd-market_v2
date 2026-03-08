/**
 * Donor Tax Documents Page
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
  Download,
  Calendar,
  Loader2,
  File,
  CheckCircle
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { fetchDonorDocuments, fetchDonorYearlySummary, type DonorDocument, type DonorYearlySummary } from '@/lib/supabase'

export function DonorDocuments() {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [documents, setDocuments] = useState<DonorDocument[]>([])
  const [yearlySummaries, setYearlySummaries] = useState<DonorYearlySummary[]>([])
  const [loading, setLoading] = useState(true)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        const [docsData, summaryData] = await Promise.all([
          fetchDonorDocuments(user.id),
          fetchDonorYearlySummary(user.id)
        ])
        setDocuments(docsData)
        setYearlySummaries(summaryData)
      } catch (error) {
        console.error('Error loading documents:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user?.id) {
      loadData()
    }
  }, [isLoaded, user?.id])

  const filteredDocuments = selectedYear === 'all' 
    ? documents 
    : documents.filter(d => d.year === selectedYear)

  // Get unique years from documents
  const availableYears = [...new Set(documents.map(d => d.year))].sort((a, b) => b - a)

  const handleDownload = (doc: DonorDocument) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    } else {
      alert(`Document "${doc.name}" is not available for download yet.`)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

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
                  <span className="text-gray-900">Tax Documents</span>
                </nav>
                <h1 className="text-xl font-semibold text-gray-900 mt-1">Tax Documents</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="px-3 py-2 border border-gray-200 rounded-md text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Info Card */}
          <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Tax Deduction Information</h3>
                <p className="text-sm text-blue-700 mt-1">
                  All donations made through KC Digital Drive are tax-deductible. Download your annual summary 
                  or quarterly receipts below for your tax records.
                </p>
              </div>
            </div>
          </Card>

          {/* Documents List */}
          <Card className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Available Documents</h2>
              <p className="text-sm text-gray-500">Download your donation receipts and tax documents</p>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents available yet.</p>
                <p className="text-sm mt-2">Documents will appear here once you make your first donation.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <File className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{doc.type}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{doc.size}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {doc.status === 'ready' ? 'Ready' : doc.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Summary Cards */}
          {yearlySummaries.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {yearlySummaries.slice(0, 2).map((summary) => (
                <Card key={summary.year} className="p-6 bg-white border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{summary.year} Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Donations</span>
                      <span className="font-semibold text-gray-900">${summary.total_donations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Number of Donations</span>
                      <span className="font-semibold text-gray-900">{summary.donation_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax Deductible Amount</span>
                      <span className="font-semibold text-emerald-600">${summary.tax_deductible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
