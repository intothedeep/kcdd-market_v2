/**
 * Home Page
 * 
 * Main landing page composed of semantic sections
 */

import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { StatsSection } from '@/components/home/StatsSection'
import { ContentBlockSection } from '@/components/home/ContentBlockSection'
import { SectionHeader } from '@/components/home/SectionHeader'
import { BentoGridSection } from '@/components/home/BentoGridSection'
import { FeatureCardsSection } from '@/components/home/FeatureCardsSection'
import { FeatureCardsWithImageSection } from '@/components/home/FeatureCardsWithImageSection'
import { TextWithImageSection } from '@/components/home/TextWithImageSection'
import { homeFeatures } from '@/data/homeFeatures'
import { homeContentBlock } from '@/data/homeContentBlock'
import { homeStats, homeStatsContent } from '@/data/homeStats'
import { homeSectionHeader } from '@/data/homeSectionHeader'
import { homeBentoGrid } from '@/data/homeBentoGrid'
import { homeFeatureCards } from '@/data/homeFeatureCards'
import { homeFeatureCardsWithImage } from '@/data/homeFeatureCardsWithImage'
import { homeTextWithImage } from '@/data/homeTextWithImage'

export function HomePage() {
  return (
    <main className="w-full">
      {/* Hero Section - Location: src/components/home/HeroSection.tsx */}
      <HeroSection />

      {/* Content Block Section - Location: src/components/home/ContentBlockSection.tsx */}
      <ContentBlockSection data={homeContentBlock} imagePosition="left" />

      {/* Section Header - Location: src/components/home/SectionHeader.tsx */}
      <SectionHeader data={homeSectionHeader} />

      {/* Bento Grid Section - Location: src/components/home/BentoGridSection.tsx */}
      <BentoGridSection cards={homeBentoGrid} />

      {/* Feature Cards Section - Location: src/components/home/FeatureCardsSection.tsx */}
      <FeatureCardsSection data={homeFeatureCards} />

      {/* Feature Cards With Image Section - Location: src/components/home/FeatureCardsWithImageSection.tsx */}
      <FeatureCardsWithImageSection data={homeFeatureCardsWithImage} />

      {/* Text With Image Section - Location: src/components/home/TextWithImageSection.tsx */}
      <TextWithImageSection data={homeTextWithImage} />
      
      {/* Features Section - Location: src/components/home/FeaturesSection.tsx */}
      <FeaturesSection features={homeFeatures} />

      {/* Stats Section - Location: src/components/home/StatsSection.tsx */}
      <StatsSection stats={homeStats} content={homeStatsContent} />

    </main>
  )
}
