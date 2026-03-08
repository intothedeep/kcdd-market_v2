/**
 * Organization Hero Component
 * Cover image area with organization logo overlay
 */

import { Pencil, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrganizationLogo } from './OrganizationLogo'

interface OrganizationHeroProps {
  coverImageUrl?: string | null
  logoUrl?: string | null
  logoEmoji?: string
  name: string
  isOwner?: boolean
  onEditClick?: () => void
}

export function OrganizationHero({
  coverImageUrl,
  logoUrl,
  logoEmoji,
  name,
  isOwner = false,
  onEditClick,
}: OrganizationHeroProps) {
  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-[300px] w-full overflow-hidden rounded-[10px] bg-[#f5f5f5]">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={`${name} cover`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ea580c]/10 to-[#1b5858]/10">
            <ImagePlus className="h-16 w-16 text-[#737373] opacity-30" />
          </div>
        )}
      </div>

      {/* Logo Overlay */}
      <div className="absolute -bottom-12 left-6">
        <div className="rounded-full bg-white p-1 shadow-lg">
          <OrganizationLogo
            logoUrl={logoUrl}
            logoEmoji={logoEmoji}
            name={name}
            size="xl"
            className="border-4 border-white"
          />
        </div>
      </div>

      {/* Edit Button for Owners */}
      {isOwner && onEditClick && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="absolute right-4 top-4 bg-white/90 backdrop-blur-sm"
        >
          <Pencil className="mr-1 h-4 w-4" />
          Edit Profile
        </Button>
      )}
    </div>
  )
}
