/**
 * Centralized Configuration
 *
 * All environment variables and app configuration in one place.
 * This makes it easy to validate and manage all settings.
 *
 * Documentation:
 * - Vite env variables: https://vitejs.dev/guide/env-and-mode.html
 * - TypeScript import.meta.env: https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript
 */

// Validate required environment variables
const requiredEnvVars = [
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_API_URL',
] as const

// Check for missing environment variables in development
if (import.meta.env.DEV) {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key])
  if (missing.length > 0) {
    console.error('[Error] Missing required environment variables:', missing)
    console.error('[Info] Please copy .env.example to .env.local and fill in the values')
  }
}

// ============================================
// CLERK CONFIGURATION
// ============================================
export const clerkConfig = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
  // Clerk Dashboard: https://dashboard.clerk.com
  // Docs: https://clerk.com/docs/quickstarts/react
}

// ============================================
// SUPABASE CONFIGURATION
// ============================================
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  // Supabase Dashboard: https://app.supabase.com
  // Docs: https://supabase.com/docs/reference/javascript/introduction
}

// ============================================
// STRIPE CONFIGURATION
// ============================================
export const stripeConfig = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  // Stripe Dashboard: https://dashboard.stripe.com
  // Docs: https://stripe.com/docs/stripe-js/react
}

// ============================================
// API CONFIGURATION
// ============================================
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 30000, // 30 seconds
  // Backend API endpoints
  endpoints: {
    payments: {
      createIntent: '/api/payments/create-intent',
      webhook: '/api/payments/webhook',
    },
    requests: {
      list: '/api/requests',
      claim: '/api/requests/claim',
      fulfill: '/api/requests/fulfill',
    },
  },
}

// ============================================
// APPLICATION CONFIGURATION
// ============================================
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || 'KC Digital Drive Market',
  url: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',

  // Feature flags
  features: {
    payments: import.meta.env.VITE_ENABLE_PAYMENTS === 'true',
    realtime: import.meta.env.VITE_ENABLE_REALTIME === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },

  // Development mode
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

// ============================================
// ROUTES CONFIGURATION
// ============================================
export const routes = {
  home: '/',
  about: '/about',
  faq: '/faq',
  contact: '/contact',
  requests: '/campaigns',

  // Authentication
  signIn: '/sign-in',
  signUp: '/sign-up',
  roleSelection: '/get-started',

  // Organization routes (public)
  organizations: {
    profile: (id: string) => `/organizations/${id}`,
  },

  // Donor routes
  donor: {
    dashboard: '/donor/dashboard',
    profile: '/donor/profile',
    donations: '/donor/donations',
  },

  // CBO routes
  cbo: {
    dashboard: '/cbo/dashboard',
    setup: '/cbo/setup',
    requests: '/cbo/requests',
    newRequest: '/cbo/requests/new',
    profile: '/cbo/profile',
    profileEdit: '/cbo/profile/edit',
  },
  cboCampaignDefaults: '/cbo/campaign-defaults',

  // Admin routes
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    organizations: '/admin/organizations',
    campaigns: '/admin/campaigns',
    auditLog: '/admin/audit-log',
  },

  // Campaign routes
  campaign: (slug: string) => `/campaign/${slug}`,
  campaignDonate: (slug: string) => `/campaign/${slug}/donate`,

  // Payment routes
  checkout: (requestId: string) => `/checkout/${requestId}`,
  paymentSuccess: '/payment/success',
  paymentCancel: '/payment/cancel',

  // Legal routes
  legal: {
    privacy: '/legal/privacy',
    doNotSell: '/legal/do-not-sell',
    accessibility: '/legal/accessibility',
    terms: '/legal/terms',
    cpsia: '/legal/cpsia-compliance',
    sitemap: '/legal/sitemap',
  },
}

// ============================================
// VALIDATION HELPERS
// ============================================
export const isConfigValid = (): boolean => {
  return requiredEnvVars.every((key) => !!import.meta.env[key])
}

export const getConfigErrors = (): string[] => {
  return requiredEnvVars.filter((key) => !import.meta.env[key]).map((key) => `Missing: ${key}`)
}

// Log configuration status in development
if (appConfig.isDevelopment) {
  console.log('[Config] Configuration loaded:', {
    environment: appConfig.environment,
    features: appConfig.features,
    clerk: clerkConfig.publishableKey ? 'OK' : 'MISSING',
    supabase: supabaseConfig.url ? 'OK' : 'MISSING',
    stripe: stripeConfig.publishableKey ? 'OK' : 'MISSING',
  })
}
