import type { FooterData } from '@/components/Footer'

export const footerData: FooterData = {
  linkColumns: [
    {
      title: 'Platform',
      links: [
        { label: 'Browse Requests', href: '/requests' },
        { label: 'For Organizations', href: '/about/organizations' },
        { label: 'For Donors', href: '/about/donors' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'How It Works', href: '/about/how-it-works' },
        { label: 'Impact Reports', href: '/impact' },
        { label: 'FAQs', href: '/about/faqs' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/support' },
        { label: 'Report an Issue', href: '/support/report' },
        { label: 'Partner With Us', href: '/partners' },
      ],
    },
  ],
  newsletter: {
    title: 'Stay Updated',
    description: 'Get the latest on community impact and giving opportunities.',
    placeholder: 'Enter your email',
    buttonLabel: 'Subscribe',
  },
  socialLinks: [
    { icon: 'facebook', href: 'https://facebook.com/kcdigitaldrive', label: 'Facebook' },
    { icon: 'twitter', href: 'https://twitter.com/kcdigitaldrive', label: 'Twitter' },
    { icon: 'instagram', href: 'https://instagram.com/kcdigitaldrive', label: 'Instagram' },
    { icon: 'linkedin', href: 'https://linkedin.com/company/kcdigitaldrive', label: 'LinkedIn' },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/legal/privacy' },
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Accessibility', href: '/legal/accessibility' },
    { label: 'Cookie Policy', href: '/legal/cookies' },
  ],
  bottomSocialLinks: [
    { icon: 'facebook', href: 'https://facebook.com/kcdigitaldrive', label: 'Facebook' },
    { icon: 'twitter', href: 'https://twitter.com/kcdigitaldrive', label: 'Twitter' },
    { icon: 'instagram', href: 'https://instagram.com/kcdigitaldrive', label: 'Instagram' },
    { icon: 'linkedin', href: 'https://linkedin.com/company/kcdigitaldrive', label: 'LinkedIn' },
  ],
}
