import type { BentoCardData } from '@/components/home/BentoGridSection'

export const homeBentoGrid: [BentoCardData, BentoCardData, BentoCardData, BentoCardData] = [
  {
    title: 'Local Impact',
    description:
      'Every donation stays in the Kansas City community. We partner with verified 501(c)(3) organizations doing meaningful work right here at home.',
    linkText: 'See Local Organizations',
    linkHref: '/organizations',
    backgroundColor: '#1b5858',
    textColor: 'light',
  },
  {
    title: 'Transparent Giving',
    description:
      'Know exactly where your money goes. Track your donations from funding to delivery with proof of impact and thank you messages from organizations.',
    linkText: 'How Tracking Works',
    linkHref: '/about/transparency',
    backgroundColor: '#c4e5c1',
    textColor: 'dark',
  },
  {
    title: 'Tax Benefits',
    description:
      'All donations are 100% tax-deductible. Download instant receipts after each donation or generate annual summaries for easy tax filing.',
    linkText: 'Tax Information',
    linkHref: '/about/tax-benefits',
    backgroundColor: '#c4e5c1',
    textColor: 'dark',
  },
  {
    title: 'Join Our Community',
    description:
      "Whether you're a donor looking to make an impact or an organization needing support, there's a place for you at KC Digital Drive.",
    linkText: 'Get Started Today',
    linkHref: '/register',
    backgroundColor: '#103032',
    textColor: 'light',
  },
]
