import type { FeatureCardsWithImageSectionData } from '@/components/home/FeatureCardsWithImageSection'

export const homeFeatureCardsWithImage: FeatureCardsWithImageSectionData = {
  subtitle: 'For Community Organizations',
  heading: 'Get the technology your nonprofit needs to thrive.',
  buttonLabel: 'Register Your Organization',
  buttonHref: '/sign-up',
  imagePlaceholderColor: '#1b5858',
  cards: [
    {
      title: 'Submit Requests',
      description:
        'Post specific technology needs to our community of donors. Include details about how items will be used.',
      linkText: 'Learn How',
      linkHref: '/about#for-organizations',
    },
    {
      title: 'Verified Status',
      description:
        'Our team verifies your 501(c)(3) status ensuring donors can trust their contributions are going to legitimate causes.',
      linkText: 'Verification Process',
      linkHref: '/about#verification',
    },
    {
      title: 'Receive Funding',
      description:
        'When donors fund your requests, payments are processed securely through Stripe directly to your organization.',
      linkText: 'Payment Details',
      linkHref: '/about#how-it-works',
    },
    {
      title: 'Share Your Impact',
      description:
        'Keep donors updated with proof of delivery, photos, and impact stories that build lasting relationships.',
      linkText: 'Impact Reporting',
      linkHref: '/about#impact',
    },
  ],
}
