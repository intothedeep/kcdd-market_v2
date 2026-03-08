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
import { Circle, ChevronDown, LayoutDashboard, Heart, Building2, Shield } from 'lucide-react'
import { useUserType } from '@/hooks/useClerkSupabase'

export function Navbar() {
  const { isSignedIn } = useUser()
  const { userType, loading: userTypeLoading } = useUserType()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

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
      <div className="flex items-center justify-between px-5 py-5">
        {/* Logo - Fixed width for balance */}
        <div className="flex items-center gap-5 flex-1">
          <Link to={routes.home}>
            <h1 
              className="text-[30px] font-black text-[hsl(var(--brand-primary))] whitespace-nowrap"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              KC DIME
            </h1>
          </Link>
        </div>

        {/* Navigation Links - Centered */}
        <nav className="hidden md:flex items-center gap-[15px] flex-shrink-0">
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
            Browse Requests
          </Link>
          <Link
            to={routes.about}
            className={`text-sm transition-colors ${
              isActive('/contact')
                ? 'font-bold text-[hsl(var(--brand-primary))]'
                : 'font-normal text-black hover:text-[hsl(var(--brand-primary))]'
            }`}
          >
            Contact
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

        {/* Action Buttons - Fixed width for balance */}
        <div className="flex items-center gap-[15px] justify-end flex-1">
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
                      className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white gap-1"
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
              <UserButton afterSignOutUrl={routes.home} />
            </>
          ) : (
            <>
              <Link to={routes.cbo.dashboard}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white h-9 px-4"
                >
                  For Organizations
                </Button>
              </Link>
              <SignInButton mode="modal">
                <Button
                  size="sm"
                  className="rounded-full bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(var(--brand-primary))]/90 h-9 px-4 gap-2"
                >
                  <Circle className="h-4 w-4 fill-white" />
                  Login
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
