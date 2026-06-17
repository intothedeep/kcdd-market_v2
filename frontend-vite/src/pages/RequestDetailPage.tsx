/**
 * Request Detail Page
 *
 * Mirrors the campaign detail UX (hero image, title, story, contextual badges,
 * donate CTA) for single-device donation requests — both org requests and
 * individual recipient requests posted through KC DIME Direct.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sanitizeStoryHtml } from '@/lib/sanitizeStoryHtml'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, MapPin, Users, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'

interface RequestDetail {
  id: string
  description: string
  amount: number
  urgency: 'low' | 'medium' | 'high'
  zipcode: string | null
  status: 'open' | 'claimed' | 'fulfilled' | 'denied'
  beneficiaries_count: number | null
  created_at: string
  cause_area_id: string | null
  organization: {
    id: string
    name: string
    slug: string | null
    mission: string | null
    logo_url: string | null
    logo_emoji: string | null
    cover_image_url: string | null
    website: string | null
  } | null
  cause_area: { id: string; name: string } | null
}

// Verified-free Unsplash photos for request hero images, picked by cause area.
// Fall back to the org's cover image if available.
const HERO_BY_CAUSE: Record<string, string> = {
  'ca-digital-access':
    'https://images.unsplash.com/photo-1758270705317-3ef6142d306f?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-education':
    'https://images.unsplash.com/photo-1758687126499-9ff30d1c5762?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-education-youth':
    'https://images.unsplash.com/photo-1758270705290-62b6294dd044?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-employment':
    'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-children-families':
    'https://images.unsplash.com/photo-1758687126499-9ff30d1c5762?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-mental-health':
    'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-housing-homelessness':
    'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-senior-services':
    'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-refugees-migration':
    'https://images.unsplash.com/photo-1758270705317-3ef6142d306f?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-gender-equality':
    'https://images.unsplash.com/photo-1758687126499-9ff30d1c5762?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  'ca-poverty-hunger':
    'https://images.unsplash.com/photo-1758270705290-62b6294dd044?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1',
}
const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1600&q=80&auto=format&fit=crop&kcdd_placeholder=1'

function urgencyStyle(urgency: 'low' | 'medium' | 'high'): string {
  if (urgency === 'high') return 'bg-red-100 text-red-700'
  if (urgency === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('requests')
          .select(
            `id, description, amount, urgency, zipcode, status, beneficiaries_count, created_at, cause_area_id,
             organization:organizations(id, name, slug, mission, logo_url, logo_emoji, cover_image_url, website),
             cause_area:cause_areas(id, name)`
          )
          .eq('id', id)
          .maybeSingle()

        if (error || !data) {
          setError('Request not found')
          return
        }
        setRequest(data as unknown as RequestDetail)
      } catch {
        setError('Failed to load request')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ea580c]" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[#737373]" />
            <h1 className="text-2xl font-bold">Request not found</h1>
            <p className="mt-2 text-[#737373]">
              This request may have been fulfilled, closed, or removed.
            </p>
            <Link to="/requests">
              <Button className="mt-6 bg-[#ea580c] hover:bg-[#ea580c]/90">
                Browse open requests
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isDirect = request.organization?.slug === 'kcdd-direct'
  const heroSrc =
    request.organization?.cover_image_url ||
    (request.cause_area_id ? HERO_BY_CAUSE[request.cause_area_id] : null) ||
    DEFAULT_HERO
  const isPlaceholderHero = heroSrc.includes('kcdd_placeholder=1')

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="container max-w-5xl py-8">
        <Link
          to="/requests"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#737373] hover:text-[#0a0a0a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Link>

        {/* Hero */}
        <div className="relative mb-6 aspect-[16/6] w-full overflow-hidden rounded-xl bg-[#f5f5f5]">
          <img src={heroSrc} alt={request.description} className="h-full w-full object-cover" />
          {isPlaceholderHero && (
            <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Placeholder photo
            </span>
          )}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${urgencyStyle(request.urgency)}`}
            >
              {request.urgency} priority
            </span>
            {request.status !== 'open' && (
              <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                {request.status}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Org chip + cause area */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/organizations/${request.organization?.slug || request.organization?.id}`}
                className="flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 transition-colors hover:border-[#ea580c]"
              >
                {request.organization?.logo_url && !logoError ? (
                  <img
                    src={request.organization.logo_url}
                    alt={request.organization.name}
                    className="h-6 w-6 rounded-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-lg" aria-hidden="true">
                    {request.organization?.logo_emoji || '🎯'}
                  </span>
                )}
                <span className="text-sm font-medium text-[#ea580c]">
                  {isDirect ? 'KC DIME Direct — Individual Recipient' : request.organization?.name}
                </span>
              </Link>
              {request.cause_area?.name && (
                <Badge variant="secondary" className="bg-[#f5f5f5] text-[#525252]">
                  {request.cause_area.name}
                </Badge>
              )}
              <span className="text-xs text-[#737373]">
                Posted {formatRelativeTime(request.created_at)}
              </span>
            </div>

            {/* Title (first sentence of description, or full if short) */}
            <h1 className="text-3xl font-bold tracking-tight text-[#0a0a0a] md:text-4xl">
              {isDirect ? 'A verified individual needs tech.' : 'A KC partner org needs tech.'}
            </h1>

            {/* Full description (may contain HTML for the individual <strong> intros) */}
            <div
              className="text-base leading-relaxed text-[#404040] [&_strong]:font-semibold [&_strong]:text-[#0a0a0a]"
              dangerouslySetInnerHTML={{ __html: sanitizeStoryHtml(request.description) }}
            />

            {/* What this funds */}
            <Card>
              <CardContent className="py-5">
                <h2 className="mb-3 text-lg font-semibold text-[#0a0a0a]">What your gift funds</h2>
                <p className="text-sm leading-relaxed text-[#525252]">
                  {isDirect
                    ? `Your full ${formatCurrency(request.amount)} gift funds this specific device and the 90-day support window that comes with it. KC DIME procures the equipment, wipes and re-images if refurbished, ships or arranges pickup, and follows up at 30 and 90 days. You'll get a thank-you note from the recipient after delivery.`
                    : `Your full ${formatCurrency(request.amount)} gift funds this specific equipment list for ${request.organization?.name}. KC DIME procures the gear, configures it for the program's use case, and delivers to the org. The org reports back with a delivery photo and an outcome update.`}
                </p>
              </CardContent>
            </Card>

            {/* Org mission */}
            {!isDirect && request.organization?.mission && (
              <Card>
                <CardContent className="py-5">
                  <h2 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                    About {request.organization.name}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#525252]">
                    {request.organization.mission}
                  </p>
                  {request.organization.website && (
                    <a
                      href={request.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-[#ea580c] hover:underline"
                    >
                      Visit website →
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verification reassurance */}
            <Card className="border-[#dcfce7] bg-[#f0fdf4]">
              <CardContent className="flex items-start gap-3 py-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#15803d]" />
                <div className="text-sm text-[#166534]">
                  <strong className="font-semibold">Verified by KC DIME.</strong>{' '}
                  {isDirect
                    ? 'This recipient applied through our intake process, completed a need-verification call, and has at least one professional reference (case manager, teacher, employer, or social worker).'
                    : 'This organization is a verified 501(c)(3) on our partner roster. Every funded request includes a delivery photo and an outcome update.'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky donate column */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="overflow-hidden">
              <CardContent className="space-y-4 py-5">
                <div>
                  <div className="text-3xl font-bold text-[#0a0a0a]">
                    {formatCurrency(request.amount)}
                  </div>
                  <div className="mt-1 text-sm text-[#737373]">
                    Full request amount. Single donor or split — you pick.
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {request.zipcode && (
                    <div className="flex items-center gap-2 text-[#525252]">
                      <MapPin className="h-4 w-4 text-[#737373]" />
                      KC zip {request.zipcode}
                    </div>
                  )}
                  {request.beneficiaries_count != null && request.beneficiaries_count > 0 && (
                    <div className="flex items-center gap-2 text-[#525252]">
                      <Users className="h-4 w-4 text-[#737373]" />
                      {request.beneficiaries_count}{' '}
                      {request.beneficiaries_count === 1 ? 'person served' : 'people served'}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`/checkout/${request.id}`)}
                  className="w-full bg-[#ea580c] py-6 text-base font-semibold hover:bg-[#ea580c]/90"
                  disabled={request.status !== 'open'}
                >
                  {request.status === 'open'
                    ? `Donate ${formatCurrency(request.amount)}`
                    : 'No longer accepting donations'}
                </Button>

                <p className="text-center text-xs text-[#737373]">
                  100% tax-deductible · Secure checkout via Stripe
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
