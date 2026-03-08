/**
 * Contact Information Constants
 * Centralized contact information for the platform
 */

export const SUPPORT_EMAIL = 'support@kcdigitaldrive.org'
export const SUPPORT_PHONE = '(816) 555-0123'
export const SUPPORT_HOURS = 'Monday-Friday, 9am-5pm CT'

export const CONTACT_INFO = {
  email: SUPPORT_EMAIL,
  phone: SUPPORT_PHONE,
  hours: SUPPORT_HOURS,
  address: {
    street: '123 Main Street',
    city: 'Kansas City',
    state: 'MO',
    zip: '64108',
  },
} as const

export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/kcdigitaldrive',
  twitter: 'https://twitter.com/kcdigitaldrive',
  instagram: 'https://instagram.com/kcdigitaldrive',
  linkedin: 'https://linkedin.com/company/kcdigitaldrive',
} as const
