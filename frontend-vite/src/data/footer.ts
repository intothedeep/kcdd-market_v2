import type { FooterData } from '@/components/Footer'

export const footerData: FooterData = {
  linkColumns: [
    {
      title: 'Title Label',
      links: [
        { label: 'Lorem ipsum dolor', href: '#' }
      ]
    },
    {
      title: 'Title Label',
      links: [
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' }
      ]
    },
    {
      title: 'Title Label',
      links: [
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' }
      ]
    },
    {
      title: 'Title Label',
      links: [
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' },
        { label: 'Lorem ipsum dolor', href: '#' }
      ]
    }
  ],
  newsletter: {
    title: 'Title Label',
    description: 'Lorem ipsum dolor sit amet, onse ctetur.',
    placeholder: 'Placeholder',
    buttonLabel: 'Submit'
  },
  socialLinks: [
    { icon: 'facebook', href: '#', label: 'Facebook' },
    { icon: 'twitter', href: '#', label: 'Twitter' },
    { icon: 'instagram', href: '#', label: 'Instagram' },
    { icon: 'linkedin', href: '#', label: 'LinkedIn' }
  ],
  legalLinks: [
    { label: 'Privacy Statement', href: '/legal/privacy' },
    { label: 'Do Not Sell My Personal Information', href: '/legal/do-not-sell' },
    { label: 'Accessibility Statement', href: '/legal/accessibility' },
    { label: 'Terms and Conditions', href: '/legal/terms' },
    { label: 'GCC-CPSIA Compliance', href: '/legal/cpsia-compliance' },
    { label: 'Site Map', href: '/legal/sitemap' }
  ],
  bottomSocialLinks: [
    { icon: 'facebook', href: '#', label: 'Facebook' },
    { icon: 'twitter', href: '#', label: 'Twitter' },
    { icon: 'instagram', href: '#', label: 'Instagram' },
    { icon: 'linkedin', href: '#', label: 'LinkedIn' }
  ]
}

