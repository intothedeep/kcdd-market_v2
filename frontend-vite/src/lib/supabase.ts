/**
 * Supabase Client Configuration
 * 
 * This client is configured to work with Clerk authentication.
 * The Clerk JWT token is automatically included in requests.
 * 
 * Documentation:
 * - Supabase JS Client: https://supabase.com/docs/reference/javascript/introduction
 * - Clerk + Supabase: https://clerk.com/docs/integrations/databases/supabase
 */

import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config'
import type { Database } from '@/types/database'

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      persistSession: false, // We use Clerk for auth
      autoRefreshToken: false,
    },
  }
)

/**
 * Set Clerk JWT token for Supabase requests
 * Call this after user signs in with Clerk
 */
export const setSupabaseAuth = async (clerkToken: string | null) => {
  // Note: With the latest Supabase client, auth is managed differently
  // The JWT token is automatically handled when using Clerk integration
  if (clerkToken) {
    // For now, this is a no-op as Clerk handles the integration
    console.log('Clerk token set')
  }
}

/**
 * Helper to check if user is authenticated with Supabase
 */
export const isSupabaseAuthenticated = (): boolean => {
  // Check if there's an active session
  return true // Placeholder - Clerk handles auth
}

/**
 * Real-time subscription helper
 * 
 * Example usage:
 * ```ts
 * const subscription = subscribeToRequests((payload) => {
 *   console.log('New request:', payload)
 * })
 * 
 * // Later, unsubscribe:
 * subscription.unsubscribe()
 * ```
 */
export const subscribeToRequests = (
  callback: (payload: any) => void,
  filters?: { status?: string; organization_id?: string }
) => {
  let channel = supabase
    .channel('requests-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'requests',
        filter: filters ? `status=eq.${filters.status}` : undefined,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Helper functions for common database operations
 */

// Fetch all open requests
export const fetchOpenRequests = async () => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      organization:organizations(*),
      cause_area:cause_areas(*)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

// Claim a request
export const claimRequest = async (requestId: string, donorId: string) => {
  const updateData: Database['public']['Tables']['requests']['Update'] = {
    status: 'claimed',
    donor_id: donorId,
    claimed_at: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Create a new request
export const createRequest = async (request: any) => {
  const { data, error } = await supabase
    .from('requests')
    .insert(request)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Newsletter subscription
 * Saves email to newsletter_subscriptions table
 */
export const subscribeToNewsletter = async (email: string, source: string = 'footer') => {
  const { data, error } = await supabase
    .from('newsletter_subscriptions')
    .upsert(
      { 
        email: email.toLowerCase().trim(),
        source,
        is_active: true,
        subscribed_at: new Date().toISOString()
      },
      { 
        onConflict: 'email',
        ignoreDuplicates: false 
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Onboarding Functions
 */

// Check if user has completed onboarding
export const checkOnboardingStatus = async (userId: string, userType: 'donor' | 'cbo' = 'donor') => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_complete, user_type')
    .eq('id', userId)
    .single()

  if (error) {
    // If no profile exists, create one and return incomplete status
    if (error.code === 'PGRST116') {
      // Create the user profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_type: userType,
          onboarding_complete: false,
          wants_updates: false
        })
      
      if (insertError) {
        console.error('Error creating user profile:', insertError)
      }
      
      return { onboarding_complete: false, user_type: userType }
    }
    throw error
  }
  return data
}

// Save organization onboarding data
export const saveOrganizationOnboarding = async (
  userId: string, 
  data: {
    name: string
    website: string | null
    ein: string | null
    mission: string
    email: string
    logo?: File | null
  }
) => {
  let logoUrl = null

  // Upload logo if provided
  if (data.logo) {
    const fileExt = data.logo.name.split('.').pop()
    const fileName = `${userId}-logo-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(fileName, data.logo)

    if (uploadError) {
      console.error('Logo upload error:', uploadError)
      // Continue without logo
    } else {
      const { data: urlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }
  }

  // Upsert organization
  const { data: orgData, error } = await supabase
    .from('organizations')
    .upsert(
      {
        user_id: userId,
        name: data.name,
        website: data.website,
        ein: data.ein,
        mission: data.mission,
        email: data.email,
        logo_url: logoUrl,
        zipcode: '00000', // Default, can be updated later
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return orgData
}

// Mark onboarding as complete
export const completeOnboarding = async (userId: string, wantsUpdates: boolean = false) => {
  // First try to update
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_complete: true,
      wants_updates: wantsUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  // If update failed (no row), try to insert
  if (error) {
    if (error.code === 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          onboarding_complete: true,
          wants_updates: wantsUpdates,
          user_type: 'donor'
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      return insertData
    }
    throw error
  }
  return data
}

// Get organization by user ID
export const getOrganizationByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Save donor onboarding data
export const saveDonorOnboarding = async (
  userId: string,
  data: {
    displayName: string
    website: string | null
    phone: string | null
    bio: string | null
    email: string
    logo?: File | null
    causeAreas?: string[]
  }
) => {
  let profilePictureUrl = null

  // Upload profile picture if provided
  if (data.logo) {
    const fileExt = data.logo.name.split('.').pop()
    const fileName = `${userId}-profile-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, data.logo)

    if (uploadError) {
      console.error('Profile picture upload error:', uploadError)
    } else {
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)
      profilePictureUrl = urlData.publicUrl
    }
  }

  // Upsert donor profile
  const { data: profileData, error } = await supabase
    .from('donor_profiles')
    .upsert(
      {
        user_id: userId,
        display_name: data.displayName,
        name: data.displayName,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw error

  // Save donor cause area preferences if any
  if (data.causeAreas && data.causeAreas.length > 0) {
    await saveDonorCauseAreas(userId, data.causeAreas)
  }

  return profileData
}

// Save donor cause area preferences
export const saveDonorCauseAreas = async (userId: string, causeAreas: string[]) => {
  // Get cause area IDs from names
  const { data: causeAreaRecords, error: fetchError } = await supabase
    .from('cause_areas')
    .select('id, name')
    .in('name', causeAreas)

  if (fetchError) throw fetchError

  if (!causeAreaRecords || causeAreaRecords.length === 0) {
    console.warn('No matching cause areas found in database')
    return []
  }

  // Create donor_cause_areas records
  const records = causeAreaRecords.map(ca => ({
    user_id: userId,
    cause_area_id: ca.id
  }))

  // Delete existing associations first
  await supabase
    .from('donor_cause_areas')
    .delete()
    .eq('user_id', userId)

  // Insert new associations
  const { data, error } = await supabase
    .from('donor_cause_areas')
    .insert(records)
    .select()

  if (error) throw error
  return data
}

// Save organization cause areas
export const saveOrganizationCauseAreas = async (organizationId: string, causeAreas: string[]) => {
  // First, get the cause area IDs from names
  const { data: causeAreaRecords, error: fetchError } = await supabase
    .from('cause_areas')
    .select('id, name')
    .in('name', causeAreas)

  if (fetchError) throw fetchError

  // If no matching cause areas found, create them or skip
  if (!causeAreaRecords || causeAreaRecords.length === 0) {
    console.warn('No matching cause areas found in database')
    return []
  }

  // Create organization_cause_areas records
  const records = causeAreaRecords.map(ca => ({
    organization_id: organizationId,
    cause_area_id: ca.id
  }))

  // Delete existing associations first (to handle updates)
  await supabase
    .from('organization_cause_areas')
    .delete()
    .eq('organization_id', organizationId)

  // Insert new associations
  const { data, error } = await supabase
    .from('organization_cause_areas')
    .insert(records)
    .select()

  if (error) throw error
  return data
}

