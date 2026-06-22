/**
 * Home Page
 *
 * Main landing page composed of semantic sections
 */

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { StatsSection, Stat, StatsContent } from '@/components/home/StatsSection'
import { ContentBlockSection } from '@/components/home/ContentBlockSection'
import { SectionHeader } from '@/components/home/SectionHeader'
import { BentoGridSection } from '@/components/home/BentoGridSection'
import { FeatureCardsSection } from '@/components/home/FeatureCardsSection'
import { FeatureCardsWithImageSection } from '@/components/home/FeatureCardsWithImageSection'
import { TextWithImageSection } from '@/components/home/TextWithImageSection'
import { homeFeatures } from '@/data/homeFeatures'
import { homeContentBlock } from '@/data/homeContentBlock'
import { homeSectionHeader } from '@/data/homeSectionHeader'
import { homeBentoGrid } from '@/data/homeBentoGrid'
import { homeFeatureCards } from '@/data/homeFeatureCards'
import { homeFeatureCardsWithImage } from '@/data/homeFeatureCardsWithImage'
import { homeTextWithImage } from '@/data/homeTextWithImage'
import { supabase } from '@/lib/supabase'

export function HomePage() {
  const [stats, setStats] = useState<Stat[]>([
    { value: 0, label: 'Requests Fulfilled', description: 'Technology needs met' },
    { value: 0, label: 'Organizations Served', description: 'CBOs supported' },
    { value: '$0', label: 'Total Raised', description: 'Community investment' },
  ])

  const statsContent: StatsContent = {
    heading: 'Making an Impact Together',
    description:
      'KC DIME connects donors with community-based organizations to bridge the digital divide in Kansas City. Every contribution helps provide technology access and digital literacy to those who need it most.',
    linkText: 'Browse open requests',
    linkHref: '/campaigns',
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch fulfilled requests (data + count locally for reliability)
        const { data: fulfilledRequests } = await supabase
          .from('requests')
          .select('id, amount')
          .eq('status', 'fulfilled')

        const fulfilledCount = fulfilledRequests?.length || 0
        const totalRaised =
          fulfilledRequests?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0

        // Fetch organizations count (data + count locally for reliability)
        const { data: orgsData } = await supabase.from('organizations').select('id')

        const orgsCount = orgsData?.length || 0

        setStats([
          {
            value: fulfilledCount,
            label: 'Requests Fulfilled',
            description: 'Technology needs met',
          },
          { value: orgsCount, label: 'Organizations Served', description: 'CBOs supported' },
          {
            value: `$${totalRaised.toLocaleString()}`,
            label: 'Total Raised',
            description: 'Community investment',
          },
        ])
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <main className="w-full">
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section - Moved up for visibility */}
      <StatsSection stats={stats} content={statsContent} />

      {/* Content Block Section */}
      <ContentBlockSection data={homeContentBlock} imagePosition="left" />

      {/* Section Header */}
      <SectionHeader data={homeSectionHeader} />

      {/* Bento Grid Section */}
      <BentoGridSection cards={homeBentoGrid} />

      {/* Feature Cards Section */}
      <FeatureCardsSection data={homeFeatureCards} />

      {/* Feature Cards With Image Section */}
      <FeatureCardsWithImageSection data={homeFeatureCardsWithImage} />

      {/* Text With Image Section */}
      <TextWithImageSection data={homeTextWithImage} />

      {/* Features Section */}
      <FeaturesSection features={homeFeatures} />
    </main>
  )
}
