/**
 * Navigation Bar Component
 * Themed with CSS variables - update colors in globals.css
 */

import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'
import { Circle } from 'lucide-react'

export function Navbar() {
  const { isSignedIn } = useUser()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

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
              <Link to={routes.donor.dashboard}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white"
                >
                  Dashboard
                </Button>
              </Link>
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
