/**
 * PublishedCampaignView
 *
 * Adapter type for the public campaign detail page. Per locked decision
 * D-public-page, the donor-facing campaign render is driven by the latest
 * approved `campaign_details` row, NOT by the live `campaigns` row.
 *
 * Data flow (post-REFB — campaigns has no state column, no published pointer):
 *   1. SELECT * FROM campaigns                 → runtime row (counters + identity)
 *   2. SELECT content, version FROM campaign_details
 *        WHERE campaign_id = $1 AND status = 'approved'
 *        ORDER BY version DESC LIMIT 1         → latest approved content
 *   3. buildPublishedCampaignView()            → overlays content fields on top
 *                                                of the live row, then overrides
 *                                                identity + runtime counters
 *                                                from the live row.
 *
 * The content blob is `to_jsonb(c.*)`-shaped data captured when the editor
 * submitted that revision. Field-level types here mirror the columns the
 * CampaignPage component actually renders.
 *
 * The `[key: string]: unknown` index signature is deliberate: existing JSX
 * in CampaignPage.tsx still reads legacy fields (social URLs, etc.) directly
 * off `campaign.*`. Index signature keeps those accesses compiling without a
 * cascade refactor.
 */

export interface PublishedCampaignContent {
  // Content fields — overlay onto the view
  title?: string
  slug?: string
  short_description?: string | null
  story_title?: string | null
  story_content?: string | null
  image_url?: string | null
  logo_url?: string | null
  funding_goal?: number | null
  cause_area_ids?: string[] | null
  creator_name?: string | null
  creator_role?: string | null
  contact_email?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  instagram_url?: string | null
  linkedin_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  website_url?: string | null
  phone?: string | null
  // Content may contain any other column from the campaigns row.
  [key: string]: unknown
}

export interface PublishedCampaignViewOrganization {
  id: string
  name: string
  slug?: string
  mission: string | null
  logo_url: string | null
  stripe_charges_enabled?: boolean
}

export interface PublishedCampaignView {
  // ----- Identity + runtime counters (live, NOT from content) -----
  id: string
  organization_id: string | null
  amount_raised: number
  supporters_count: number
  created_at: string
  created_by?: string | null
  first_approved_at: string | null
  last_edit_approved_at: string | null

  // ----- Content (overlay from published detail) -----
  title: string
  slug: string
  short_description: string | null
  story_title: string | null
  story_content: string | null
  image_url: string | null
  logo_url: string | null
  funding_goal: number
  cause_area_ids: string[] | null
  creator_name: string | null
  creator_role: string | null
  contact_email: string | null
  facebook_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
  website_url: string | null
  phone: string | null

  // ----- Joined org (live, separate join) -----
  organization: PublishedCampaignViewOrganization

  // Indexer so existing JSX accessing legacy fields keeps compiling.
  [key: string]: unknown

  // Sentinel flag the caller can read to render a "no published detail"
  // placeholder. True only when there is no approved content overlay.
  hasContent: boolean
}

/**
 * Build a PublishedCampaignView by overlaying published-detail content onto
 * the live campaigns row. Runtime counters + identity always win over the
 * content.
 *
 * Post-REFB, the live `campaigns` row carries NO content columns (title,
 * funding_goal, story_content, etc. were dropped — see migration
 * 20260616000002_campaigns_drop_content_columns.sql). The legacy
 * "fallback: spread the live row when content is null" path therefore
 * produced an all-undefined view. We now signal the null-content case
 * explicitly via `hasContent: false` so callers can render a placeholder
 * instead of an undefined page.
 *
 * Pure: no side effects, no I/O.
 */
export function buildPublishedCampaignView(
  campaign: Record<string, unknown>,
  content: PublishedCampaignContent | null
): PublishedCampaignView {
  const base: Record<string, unknown> = content ? { ...content } : {}

  // Live-row fields that MUST NOT come from the content.
  const liveOverrides: Record<string, unknown> = {
    id: campaign.id,
    organization_id: campaign.organization_id,
    amount_raised: campaign.amount_raised,
    supporters_count: campaign.supporters_count,
    created_at: campaign.created_at,
    created_by: campaign.created_by,
    first_approved_at: (campaign.first_approved_at as string | null) ?? null,
    last_edit_approved_at: (campaign.last_edit_approved_at as string | null) ?? null,
    organization: campaign.organization,
  }

  return {
    ...base,
    ...liveOverrides,
    hasContent: content !== null,
  } as PublishedCampaignView
}
