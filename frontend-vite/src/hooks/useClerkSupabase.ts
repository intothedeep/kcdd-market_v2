/**
 * Clerk + Supabase Integration Hook
 *
 * This hook syncs Clerk authentication with Supabase.
 * It checks if a user profile exists and sets a flag if role selection is needed.
 *
 * Documentation:
 * - Clerk useAuth: https://clerk.com/docs/references/react/use-auth
 * - Clerk useUser: https://clerk.com/docs/references/react/use-user
 */

import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useClerkSupabase = () => {
  const { isLoaded: authLoaded, userId } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [isProfileSynced, setIsProfileSynced] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false)

  useEffect(() => {
    const syncUserToSupabase = async () => {
      // Wait for both auth and user to be loaded
      if (!authLoaded || !userLoaded) return

      // No user signed in
      if (!userId || !user) {
        setIsProfileSynced(false)
        setNeedsRoleSelection(false)
        return
      }

      // Already syncing or synced
      if (isSyncing || isProfileSynced) return

      setIsSyncing(true)

      try {
        // Check if user profile exists in Supabase
        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id, user_type, onboarding_complete')
          .eq('id', userId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (user doesn't exist yet)
          console.error('Error checking user profile:', fetchError)
          setIsSyncing(false)
          return
        }

        // If profile doesn't exist, show role selection modal
        if (!existingProfile) {
          console.log('New user detected, needs role selection:', userId)
          setNeedsRoleSelection(true)
        } else {
          console.log('User profile exists:', existingProfile.id)
          setNeedsRoleSelection(false)
        }

        setIsProfileSynced(true)
      } catch (err) {
        console.error('Error syncing user to Supabase:', err)
      } finally {
        setIsSyncing(false)
      }
    }

    syncUserToSupabase()
  }, [authLoaded, userLoaded, userId, user, isSyncing, isProfileSynced])

  // Reset sync state when user changes
  useEffect(() => {
    setIsProfileSynced(false)
    setNeedsRoleSelection(false)
  }, [userId])

  // Function to dismiss the role selection modal (after completion)
  const dismissRoleSelection = () => {
    setNeedsRoleSelection(false)
  }

  return {
    isReady: authLoaded && userLoaded && (isProfileSynced || !userId),
    userId,
    user,
    isProfileSynced,
    isSyncing,
    needsRoleSelection,
    dismissRoleSelection
  }
}

/**
 * Hook to get the current user's type (donor, cbo, admin)
 */
export const useUserType = () => {
  const { userId } = useAuth()
  const [userType, setUserType] = useState<'donor' | 'cbo' | 'admin' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserType = async () => {
      if (!userId) {
        setUserType(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching user type:', error)
          setUserType('donor') // Default to donor
        } else {
          setUserType(data?.user_type || 'donor')
        }
      } catch (err) {
        console.error('Error:', err)
        setUserType('donor')
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()
  }, [userId])

  return { userType, loading }
}
