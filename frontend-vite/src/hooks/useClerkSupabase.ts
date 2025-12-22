/**
 * Clerk + Supabase Integration Hook
 * 
 * This hook syncs Clerk authentication with Supabase.
 * It automatically creates a user profile in Supabase when a new user signs in.
 * 
 * Documentation:
 * - Clerk useAuth: https://clerk.com/docs/references/react/use-auth
 * - Clerk useUser: https://clerk.com/docs/references/react/use-user
 */

import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useClerkSupabase = () => {
  const { getToken, isLoaded: authLoaded, userId } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [isProfileSynced, setIsProfileSynced] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const syncUserToSupabase = async () => {
      // Wait for both auth and user to be loaded
      if (!authLoaded || !userLoaded) return
      
      // No user signed in
      if (!userId || !user) {
        setIsProfileSynced(false)
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

        // If profile doesn't exist, create it
        if (!existingProfile) {
          console.log('Creating new user profile for:', userId)
          
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              user_type: 'donor', // Default to donor, can be changed later
              is_vetted: false,
              onboarding_complete: false,
              wants_updates: false
            })

          if (insertError) {
            console.error('Error creating user profile:', insertError)
          } else {
            console.log('✅ User profile created successfully')
            
            // Also create a donor profile with basic info from Clerk
            const { error: donorError } = await supabase
              .from('donor_profiles')
              .insert({
                user_id: userId,
                display_name: user.firstName || user.username || 'Anonymous',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
                email: user.primaryEmailAddress?.emailAddress || '',
                phone: user.primaryPhoneNumber?.phoneNumber || null,
                bio: null,
                max_per_request: 500,
                service_area_zipcode: null
              })

            if (donorError && donorError.code !== '23505') {
              // 23505 = unique constraint violation (profile already exists)
              console.error('Error creating donor profile:', donorError)
            }
          }
        } else {
          console.log('User profile already exists:', existingProfile.id)
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
  }, [userId])

  return {
    isReady: authLoaded && userLoaded && (isProfileSynced || !userId),
    userId,
    user,
    isProfileSynced,
    isSyncing
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
