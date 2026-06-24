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
import type { VerificationStatus } from '@/constants/userTypes'

import { api } from '@/lib/api'
// Clerk-Supabase JWT bridge.
//
// Code side (this file + App.tsx) wires a getter for the current Clerk
// session token. Always installed — once Supabase Third Party Auth trusts
// Clerk, `auth.uid()` in RLS becomes the signed-in Clerk user ID.
type ClerkTokenGetter = (() => Promise<string | null>) | null
type ClerkSignedInGetter = (() => boolean) | null
let clerkTokenGetter: ClerkTokenGetter = null
let clerkIsSignedInGetter: ClerkSignedInGetter = null

// H4-A: thrown when a signed-in user's Clerk session token cannot be
// refreshed for a Supabase request. The anon-key fallback is reserved
// for signed-out users only; a signed-in user with a stale/missing
// token must fail loud so callers don't silently render anon-keyed
// (RLS-blocked) empty data.
export class SupabaseAuthRefreshError extends Error {
  constructor(cause?: unknown) {
    super('Failed to refresh Clerk session for Supabase request')
    this.name = 'SupabaseAuthRefreshError'
    ;(this as any).cause = cause
  }
}

export const registerClerkTokenGetter = (
  getter: ClerkTokenGetter,
  isSignedInGetter: ClerkSignedInGetter = null
) => {
  clerkTokenGetter = getter
  clerkIsSignedInGetter = isSignedInGetter
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  // supabase-js >= 2.42 — called per-request, used as the Bearer in Authorization.
  //
  // H4-A: distinguish "signed out" (return anon, valid) from "signed in
  // but token fetch failed" (throw SupabaseAuthRefreshError). The anon
  // path is preserved only for signed-out users to keep public pages
  // working; signed-in transient failures must surface, not silently
  // degrade authority to anon (which RLS returns 0 rows for protected
  // queries).
  accessToken: async () => {
    const signedIn = clerkIsSignedInGetter ? clerkIsSignedInGetter() : false
    if (!signedIn) {
      return supabaseConfig.anonKey
    }
    if (!clerkTokenGetter) {
      throw new SupabaseAuthRefreshError('clerkTokenGetter not registered while signed in')
    }
    try {
      const token = await clerkTokenGetter()
      if (token) return token
      throw new SupabaseAuthRefreshError('Clerk getToken returned null while signed in')
    } catch (err) {
      if (err instanceof SupabaseAuthRefreshError) throw err
      throw new SupabaseAuthRefreshError(err)
    }
  },
} as any)

/**
 * @deprecated Use registerClerkTokenGetter instead.
 */
export const setSupabaseAuth = async (_clerkToken: string | null) => {
  // no-op; preserved for backwards compatibility with callers
}

/**
 * @deprecated Not used - Clerk handles all authentication
 * This function exists for potential future use but currently
 * always returns true since Clerk manages auth state.
 */
