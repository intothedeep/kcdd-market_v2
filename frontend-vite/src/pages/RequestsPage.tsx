/**
 * Browse Campaigns Page
 * Shows active campaigns as cards for donors to browse and support
 * Supports filtering by cause area tags
 */

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getActiveCampaigns, supabase } from '@/lib/supabase'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Search, Target, Users, Loader2, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 15

interface Campaign {
  id: string
  title: string
  slug: string
  creator_name: string
  short_description: string
  funding_goal: number
  amount_raised: number
  supporters_count: number
  image_url: string | null
  logo_url: string | null
  cause_area_ids: string[]
  created_at: string
  organization: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

interface CauseArea {
  id: string
  name: string
}

interface OrgChip {
  id: string
  name: string
  logo_url: string | null
}

export function RequestsPage() {
  const [searchParams] = useSearchParams()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [causeAreas, setCauseAreas] = useState<CauseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    searchParams.get('organization')
  )
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadData = async () => {
      // Load campaigns and cause areas independently so a failure in one
      // (e.g. an embed/RLS error on cause_areas) does not silently wipe out
      // the campaigns grid — the primary content of this page.
      const [campaignsResult, causeAreasResult] = await Promise.allSettled([
        getActiveCampaigns(200),
        supabase.from('cause_areas').select('id, name').order('name'),
      ])

      if (campaignsResult.status === 'fulfilled') {
        setCampaigns((campaignsResult.value as Campaign[]) || [])
      } else {
        console.error('Error loading campaigns:', campaignsResult.reason)
      }

      if (causeAreasResult.status === 'fulfilled') {
        const { data, error } = causeAreasResult.value
        if (error) console.error('Error loading cause areas:', error)
        setCauseAreas((data as CauseArea[]) || [])
      } else {
        console.error('Error loading cause areas:', causeAreasResult.reason)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Reset to page 1 whenever the filter/search changes so users don't
  // land on an empty page after narrowing results.
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags, selectedOrgId])

