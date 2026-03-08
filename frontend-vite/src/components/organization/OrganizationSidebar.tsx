/**
 * Organization Sidebar Component
 * Displays stats, contact info, and support CTA
 */

import { MapPin, Globe, Mail, Phone, Users, Calendar, Building2, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { OrganizationProfile } from '@/lib/supabase'

interface OrganizationSidebarProps {
  organization: OrganizationProfile
  requestStats?: {
    open: number
    fulfilled: number
    totalRaised: number
  }
  showSupportButton?: boolean
}

export function OrganizationSidebar({
  organization,
  requestStats,
  showSupportButton = true
}: OrganizationSidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Build full address string
  const getFullAddress = () => {
    const parts = []
    if (organization.address) parts.push(organization.address)
    const cityStateZip = [
      organization.city,
      organization.state,
      organization.zipcode
    ].filter(Boolean).join(organization.state ? ', ' : ' ')
    if (cityStateZip) parts.push(cityStateZip)
    return parts.join(', ')
  }

  const fullAddress = getFullAddress()

  return (
    <Card className="w-[340px] sticky top-6 overflow-hidden border-[#e5e5e5] rounded-xl shadow-sm">
      {/* Impact Stats - Prominent at top with colored background */}
      {requestStats && (
        <div className="bg-gradient-to-br from-[#1b5858] to-[#0f3d3d] p-6">
          <h3 className="text-sm font-medium text-white/80 mb-4">Community Impact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{requestStats.open}</p>
              <p className="text-xs text-white/70 mt-1">Active Requests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{requestStats.fulfilled}</p>
              <p className="text-xs text-white/70 mt-1">Fulfilled</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#fbbf24]">
                {formatCurrency(requestStats.totalRaised)}
              </p>
              <p className="text-xs text-white/70 mt-1">Raised</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* Verified Badge */}
        {organization.user_profile?.is_vetted && (
          <div className="flex items-center gap-2 p-3 bg-[#d1fae5]/50 rounded-lg">
            <BadgeCheck className="h-5 w-5 text-[#059669]" />
            <div>
              <p className="text-sm font-medium text-[#059669]">Verified Organization</p>
              <p className="text-xs text-[#059669]/70">{organization.organization_type}</p>
            </div>
          </div>
        )}

        {/* Organization Details */}
        <div className="space-y-3">
          {organization.organization_size && (
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <span className="text-sm text-[#0a0a0a]">{organization.organization_size}</span>
            </div>
          )}
          {organization.year_founded && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <span className="text-sm text-[#0a0a0a]">Founded {organization.year_founded}</span>
            </div>
          )}
          {organization.ein && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <span className="text-sm text-[#737373]">EIN: {organization.ein}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#f5f5f5]" />

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Contact</h3>
          {fullAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-[#737373] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-[#0a0a0a]">{fullAddress}</span>
            </div>
          )}
          {organization.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#ea580c] hover:underline truncate"
              >
                {organization.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {organization.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <a
                href={`mailto:${organization.email}`}
                className="text-sm text-[#0a0a0a] hover:text-[#ea580c]"
              >
                {organization.email}
              </a>
            </div>
          )}
          {organization.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#737373] flex-shrink-0" />
              <a
                href={`tel:${organization.phone}`}
                className="text-sm text-[#0a0a0a] hover:text-[#ea580c]"
              >
                {organization.phone}
              </a>
            </div>
          )}
        </div>

        {/* Support CTA */}
        {showSupportButton && (
          <Link to={`/requests?organization=${organization.id}`} className="block pt-2">
            <Button className="w-full bg-[#ea580c] hover:bg-[#dc4c06] text-white rounded-full h-11 text-base font-medium">
              Support This Organization
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}