export const isSupabaseAuthenticated = (): boolean => {
  return true // Clerk handles auth - this is intentionally always true
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
  const channel = supabase
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
    .select(
      `
      *,
      organization:organizations(*),
      cause_area:cause_areas(*)
    `
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single()

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
  const { data, error } = await supabase.from('requests').insert(request).select().single()

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
        subscribed_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
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
export const checkOnboardingStatus = async (
  userId: string,
  userType: 'donor' | 'cbo' = 'donor'
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('onboarding_complete, user_type')
    .eq('id', userId)
    .single()

  if (error) {
    // If no profile exists, create one and return incomplete status
    if (error.code === 'PGRST116') {
      // Create the user profile
      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: userId,
        user_type: userType,
        onboarding_complete: false,
        wants_updates: false,
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
      const { data: urlData } = supabase.storage.from('organization-logos').getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }
  }

  // Check if org already exists for this user
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const orgPayload = {
    user_id: userId,
    name: data.name,
    website: data.website,
    ein: data.ein,
    mission: data.mission,
    email: data.email,
    logo_url: logoUrl,
    updated_at: new Date().toISOString(),
  }

  // Approval gate: new orgs are not vetted by default. Admin must set
  // user_profiles.verification_status='verified' before this org becomes publicly visible.
  if (existing) {
    const { data: orgData, error } = await supabase
      .from('organizations')
      .update(orgPayload)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return orgData
  }

  const { data: orgData, error } = await supabase
    .from('organizations')
    .insert({
      ...orgPayload,
      id: crypto.randomUUID(),
      zipcode: '',
    })
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
      updated_at: new Date().toISOString(),
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
          user_type: 'donor',
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
    .select()
    .single()

  return { data, error }
}

// W5-B1 (Phase C / Theme 4) — Per-org default campaign template
// Persisted as JSONB on organizations.default_campaign_template; consumed
// by W5-B2 to prefill the new-campaign form.
export interface OrganizationDefaults {
  creator_name?: string
  creator_role?: string
  contact_email?: string
  cause_area_ids?: string[]
  faqs?: Array<{ question: string; answer: string }>
}

export async function getOrganizationDefaults(orgId: string): Promise<OrganizationDefaults | null> {
  const { data, error } = await (supabase.from('organizations') as any)
    .select('default_campaign_template')
    .eq('id', orgId)
    .maybeSingle()
  if (error) {
    console.error('getOrganizationDefaults error:', error)
    return null
  }
  return (data?.default_campaign_template as OrganizationDefaults | null) ?? null
}

export async function updateOrganizationDefaults(
  orgId: string,
  payload: OrganizationDefaults
): Promise<void> {
  const { error } = await (supabase.from('organizations') as any)
    .update({ default_campaign_template: payload })
    .eq('id', orgId)
  if (error) throw error
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
      const { data: urlData } = supabase.storage.from('profile-pictures').getPublicUrl(fileName)
      profilePictureUrl = urlData.publicUrl
    }
  }

  // First update user_profiles with email info
  await supabase.from('user_profiles').upsert(
    {
      id: userId,
      email: data.email,
      phone: data.phone,
      profile_picture_url: profilePictureUrl,
      updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
  const records = causeAreaRecords.map((ca) => ({
    user_id: userId,
    cause_area_id: ca.id,
  }))

  // Delete existing associations first
  await supabase.from('donor_cause_areas').delete().eq('user_id', userId)

  // Insert new associations
  const { data, error } = await supabase.from('donor_cause_areas').insert(records).select()

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
  const records = causeAreaRecords.map((ca) => ({
    organization_id: organizationId,
    cause_area_id: ca.id,
  }))

  // Delete existing associations first (to handle updates)
  await supabase.from('organization_cause_areas').delete().eq('organization_id', organizationId)

  // Insert new associations
  const { data, error } = await supabase.from('organization_cause_areas').insert(records).select()

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
  beneficiariesHelped: number
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

// Fetch donor dashboard statistics. Counts BOTH requests-style donations
// (where this donor claimed/fulfilled a specific request row) and
// campaign-style donations (recorded as payment_transactions).
export const fetchDonorDashboardStats = async (donorId: string): Promise<DonorDashboardStats> => {
  const [requestsResult, txResult] = await Promise.all([
    supabase.from('requests').select('id, amount, status, cause_area_id').eq('donor_id', donorId),
    supabase
      .from('payment_transactions')
      .select('id, amount_total, status')
      .eq('donor_id', donorId),
  ])

  if (requestsResult.error) throw requestsResult.error
  if (txResult.error) throw txResult.error

  const requestRows = requestsResult.data || []
  const txRows = (txResult.data || []) as any[]

  const fulfilledFromRequests = requestRows.filter((d) => d.status === 'fulfilled')
  const claimedFromRequests = requestRows.filter((d) => d.status === 'claimed')

  // Campaign tx donations: 'succeeded' → counts toward fulfilled,
  // 'pending' → counts toward claimed (intent created, awaiting webhook).
  const fulfilledFromTx = txRows.filter((d) => d.status === 'succeeded')
  const claimedFromTx = txRows.filter((d) => d.status === 'pending')

  const totalDonations =
    fulfilledFromRequests.reduce((sum, d) => sum + Number(d.amount), 0) +
    fulfilledFromTx.reduce((sum, d) => sum + Number(d.amount_total || 0) / 100, 0)

  // Campaigns aren't tagged with cause areas in the current schema, so
  // campaign donations don't contribute to the unique-causes count.
  const causeIds = new Set<string>()
  requestRows.forEach((d) => d.cause_area_id && causeIds.add(d.cause_area_id))

  return {
    totalDonations,
    requestsFulfilled: fulfilledFromRequests.length + fulfilledFromTx.length,
    requestsClaimed: claimedFromRequests.length + claimedFromTx.length,
    causesSupported: causeIds.size,
  }
}

// Fetch donor's donation history
// Donor donation history merges two parallel sources:
// (1) `requests` rows where the donor claimed a single request directly
// (2) `payment_transactions` rows from campaign-style donations
// Stripe tx status is mapped onto the DonationRecord status union so the
// dashboard filters (claimed / fulfilled / etc.) work for both shapes:
//   tx 'succeeded' -> 'fulfilled'   (money received)
//   tx 'pending'   -> 'claimed'     (intent created, not yet confirmed)
//   tx 'failed'/'canceled' -> 'denied'
const mapTxStatusToDonationStatus = (
  txStatus: string | null
): 'open' | 'claimed' | 'fulfilled' | 'denied' => {
  switch (txStatus) {
    case 'succeeded':
      return 'fulfilled'
    case 'failed':
    case 'canceled':
      return 'denied'
    case 'pending':
    default:
      return 'claimed'
  }
}

export const fetchDonorDonations = async (
  donorId: string,
  filters?: { status?: string; search?: string }
): Promise<DonationRecord[]> => {
  // Source 1: requests-style donations
  let requestsQuery = supabase
    .from('requests')
    .select(
      `
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
    `
    )
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    requestsQuery = requestsQuery.eq(
      'status',
      filters.status as 'open' | 'claimed' | 'fulfilled' | 'denied'
    )
  }
  if (filters?.search) {
    requestsQuery = requestsQuery.ilike('description', `%${filters.search}%`)
  }

  // Source 2: campaign-style donations recorded as Stripe transactions.
  // Note: campaigns has no cause_area_id column (see migrations), so we
  // can't pull cause area from the join — donations get tagged 'General'.
  const txQuery = supabase
    .from('payment_transactions')
    .select(
      `
      id,
      amount_total,
      status,
      created_at,
      completed_at,
      campaign:campaigns(
        id,
        slug,
        organization_id,
        detail:campaign_details(content, status, version)
      ),
      organization:organizations(name, logo_emoji)
    `
    )
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false })

  const [requestsResult, txResult] = await Promise.all([requestsQuery, txQuery])

  if (requestsResult.error) throw requestsResult.error
  if (txResult.error) throw txResult.error

  const requestDonations: DonationRecord[] = (requestsResult.data || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    amount: Number(item.amount),
    status: item.status,
    urgency: item.urgency,
    organization_name: item.organization?.name || 'Unknown Organization',
    organization_logo_emoji: item.organization?.logo_emoji || 'building2',
    cause_area_name: item.cause_area?.name || 'General',
    created_at: item.created_at,
    claimed_at: item.claimed_at,
    fulfilled_at: item.fulfilled_at,
  }))

  const campaignDonations: DonationRecord[] = (txResult.data || []).map((item: any) => {
    const mappedStatus = mapTxStatusToDonationStatus(item.status)
    const campaignDetails: Array<{ content?: any; status?: string; version?: number }> =
      Array.isArray(item.campaign?.detail) ? item.campaign.detail : []
    const sortedDetails = [...campaignDetails].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
    const approvedDetail = sortedDetails.find((d) => d.status === 'approved')
    const sourceContent = (approvedDetail?.content ?? sortedDetails[0]?.content ?? {}) as {
      title?: string
    }
    const campaignTitle = sourceContent.title || 'Campaign donation'
    return {
      id: item.id,
      description: campaignTitle,
      // payment_transactions.amount_total is stored in cents
      amount: Number(item.amount_total || 0) / 100,
      status: mappedStatus,
      urgency: 'medium',
      organization_name: item.organization?.name || 'KC DIME',
      organization_logo_emoji: item.organization?.logo_emoji || 'building2',
      cause_area_name: 'General',
      created_at: item.created_at,
      claimed_at: item.created_at,
      fulfilled_at: mappedStatus === 'fulfilled' ? item.completed_at || item.created_at : null,
    }
  })

  // Apply search/status filters to campaign donations client-side so the
  // shape lines up with the requests query's filters.
  let filteredCampaigns = campaignDonations
  if (filters?.status && filters.status !== 'all') {
    filteredCampaigns = filteredCampaigns.filter((d) => d.status === filters.status)
  }
  if (filters?.search) {
    const needle = filters.search.toLowerCase()
    filteredCampaigns = filteredCampaigns.filter((d) =>
      d.description.toLowerCase().includes(needle)
    )
  }

  return [...requestDonations, ...filteredCampaigns].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )
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
    return {
      totalReceived: 0,
      activeRequests: 0,
      fulfilledRequests: 0,
      pendingRequests: 0,
      beneficiariesHelped: 0,
    }
  }

  const { data: requests, error } = await supabase
    .from('requests')
    .select('id, amount, status')
    .eq('organization_id', org.id)

  if (error) throw error

  const fulfilled = requests?.filter((r) => r.status === 'fulfilled') || []
  const active = requests?.filter((r) => r.status === 'claimed') || []
  const pending = requests?.filter((r) => r.status === 'open') || []

  return {
    totalReceived: fulfilled.reduce((sum, r) => sum + Number(r.amount), 0),
    activeRequests: active.length,
    fulfilledRequests: fulfilled.length,
    pendingRequests: pending.length,
    beneficiariesHelped: fulfilled.length,
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
    .select(
      `
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
    `
    )
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as 'open' | 'claimed' | 'fulfilled' | 'denied')
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
    fulfilled_at: item.fulfilled_at,
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
      id: crypto.randomUUID(),
      status: 'open',
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

