/**
 * Application Routes
 *
 * Documentation:
 * - React Router v6: https://reactrouter.com/en/main
 * - Clerk Protected Routes: https://clerk.com/docs/components/protect
 */

import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { routes } from '@/config'

// Layouts (kept static)
import { MainLayout } from '@/layouts/MainLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'

// Pages (HomePage kept static — eager above-the-fold)
import { HomePage } from '@/pages/HomePage'
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const FaqPage = lazy(() => import('@/pages/FaqPage').then((m) => ({ default: m.FaqPage })))
const ContactPage = lazy(() =>
  import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage }))
)
const RequestsPage = lazy(() =>
  import('@/pages/RequestsPage').then((m) => ({ default: m.RequestsPage }))
)
// W7-10 Phase 1: requests surfaces unrouted (campaigns-only). Reversible — uncomment.
// import { RequestDetailPage } from '@/pages/RequestDetailPage'
const DonorDashboard = lazy(() =>
  import('@/pages/donor/DashboardPage').then((m) => ({ default: m.DonorDashboard }))
)
const DonorProfile = lazy(() =>
  import('@/pages/donor/ProfilePage').then((m) => ({ default: m.DonorProfile }))
)
const CBODashboard = lazy(() =>
  import('@/pages/cbo/DashboardPage').then((m) => ({ default: m.CBODashboard }))
)
const CBOSetup = lazy(() => import('@/pages/cbo/SetupPage').then((m) => ({ default: m.CBOSetup })))
// import { CBORequests } from '@/pages/cbo/RequestsPage'
// import { NewRequestPage } from '@/pages/cbo/NewRequestPage'
const CBOProfile = lazy(() =>
  import('@/pages/cbo/ProfilePage').then((m) => ({ default: m.CBOProfile }))
)
const CBOProfileEdit = lazy(() =>
  import('@/pages/cbo/ProfileEditPage').then((m) => ({ default: m.CBOProfileEdit }))
)
const CampaignDefaultsPage = lazy(() =>
  import('@/pages/cbo/CampaignDefaultsPage').then((m) => ({ default: m.CampaignDefaultsPage }))
)
const OrganizationProfilePage = lazy(() =>
  import('@/pages/organizations/OrganizationProfilePage').then((m) => ({
    default: m.OrganizationProfilePage,
  }))
)
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
)
const PaymentSuccessPage = lazy(() =>
  import('@/pages/PaymentSuccessPage').then((m) => ({ default: m.PaymentSuccessPage }))
)
const CampaignPage = lazy(() =>
  import('@/pages/CampaignPage').then((m) => ({ default: m.CampaignPage }))
)
const CampaignDonatePage = lazy(() =>
  import('@/pages/CampaignDonatePage').then((m) => ({ default: m.CampaignDonatePage }))
)
// RoleSelectionPage removed - now using RoleSelectionModal in App.tsx
const AdminDashboard = lazy(() =>
  import('@/pages/admin/DashboardPage').then((m) => ({ default: m.AdminDashboard }))
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.AdminUsersPage }))
)
const CampaignsAdminPage = lazy(() =>
  import('@/pages/admin/CampaignsAdminPage').then((m) => ({ default: m.CampaignsAdminPage }))
)
const AuditLogPage = lazy(() =>
  import('@/pages/admin/AuditLogPage').then((m) => ({ default: m.AuditLogPage }))
)
import { useRealUserType } from '@/hooks/useClerkSupabase'

// Legal Pages (shared chunk via @/pages/legal barrel)
const PrivacyStatementPage = lazy(() =>
  import('@/pages/legal').then((m) => ({ default: m.PrivacyStatementPage }))
)
const DoNotSellPage = lazy(() =>
  import('@/pages/legal').then((m) => ({ default: m.DoNotSellPage }))
)
const AccessibilityStatementPage = lazy(() =>
  import('@/pages/legal').then((m) => ({ default: m.AccessibilityStatementPage }))
)
const TermsAndConditionsPage = lazy(() =>
  import('@/pages/legal').then((m) => ({ default: m.TermsAndConditionsPage }))
)
const CPSIACompliancePage = lazy(() =>
  import('@/pages/legal').then((m) => ({ default: m.CPSIACompliancePage }))
)
const SiteMapPage = lazy(() => import('@/pages/legal').then((m) => ({ default: m.SiteMapPage })))

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
// Uses useRealUserType to check actual user role (ignores impersonation)
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { userType, loading } = useRealUserType()

  // H4-B: treat null as "still resolving / transient fetch error" so a
  // network blip during user_profiles select does not demote an admin
  // to Access Denied mid-session. useRealUserType now returns null on
  // fetch error (was: 'donor'), and we surface that as a spinner here.
  if (loading || userType == null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#ea580c]" />
      </div>
    )
  }

  if (userType !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-[#0a0a0a]">Access Denied</h1>
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
        <Route path="/requests" element={<Navigate to="/campaigns" replace />} />
        <Route path={routes.faq} element={<FaqPage />} />
        <Route path={routes.contact} element={<ContactPage />} />
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
      <Route path={`${routes.signIn}/*`} element={<SignIn routing="path" path={routes.signIn} />} />
      <Route path={`${routes.signUp}/*`} element={<SignUp routing="path" path={routes.signUp} />} />

      {/* Role Selection is now a modal in App.tsx, not a separate route */}

      {/* Donor routes (protected) */}
      <Route element={<DashboardLayout />}>
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
        {/* Legacy standalone donor pages — consolidated into dashboard sections */}
        <Route
          path="/donor/impact"
          element={<Navigate to="/donor/dashboard?section=impact" replace />}
        />
        <Route
          path="/donor/documents"
          element={<Navigate to="/donor/dashboard?section=documents" replace />}
        />
        <Route
          path="/donor/support"
          element={<Navigate to="/donor/dashboard?section=support" replace />}
        />
      </Route>

      {/* CBO routes (protected) */}
      <Route element={<DashboardLayout />}>
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
        {/* W7-10 Phase 1: /cbo/requests + /cbo/requests/new unrouted (campaigns-only). Reversible — uncomment. */}
        {/* <Route
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
        /> */}
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
        <Route
          path={routes.cboCampaignDefaults}
          element={
            <ProtectedRoute>
              <CampaignDefaultsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Organization routes (public) */}
      <Route element={<MainLayout />}>
        <Route path="/organizations/:id" element={<OrganizationProfilePage />} />
        {/* W7-10 Phase 1: /request/:id unrouted. Reversible — uncomment. */}
        {/* <Route path="/request/:id" element={<RequestDetailPage />} /> */}
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
      <Route element={<DashboardLayout />}>
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
        <Route
          path="/admin/pending-edits"
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <CampaignsAdminPage />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path={routes.admin.auditLog}
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <AuditLogPage />
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
