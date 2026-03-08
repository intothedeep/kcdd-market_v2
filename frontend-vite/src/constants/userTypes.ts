/**
 * User Type Constants
 *
 * Internal types vs Display labels for the signup/onboarding flow.
 * - 'donor' = Users who want to give (individuals or organizations)
 * - 'cbo' = Recipient Organizations (organizations seeking support)
 */

// Internal database values (don't change these)
export const USER_TYPES = {
  DONOR: 'donor',
  RECIPIENT_ORG: 'cbo', // Keep 'cbo' in DB, display as "Recipient Organization"
  ADMIN: 'admin',
} as const

// Display labels (what users see)
export const USER_TYPE_LABELS = {
  donor: 'Donor',
  cbo: 'Recipient Organization',
  admin: 'Administrator',
} as const

// Signup flow labels
export const SIGNUP_OPTIONS = {
  DONOR: {
    title: 'I want to give',
    description: 'Support Kansas City community members and organizations with donations',
    icon: 'Heart',
    userType: USER_TYPES.DONOR,
  },
  RECIPIENT_ORG: {
    title: 'I need support',
    description: 'Request technology equipment and resources for yourself or your organization',
    icon: 'Users',
    userType: USER_TYPES.RECIPIENT_ORG,
  },
} as const

// Organization tiers (admin-only, hidden from regular users)
export const ORG_TIERS = {
  INDIVIDUAL: 'individual',
  SMALL_ORG: 'small_org',
  LARGE_ORG: 'large_org',
} as const

export const ORG_TIER_LABELS = {
  individual: 'Individual',
  small_org: 'Small Organization',
  large_org: 'Large Organization',
} as const

// Verification status (admin-only)
export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
} as const

export const VERIFICATION_STATUS_LABELS = {
  unverified: 'Unverified',
  verified: 'Verified',
  premium: 'Premium',
} as const

// Type exports
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES]
export type OrgTier = typeof ORG_TIERS[keyof typeof ORG_TIERS]
export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS]
