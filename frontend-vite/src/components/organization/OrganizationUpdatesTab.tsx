/**
 * Organization Updates Tab Component
 * Timeline layout with date, title, image, and content
 */

import { Clock, MessageSquarePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { OrganizationUpdate } from '@/lib/supabase'

interface OrganizationUpdatesTabProps {
  updates: OrganizationUpdate[]
}

export function OrganizationUpdatesTab({ updates }: OrganizationUpdatesTabProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (updates.length === 0) {
    return (
      <div className="max-w-3xl">
        <h2 className="mb-6 text-2xl font-semibold text-[#0a0a0a]">Latest Updates</h2>
        <div className="rounded-lg bg-[#f5f5f5] py-12 text-center text-[#737373]">
          <MessageSquarePlus className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg">No updates yet.</p>
          <p className="mt-2 text-sm">Check back later for news from this organization.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-2xl font-semibold text-[#0a0a0a]">Latest Updates</h2>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute bottom-0 left-[23px] top-0 w-0.5 bg-[#f5f5f5]" />

        {/* Update entries */}
        <div className="space-y-6">
          {updates.map((update) => (
            <div key={update.id} className="relative flex gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b5858]">
                  <MessageSquarePlus className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Content */}
              <Card className="flex-1 border-[#f5f5f5] p-6">
                {/* Date */}
                <div className="mb-3 flex items-center gap-2 text-sm text-[#737373]">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(update.created_at)}</span>
                </div>

                {/* Title */}
                <h3 className="mb-3 text-lg font-semibold text-[#0a0a0a]">{update.title}</h3>

                {/* Image */}
                {update.image_url && (
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <img
                      src={update.image_url}
                      alt={update.title}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <p className="whitespace-pre-line text-base leading-relaxed text-[#0a0a0a]">
                  {update.content}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
