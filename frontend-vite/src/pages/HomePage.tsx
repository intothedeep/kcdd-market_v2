/**
 * Home Page
 * 
 * Main landing page composed of semantic sections
 */

import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { StatsSection } from '@/components/home/StatsSection'
import { ContentBlockSection } from '@/components/home/ContentBlockSection'
import { homeFeatures } from '@/data/homeFeatures'

export function HomePage() {

  return (
    <main className="w-full">
      {/* Hero Section - Location: src/components/home/HeroSection.tsx */}
      <HeroSection />

      {/* Content Block Section - Location: src/components/home/ContentBlockSection.tsx */}
      <ContentBlockSection />
      
      {/* Features Section - Location: src/components/home/FeaturesSection.tsx */}
      <FeaturesSection features={homeFeatures} />

      {/* Stats Section - Location: src/components/home/StatsSection.tsx */}
      <StatsSection />

    </main>
  )
}