// Slugify a campaign title for the campaigns.slug column. Lower-case,
// strip non-alphanumerics down to single dashes, trim leading/trailing
// dashes. Matches the generate_org_slug() shape used elsewhere.
const slugifyTitle = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)

// Create a new campaign.
//
// Post-REFB the campaigns row is metadata-only — title, funding_goal,
// story_content, social URLs, etc. all live in campaign_details.content.
// Both inserts MUST commit together; otherwise a failure on the
// campaign_details A14 CHECK leaves an orphan campaigns row.
//
// H3-E: collapsed two-step pattern into a single SECURITY DEFINER RPC
// (public.create_campaign_with_detail, migration 20260617000003). The
// RPC validates org ownership and stamps created_by/changed_by from the
// caller's clerk_user_id() — the client cannot spoof either field.
//
// Required content keys per migration A14: title, funding_goal,
// contact_email. The returned shape preserves { id, slug, ...campaign }
// for caller compatibility (callers navigate via campaign.slug).
export const createCampaign = async (campaignData: CampaignData) => {
  const slug = `${slugifyTitle(campaignData.title)}-${Date.now().toString(36)}`

  const content: Record<string, unknown> = {
    title: campaignData.title,
    funding_goal: campaignData.funding_goal,
    contact_email: campaignData.contact_email,
  }
  if (campaignData.creator_name !== undefined) content.creator_name = campaignData.creator_name
  if (campaignData.creator_role !== undefined) content.creator_role = campaignData.creator_role
  if (campaignData.cause_area_ids !== undefined)
    content.cause_area_ids = campaignData.cause_area_ids
  if (campaignData.short_description !== undefined)
    content.short_description = campaignData.short_description
  if (campaignData.story_title !== undefined) content.story_title = campaignData.story_title
  if (campaignData.story_content !== undefined) content.story_content = campaignData.story_content
  if (campaignData.image_url !== undefined) content.image_url = campaignData.image_url
  if (campaignData.logo_url !== undefined) content.logo_url = campaignData.logo_url
  if (campaignData.phone !== undefined) content.phone = campaignData.phone
  if (campaignData.facebook_url !== undefined) content.facebook_url = campaignData.facebook_url
  if (campaignData.twitter_url !== undefined) content.twitter_url = campaignData.twitter_url
  if (campaignData.instagram_url !== undefined) content.instagram_url = campaignData.instagram_url
  if (campaignData.linkedin_url !== undefined) content.linkedin_url = campaignData.linkedin_url
  if (campaignData.youtube_url !== undefined) content.youtube_url = campaignData.youtube_url
  if (campaignData.tiktok_url !== undefined) content.tiktok_url = campaignData.tiktok_url
  if (campaignData.website_url !== undefined) content.website_url = campaignData.website_url

  const { data: rpcResult, error: rpcError } = await (supabase as any).rpc(
    'create_campaign_with_detail',
    {
      p_organization_id: campaignData.organization_id,
      p_slug: slug,
      p_created_by: campaignData.created_by,
      p_content: content,
      p_change_summary: null,
    }
  )

  if (rpcError) throw rpcError
  if (!rpcResult) throw new Error('createCampaign: RPC returned no row')

  const { campaign_id, detail_id } = rpcResult as {
    campaign_id: string
    detail_id: string
  }

  // Preserve the prior return shape: { id, slug, ...other campaign cols,
  // detail }. The two columns callers actually read are .id and .slug;
  // everything else (organization_id, created_by, timestamps) is
  // reconstructable from inputs or fetched later. Skipping the extra
  // SELECT keeps the path single-roundtrip.
  const result: Record<string, unknown> = {
    id: campaign_id,
    slug,
    organization_id: campaignData.organization_id,
    created_by: campaignData.created_by,
    detail: { id: detail_id, version: 1, status: 'pending_initial_approval', content },
  }
  return result
}

// Get campaign by slug or id
/**
 * Shape returned by getCampaignsByOrganization — flat-spread of campaigns
 * row + latest content JSONB + derived lifecycle status.
 *
 * Used by duplicateCampaign and CBO dashboard kebab actions.
 */
export interface CampaignWithDerivedStatus {
  // Identity (from campaigns row)
  id: string
  organization_id: string
  slug?: string | null
  created_by?: string | null
  created_at?: string | null
  deleted_at?: string | null

  // Lifecycle (derived in getCampaignsByOrganization)
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'deleted'

  // Content (flat-spread from latest campaign_details.content)
  // Mirrors CampaignData optional fields — see L997+
  title?: string
  funding_goal?: number | string
  contact_email?: string
  creator_name?: string
  creator_role?: string
  cause_area_ids?: string[]
  short_description?: string
  story_title?: string
  story_content?: string
  image_url?: string | null
  logo_url?: string | null
  phone?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  website_url?: string | null

