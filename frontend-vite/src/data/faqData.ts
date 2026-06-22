export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

export const faqData: FaqCategory[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is KC Digital Drive?',
        answer:
          'KC Digital Drive is a platform that connects donors with verified 501(c)(3) community-based organizations in the Kansas City area. Organizations post specific technology needs, and donors fund those requests directly.',
      },
      {
        question: 'Who can use the platform?',
        answer:
          'Anyone can browse requests and donate. Organizations must be registered 501(c)(3) nonprofits serving the Kansas City metro area to post requests.',
      },
      {
        question: 'Is KC Digital Drive a nonprofit?',
        answer:
          'Yes. KC Digital Drive operates as a nonprofit initiative focused on bridging the digital divide in the Kansas City region.',
      },
      {
        question: 'What kinds of technology can be requested?',
        answer:
          'Organizations can request laptops, desktops, tablets, software licenses, networking equipment, printers, and other technology essentials for their operations.',
      },
    ],
  },
  {
    title: 'For Donors',
    items: [
      {
        question: 'Are my donations tax-deductible?',
        answer:
          "Yes! All donations are 100% tax-deductible. You'll receive an instant tax receipt after each donation, and annual summaries are available in your dashboard.",
      },
      {
        question: 'How do I know my donation is being used properly?',
        answer:
          'Every funded request includes delivery tracking. Organizations provide proof of delivery photos and impact updates so you can see exactly how your donation was used.',
      },
      {
        question: 'Can I donate to a specific organization?',
        answer:
          'Yes. You can browse requests by organization, category, or funding amount and choose exactly where your donation goes.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'We accept all major credit and debit cards through Stripe, our secure payment processor. All transactions are encrypted and PCI-compliant.',
      },
    ],
  },
  {
    title: 'For Organizations',
    items: [
      {
        question: 'How do I register my organization?',
        answer:
          'Click "Register Your Organization" and create an account. You\'ll need to provide your EIN and 501(c)(3) documentation. Our team will verify your status, typically within 2-3 business days.',
      },
      {
        question: 'What does the verification process involve?',
        answer:
          "We cross-reference your EIN with IRS records, verify your organization's mission and service area, and confirm you serve the Kansas City metro area. Once approved, you'll receive a verified badge.",
      },
      {
        question: 'How do I receive funds?',
        answer:
          "Funds are processed securely through Stripe and deposited directly to your organization's bank account. You'll set up your banking details during onboarding.",
      },
      {
        question: 'Is there a fee to use the platform?',
        answer:
          'There is no platform fee for organizations. Standard payment processing fees apply (set by Stripe). The full donation amount minus processing fees goes directly to your organization.',
      },
    ],
  },
]
