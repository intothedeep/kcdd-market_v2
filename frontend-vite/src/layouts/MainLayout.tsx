/**
 * Main Layout Component
 * 
 * Provides consistent header/footer across pages
 */

import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { NoticeBanner } from '@/components/NoticeBanner'
import { Footer } from '@/components/Footer'
import { footerData } from '@/data/footer'

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NoticeBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer data={footerData} />
    </div>
  )
}

