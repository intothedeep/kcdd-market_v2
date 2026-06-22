import type { FeatureCardsSectionData } from '@/components/home/FeatureCardsSection'

export const homeFeatureCards: FeatureCardsSectionData = {
  subtitle: 'For Donors',
  heading: 'Fund a specific laptop, hotspot, or tablet — and watch it ship.',
  description:
    'No vague "general fund." Each request on KC DIME is a real device for a real Kansas City recipient. Pick the one you want to fund and follow it from cart to doorstep.',
  listItems: ['100% tax-deductible', 'Per-device tracking', 'Verified recipients only'],
  buttonLabel: 'Get Started',
  buttonHref: '/sign-up',
  cards: [
    {
      title: 'Browse Open Requests',
      description:
        'Laptops for students, hotspots for re-entry clients, tablets for seniors, monitors for remote workers — see what Kansas City needs right now.',
      linkText: 'View All Requests',
      linkHref: '/campaigns',
    },
    {
      title: 'Fund a Device',
      description:
        'Pay with a card. Your entire contribution (minus the Stripe fee, which we publish) goes directly to the device your gift is tagged to.',
      linkText: 'How Donations Work',
      linkHref: '/about#how-it-works',
    },
    {
      title: 'Track Your Impact',
      description:
        "Every device you funded shows up in your donor dashboard — with the recipient's thank-you note, a photo from delivery day, and our 90-day check-in.",
      linkText: 'See Donor Dashboard',
      linkHref: '/about#impact',
    },
    {
      title: 'Tax Receipts, Automated',
      description:
        'Instant IRS-compliant receipts after every gift. Download an annual summary at tax time without emailing anyone.',
      linkText: 'Tax Information',
      linkHref: '/about#tax-benefits',
    },
  ],
}
