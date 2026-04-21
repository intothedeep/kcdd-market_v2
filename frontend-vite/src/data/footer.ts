import type { FooterData } from '@/components/Footer'

export const footerData: FooterData = {
  linkColumns: [
    {
      title: 'Platform',
      links: [
        { label: 'Browse Requests', href: '/requests' },
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
    { label: 'Cookie Policy', href: '/legal/privacy' },
  ],
  bottomSocialLinks: [
    { icon: 'facebook', href: 'https://facebook.com/kcdigitaldrive', label: 'Facebook' },
    { icon: 'twitter', href: 'https://twitter.com/kcdigitaldrive', label: 'Twitter' },
    { icon: 'instagram', href: 'https://instagram.com/kcdigitaldrive', label: 'Instagram' },
    { icon: 'linkedin', href: 'https://linkedin.com/company/kcdigitaldrive', label: 'LinkedIn' },
  ],
}
