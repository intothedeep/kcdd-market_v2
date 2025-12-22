/**
 * Application Routes
 * 
 * Documentation:
 * - React Router v6: https://reactrouter.com/en/main
 * - Clerk Protected Routes: https://clerk.com/docs/components/protect
 */

import { Routes, Route } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { routes } from '@/config'

// Layouts
import { MainLayout } from '@/layouts/MainLayout'

// Pages
import { HomePage } from '@/pages/HomePage'
import { AboutPage } from '@/pages/AboutPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { DonorDashboard } from '@/pages/donor/DashboardPage'
import { DonorProfile } from '@/pages/donor/ProfilePage'
import { DonorImpact } from '@/pages/donor/ImpactPage'
import { DonorDocuments } from '@/pages/donor/DocumentsPage'
import { DonorSupport } from '@/pages/donor/SupportPage'
import { CBODashboard } from '@/pages/cbo/DashboardPage'
import { CBOSetup } from '@/pages/cbo/SetupPage'
import { CBORequests } from '@/pages/cbo/RequestsPage'
import { NewRequestPage } from '@/pages/cbo/NewRequestPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { CampaignPage } from '@/pages/CampaignPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.about} element={<AboutPage />} />
        <Route path={routes.requests} element={<RequestsPage />} />
      </Route>

      {/* Auth routes */}
      <Route path={routes.signIn} element={<SignIn routing="path" path={routes.signIn} />} />
      <Route path={routes.signUp} element={<SignUp routing="path" path={routes.signUp} />} />

      {/* Donor routes (protected) */}
      <Route element={<MainLayout />}>
        <Route
          path={routes.donor.dashboard}
          element={
            <ProtectedRoute>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.donor.profile}
          element={
            <ProtectedRoute>
              <DonorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/impact"
          element={
            <ProtectedRoute>
              <DonorImpact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/documents"
          element={
            <ProtectedRoute>
              <DonorDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/support"
          element={
            <ProtectedRoute>
              <DonorSupport />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* CBO routes (protected) */}
      <Route element={<MainLayout />}>
        <Route
          path={routes.cbo.dashboard}
          element={
            <ProtectedRoute>
              <CBODashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.cbo.setup}
          element={
            <ProtectedRoute>
              <CBOSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.cbo.requests}
          element={
            <ProtectedRoute>
              <CBORequests />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.cbo.newRequest}
          element={
            <ProtectedRoute>
              <NewRequestPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Payment routes */}
      <Route element={<MainLayout />}>
        <Route
          path="/checkout/:requestId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path={routes.paymentSuccess} element={<PaymentSuccessPage />} />
      </Route>

      {/* Campaign routes (public) */}
      <Route element={<MainLayout />}>
        <Route path="/campaign/:slug" element={<CampaignPage />} />
        <Route path="/user/campaign/:slug" element={<CampaignPage />} />
      </Route>
    </Routes>
  )
}

