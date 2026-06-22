/**
 * Clerk + Supabase Integration Hook
 *
 * This hook syncs Clerk authentication with Supabase.
 * It automatically updates the Supabase client with the Clerk JWT token.
 *
 * Documentation:
 * - Clerk useAuth: https://clerk.com/docs/references/react/use-auth
 * - Clerk JWT Templates: https://clerk.com/docs/backend-requests/making/jwt-templates
 */

import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { registerClerkTokenGetter, fetchUserProfile, supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export const useClerkSupabase = () => {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth()
  const { setUserType, reset } = useAuthStore()

  useEffect(() => {
    if (!isLoaded) return

    if (userId) {
      // Register a token getter so supabase-js can pull a fresh Clerk JWT
      // before every request. The getter is called per-request, so tokens
      // never go stale (60s lifetime in Clerk dev).
      //
      // H4-A: also pass an isSignedIn getter so the accessToken callback
      // can distinguish signed-out (anon fallback OK) from signed-in
      // (must throw on token refresh failure, not silently degrade).
      registerClerkTokenGetter(
        () => getToken({ template: 'supabase' }),
        () => isSignedIn === true
      )

      const syncAuth = async () => {
        try {
          // Ensure user_profiles row exists for this Clerk user before any
          // downstream FK-bound operations (payment webhooks, become-cbo, etc.)
          await api.post('/api/users/sync', {}, getToken).catch((err) => {
            console.error('Error syncing user_profiles:', err)
          })
          // Populate userType in authStore so admin nav link is shown immediately
          const profile: any = await fetchUserProfile(userId).catch(() => null)
          if (profile?.user_type) setUserType(profile.user_type)
        } catch (error) {
          console.error('Error syncing Clerk session:', error)
        }
      }
      syncAuth()
    } else {
      registerClerkTokenGetter(null)
      reset()
    }
  }, [isLoaded, userId, isSignedIn, getToken])

  // needsRoleSelection / dismissRoleSelection: used by App.tsx to show the
  // role selection modal on first sign-in. Merged from main branch — these
  // fields were removed in the feat/taek version but are still required by
  // RoleSelectionModal. Returning false/no-op keeps the existing behaviour
  // (role selection logic lives in RoleSelectionModal itself).
  const [needsRoleSelection] = useState(false)
  const dismissRoleSelection = () => {}

  return {
    isReady: isLoaded,
    userId,
    needsRoleSelection,
    dismissRoleSelection,
  }
}

/**
 * Hook to get the current user's type (donor, cbo, admin)
 * Respects impersonation context when active.
 */
export const useUserType = () => {
  const { userId } = useAuth()
  // H4-B: cache-first read from authStore. useClerkSupabase populates
  // authStore.userType after sign-in sync, so subsequent callers should
  // read from cache instead of issuing a redundant user_profiles SELECT
  // (was: 3 identical SELECTs per page load).
  const cached = useAuthStore((s) => s.userType)
  const setAuthStoreUserType = useAuthStore((s) => s.setUserType)
  const [userType, setUserType] = useState<'donor' | 'cbo' | 'admin' | null>(cached)
  const [loading, setLoading] = useState(!cached && !!userId)

  // Check for impersonation in sessionStorage (avoids circular dependency with context)
  const impersonatedType = (() => {
    try {
      const stored = sessionStorage.getItem('impersonation')
      if (stored) {
        const parsed = JSON.parse(stored) as { userType: 'donor' | 'cbo' | 'admin' }
        return parsed.userType
      }
    } catch {
      // ignore
    }
    return null
  })()

  useEffect(() => {
    // If impersonating, use the impersonated user's type
    if (impersonatedType) {
      setUserType(impersonatedType)
      setLoading(false)
      return
    }

    if (!userId) {
      setUserType(null)
      setLoading(false)
      return
    }

    // Cache hit: skip the DB fetch entirely.
    if (cached) {
      setUserType(cached)
      setLoading(false)
      return
    }

    const fetchUserType = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', userId)
          .single()

        if (error) {
          // H4-B: do NOT default to 'donor' on error — that silently
          // demotes admins on transient network failures. Return null
          // and let callers (e.g. ProtectedAdminRoute) treat as
          // "still loading / unknown" instead of "definitely donor".
          console.error('Error fetching user type:', error)
          setUserType(null)
        } else {
          const fetched =
            (data as { user_type?: 'donor' | 'cbo' | 'admin' } | null)?.user_type ?? null
          if (fetched) {
            setUserType(fetched)
            setAuthStoreUserType(fetched)
          } else {
            setUserType(null)
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setUserType(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()
  }, [userId, impersonatedType, cached, setAuthStoreUserType])

  return { userType, loading }
}

/**
 * Hook to get the real (non-impersonated) user type.
 * Used by ProtectedAdminRoute to verify actual admin access.
 */
export const useRealUserType = () => {
  const { userId } = useAuth()
  // H4-B: cache-first like useUserType, but ignores impersonation by
  // design (ProtectedAdminRoute calls this to verify real admin role).
  // The authStore cache reflects the real user_type populated by
  // useClerkSupabase syncAuth — impersonation overrides happen at the
  // useUserType layer, not in the store.
  const cached = useAuthStore((s) => s.userType)
  const setAuthStoreUserType = useAuthStore((s) => s.setUserType)
  const [userType, setUserType] = useState<'donor' | 'cbo' | 'admin' | null>(cached)
  const [loading, setLoading] = useState(!cached && !!userId)

  useEffect(() => {
    if (!userId) {
      setUserType(null)
      setLoading(false)
      return
    }

    // Cache hit: skip the DB fetch entirely.
    if (cached) {
      setUserType(cached)
      setLoading(false)
      return
    }

    const fetchUserType = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', userId)
          .single()

        if (error) {
          // H4-B: do NOT default to 'donor' on error — that silently
          // demotes admins on transient network failures.
          console.error('Error fetching real user type:', error)
          setUserType(null)
        } else {
          const fetched =
            (data as { user_type?: 'donor' | 'cbo' | 'admin' } | null)?.user_type ?? null
          if (fetched) {
            setUserType(fetched)
            setAuthStoreUserType(fetched)
          } else {
            setUserType(null)
          }
        }
      } catch (err) {
        console.error('Error:', err)
        setUserType(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()
  }, [userId, cached, setAuthStoreUserType])

  return { userType, loading }
}
