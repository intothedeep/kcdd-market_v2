/**
 * Dashboard Layout Component
 *
 * Layout for dashboard pages - no footer, content fills remaining viewport height
 */

import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { NoticeBanner } from '@/components/NoticeBanner'

export function DashboardLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      <NoticeBanner />
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
