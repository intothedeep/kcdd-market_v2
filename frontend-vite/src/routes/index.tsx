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
import { CBOProfile } from '@/pages/cbo/ProfilePage'
import { CBOProfileEdit } from '@/pages/cbo/ProfileEditPage'
import { OrganizationProfilePage } from '@/pages/organizations/OrganizationProfilePage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { CampaignPage } from '@/pages/CampaignPage'
import { CampaignDonatePage } from '@/pages/CampaignDonatePage'
// RoleSelectionPage removed - now using RoleSelectionModal in App.tsx
import { AdminDashboard } from '@/pages/admin/DashboardPage'
import { AdminUsersPage } from '@/pages/admin/UsersPage'
import { useUserType } from '@/hooks/useClerkSupabase'

// Legal Pages
import {
  PrivacyStatementPage,
  DoNotSellPage,
  AccessibilityStatementPage,
  TermsAndConditionsPage,
  CPSIACompliancePage,
  SiteMapPage,
} from '@/pages/legal'

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

// Admin-Only Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { userType, loading } = useUserType()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]" />
      </div>
    )
  }

  if (userType !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0a0a0a] mb-2">Access Denied</h1>
          <p className="text-[#737373]">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
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

      {/* Legal routes (public) */}
      <Route element={<MainLayout />}>
        <Route path={routes.legal.privacy} element={<PrivacyStatementPage />} />
        <Route path={routes.legal.doNotSell} element={<DoNotSellPage />} />
        <Route path={routes.legal.accessibility} element={<AccessibilityStatementPage />} />
        <Route path={routes.legal.terms} element={<TermsAndConditionsPage />} />
        <Route path={routes.legal.cpsia} element={<CPSIACompliancePage />} />
        <Route path={routes.legal.sitemap} element={<SiteMapPage />} />
      </Route>

      {/* Auth routes */}
      <Route path={routes.signIn} element={<SignIn routing="path" path={routes.signIn} />} />
      <Route path={routes.signUp} element={<SignUp routing="path" path={routes.signUp} />} />

      {/* Role Selection is now a modal in App.tsx, not a separate route */}

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
        <Route
          path={routes.cbo.profile}
          element={
            <ProtectedRoute>
              <CBOProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.cbo.profileEdit}
          element={
            <ProtectedRoute>
              <CBOProfileEdit />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Organization routes (public) */}
      <Route element={<MainLayout />}>
        <Route path="/organizations/:id" element={<OrganizationProfilePage />} />
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
        <Route
          path="/campaign/:slug/donate"
          element={
            <ProtectedRoute>
              <CampaignDonatePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin routes (protected, admin-only) */}
      <Route element={<MainLayout />}>
        <Route
          path={routes.admin.dashboard}
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.admin.users}
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <AdminUsersPage />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

