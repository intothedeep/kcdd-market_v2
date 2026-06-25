/**
 * Mobile bottom-left navigation FAB (mobile-only, md:hidden).
 *
 * - Public pages (no dashboard sidenav): a single tap opens the Home
 *   bottom-sheet directly — there is only one menu, so no need to expand.
 * - Dashboard pages (/admin, /cbo, /donor): a speed-dial. The closed FAB
 *   shows an "open" (Menu) icon; tapping it flips the icon to an X and fans
 *   out two buttons stacked vertically:
 *     1. Home      → opens the global Home bottom-sheet (mobileNavStore)
 *     2. Dashboard → opens the dashboard sidenav Sheet (dashboardNavStore)
 *   Tapping the X (or picking an action, or navigating) collapses it again.
 */

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X, Home, LayoutDashboard } from 'lucide-react'
import { useMobileNavStore } from '@/stores/mobileNavStore'
import { useDashboardNavStore } from '@/stores/dashboardNavStore'

const fabBase =
  'flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl ring-2 ring-white transition-colors hover:bg-amber-600'

const actionPill =
  'flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-medium text-black shadow-lg ring-1 ring-black/5 transition-colors hover:bg-amber-50'

export function MobileNavFab() {
  const location = useLocation()
  const openHome = useMobileNavStore((s) => s.openNav)
  const openDashboard = useDashboardNavStore((s) => s.openNav)
  const [expanded, setExpanded] = useState(false)

  const onDashboard =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/cbo') ||
    location.pathname.startsWith('/donor')

  // Collapse the speed-dial whenever the route changes.
  useEffect(() => {
    setExpanded(false)
  }, [location.pathname])

  // Public pages — single tap opens the Home bottom-sheet, no expansion.
  if (!onDashboard) {
    return (
      <button
        type="button"
        onClick={openHome}
        aria-label="Open menu"
        className={`fixed bottom-6 left-4 z-40 md:hidden ${fabBase}`}
      >
        <Menu className="h-6 w-6" />
      </button>
    )
  }

  // Dashboard pages — speed-dial with Home + Dashboard.
  return (
    <div className="fixed bottom-6 left-4 z-40 flex flex-col items-start gap-3 md:hidden">
      {expanded && (
        <>
          <button
            type="button"
            onClick={() => {
              setExpanded(false)
              openHome()
            }}
            className={actionPill}
          >
            <Home className="h-5 w-5 text-amber-600" />
            Home menu
          </button>
          <button
            type="button"
            onClick={() => {
              setExpanded(false)
              openDashboard()
            }}
            className={actionPill}
          >
            <LayoutDashboard className="h-5 w-5 text-amber-600" />
            Dashboard menu
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Close menu' : 'Open menu'}
        aria-expanded={expanded}
        className={fabBase}
      >
        {expanded ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  )
}
