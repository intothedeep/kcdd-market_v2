/**
 * Main Layout Component
 *
 * Provides consistent header/footer across pages
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { NoticeBanner } from '@/components/NoticeBanner'
import { Footer } from '@/components/Footer'
import { RouteFallback } from '@/components/RouteFallback'
import { footerData } from '@/data/footer'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NoticeBanner />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer data={footerData} />
    </div>
  )
}