  // Forward-compat nested shapes (some callers may preserve these)
  latestApproved?: { content?: Record<string, unknown> }
  latest?: { content?: Record<string, unknown> }

  // Allow unknown extras (campaigns row may have other columns spread in)
  [key: string]: unknown
}

// Get campaigns by organization with derived title + status.
//
// Post-REFB, campaigns has no title / funding_goal / status. The CBO
// dashboard reads those, so we embed every campaign_details row, then
// reduce client-side to (a) the latest version's status — which maps
// to the lifecycle bucket — and (b) the latest APPROVED version's
// content (falling back to the latest version's content for draft /
// pending campaigns that have never been approved).
//
// Returned shape adds top-level `title`, `funding_goal`, `status` so
// existing JSX in DashboardPage keeps working unchanged.
export const getCampaignsByOrganization = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      details:campaign_details(content, status, version)
    `
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row: any) => {
    const details: Array<{ content: any; status: string; version: number }> = Array.isArray(
      row.details
    )
      ? row.details
      : []
    const sorted = [...details].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
    const latest = sorted[0]
    const latestApproved = sorted.find((d) => d.status === 'approved')

    // Lifecycle derivation mirrors backend/api/services/campaignStateMachine.js
    let derivedStatus: string
    if (row.deleted_at) {
      derivedStatus = 'deleted'
    } else if (!latest) {
      derivedStatus = 'draft'
    } else if (latest.status === 'pending_initial_approval') {
      derivedStatus = 'pending'
    } else if (latest.status === 'pending_edit_approval') {
      derivedStatus = 'pending'
    } else if (latestApproved) {
      derivedStatus = 'active'
    } else if (latest.status === 'rejected') {
      derivedStatus = 'rejected'
    } else {
      derivedStatus = 'draft'
    }

    const sourceContent = (latestApproved?.content ?? latest?.content ?? {}) as Record<
      string,
      unknown
    >
    const { details: _details, ...rest } = row
    return {
      ...sourceContent,
      ...rest,
      status: derivedStatus,
    }
  })
}

// Update campaign metadata (slug / deleted_at only).
//
// Post-REFB, content edits MUST flow through the state machine via
// POST /api/campaigns/:id/submit-edit (the route inserts a new
// campaign_details row with status pending_*_approval). This client
// helper exists only for the small whitelist of campaign-level
// metadata fields that genuinely live on the campaigns row.
export interface CampaignMetadataUpdate {
  slug?: string
  deleted_at?: string | null
}

export const updateCampaignMetadata = async (
  campaignId: string,
  updates: CampaignMetadataUpdate
) => {
  const { data, error } = await (supabase.from('campaigns') as any)
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get active campaigns (for public listing).
//
// Post-REFB, "active" = at least one approved campaign_details row exists
// AND the campaign is not soft-deleted. There is no meaningful "pending"
// public view (pending campaigns are draft-only and hidden by RLS).
//
// We use an INNER embed on campaign_details filtered to status=approved
// so PostgREST drops campaigns with no approved detail row. Each result
// row also gets the detail.content fields spread onto the top-level
// campaign object so downstream consumers can still read campaign.title,
// campaign.funding_goal, etc.
export const getActiveCampaigns = async (limit: number = 10) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      organization:organizations(id, name, slug, logo_url),
      detail:campaign_details!inner(content, status, version)
    `
    )
    .eq('detail.status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  type Detail = { content?: Record<string, unknown>; status?: string; version?: number }
  const mapped = (data || []).map((row: any) => {
    // PostgREST can return the inner embed as an array OR a single object
    // depending on FK cardinality. Normalize.
    const detail: Detail = Array.isArray(row.detail) ? row.detail[0] : row.detail
    const content = (detail?.content as Record<string, unknown> | undefined) || {}
    const version = detail?.version ?? 0
    const { detail: _detail, ...rest } = row
    return { ...content, ...rest, __detail_version: version }
  })

  // H3-D: a campaign with multiple approved detail versions (post
  // edit-approval) will appear once per approved row. PostgREST's !inner
  // join expands them into duplicate parent rows. Collapse to one row per
  // campaign.id, keeping the highest detail.version.
  const byId = new Map<string, any>()
  for (const row of mapped) {
    const existing = byId.get(row.id)
    if (!existing || (row.__detail_version ?? 0) > (existing.__detail_version ?? 0)) {
      byId.set(row.id, row)
    }
  }
  return Array.from(byId.values()).map(({ __detail_version: _v, ...rest }) => rest)
}

// Upload campaign image
export const uploadCampaignImage = async (file: File, campaignId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${campaignId}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('campaign-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('campaign-images').getPublicUrl(fileName)

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
export const fetchOrganizationQuestions = async (
  organizationId: string
): Promise<OrganizationQuestion[]> => {
  // Get all campaigns for this org. Title lives in campaign_details.content
  // post-REFB; embed the detail rows so we can pick the latest approved
  // (falling back to latest) title for display.
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select(
      `
      id,
      details:campaign_details(content, status, version)
    `
    )
    .eq('organization_id', organizationId)

  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError)
    return []
  }

  if (!campaigns?.length) return []

  const titleByCampaignId = new Map<string, string>()
  for (const c of campaigns as any[]) {
    const details: Array<{ content?: any; status?: string; version?: number }> = Array.isArray(
      c.details
    )
      ? c.details
      : []
    const sorted = [...details].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
    const approved = sorted.find((d) => d.status === 'approved')
    const content = (approved?.content ?? sorted[0]?.content ?? {}) as { title?: string }
    titleByCampaignId.set(c.id, content.title || 'Unknown Campaign')
  }

  const campaignIds = Array.from(titleByCampaignId.keys())

  // Get all questions for these campaigns
  const { data: questions, error: questionsError } = await (
    supabase.from('campaign_questions') as any
  )
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
    campaign_title: titleByCampaignId.get(q.campaign_id) || 'Unknown Campaign',
  }))
}

// Answer a question
export const answerQuestion = async (
  questionId: string,
  answer: string,
  isPublic: boolean,
  userId: string
) => {
  const { error } = await (supabase.from('campaign_questions') as any)
    .update({
      answer: answer.trim(),
      status: 'answered',
      is_public: isPublic,
      answered_at: new Date().toISOString(),
      answered_by: userId,
    })
    .eq('id', questionId)

  if (error) throw error
}

