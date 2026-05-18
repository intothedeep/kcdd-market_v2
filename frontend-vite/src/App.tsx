/**
 * Main App Component
 *
 * This is the root component that sets up all providers:
 * - Clerk for authentication
 * - React Router for routing
 * - Stripe Elements for payments
 */

import { useEffect } from 'react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { clerkConfig } from '@/config'
import { AppRoutes } from '@/routes'
import { Toaster } from '@/components/ui/toaster'
import { useClerkSupabase } from '@/hooks/useClerkSupabase'
import { RoleSelectionModal } from '@/components/RoleSelectionModal'
import { ClerkSupabaseBridge } from '@/lib/supabase'
import {
  ImpersonationProvider,
  ImpersonationBanner,
} from '@/contexts/ImpersonationContext'

// Initialize Stripe
const stripePromise = getStripe()

// Component to sync Clerk with Supabase and show role selection modal.
// Also installs the Clerk → Supabase JWT bridge so supabase-js sends the
// current Clerk session token in the Authorization header. Once Supabase is
// configured to trust Clerk-signed JWTs (Dashboard → Auth → Third Party Auth),
// auth.uid() in RLS will return the Clerk user ID.
function AuthSync() {
  const { needsRoleSelection, dismissRoleSelection } = useClerkSupabase()
  const { getToken } = useAuth()

  useEffect(() => {
    ClerkSupabaseBridge.setTokenGetter(async () => {
      try {
        // Prefer a `supabase` JWT template if defined in Clerk; fall back to
        // the default session token. Both arrive as JWTs that Supabase TPA can
        // verify once the project is configured to trust Clerk.
        const tpl = await getToken({ template: 'supabase' }).catch(() => null)
        return tpl ?? (await getToken())
      } catch {
        return null
      }
    })
    return () => ClerkSupabaseBridge.setTokenGetter(null)
  }, [getToken])

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
