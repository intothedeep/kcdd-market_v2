/**
 * Mobile Navigation Bottom-Sheet
 * Mobile-only (md:hidden). Mirrors the nav item set + auth logic of Navbar.tsx.
 * Desktop is unaffected — every element here is gated behind `md:hidden`.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react'
import {
  Menu,
  Home,
  Megaphone,
  Info,
  LogIn,
  LayoutDashboard,
  Heart,
  Building2,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { routes } from '@/config'
import { useUserType } from '@/hooks/useClerkSupabase'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

const rowClass =
  'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-black transition-colors hover:bg-[hsl(var(--brand-primary))]/10'

export function MobileNavSheet() {
  const [open, setOpen] = useState(false)
  const { isSignedIn } = useUser()
  const { userType } = useUserType()
  const navigate = useNavigate()

  // Public items — same targets as Navbar.tsx
  const publicItems: NavItem[] = [
    { label: 'Homepage', path: routes.home, icon: Home },
    { label: 'Browse Campaigns', path: routes.requests, icon: Megaphone },
    { label: 'About Us', path: routes.about, icon: Info },
  ]

  // Dashboard items — mirror Navbar.tsx getDashboardOptions()
  const getDashboardOptions = (): NavItem[] => {
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
    return [{ label: 'Dashboard', path: routes.donor.dashboard, icon: LayoutDashboard }]
  }

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Hamburger FAB — mobile only, bottom-left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-white shadow-lg transition-colors hover:bg-[hsl(var(--brand-primary))]/90 md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="md:hidden">
          {/* Grab handle */}
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-300" aria-hidden="true" />

          <SheetHeader className="px-4 pb-2 pt-3">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Site navigation and account options
            </SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 overflow-y-auto px-4 pb-4">
            {publicItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={rowClass}
              >
                <item.icon className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
                {item.label}
              </button>
            ))}

            {isSignedIn ? (
              <>
                <div className="my-2 border-t" />
                {getDashboardOptions().map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => go(item.path)}
                    className={rowClass}
                  >
                    <item.icon className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
                    {item.label}
                  </button>
                ))}
                <div className="mt-2 flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3">
                  <UserButton afterSignOutUrl={routes.home} />
                  <span className="text-base text-black">Manage account</span>
                </div>
              </>
            ) : (
              <>
                <div className="my-2 border-t" />
                <SignInButton mode="modal">
                  <button type="button" className={rowClass} onClick={() => setOpen(false)}>
                    <LogIn className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
                    Sign in / Sign up
                  </button>
                </SignInButton>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
