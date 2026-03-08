import type { FeatureCardsSectionData } from '@/components/home/FeatureCardsSection'

export const homeFeatureCards: FeatureCardsSectionData = {
  subtitle: 'How KC Digital Drive Works',
  heading: 'Connecting donors with community organizations that need support.',
  description:
    'Our platform makes it easy to discover, fund, and track technology requests from verified 501(c)(3) organizations in the Kansas City area.',
  listItems: ['100% tax-deductible', 'Direct impact tracking', 'Verified nonprofits'],
  buttonLabel: 'Get Started',
  buttonHref: '/register',
  cards: [
    {
      title: 'Browse Requests',
      description:
        'Explore technology needs from local nonprofits including laptops, software, and equipment for their operations.',
      linkText: 'View All Requests',
      linkHref: '/requests',
    },
    {
      title: 'Make a Donation',
      description:
        'Fund requests directly with secure payment processing. Your entire donation goes to the organization.',
      linkText: 'Learn More',
      linkHref: '/about/how-it-works',
    },
    {
      title: 'Track Your Impact',
      description:
        'See exactly how your donations are used with proof of delivery, impact reports, and thank you messages.',
      linkText: 'View Impact',
      linkHref: '/impact',
    },
    {
      title: 'Tax Benefits',
      description:
        'Receive instant tax receipts for every donation. Download annual summaries for easy tax filing.',
      linkText: 'Tax Information',
      linkHref: '/about/tax-benefits',
    },
  ],
}
