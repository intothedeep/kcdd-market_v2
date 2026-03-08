/**
 * Organization Team Tab Component
 * Grid of team member cards with avatar, name, role, bio, and email
 */

import { Mail, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { OrganizationTeamMember } from '@/lib/supabase'

interface OrganizationTeamTabProps {
  members: OrganizationTeamMember[]
}

export function OrganizationTeamTab({ members }: OrganizationTeamTabProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  if (members.length === 0) {
    return (
      <div className="max-w-3xl">
        <h2 className="mb-6 text-2xl font-semibold text-[#0a0a0a]">Our Team</h2>
        <div className="rounded-lg bg-[#f5f5f5] py-12 text-center text-[#737373]">
          <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg">No team members listed.</p>
          <p className="mt-2 text-sm">This organization hasn't added team members yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-[#0a0a0a]">Our Team</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="border-[#f5f5f5] p-6 transition-shadow hover:shadow-md">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <Avatar className="mb-4 h-20 w-20">
                {member.photo_url && <AvatarImage src={member.photo_url} alt={member.name} />}
                <AvatarFallback className="bg-[#1b5858] text-xl text-white">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <h3 className="text-lg font-semibold text-[#0a0a0a]">{member.name}</h3>

              {/* Role */}
              {member.role && <p className="mb-3 text-sm text-[#ea580c]">{member.role}</p>}

              {/* Bio */}
              {member.bio && (
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#737373]">
                  {member.bio}
                </p>
              )}

              {/* Email */}
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-2 text-sm text-[#1b5858] transition-colors hover:text-[#ea580c]"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
