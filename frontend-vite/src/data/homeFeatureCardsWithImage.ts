import type { FeatureCardsWithImageSectionData } from '@/components/home/FeatureCardsWithImageSection'

export const homeFeatureCardsWithImage: FeatureCardsWithImageSectionData = {
  subtitle: 'For Community Organizations',
  heading: 'Equip your programs with tech that actually shows up.',
  buttonLabel: 'Register Your Organization',
  buttonHref: '/sign-up',
  imagePlaceholderColor: '#1b5858',
  // Real Unsplash photo: diverse students gathered around a laptop in a classroom.
  imageUrl:
    'https://images.unsplash.com/photo-1758270705317-3ef6142d306f?w=1200&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  imageAlt: 'Diverse group of students collaborating around a laptop in a classroom',
  cards: [
    {
      title: 'Post Specific Tech Needs',
      description:
        '20 Chromebooks for a classroom. 5 hotspots for case managers. A projector for the homework room. Tell us what you need and what it unlocks.',
      linkText: 'How to Submit',
      linkHref: '/about#for-organizations',
    },
    {
      title: 'Get Verified Once',
      description:
        'We confirm your 501(c)(3) status with the IRS, talk to a reference, and you\'re cleared. After that, your requests post live for donors to fund.',
      linkText: 'Verification Process',
      linkHref: '/about#verification',
    },
    {
      title: 'Devices, Not Reimbursements',
      description:
        'Funded requests turn into actual gear shipped from our warehouse — fully wiped, re-imaged, and labeled. No vouchers, no purchase orders, no reimbursement paperwork.',
      linkText: 'Fulfillment Details',
      linkHref: '/about#how-it-works',
    },
    {
      title: 'Report Outcomes Easily',
      description:
        'Upload one photo and write two sentences when the gear is in use. That\'s our entire reporting requirement — and it\'s what keeps donors funding the next request.',
      linkText: 'Impact Reporting',
      linkHref: '/about#impact',
    },
  ],
}
