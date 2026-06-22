import type { BentoCardData } from '@/components/home/BentoGridSection'

export const homeBentoGrid: [BentoCardData, BentoCardData, BentoCardData, BentoCardData] = [
  {
    title: 'Built for Kansas City',
    description:
      'Every device we ship stays in the metro. Partner pantries, classrooms, shelters, libraries — and individuals applying through our direct intake — are all within a 30-minute drive of our warehouse.',
    linkText: 'See Local Partners',
    linkHref: '/campaigns',
    backgroundColor: '#1b5858',
    textColor: 'light',
  },
  {
    title: 'Every Device Tracked',
    description:
      'A donation that becomes a Chromebook becomes a serial number becomes a kid finishing their homework. We follow each device through delivery and report back at 30 and 90 days.',
    linkText: 'How Tracking Works',
    linkHref: '/about#how-it-works',
    backgroundColor: '#c4e5c1',
    textColor: 'dark',
  },
  {
    title: '100% Tax-Deductible',
    description:
      'KC DIME is a 501(c)(3). Every gift generates an automated IRS-compliant receipt the moment your payment clears. Download annual summaries from your donor dashboard.',
    linkText: 'Tax Information',
    linkHref: '/about#tax-benefits',
    backgroundColor: '#c4e5c1',
    textColor: 'dark',
  },
  {
    title: 'Donate Money or Devices',
    description:
      "Cash works. So does the old laptop in your closet. We're a Microsoft Authorized Refurbisher partner — your device gets wiped, re-imaged, and re-deployed within 30 days.",
    linkText: 'Get Started Today',
    linkHref: '/sign-up',
    backgroundColor: '#103032',
    textColor: 'light',
    // Real Unsplash photo: students gathered around a laptop together.
    backgroundImageUrl:
      'https://images.unsplash.com/photo-1758270705290-62b6294dd044?w=1400&q=80&auto=format&fit=crop&kcdd_placeholder=1',
    backgroundImageAlt: 'Students gathered around a laptop together',
  },
]
