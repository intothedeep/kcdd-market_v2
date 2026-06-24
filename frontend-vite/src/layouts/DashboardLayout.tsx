/**
 * Dashboard Layout Component
 *
 * Layout for dashboard pages - no footer, content fills remaining viewport height
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { NoticeBanner } from '@/components/NoticeBanner'
import { RouteFallback } from '@/components/RouteFallback'

export function DashboardLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      <NoticeBanner />
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
