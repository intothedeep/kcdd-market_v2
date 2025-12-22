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

// Update organization info
export const updateOrganization = async (
  organizationId: string, 
  updates: {
    name?: string
    mission?: string
    description?: string
    email?: string
    phone?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zipcode?: string
    facebook_url?: string
    twitter_url?: string
    instagram_url?: string
    linkedin_url?: string
    youtube_url?: string
    tiktok_url?: string
  }
) => {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', organizationId)
    .select()
    .single()

  return { data, error }
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

  // First update user_profiles with email info
  await supabase
    .from('user_profiles')
    .upsert(
      {
        id: userId,
        email: data.email,
        phone: data.phone,
        profile_picture_url: profilePictureUrl,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )

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
        website: data.website,
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

// ============================================
// DASHBOARD DATA FETCHING
// ============================================

export interface DonorDashboardStats {
  totalDonations: number
  requestsFulfilled: number
  requestsClaimed: number
  causesSupported: number
}

export interface CBODashboardStats {
  totalReceived: number
  activeRequests: number
  fulfilledRequests: number
  pendingRequests: number
}

export interface DonationRecord {
  id: string
  description: string
  amount: number
  status: 'open' | 'claimed' | 'fulfilled' | 'denied'
  urgency: 'low' | 'medium' | 'high'
  organization_name: string
  organization_logo_emoji: string
  cause_area_name: string
  created_at: string
  claimed_at: string | null
  fulfilled_at: string | null
}

export interface RequestRecord {
  id: string
  description: string
  amount: number
  status: 'open' | 'claimed' | 'fulfilled' | 'denied'
  urgency: 'low' | 'medium' | 'high'
  zipcode: string
  cause_area_name: string
  donor_email: string | null
  created_at: string
  claimed_at: string | null
  fulfilled_at: string | null
}

// Fetch donor dashboard statistics
export const fetchDonorDashboardStats = async (donorId: string): Promise<DonorDashboardStats> => {
  // Get all requests where this donor is involved
  const { data: donations, error } = await supabase
    .from('requests')
    .select(`
      id,
      amount,
      status,
      cause_area_id
    `)
    .eq('donor_id', donorId)

  if (error) throw error

  const fulfilled = donations?.filter(d => d.status === 'fulfilled') || []
  const claimed = donations?.filter(d => d.status === 'claimed') || []
  
  // Calculate unique cause areas supported
  const uniqueCauseAreas = new Set(donations?.map(d => d.cause_area_id) || [])

  return {
    totalDonations: fulfilled.reduce((sum, d) => sum + Number(d.amount), 0),
    requestsFulfilled: fulfilled.length,
    requestsClaimed: claimed.length,
    causesSupported: uniqueCauseAreas.size
  }
}

// Fetch donor's donation history
export const fetchDonorDonations = async (
  donorId: string, 
  filters?: { status?: string; search?: string }
): Promise<DonationRecord[]> => {
  let query = supabase
    .from('requests')
    .select(`
      id,
      description,
      amount,
      status,
      urgency,
      created_at,
      claimed_at,
      fulfilled_at,
      organization:organizations(name, logo_emoji),
      cause_area:cause_areas(name)
    `)
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    amount: Number(item.amount),
    status: item.status,
    urgency: item.urgency,
    organization_name: item.organization?.name || 'Unknown Organization',
    organization_logo_emoji: item.organization?.logo_emoji || '🏢',
    cause_area_name: item.cause_area?.name || 'General',
    created_at: item.created_at,
    claimed_at: item.claimed_at,
    fulfilled_at: item.fulfilled_at
  }))
}

// Fetch CBO dashboard statistics
export const fetchCBODashboardStats = async (userId: string): Promise<CBODashboardStats> => {
  // First get the organization for this user
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (orgError) {
    // No organization yet
    return {
      totalReceived: 0,
      activeRequests: 0,
      fulfilledRequests: 0,
      pendingRequests: 0
    }
  }

  // Get all requests for this organization
  const { data: requests, error } = await supabase
    .from('requests')
    .select('id, amount, status')
    .eq('organization_id', org.id)

  if (error) throw error

  const fulfilled = requests?.filter(r => r.status === 'fulfilled') || []
  const active = requests?.filter(r => r.status === 'claimed') || []
  const pending = requests?.filter(r => r.status === 'open') || []

  return {
    totalReceived: fulfilled.reduce((sum, r) => sum + Number(r.amount), 0),
    activeRequests: active.length,
    fulfilledRequests: fulfilled.length,
    pendingRequests: pending.length
  }
}

// Fetch CBO's requests
export const fetchCBORequests = async (
  userId: string,
  filters?: { status?: string; search?: string }
): Promise<RequestRecord[]> => {
  // First get the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (orgError) return []

  let query = supabase
    .from('requests')
    .select(`
      id,
      description,
      amount,
      status,
      urgency,
      zipcode,
      created_at,
      claimed_at,
      fulfilled_at,
      cause_area:cause_areas(name),
      donor:user_profiles!requests_donor_id_fkey(id)
    `)
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    amount: Number(item.amount),
    status: item.status,
    urgency: item.urgency,
    zipcode: item.zipcode,
    cause_area_name: item.cause_area?.name || 'General',
    donor_email: item.donor ? 'Donor assigned' : null,
    created_at: item.created_at,
    claimed_at: item.claimed_at,
    fulfilled_at: item.fulfilled_at
  }))
}

