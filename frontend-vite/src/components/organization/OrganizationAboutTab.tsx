/**
 * Organization About Tab Component
 * Displays mission, populations served, technology needs, program description
 */

import { Lightbulb, Users, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OrganizationProfile } from '@/lib/supabase'

interface OrganizationAboutTabProps {
  organization: OrganizationProfile
}

export function OrganizationAboutTab({ organization }: OrganizationAboutTabProps) {
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Mission */}
      <section>
        <h2 className="text-2xl font-semibold text-[#0a0a0a] mb-4">Our Mission</h2>
        <p className="text-base text-[#0a0a0a] leading-relaxed">
          {organization.mission}
        </p>
      </section>

      {/* Populations Served */}
      {organization.populations && organization.populations.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1b5858]" />
            Populations We Serve
          </h3>
          <div className="flex flex-wrap gap-2">
            {organization.populations.map((pop) => (
              <Badge
                key={pop.id}
                variant="secondary"
                className="bg-[#1b5858]/10 text-[#1b5858] font-normal px-3 py-1"
              >
                {pop.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Program Description */}
      {organization.program_description && (
        <section>
          <h3 className="text-lg font-semibold text-[#0a0a0a] mb-3">Our Programs</h3>
          <p className="text-base text-[#0a0a0a] leading-relaxed whitespace-pre-line">
            {organization.program_description}
          </p>
        </section>
      )}

      {/* Technology Needs - Restyled to be informative, not alarming */}
      {organization.technology_barriers && (
        <section className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#0ea5e9]/10 rounded-full">
              <Lightbulb className="h-5 w-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">
                How You Can Help
              </h3>
              <p className="text-base text-[#0a0a0a] leading-relaxed">
                {organization.technology_barriers}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Service Area */}
      {organization.service_area_description && (
        <section>
          <h3 className="text-lg font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#1b5858]" />
            Service Area
          </h3>
          <p className="text-base text-[#0a0a0a] leading-relaxed">
            {organization.service_area_description}
          </p>
        </section>
      )}
    </div>
  )
}
