/**
 * PublishedCampaignView
 *
 * Adapter type for the public campaign detail page. Per locked decision
 * D-public-page, the donor-facing campaign render is driven by the
 * `published_detail_id` content, NOT by the live `campaigns` row content.
 *
 * Data flow:
 *   1. SELECT * FROM campaigns      → runtime row (live counters + identity)
 *   2. SELECT content FROM campaign_details WHERE id = published_detail_id
 *                                   → frozen content at last approval
 *   3. buildPublishedCampaignView() → overlays content fields on top
 *                                     of the live row, then overrides identity
 *                                     + runtime counters from the live row.
 *
 * The content is `to_jsonb(c.*)` captured at the time of approval — i.e. a
 * full campaigns row at the time of approval. Field-level types here mirror
 * the columns the CampaignPage component actually renders.
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
  approval_status: string
  published_detail_id: string | null
  created_at: string
  created_by?: string | null
  status?: string
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
}

/**
 * Build a PublishedCampaignView by overlaying published-detail content onto
 * the live campaigns row. Runtime counters + identity always win over the
 * content.
 *
 * Defensive fallback: if `content` is null (legacy campaign whose
 * `published_detail_id` is somehow NULL — should not happen post-backfill),
 * we spread the live `campaign` row directly so the page still renders.
 *
 * Pure: no side effects, no I/O.
 */
export function buildPublishedCampaignView(
  campaign: Record<string, unknown> & {
    published_detail?: { content?: PublishedCampaignContent } | null
  },
  content: PublishedCampaignContent | null
): PublishedCampaignView {
  const base: Record<string, unknown> = content
    ? { ...content }
    : { ...campaign }

  // Live-row fields that MUST NOT come from the content.
  const liveOverrides: Record<string, unknown> = {
    id: campaign.id,
    organization_id: campaign.organization_id,
    amount_raised: campaign.amount_raised,
    supporters_count: campaign.supporters_count,
    approval_status: campaign.approval_status,
    published_detail_id: campaign.published_detail_id,
    created_at: campaign.created_at,
    created_by: campaign.created_by,
    status: campaign.status,
    last_edit_approved_at: (campaign.last_edit_approved_at as string | null) ?? null,
    organization: campaign.organization,
  }

  return { ...base, ...liveOverrides } as PublishedCampaignView
}
