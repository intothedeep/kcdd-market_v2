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

// Initialize Stripe
const stripePromise = getStripe()

// Component to sync Clerk with Supabase
function AuthSync() {
  useClerkSupabase()
  return null
}

function App() {
  // Validate configuration
  if (!clerkConfig.publishableKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-600 mb-2">Missing Clerk publishable key.</p>
          <p className="text-sm text-gray-500">
            Please copy .env.example to .env.local and add your configuration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkConfig.publishableKey}>
      <AuthSync />
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </Elements>
    </ClerkProvider>
  )
}

export default App