// Dismiss/reject a question
export const dismissQuestion = async (questionId: string) => {
  const { error } = await (supabase.from('campaign_questions') as any)
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
  type: string // 'tax_receipt' | 'annual_summary' | 'quarterly_statement'
  size: string
  file_url: string | null
  year: number
  quarter: number | null
  status: string
  created_at: string
  // Extended fields for receipts
  organization_id?: string
  organization_name?: string
  organization_ein?: string
  donation_amount?: number
  donation_date?: string
  receipt_number?: string
  request_id?: string
  campaign_id?: string
  donor_name?: string
  donor_email?: string
}

export const fetchDonorDocuments = async (userId: string): Promise<DonorDocument[]> => {
  const { data, error } = await (supabase.from('donor_documents') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .order('year', { ascending: false })
    .order('donation_date', { ascending: false })

  if (error) {
    console.error('Error fetching donor documents:', error)
    return []
  }
  return data || []
}

/**
 * Get download URL for a document
 *
 * H5-D: backend route now enforces clerkAuth + per-doc ownership, so we
 * route the call through api.get() to pass the Clerk Bearer token.
 */
export const getDocumentDownloadUrl = async (
  documentId: string,
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<string | null> => {
  try {
    const data = await api.get<{ url?: string | null }>(
      `/api/documents/download/${documentId}`,
      getToken
    )
    return data.url || null
  } catch (error) {
    console.error('Error getting document download URL:', error)
    return null
  }
}

/**
 * Generate annual summary for a donor
 *
 * H5-D: backend route now enforces clerkAuth + self-only guard, so we
 * route the call through api.post() to pass the Clerk Bearer token.
 */
export const generateAnnualSummary = async (
  donorId: string,
  year: number,
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<DonorDocument | null> => {
  try {
    const data = await api.post<{ document?: DonorDocument | null }>(
      '/api/documents/generate-annual-summary',
      { donorId, year },
      getToken
    )
    return data.document || null
  } catch (error) {
    console.error('Error generating annual summary:', error)
    throw error
  }
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
    const { data: summaryData } = await (supabase as any)
      .from('donor_impact_summary')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch impact by cause with cause area names
    const { data: causeData } = await (supabase as any)
      .from('donor_impact_by_cause')
      .select(
        `
        amount,
        percentage,
        cause_area:cause_areas(name)
      `
      )
      .eq('user_id', userId)
      .order('percentage', { ascending: false })

    // Fetch monthly donations
    const { data: monthlyData } = await (supabase as any)
      .from('donor_monthly_donations')
      .select('month, amount')
      .eq('user_id', userId)
      .order('year', { ascending: true })

    // Fetch impact stories
    const { data: storiesData } = await (supabase as any)
      .from('donor_impact_stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(4)

    return {
      summary: summaryData || {
        total_donated: 0,
        lives_impacted: 0,
        organizations_helped: 0,
        months_active: 0,
      },
      topCauses: (causeData || []).map((c: any) => ({
        name: c.cause_area?.name || 'Unknown',
        amount: c.amount,
        percentage: c.percentage,
      })),
      monthlyData: monthlyData || [],
      recentImpact: storiesData || [],
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

export const fetchSupportFAQs = async (
  userType: 'donor' | 'cbo' | 'all' = 'all'
): Promise<SupportFAQ[]> => {
  let query = (supabase.from('support_faqs') as any)
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
  const { data, error } = await (supabase.from('support_contact_info') as any)
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
      tax_deductible: data.total, // All donations are tax deductible
    }))
    .sort((a, b) => b.year - a.year)
}

// ============================================
// ORGANIZATION PROFILE FUNCTIONS
// ============================================

export interface OrganizationProfile {
  id: string
  user_id: string
  name: string
  website: string | null
  mission: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipcode: string
  ein: string | null
  logo_url: string | null
  logo_emoji: string
  tagline: string | null
  organization_type: string | null
  organization_size: string | null
  year_founded: number | null
  technology_barriers: string | null
  cover_image_url: string | null
  social_links: Record<string, string> | null
  program_description: string | null
  service_area_description: string | null
  created_at: string
  updated_at: string
  cause_areas?: { id: string; name: string }[]
  populations?: { id: string; name: string }[]
  user_profile?: { verification_status: VerificationStatus }
}

export interface OrganizationUpdate {
  id: string
  organization_id: string
  title: string
  content: string
  image_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationTeamMember {
  id: string
  organization_id: string
  name: string
  role: string | null
  bio: string | null
  photo_url: string | null
  email: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

// Fetch organization by ID or slug with related data.
// Callers pass either the row's primary key (e.g. "org-harvesters") or the
// public slug (e.g. "harvesters") — we look up by whichever matches.
export const fetchOrganizationProfile = async (
  organizationIdOrSlug: string
): Promise<OrganizationProfile | null> => {
  // organizations.id is a uuid column. When called with a slug, putting it in
  // an `id.eq.<slug>` predicate makes Postgres try to cast the slug to uuid and
  // throws 22P02 (invalid input syntax for type uuid), failing the whole query.
  // Only include the id predicate when the argument actually looks like a uuid.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    organizationIdOrSlug
  )

  const baseQuery = supabase.from('organizations').select(
    `
      *,
      user_profile:user_profiles!organizations_user_id_fkey(verification_status)
    `
  )

  const { data: org, error } = await (
    isUuid
      ? baseQuery.or(`id.eq.${organizationIdOrSlug},slug.eq.${organizationIdOrSlug}`)
      : baseQuery.eq('slug', organizationIdOrSlug)
  ).maybeSingle()

  if (error || !org) {
    if (error) console.error('Error fetching organization:', error)
    return null
  }

  const organizationId = (org as any).id

  // Fetch cause areas
  const { data: causeAreaLinks } = await supabase
    .from('organization_cause_areas')
    .select('cause_area_id')
    .eq('organization_id', organizationId)

  let causeAreas: { id: string; name: string }[] = []
  if (causeAreaLinks && causeAreaLinks.length > 0) {
    const causeAreaIds = causeAreaLinks.map((ca) => ca.cause_area_id)
    const { data: causes } = await supabase
      .from('cause_areas')
      .select('id, name')
      .in('id', causeAreaIds)
    causeAreas = causes || []
  }

  // Fetch populations served
  const { data: populationLinks } = await (supabase.from('organization_populations') as any)
    .select('identity_category_id')
    .eq('organization_id', organizationId)

  let populations: { id: string; name: string }[] = []
  if (populationLinks && populationLinks.length > 0) {
    const populationIds = populationLinks.map((p: any) => p.identity_category_id)
    const { data: pops } = await supabase
      .from('identity_categories')
      .select('id, name')
      .in('id', populationIds)
    populations = pops || []
  }

  return {
    ...org,
    cause_areas: causeAreas,
    populations: populations,
  } as OrganizationProfile
}

// Fetch organization by user ID
export const fetchOrganizationByUserId = async (
  userId: string
): Promise<OrganizationProfile | null> => {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error || !org) {
    return null
  }

  return fetchOrganizationProfile(org.id)
}

// Fetch organization's requests
export const fetchOrganizationRequests = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('requests')
    .select(
      `
      *,
      cause_area:cause_areas(id, name)
    `
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organization requests:', error)
    return []
  }

  return data || []
}

// Fetch organization updates
export const fetchOrganizationUpdates = async (
  organizationId: string
): Promise<OrganizationUpdate[]> => {
  const { data, error } = await (supabase.from('organization_updates') as any)
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organization updates:', error)
    return []
  }

  return data || []
}

// Fetch organization team members
export const fetchOrganizationTeamMembers = async (
  organizationId: string
): Promise<OrganizationTeamMember[]> => {
  const { data, error } = await (supabase.from('organization_team_members') as any)
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  return data || []
}

// Update organization profile
export const updateOrganizationProfile = async (
  organizationId: string,
  updates: Partial<OrganizationProfile>
) => {
  // Strip joined/virtual properties that are not real columns on organizations
  const { cause_areas: _ca, populations: _pop, user_profile: _up, ...columns } = updates
  const { data, error } = await supabase
    .from('organizations')
    .update({
      ...columns,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating organization:', error)
    throw error
  }

  return data
}

// Create organization update (news post)
export const createOrganizationUpdate = async (update: {
  organization_id: string
  title: string
  content: string
  image_url?: string
}) => {
  const { data, error } = await (supabase.from('organization_updates') as any)
    .insert({
      ...update,
      id: crypto.randomUUID(),
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating organization update:', error)
    throw error
  }

  return data
}

// Create organization team member
export const createOrganizationTeamMember = async (member: {
  organization_id: string
  name: string
  role?: string
  bio?: string
  photo_url?: string
  email?: string
  display_order?: number
}) => {
  const { data, error } = await (supabase.from('organization_team_members') as any)
    .insert({
      ...member,
      id: crypto.randomUUID(),
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating team member:', error)
    throw error
  }

  return data
}

// Update organization team member
export const updateOrganizationTeamMember = async (
  memberId: string,
  updates: Partial<OrganizationTeamMember>
) => {
  const { data, error } = await (supabase.from('organization_team_members') as any)
    .update(updates)
    .eq('id', memberId)
    .select()
    .single()

  if (error) {
    console.error('Error updating team member:', error)
    throw error
  }

  return data
}

// Delete organization team member (soft delete)
export const deleteOrganizationTeamMember = async (memberId: string) => {
  const { error } = await (supabase.from('organization_team_members') as any)
    .update({ is_active: false })
    .eq('id', memberId)

  if (error) {
    console.error('Error deleting team member:', error)
    throw error
  }
}

// Save organization populations
export const saveOrganizationPopulations = async (
  organizationId: string,
  populationIds: string[]
) => {
  // Delete existing populations
  await (supabase.from('organization_populations') as any)
    .delete()
    .eq('organization_id', organizationId)

  if (populationIds.length === 0) return []

  // Insert new populations
  const records = populationIds.map((id) => ({
    organization_id: organizationId,
    identity_category_id: id,
  }))

  const { data, error } = await (supabase.from('organization_populations') as any)
    .insert(records)
    .select()

  if (error) {
    console.error('Error saving populations:', error)
    throw error
  }

  return data
}

// Fetch identity categories (for population selection)
export const fetchIdentityCategories = async () => {
  const { data, error } = await supabase
    .from('identity_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching identity categories:', error)
    return []
  }

  return data || []
}

// ============================================
// CAMPAIGN REPORTS
// ============================================

export type CampaignReportReason = 'fraud' | 'inappropriate' | 'spam' | 'misleading' | 'other'

export interface CampaignReportData {
  campaign_id: string
  reporter_id?: string | null
  reporter_email?: string | null
  reason: CampaignReportReason
  description?: string | null
}

export interface CampaignReport extends CampaignReportData {
  id: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  admin_notes?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

// Submit a campaign report
export const submitCampaignReport = async (
  reportData: CampaignReportData
): Promise<CampaignReport> => {
  const { data, error } = await (supabase.from('campaign_reports') as any)
    .insert({
      campaign_id: reportData.campaign_id,
      reporter_id: reportData.reporter_id || null,
      reporter_email: reportData.reporter_email || null,
      reason: reportData.reason,
      description: reportData.description || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting campaign report:', error)
    throw error
  }

  return data
}

// Fetch campaign reports (for admin)
export const fetchCampaignReports = async (status?: string): Promise<CampaignReport[]> => {
  let query = (supabase.from('campaign_reports') as any)
    .select(
      `
      *,
      campaign:campaigns(
        id,
        slug,
        organization_id,
        detail:campaign_details(content, status, version)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching campaign reports:', error)
    return []
  }

  // Post-process: derive campaign.title from the latest approved detail
  // (fallback to latest) so downstream callers keep reading report.campaign.title.
  return (data || []).map((row: any) => {
    const detail: Array<{ content?: any; status?: string; version?: number }> = Array.isArray(
      row.campaign?.detail
    )
      ? row.campaign.detail
      : []
    const sorted = [...detail].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
    const approved = sorted.find((d) => d.status === 'approved')
    const content = (approved?.content ?? sorted[0]?.content ?? {}) as { title?: string }
    if (row.campaign) {
      row.campaign = {
        ...row.campaign,
        title: content.title || 'Untitled campaign',
      }
      delete row.campaign.detail
    }
    return row
  })
}

// Update campaign report status (for admin)
export const updateCampaignReportStatus = async (
  reportId: string,
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
  adminId?: string,
  adminNotes?: string
): Promise<CampaignReport | null> => {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_by = adminId
    updates.resolved_at = new Date().toISOString()
  }

  if (adminNotes) {
    updates.admin_notes = adminNotes
  }

  const { data, error } = await (supabase.from('campaign_reports') as any)
    .update(updates)
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating campaign report:', error)
    throw error
  }

  return data
}

// ============================================
// PLATFORM SETTINGS
// ============================================

export interface PlatformSetting {
  id: string
  key: string
  value: string
  value_type: 'string' | 'boolean' | 'number' | 'json'
  description: string | null
  updated_by: string | null
  updated_at: string
}

// Fetch all platform settings
export const fetchPlatformSettings = async (): Promise<Record<string, any>> => {
  const { data, error } = await (supabase.from('platform_settings') as any).select('*')

  if (error) {
    console.error('Error fetching platform settings:', error)
    return {}
  }

  // Convert to key-value object with proper types
  const settings: Record<string, any> = {}
  for (const setting of data || []) {
    let value: any = setting.value
    if (setting.value_type === 'boolean') {
      value = setting.value === 'true'
    } else if (setting.value_type === 'number') {
      value = Number(setting.value)
    } else if (setting.value_type === 'json') {
      try {
        value = JSON.parse(setting.value)
      } catch {
        value = setting.value
      }
    }
    settings[setting.key] = value
  }

  return settings
}

// Update a platform setting
export const updatePlatformSetting = async (
  key: string,
  value: any,
  adminId?: string
): Promise<void> => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)

  const { error } = await (supabase.from('platform_settings') as any)
    .update({
      value: stringValue,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)

  if (error) {
    console.error('Error updating platform setting:', error)
    throw error
  }
}

// Update multiple platform settings at once
export const updatePlatformSettings = async (
  settings: Record<string, any>,
  adminId?: string
): Promise<void> => {
  for (const [key, value] of Object.entries(settings)) {
    await updatePlatformSetting(key, value, adminId)
  }
}

// ============================================
// HISTORICAL DATA FOR ANALYTICS
// ============================================

export interface MonthlyDataPoint {
  month: string
  year: number
  count: number
  amount?: number
}

// Fetch user growth data (users created per month)
export const fetchUserGrowthData = async (months: number = 6): Promise<MonthlyDataPoint[]> => {
  const { data, error } = await (supabase.from('user_profiles') as any)
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching user growth data:', error)
    return []
  }

  // Group by month
  const monthCounts: Record<string, number> = {}
  const now = new Date()

  // Initialize last N months with 0
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthCounts[key] = 0
  }

  // Count users per month
  for (const user of data || []) {
    const date = new Date(user.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (key in monthCounts) {
      monthCounts[key]++
    }
  }

  // Convert to array format
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return Object.entries(monthCounts).map(([key, count]) => {
    const [year, month] = key.split('-').map(Number)
    return {
      month: monthNames[month - 1],
      year,
      count,
    }
  })
}

// Token getter shape matching Clerk's useAuth().getToken (mirrors api.ts).
type DonationTrendsTokenGetter = (options?: { template?: string }) => Promise<string | null>

// Donation trends — re-sourced from GET /api/admin/donations (the requests
// table is dead). Returns the backend's last-6-month succeeded buckets mapped
// to MonthlyDataPoint (month name + dollars). Signature/return type preserved
// so the AnalyticsContent→Overview chart consumer is unchanged.
export const fetchDonationTrendsData = async (
  getToken: DonationTrendsTokenGetter
): Promise<MonthlyDataPoint[]> => {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  try {
    const data = await api.get<{
      totals?: {
        monthlyTrends?: { month: number; year: number; count: number; amount: number }[]
      }
    }>('/api/admin/donations', getToken)
    const trends = data.totals?.monthlyTrends ?? []
    return trends.map((t) => ({
      // backend month is 1-12; amount is in cents → dollars for the chart.
      month: monthNames[t.month - 1] ?? String(t.month),
      year: t.year,
      count: t.count,
      amount: t.amount / 100,
    }))
  } catch (err) {
    console.error('Error fetching donation trends:', err)
    return []
  }
}

// ============================================
// ADMIN ACTIVITY LOG
// ============================================

export interface AdminActivity {
  id: string
  admin_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any> | null
  created_at: string
}

// Log admin activity
export const logAdminActivity = async (
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> => {
  const { error } = await (supabase.from('admin_activity_log') as any).insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })

  if (error) {
    console.error('Error logging admin activity:', error)
    // Don't throw - activity logging shouldn't break the main operation
  }
}

// Fetch recent admin activity.
// W4-B (Phase A8): signature extended to support filter + cursor pagination
// for AuditLogPage. `sinceIso` is exclusive upper bound on created_at, so
// callers can keep paging by passing the oldest item's timestamp.
export const fetchAdminActivity = async (
  opts: { limit?: number; action?: string; entityType?: string; sinceIso?: string } = {}
): Promise<AdminActivity[]> => {
  const { limit = 50, action, entityType, sinceIso } = opts
  let query = (supabase.from('admin_activity_log') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (action) query = query.eq('action', action)
  if (entityType) query = query.eq('entity_type', entityType)
  if (sinceIso) query = query.lt('created_at', sinceIso)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching admin activity:', error)
    return []
  }

  return data || []
}

// W7-12: resolve admin_id (TEXT, no FK) -> email/name for the audit log.
// admin_activity_log.admin_id has no FK to user_profiles, so a PostgREST
// embed won't resolve. Caller collects unique ids per page and accumulates
// the returned id->profile map across pages.
export const fetchUserProfilesByIds = async (
  ids: string[]
): Promise<Record<string, { email: string | null; name: string | null }>> => {
  if (ids.length === 0) return {}

  const { data, error } = await (supabase.from('user_profiles') as any)
    .select('id,email,name')
    .in('id', ids)

  if (error) {
    console.error('Error fetching user profiles by ids:', error)
    return {}
  }

  return ((data || []) as { id: string; email: string | null; name: string | null }[]).reduce(
    (acc, row) => {
      acc[row.id] = { email: row.email ?? null, name: row.name ?? null }
      return acc
    },
    {} as Record<string, { email: string | null; name: string | null }>
  )
}

// ============================================
// ORGANIZATION DOCUMENTS
// ============================================

export interface OrganizationDocument {
  id: string
  organization_id: string
  uploaded_by: string
  name: string
  type: string // 'tax_exempt' | '501c3' | 'annual_report' | 'financial_statement' | 'audit_report' | 'bylaws' | 'insurance' | 'other'
  size: string | null
  file_url: string | null
  year: number | null
  status: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export const ORGANIZATION_DOCUMENT_TYPES = [
  { value: 'tax_exempt', label: 'Tax Exempt Certificate' },
  { value: '501c3', label: '501(c)(3) Determination Letter' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'board_minutes', label: 'Board Minutes' },
  { value: 'bylaws', label: 'Organization Bylaws' },
  { value: 'insurance', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other' },
] as const

/**
 * Fetch all documents for an organization
 */
export const fetchOrganizationDocuments = async (
  organizationId: string
): Promise<OrganizationDocument[]> => {
  const { data, error } = await (supabase.from('organization_documents') as any)
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organization documents:', error)
    return []
  }
  return data || []
}

/**
 * Upload a document for an organization
 */
export const uploadOrganizationDocument = async (
  organizationId: string,
  uploadedBy: string,
  file: File,
  metadata: {
    name: string
    type: string
    year?: number
    description?: string
    is_public?: boolean
  }
): Promise<OrganizationDocument | null> => {
  try {
    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('organization-documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('organization-documents').getPublicUrl(fileName)

    // Create document record
    const { data, error } = await (supabase.from('organization_documents') as any)
      .insert({
        organization_id: organizationId,
        uploaded_by: uploadedBy,
        name: metadata.name,
        type: metadata.type,
        size: formatFileSize(file.size),
        file_url: urlData.publicUrl,
        year: metadata.year || new Date().getFullYear(),
        status: 'ready',
        description: metadata.description || null,
        is_public: metadata.is_public || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document record:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error uploading organization document:', error)
    return null
  }
}

/**
 * Delete an organization document
 */
export const deleteOrganizationDocument = async (documentId: string): Promise<boolean> => {
  try {
    // Get the document first to get the file URL
    const { data: doc } = await (supabase.from('organization_documents') as any)
      .select('file_url')
      .eq('id', documentId)
      .single()

    if (doc?.file_url) {
      // Extract file path from URL and delete from storage
      const url = new URL(doc.file_url)
      const filePath = url.pathname.split('/organization-documents/')[1]
      if (filePath) {
        await supabase.storage.from('organization-documents').remove([filePath])
      }
    }

    // Delete document record
    const { error } = await (supabase.from('organization_documents') as any)
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('Error deleting document:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting organization document:', error)
    return false
  }
}

/**
 * Update document metadata
 */
export const updateOrganizationDocument = async (
  documentId: string,
  updates: Partial<
    Pick<OrganizationDocument, 'name' | 'type' | 'year' | 'description' | 'is_public'>
  >
): Promise<OrganizationDocument | null> => {
  const { data, error } = await (supabase.from('organization_documents') as any)
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating document:', error)
    return null
  }

  return data
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Duplicate an existing campaign.
//
// W5-A1: copies the source campaign's content into a brand-new campaign
// that lands in `pending_initial_approval` (no fast-track) via the
// existing create_campaign_with_detail RPC. No new RPC, no Storage
// re-upload — image URLs are shared with the source.
//
// The source object is whatever `getCampaignsByOrganization` returns:
// post-REFB that helper spreads `latestApproved?.content ?? latest?.content`
// flat onto the campaign row, so title / funding_goal / contact_email /
// story_content / etc. are read directly off `sourceCampaign`. The
// `latestApproved.content` shape from the architect brief is also
// honoured if present, for forward compatibility.
export const duplicateCampaign = async (
  sourceCampaign: CampaignWithDerivedStatus,
  createdBy: string
): Promise<Awaited<ReturnType<typeof createCampaign>>> => {
  if (!sourceCampaign) {
    throw new Error('No source campaign to duplicate')
  }
  if (sourceCampaign.deleted_at) {
    throw new Error('Cannot duplicate a deleted campaign')
  }
  if (!sourceCampaign.organization_id) {
    throw new Error('Source campaign is missing organization_id')
  }

  // Prefer the architect-spec'd nested content if a future caller
  // provides it; otherwise read the flat fields that the current
  // getCampaignsByOrganization() spread produces.
  const nestedContent =
    sourceCampaign.latestApproved?.content ?? sourceCampaign.latest?.content ?? null
  const source: Record<string, unknown> = nestedContent
    ? { ...(nestedContent as Record<string, unknown>) }
    : { ...(sourceCampaign as Record<string, unknown>) }

  const sourceTitle =
    (source.title as string | undefined) ||
    (sourceCampaign.title as string | undefined) ||
    'Untitled campaign'

  const fundingGoalRaw = source.funding_goal ?? sourceCampaign.funding_goal
  const fundingGoal =
    typeof fundingGoalRaw === 'number'
      ? fundingGoalRaw
      : typeof fundingGoalRaw === 'string'
        ? parseFloat(fundingGoalRaw) || 0
        : 0

  const contactEmail =
    (source.contact_email as string | undefined) ||
    (sourceCampaign.contact_email as string | undefined) ||
    ''

  if (!contactEmail) {
    throw new Error('Source campaign is missing contact_email; cannot duplicate')
  }

  const payload: CampaignData = {
    organization_id: sourceCampaign.organization_id,
    created_by: createdBy,
    title: `Copy of ${sourceTitle}`,
    funding_goal: fundingGoal,
    contact_email: contactEmail,
  }

  // Copy every optional content field that exists on the source.
  // Skip undefined so createCampaign omits the key from the RPC payload.
  const optionalKeys: Array<keyof CampaignData> = [
    'creator_name',
    'creator_role',
    'cause_area_ids',
    'short_description',
    'story_title',
    'story_content',
    'image_url',
    'logo_url',
    'phone',
    'facebook_url',
    'twitter_url',
    'instagram_url',
    'linkedin_url',
    'youtube_url',
    'tiktok_url',
    'website_url',
  ]
  for (const key of optionalKeys) {
    const value = source[key as string]
    if (value !== undefined && value !== null) {
      ;(payload as unknown as Record<string, unknown>)[key as string] = value
    }
  }

  return createCampaign(payload)
}
