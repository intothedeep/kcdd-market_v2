/**
 * Navigation Bar Component
 * Themed with CSS variables - update colors in globals.css
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, LayoutDashboard, Heart, Building2, Shield } from 'lucide-react'
import { useUserType } from '@/hooks/useClerkSupabase'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Navbar() {
  const { isSignedIn } = useUser()
  const { userType, loading: userTypeLoading } = useUserType()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  // On dashboard routes, show the dashboard name in the brand spot;
  // on public routes keep the "KC DIME" brand. The link target stays home.
  const brandTitle = (() => {
    const path = location.pathname
    if (path.startsWith('/admin')) return 'Admin Dashboard'
    if (path.startsWith('/cbo/')) return 'Organization Dashboard'
    if (path.startsWith('/donor/')) return 'Donor Dashboard'
    return 'KC DIME'
  })()

  // Determine which dashboards the user has access to
  const getDashboardOptions = () => {
    if (userType === 'admin') {
      return [
        { label: 'Admin Dashboard', path: routes.admin.dashboard, icon: Shield },
        { label: 'Donor Dashboard', path: routes.donor.dashboard, icon: Heart },
        { label: 'CBO Dashboard', path: routes.cbo.dashboard, icon: Building2 },
      ]
    }
    if (userType === 'cbo') {
      return [{ label: 'Dashboard', path: routes.cbo.dashboard, icon: LayoutDashboard }]
    }
    // Default to donor
    return [{ label: 'Dashboard', path: routes.donor.dashboard, icon: LayoutDashboard }]
  }

  const dashboardOptions = getDashboardOptions()
  const hasMultipleDashboards = dashboardOptions.length > 1
  const defaultDashboard = dashboardOptions[0]?.path || routes.donor.dashboard

  return (
    <header className="w-full border-b bg-white">
      <div className="flex items-center px-5 py-5">
        {/* Left side - Navigation Links */}
        <div className="flex flex-1 items-center">
          <nav className="hidden items-center gap-[15px] md:flex">
            <Link
              to={routes.home}
              className={`text-sm transition-colors ${
                isActive(routes.home)
                  ? 'font-bold text-[hsl(var(--brand-primary))]'
                  : 'font-normal text-black hover:text-[hsl(var(--brand-primary))]'
              }`}
            >
              Homepage
            </Link>
            <Link
              to={routes.requests}
              className={`text-sm transition-colors ${
                isActive(routes.requests)
                  ? 'font-bold text-[hsl(var(--brand-primary))]'
                  : 'font-normal text-black hover:text-[hsl(var(--brand-primary))]'
              }`}
            >
              Browse Campaigns
            </Link>
            <Link
              to={routes.about}
              className={`text-sm transition-colors ${
                isActive(routes.about)
                  ? 'font-bold text-[hsl(var(--brand-primary))]'
                  : 'font-normal text-black hover:text-[hsl(var(--brand-primary))]'
              }`}
            >
              About Us
            </Link>
          </nav>
        </div>

        {/* Logo - Centered, hugs content */}
        <Link to={routes.home} className="flex-shrink-0">
          <h1
            className="whitespace-nowrap text-[30px] font-black text-[hsl(var(--brand-primary))]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {brandTitle}
          </h1>
        </Link>

        {/* Right side - Action Buttons */}
        <div className="flex flex-1 items-center justify-end gap-[15px]">
          {isSignedIn ? (
            <>
              {userTypeLoading ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] opacity-50"
                  disabled
                >
                  Dashboard
                </Button>
              ) : hasMultipleDashboards ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white"
                    >
                      Dashboard
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {dashboardOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.path}
                        onClick={() => navigate(option.path)}
                        className="cursor-pointer gap-2"
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to={defaultDashboard}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              {/* In-app notification inbox — mounted for every signed-in user.
                  The bell hides itself when the inbox is empty for donors; the
                  current notification kinds (campaign_*) only fan out to
                  admins and CBOs, so donors will simply see an empty inbox. */}
              <NotificationBell />
              <UserButton afterSignOutUrl={routes.home} />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full border-2 border-[hsl(var(--brand-primary))] px-4 text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white"
                >
                  Sign in
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
