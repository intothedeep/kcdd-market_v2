/**
 * Main App Component
 *
 * This is the root component that sets up all providers:
 * - Clerk for authentication
 * - React Router for routing
 * - Stripe Elements for payments
 */

import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { clerkConfig } from '@/config'
import { AppRoutes } from '@/routes'
import { Toaster } from '@/components/ui/toaster'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { RoleSelectionModal } from '@/components/RoleSelectionModal'
import { ImpersonationProvider, ImpersonationBanner } from '@/contexts/ImpersonationContext'

// Initialize Stripe
const stripePromise = getStripe()

// Component to sync Clerk with Supabase and show role selection modal.
// The Clerk → Supabase JWT bridge installation lives entirely inside
// useClerkSupabase, which registers a two-arg token getter (token +
// isSignedIn). Do NOT re-register here — a one-arg duplicate would
// overwrite the isSignedIn signal and reintroduce the silent-anon
// fallback the H4-A hotfix closes.
function AuthSync() {
  const { needsRoleSelection, dismissRoleSelection } = useClerkSupabase()
  return <RoleSelectionModal isOpen={needsRoleSelection} onClose={dismissRoleSelection} />
}

function App() {
  // Validate configuration
  if (!clerkConfig.publishableKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Error</h1>
          <p className="mb-2 text-gray-600">Missing Clerk publishable key.</p>
          <p className="text-sm text-gray-500">
            Please copy .env.example to .env.local and add your configuration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkConfig.publishableKey}>
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <ImpersonationProvider>
            <ImpersonationBanner />
            <AuthSync />
            <AppRoutes />
            <Toaster />
          </ImpersonationProvider>
        </BrowserRouter>
      </Elements>
    </ClerkProvider>
  )
}

export default App
