/**
 * CBO Dashboard Page
 * Based on Figma design with sidebar navigation, stats cards, and data table
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sidebar, SidebarGroup, SidebarItem, SidebarFooter } from '@/components/ui/sidebar'
import { 
  AlertTriangle, 
  Settings,
  LayoutDashboard,
  List,
  BarChart3,
  Folder,
  Users,
  FileText,
  HelpCircle,
  Search,
  PanelLeft,
  TrendingUp,
  Columns2,
  Plus,
  GripVertical,
  MoreVertical,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { OnboardingModal } from '@/components/OnboardingModal'
import { checkOnboardingStatus } from '@/lib/supabase'

// Sample data for the table
const tableData = [
  { id: 1, header: 'Cover Page', sectionType: 'Cover Page', status: 'in_process', target: 23, limit: 32, reviewer: 'Jamik Tashpulatov' },
  { id: 2, header: 'Table of contents', sectionType: 'Table of Contents', status: 'done', target: 45, limit: 8, reviewer: 'Jamik Tashpulatov' },
  { id: 3, header: 'Executive summary', sectionType: 'Technical Content', status: 'done', target: 45, limit: 45, reviewer: 'Jamik Tashpulatov' },
  { id: 4, header: 'Technical approach', sectionType: 'Cover Page', status: 'in_process', target: 45, limit: 45, reviewer: 'Eddie Lake' },
  { id: 5, header: 'Design', sectionType: 'Cover Page', status: 'in_process', target: 23, limit: 23, reviewer: 'Eddie Lake' },
  { id: 6, header: 'Capabilities', sectionType: 'Narrative', status: 'done', target: 23, limit: 23, reviewer: 'Eddie Lake' },
  { id: 7, header: 'Integration with existing systems', sectionType: 'Technical Content', status: 'in_process', target: 23, limit: 23, reviewer: 'Eddie Lake' },
  { id: 8, header: 'Innovation and Advantages', sectionType: 'Table of Contents', status: 'done', target: 8, limit: 45, reviewer: null },
  { id: 9, header: 'Overview of EMR\'s Innovative Solutions', sectionType: 'Narrative', status: 'done', target: 23, limit: 23, reviewer: null },
  { id: 10, header: 'Advanced Algorithms and Machine Learning', sectionType: 'Table of Contents', status: 'in_process', target: 89, limit: 23, reviewer: null },
]

interface StatCardProps {
  label: string
  value: string
  trend?: string
  description?: string
}

function StatCard({ label, value, trend, description }: StatCardProps) {
  return (
    <Card className="flex-1 p-6 bg-white border border-border rounded-xl shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-3xl font-semibold text-foreground">{value}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{trend || 'Something'}</span>
            <TrendingUp className="size-4" />
          </div>
          <span className="text-sm text-muted-foreground">{description || 'Something'}</span>
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <Badge variant="outline" className="gap-1 bg-white">
        <CheckCircle2 className="size-3 text-green-500" />
        Done
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 bg-white">
      <Loader2 className="size-3 animate-spin" />
      In Process
    </Badge>
  )
}

export function CBODashboard() {
  const { user, isLoaded } = useUser()
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [activeNav, setActiveNav] = useState('campaign')
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const totalPages = 7

  // Check onboarding status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return
      
      try {
        const status = await checkOnboardingStatus(user.id, 'cbo')
        setOnboardingComplete(status.onboarding_complete ?? false)
        
        // Auto-show modal if onboarding not complete
        if (!status.onboarding_complete) {
          setShowOnboardingModal(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setOnboardingComplete(false)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    if (isLoaded && user) {
      checkStatus()
    }
  }, [user, isLoaded])

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true)
    setShowOnboardingModal(false)
  }

  const toggleRow = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const toggleAllRows = () => {
    if (selectedRows.length === tableData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(tableData.map(row => row.id))
    }
  }

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar className="shrink-0">
        <div className="flex flex-col h-full">
          <SidebarGroup>
            <SidebarItem 
              icon={<LayoutDashboard className="size-4" />} 
              active={activeNav === 'campaign'}
              onClick={() => setActiveNav('campaign')}
            >
              My Campaign
            </SidebarItem>
            <SidebarItem 
              icon={<List className="size-4" />}
              active={activeNav === 'list'}
              onClick={() => setActiveNav('list')}
            >
              My Campaign
            </SidebarItem>
            <SidebarItem 
              icon={<BarChart3 className="size-4" />}
              active={activeNav === 'updates'}
              onClick={() => setActiveNav('updates')}
            >
              Updates & Proof
            </SidebarItem>
            <SidebarItem 
              icon={<Folder className="size-4" />}
              active={activeNav === 'payouts'}
              onClick={() => setActiveNav('payouts')}
            >
              Payouts / Transfers
            </SidebarItem>
            <SidebarItem 
              icon={<Users className="size-4" />}
              active={activeNav === 'verification'}
              onClick={() => setActiveNav('verification')}
            >
              Verification Status
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup label="Documents" className="mt-4">
            <SidebarItem 
              icon={<FileText className="size-4" />}
              active={activeNav === 'tax'}
              onClick={() => setActiveNav('tax')}
            >
              Tax Documents
            </SidebarItem>
          </SidebarGroup>

          <SidebarFooter>
            <SidebarGroup>
              <SidebarItem 
                icon={<Settings className="size-4" />}
                active={activeNav === 'account'}
                onClick={() => setActiveNav('account')}
              >
                Account Information
              </SidebarItem>
              <SidebarItem 
                icon={<HelpCircle className="size-4" />}
                active={activeNav === 'support'}
                onClick={() => setActiveNav('support')}
              >
                Support
              </SidebarItem>
              <SidebarItem 
                icon={<Search className="size-4" />}
                active={activeNav === 'search'}
                onClick={() => setActiveNav('search')}
              >
                Search
              </SidebarItem>
            </SidebarGroup>
          </SidebarFooter>
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pr-2 py-2 min-w-0">
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center h-12 px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <button className="size-7 flex items-center justify-center rounded-lg hover:bg-muted">
                <PanelLeft className="size-4" />
              </button>
              <div className="w-2 flex items-center justify-center">
                <div className="h-4 w-px bg-border" />
              </div>
              <span className="text-sm">Documents</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Onboarding Warning Banner - KEPT FROM ORIGINAL */}
            {onboardingComplete === false && !isCheckingStatus && (
              <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Complete Your Organization Profile</AlertTitle>
                <AlertDescription className="text-amber-700 flex items-center justify-between">
                  <span>
                    Your organization profile is incomplete. Please complete the setup to start receiving donations.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowOnboardingModal(true)}
                    className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
                  >
                    <Settings className="size-4 mr-2" />
                    Complete Setup
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="flex gap-4 mb-6">
              <StatCard label="Total Raised" value="$1,000.99" trend="12% increase" description="from last month" />
              <StatCard label="Active Requests" value="1,000.99" trend="5 new" description="this week" />
              <StatCard label="Fulfilled" value="1,000.99" trend="8 completed" description="this month" />
              <StatCard label="Success Rate" value="4.5%" trend="Up 2.5%" description="vs last quarter" />
            </div>

            {/* Data Table */}
            <div className="flex flex-col">
              {/* Table Filters */}
              <div className="flex items-center justify-between pb-6">
                <Tabs defaultValue="all" className="w-auto">
                  <TabsList className="bg-muted rounded-lg p-[3px] h-9">
                    <TabsTrigger value="all" className="text-sm px-2 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                      All Requests
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-sm px-2 py-1 rounded-md">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="active" className="text-sm px-2 py-1 rounded-md">
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-sm px-2 py-1 rounded-md">
                      Completed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Columns2 className="size-4" />
                    <span className="text-xs">Customize Columns</span>
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Plus className="size-4" />
                    <span className="text-xs">Add Section</span>
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="w-11 h-10 border-b border-border"></th>
                      <th className="w-14 h-10 border-b border-border px-3">
                        <Checkbox 
                          checked={selectedRows.length === tableData.length}
                          onCheckedChange={toggleAllRows}
                        />
                      </th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Header</th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Section Type</th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Status</th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Target</th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Limit</th>
                      <th className="h-10 border-b border-border px-2 text-left text-sm font-medium">Reviewer</th>
                      <th className="w-14 h-10 border-b border-border"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="h-[53px] px-2">
                          <button className="size-8 flex items-center justify-center rounded-lg hover:bg-muted">
                            <GripVertical className="size-4 text-muted-foreground" />
                          </button>
                        </td>
                        <td className="h-[53px] px-3">
                          <Checkbox 
                            checked={selectedRows.includes(row.id)}
                            onCheckedChange={() => toggleRow(row.id)}
                          />
                        </td>
                        <td className="h-[53px] px-2 text-sm truncate max-w-[200px]">{row.header}</td>
                        <td className="h-[53px] px-2">
                          <Badge variant="outline" className="bg-white font-semibold text-xs">
                            {row.sectionType}
                          </Badge>
                        </td>
                        <td className="h-[53px] px-2">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="h-[53px] px-2 text-sm">{row.target}</td>
                        <td className="h-[53px] px-2 text-sm">{row.limit}</td>
                        <td className="h-[53px] px-2 text-sm">
                          {row.reviewer ? (
                            <span>{row.reviewer}</span>
                          ) : (
                            <Button variant="outline" size="sm" className="h-9 gap-2 opacity-50" disabled>
                              Assign reviewer
                              <ChevronDown className="size-4" />
                            </Button>
                          )}
                        </td>
                        <td className="h-[53px] px-2">
                          <button className="size-9 flex items-center justify-center rounded-lg hover:bg-muted">
                            <MoreVertical className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} of {tableData.length * totalPages} row(s) selected.
                </span>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Rows per page</span>
                    <Button variant="outline" className="h-9 w-20 gap-2 justify-between">
                      <span>{rowsPerPage}</span>
                      <ChevronDown className="size-4 opacity-50" />
                    </Button>
                  </div>

                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="size-9"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="size-9"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="size-9"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="size-9"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleOnboardingComplete}
        userType="cbo"
      />
    </div>
  )
}
