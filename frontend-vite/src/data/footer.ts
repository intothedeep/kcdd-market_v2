import type { FooterData } from '@/components/Footer'

export const footerData: FooterData = {
  linkColumns: [
    {
      title: 'Platform',
      links: [
        { label: 'Browse Campaigns', href: '/campaigns' },
        { label: 'For Organizations', href: '/about#for-organizations' },
        { label: 'For Donors', href: '/about#for-donors' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'How It Works', href: '/about#how-it-works' },
        { label: 'Impact Reports', href: '/about#impact' },
        { label: 'FAQs', href: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/faq' },
        { label: 'Report an Issue', href: '/contact' },
      ],
    },
  ],
  newsletter: {
    title: 'Stay Updated',
    description: 'Get the latest on community impact and giving opportunities.',
    placeholder: 'Enter your email',
    buttonLabel: 'Subscribe',
  },
  // Social links left empty until real KC DIME social profiles exist.
  // The previous defaults pointed to facebook.com/kcdigitaldrive etc., which
  // either don't exist or belong to other accounts — safer to omit than send
  // donors to the wrong page.
  socialLinks: [],
  legalLinks: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Accessibility', href: '/legal/accessibility' },
    { label: 'Cookie Policy', href: '/legal/privacy' },
  ],
  bottomSocialLinks: [],
}