  // Deduped, name-sorted list of organizations derived from loaded campaigns.
  // No extra fetch — getActiveCampaigns already embeds the organization.
  const organizations: OrgChip[] = Array.from(
    campaigns
      .reduce((map, campaign) => {
        const org = campaign.organization
        if (org?.id && !map.has(org.id)) {
          map.set(org.id, { id: org.id, name: org.name, logo_url: org.logo_url })
        }
        return map
      }, new Map<string, OrgChip>())
      .values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const getCauseAreaNames = (causeAreaIds: string[]) => {
    return causeAreas
      .filter((ca) => causeAreaIds.includes(ca.id))
      .map((ca) => ca.name)
      .slice(0, 2) // Show max 2 tags
  }

  const calculateProgress = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const clearTags = () => {
    setSelectedTags([])
  }

  // Filter campaigns by search query AND selected tags AND selected org
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Search filter
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    // Tag filter - campaign must have ALL selected tags
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tagId) => campaign.cause_area_ids?.includes(tagId))

    // Org filter
    const matchesOrg = !selectedOrgId || campaign.organization?.id === selectedOrgId

    return matchesSearch && matchesTags && matchesOrg
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a]">Browse Campaigns</h1>
          <p className="mt-2 text-lg text-[#737373]">
            Fund a multi-device campaign — every campaign goes to verified Kansas Citians.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#737373]" />
            <Input
              type="search"
              placeholder="Search campaigns, organizations, or causes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 border-[#e5e5e5] bg-white pl-10 text-base"
            />
          </div>
          <Button
            variant={showTagFilter ? 'default' : 'outline'}
            onClick={() => setShowTagFilter(!showTagFilter)}
            className={`h-12 px-4 ${showTagFilter ? 'bg-[#1b5858] hover:bg-[#164444]' : ''}`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter by Cause
            {selectedTags.length > 0 && (
              <Badge className="ml-2 bg-white text-[#1b5858]">{selectedTags.length}</Badge>
            )}
          </Button>
        </div>

        {/* Organization Chips */}
        {organizations.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOrgId(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                selectedOrgId === null
                  ? 'bg-[#1b5858] text-white'
                  : 'bg-[#f5f5f5] text-[#737373] hover:bg-[#e5e5e5]'
              }`}
            >
              All
            </button>
            {organizations.map((org) => {
              const isSelected = selectedOrgId === org.id
              return (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(isSelected ? null : org.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#1b5858] text-white'
                      : 'bg-[#f5f5f5] text-[#737373] hover:bg-[#e5e5e5]'
                  }`}
                >
                  {org.logo_url && (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  {org.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Tag Filter Panel */}
        {showTagFilter && (
          <div className="mb-6 rounded-lg border border-[#e5e5e5] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-[#0a0a0a]">Filter by Cause Area</h3>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearTags} className="text-[#737373]">
                  <X className="mr-1 h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {causeAreas.map((area) => {
                const isSelected = selectedTags.includes(area.id)
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleTag(area.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#1b5858] text-white'
                        : 'bg-[#f5f5f5] text-[#737373] hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {area.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Tags Display */}
        {selectedTags.length > 0 && !showTagFilter && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#737373]">Filtering by:</span>
            {selectedTags.map((tagId) => {
              const area = causeAreas.find((ca) => ca.id === tagId)
              return area ? (
                <Badge
                  key={tagId}
                  className="cursor-pointer bg-[#1b5858] text-white hover:bg-[#164444]"
                  onClick={() => toggleTag(tagId)}
                >
                  {area.name}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ) : null
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTags}
              className="h-6 px-2 text-[#737373]"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count + Page indicator */}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE))
          const safePage = Math.min(page, totalPages)
          const startIdx = (safePage - 1) * PAGE_SIZE
          const endIdx = Math.min(filteredCampaigns.length, startIdx + PAGE_SIZE)
          return (
            <div className="mb-4 flex items-center justify-between text-sm text-[#737373]">
              <span>
                Showing {filteredCampaigns.length === 0 ? 0 : startIdx + 1}
                {filteredCampaigns.length > 0 ? `–${endIdx}` : ''} of {filteredCampaigns.length}{' '}
                campaign
                {filteredCampaigns.length !== 1 ? 's' : ''}
              </span>
              {totalPages > 1 && (
                <span>
                  Page {safePage} of {totalPages}
                </span>
              )}
            </div>
          )
        })()}

        {/* Campaigns Grid */}
        <div>
          {filteredCampaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-[#737373]" />
                <p className="text-lg text-[#737373]">No active campaigns at this time.</p>
                <p className="mt-1 text-sm text-[#737373]">
                  Check back soon for new opportunities to give.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns
                .slice(
                  (Math.min(page, Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE))) -
                    1) *
                    PAGE_SIZE,
                  Math.min(page, Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE))) *
                    PAGE_SIZE
                )
                .map((campaign) => (
                  <div key={campaign.id} className="group">
                    <Card className="flex h-full flex-col overflow-hidden border-[#e5e5e5] transition-shadow duration-200 hover:shadow-lg">
                      <Link to={`/campaign/${campaign.slug}`} className="block">
                        {/* Campaign Image */}
                        <div className="relative aspect-video overflow-hidden bg-[#f5f5f5]">
                          {campaign.image_url ? (
                            <>
                              <img
                                src={campaign.image_url}
                                alt={campaign.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {campaign.image_url.includes('kcdd_placeholder=1') && (
                                <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                  Placeholder photo
                                </span>
                              )}
                            </>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1b5858] to-[#103032]">
                              {campaign.logo_url ? (
                                <img
                                  src={campaign.logo_url}
                                  alt={campaign.organization?.name}
                                  className="h-16 w-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                                  <span className="text-2xl font-bold text-white">
                                    {campaign.organization?.name?.charAt(0) || 'C'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Cause Area Tags */}
                          {campaign.cause_area_ids?.length > 0 && (
                            <div className="absolute bottom-2 left-2 flex gap-1">
                              {getCauseAreaNames(campaign.cause_area_ids).map((name) => (
                                <Badge
                                  key={name}
                                  variant="secondary"
                                  className="bg-white/90 text-xs text-[#0a0a0a]"
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <CardHeader className="pb-2">
                          <CardDescription className="font-medium text-[#ea580c]">
                            {campaign.organization?.name}
                          </CardDescription>
                          <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-[#ea580c]">
                            {campaign.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 pb-3">
                          <p className="line-clamp-2 text-sm text-[#737373]">
                            {campaign.short_description}
                          </p>
                        </CardContent>
                      </Link>

                      {/* YELLOW Y5: card-level click-to-org affordance restored
                          without nesting anchors. Outer card wrapper is a <div>
                          (W4-H refactor); inner Link wraps only image+title+desc;
                          this Link sits between Link and CardFooter as a sibling. */}
                      {campaign.organization?.name && campaign.organization?.slug && (
                        <div className="px-6 pt-2 text-xs text-neutral-500">
                          by{' '}
                          <Link
                            to={`/organizations/${campaign.organization.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-neutral-700 underline-offset-2 hover:text-[hsl(var(--brand-primary))] hover:underline"
                          >
                            {campaign.organization.name}
                          </Link>
                        </div>
                      )}

                      <CardFooter className="flex-col items-stretch gap-3 pt-0">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5e5e5]">
                            <div
                              className="h-full rounded-full bg-[#ea580c] transition-all duration-500"
                              style={{
                                width: `${calculateProgress(campaign.amount_raised, campaign.funding_goal)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-[#0a0a0a]">
                              {formatCurrency(campaign.amount_raised)}
                            </span>
                            <span className="text-[#737373]">
                              of {formatCurrency(campaign.funding_goal)}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-[#737373]">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{campaign.supporters_count} supporters</span>
                          </div>
                          <span>{formatRelativeTime(campaign.created_at)}</span>
                        </div>

                        <Button
                          asChild
                          className="w-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]"
                        >
                          <Link
                            to={`/campaign/${campaign.slug}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Donate
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {(() => {
          const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE))
          if (totalPages <= 1) return null
          const safePage = Math.min(page, totalPages)
          const goTo = (p: number) => {
            setPage(p)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          // Compact window of up to 7 page numbers centered on current page,
          // with ellipses for the gaps.
          const pages: (number | 'gap')[] = []
          const add = (v: number | 'gap') => {
            if (pages[pages.length - 1] !== v) pages.push(v)
          }
          for (let p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
              add(p)
            } else if (Math.abs(p - safePage) === 2) {
              add('gap')
            }
          }
          return (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 1}
                onClick={() => goTo(safePage - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {pages.map((p, i) =>
                p === 'gap' ? (
                  <span key={`gap-${i}`} className="px-2 text-sm text-[#737373]">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safePage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goTo(p)}
                    aria-current={p === safePage ? 'page' : undefined}
                    className={
                      p === safePage
                        ? 'min-w-[40px] bg-[#1b5858] hover:bg-[#164444]'
                        : 'min-w-[40px]'
                    }
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === totalPages}
                onClick={() => goTo(safePage + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          )
        })()}
      </div>
    </div>
  )
}