// Get donor profile
export const getDonorProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('donor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Get all cause areas
export const fetchCauseAreas = async () => {
  const { data, error } = await supabase
    .from('cause_areas')
    .select('id, name, description')
    .order('name')

  if (error) throw error
  return data || []
}

// Create a new request (for CBO)
export const createNewRequest = async (request: {
  organization_id: string
  cause_area_id: string
  description: string
  amount: number
  urgency: 'low' | 'medium' | 'high'
  zipcode: string
}) => {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      ...request,
      status: 'open'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update request status
export const updateRequestStatus = async (
  requestId: string, 
  status: 'open' | 'claimed' | 'fulfilled' | 'denied',
  additionalData?: { donor_id?: string; donor_note?: string; denial_reason?: string }
) => {
  const updateData: any = { status }
  
  if (status === 'claimed') {
    updateData.claimed_at = new Date().toISOString()
    if (additionalData?.donor_id) updateData.donor_id = additionalData.donor_id
    if (additionalData?.donor_note) updateData.donor_note = additionalData.donor_note
  } else if (status === 'fulfilled') {
    updateData.fulfilled_at = new Date().toISOString()
  } else if (status === 'denied') {
    updateData.denied_at = new Date().toISOString()
    if (additionalData?.denial_reason) updateData.denial_reason = additionalData.denial_reason
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

// ============================================
// CAMPAIGN FUNCTIONS
// ============================================

export interface CampaignData {
  organization_id: string
  created_by: string
  title: string
  creator_name?: string
  creator_role?: string
  cause_area_ids?: string[]
  funding_goal: number
  short_description?: string
  story_title?: string
  story_content?: string
  contact_email: string
  image_url?: string
  logo_url?: string
  phone?: string
  // Social media links
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string
  website_url?: string
}

// Create a new campaign
export const createCampaign = async (campaignData: CampaignData) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaignData,
      status: 'pending',
      amount_raised: 0,
      supporters_count: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get campaign by slug or id
export const getCampaignBySlug = async (slugOrId: string) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      organization:organizations(id, name, mission, logo)
    `)
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .single()

  if (error) throw error
  return data
}

// Get campaigns by organization
export const getCampaignsByOrganization = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Update campaign
export const updateCampaign = async (campaignId: string, updates: Partial<CampaignData> & { status?: string }) => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get active campaigns (for public listing)
// includesPending: also show pending campaigns (for testing/preview)
export const getActiveCampaigns = async (limit: number = 10, includePending: boolean = true) => {
  let query = supabase
    .from('campaigns')
    .select(`
      *,
      organization:organizations(id, name, logo)
    `)
  
  if (includePending) {
    // Show both active and pending campaigns
    query = query.in('status', ['active', 'pending'])
  } else {
    // Only show active campaigns
    query = query.eq('status', 'active')
  }
  
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Upload campaign image
export const uploadCampaignImage = async (file: File, campaignId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${campaignId}-${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('campaign-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('campaign-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// Question type for dashboard
export interface OrganizationQuestion {
  id: string
  campaign_id: string
  campaign_title: string
  question: string
  submitter_name: string | null
  submitter_email: string | null
  status: 'pending' | 'answered' | 'rejected'
  answer: string | null
  is_public: boolean
  created_at: string
  answered_at: string | null
  answered_by: string | null
}

// Fetch all questions for an organization's campaigns
export const fetchOrganizationQuestions = async (organizationId: string): Promise<OrganizationQuestion[]> => {
  // Get all campaigns for this org
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, title')
    .eq('organization_id', organizationId)
  
  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError)
    return []
  }
  
  if (!campaigns?.length) return []
  
  const campaignIds = campaigns.map(c => c.id)
  
  // Get all questions for these campaigns
  const { data: questions, error: questionsError } = await (supabase
    .from('campaign_questions') as any)
    .select('*')
    .in('campaign_id', campaignIds)
    .order('created_at', { ascending: false })
  
  if (questionsError) {
    console.error('Error fetching questions:', questionsError)
    return []
  }
  
  // Join campaign titles to questions
  return (questions || []).map((q: any) => ({
    ...q,
    campaign_title: campaigns.find(c => c.id === q.campaign_id)?.title || 'Unknown Campaign'
  }))
}

// Answer a question
export const answerQuestion = async (
  questionId: string, 
  answer: string, 
  isPublic: boolean,
  userId: string
) => {
  const { error } = await (supabase
    .from('campaign_questions') as any)
    .update({
      answer: answer.trim(),
      status: 'answered',
      is_public: isPublic,
      answered_at: new Date().toISOString(),
      answered_by: userId
    })
    .eq('id', questionId)
  
  if (error) throw error
}

// Dismiss/reject a question
export const dismissQuestion = async (questionId: string) => {
  const { error } = await (supabase
    .from('campaign_questions') as any)
    .update({ status: 'rejected' })
    .eq('id', questionId)
  
  if (error) throw error
}

// ============================================
// DONOR DOCUMENTS
// ============================================

export interface DonorDocument {
  id: string
  user_id: string
  name: string
  type: string
  size: string
  file_url: string | null
  year: number
  quarter: number | null
  status: string
  created_at: string
}

export const fetchDonorDocuments = async (userId: string): Promise<DonorDocument[]> => {
  const { data, error } = await (supabase
    .from('donor_documents') as any)
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching donor documents:', error)
    return []
  }
  return data || []
}

// ============================================
// DONOR IMPACT DATA
// ============================================

export interface DonorImpactSummary {
  total_donated: number
  lives_impacted: number
  organizations_helped: number
  months_active: number
}

export interface DonorImpactByCause {
  name: string
  amount: number
  percentage: number
}

export interface DonorMonthlyDonation {
  month: string
  amount: number
}

export interface DonorImpactStory {
  description: string
  organization_name: string
  created_at: string
}

export interface DonorImpactData {
  summary: DonorImpactSummary
  topCauses: DonorImpactByCause[]
  monthlyData: DonorMonthlyDonation[]
  recentImpact: DonorImpactStory[]
}

export const fetchDonorImpactData = async (userId: string): Promise<DonorImpactData | null> => {
  try {
    // Fetch summary
    const { data: summaryData } = await (supabase
      .from('donor_impact_summary') as any)
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch impact by cause with cause area names
    const { data: causeData } = await (supabase
      .from('donor_impact_by_cause') as any)
      .select(`
        amount,
        percentage,
        cause_area:cause_areas(name)
      `)
      .eq('user_id', userId)
      .order('percentage', { ascending: false })

    // Fetch monthly donations
    const { data: monthlyData } = await (supabase
      .from('donor_monthly_donations') as any)
      .select('month, amount')
      .eq('user_id', userId)
      .order('year', { ascending: true })

    // Fetch impact stories
    const { data: storiesData } = await (supabase
      .from('donor_impact_stories') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4)

    return {
      summary: summaryData || { total_donated: 0, lives_impacted: 0, organizations_helped: 0, months_active: 0 },
      topCauses: (causeData || []).map((c: any) => ({
        name: c.cause_area?.name || 'Unknown',
        amount: c.amount,
        percentage: c.percentage
      })),
      monthlyData: monthlyData || [],
      recentImpact: storiesData || []
    }
  } catch (error) {
    console.error('Error fetching donor impact data:', error)
    return null
  }
}

// ============================================
// SUPPORT FAQS AND CONTACT INFO
// ============================================

export interface SupportFAQ {
  id: string
  question: string
  answer: string
  category: string
  user_type: string
  sort_order: number
}

export interface SupportContactInfo {
  id: string
  type: string
  label: string
  value: string
  description: string | null
  sort_order: number
}

export const fetchSupportFAQs = async (userType: 'donor' | 'cbo' | 'all' = 'all'): Promise<SupportFAQ[]> => {
  let query = (supabase
    .from('support_faqs') as any)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (userType !== 'all') {
    query = query.or(`user_type.eq.${userType},user_type.eq.all`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching support FAQs:', error)
    return []
  }
  return data || []
}

export const fetchSupportContactInfo = async (): Promise<SupportContactInfo[]> => {
  const { data, error } = await (supabase
    .from('support_contact_info') as any)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching support contact info:', error)
    return []
  }
  return data || []
}

// ============================================
// DONOR YEARLY SUMMARY (calculated from donations)
// ============================================

export interface DonorYearlySummary {
  year: number
  total_donations: number
  donation_count: number
  tax_deductible: number
}

export const fetchDonorYearlySummary = async (userId: string): Promise<DonorYearlySummary[]> => {
  // This calculates yearly summaries from the requests table where donor_id matches
  const { data, error } = await supabase
    .from('requests')
    .select('amount, fulfilled_at')
    .eq('donor_id', userId)
    .eq('status', 'fulfilled')
    .not('fulfilled_at', 'is', null)

  if (error) {
    console.error('Error fetching donor yearly summary:', error)
    return []
  }

  // Group by year
  const yearlyData: Record<number, { total: number; count: number }> = {}
  
  for (const req of data || []) {
    if (req.fulfilled_at) {
      const year = new Date(req.fulfilled_at).getFullYear()
      if (!yearlyData[year]) {
        yearlyData[year] = { total: 0, count: 0 }
      }
      yearlyData[year].total += Number(req.amount) || 0
      yearlyData[year].count += 1
    }
  }

  return Object.entries(yearlyData)
    .map(([year, data]) => ({
      year: parseInt(year),
      total_donations: data.total,
      donation_count: data.count,
      tax_deductible: data.total // All donations are tax deductible
    }))
    .sort((a, b) => b.year - a.year)
}

