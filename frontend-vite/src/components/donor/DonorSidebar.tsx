/**
 * DonorSidebar — shared responsive side-nav for the donor sub-pages
 * (Impact, Tax Documents, Support).
 *
 * - Desktop (md+): an in-flow rail, always visible.
 * - Mobile (<md): hidden; opened as an off-canvas Sheet driven by the shared
 *   `dashboardNavStore`, which the global bottom-left speed-dial FAB
 *   (MobileNavFab, "Dashboard menu") and each page's header menu button toggle.
 *
 * The donor DashboardPage keeps its own section-based sidebar; these secondary
 * pages share this route-based one.
 */
import { useUser } from '@clerk/clerk-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, LayoutDashboard, Heart, BarChart3, FileText, HelpCircle } from 'lucide-react'
import { Sidebar, SidebarGroup, SidebarItem, SidebarFooter } from '@/components/ui/sidebar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDashboardNavStore } from '@/stores/dashboardNavStore'

export function DonorSidebar() {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const open = useDashboardNavStore((s) => s.open)
  const setOpen = useDashboardNavStore((s) => s.setOpen)

  const isActive = (path: string) => location.pathname === path
  const go = (path: string) => {
    navigate(path)
    setOpen(false) // close the mobile Sheet after navigating
  }

  const body = (
    <>
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">KC Digital Drive</span>
        </div>
      </div>

      <SidebarGroup label="Menu">
        <SidebarItem
          icon={<LayoutDashboard className="h-4 w-4 text-gray-700" />}
          active={isActive('/donor/dashboard')}
          onClick={() => go('/donor/dashboard')}
        >
          Dashboard
        </SidebarItem>
        <SidebarItem
          icon={<Heart className="h-4 w-4 text-gray-700" />}
          active={isActive('/campaigns')}
          onClick={() => go('/campaigns')}
        >
          Browse Campaigns
        </SidebarItem>
        <SidebarItem
          icon={<BarChart3 className="h-4 w-4 text-gray-700" />}
          active={isActive('/donor/impact')}
          onClick={() => go('/donor/impact')}
        >
          Impact Report
        </SidebarItem>
        <SidebarItem
          icon={<FileText className="h-4 w-4 text-gray-700" />}
          active={isActive('/donor/documents')}
          onClick={() => go('/donor/documents')}
        >
          Tax Documents
        </SidebarItem>
      </SidebarGroup>

      <SidebarGroup label="Account">
        <SidebarItem
          icon={<Settings className="h-4 w-4 text-gray-700" />}
          onClick={() => go('/donor/dashboard')}
        >
          Settings
        </SidebarItem>
        <SidebarItem
          icon={<HelpCircle className="h-4 w-4 text-gray-700" />}
          active={isActive('/donor/support')}
          onClick={() => go('/donor/support')}
        >
          Support
        </SidebarItem>
      </SidebarGroup>

      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-700">
            {user?.firstName?.[0] || 'D'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.firstName || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user?.emailAddresses?.[0]?.emailAddress || ''}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </>
  )

  return (
    <>
      {/* Desktop rail — hidden on mobile */}
      <Sidebar className="hidden w-64 shrink-0 overflow-hidden border-r border-gray-200 bg-white p-0 md:flex">
        {body}
      </Sidebar>

      {/* Mobile off-canvas — opened via dashboardNavStore (MobileNavFab / header button) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-64 flex-col bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    </>
  )
}
