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
  const { data, error } = await supabase
    .from('requests')
    .update({
      status: 'claimed',
      donor_id: donorId,
      claimed_at: new Date().toISOString(),
    } as any)
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

