/**
 * Organization Logo Component
 * Displays organization avatar with logo_url or Lucide icon fallback
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { IconByName, ICON_REGISTRY } from '@/components/ui/icon-picker'

interface OrganizationLogoProps {
  logoUrl?: string | null
  /** Icon name from ICON_REGISTRY (e.g., 'building2', 'heart', 'users') */
  logoIcon?: string
  /** @deprecated Use logoIcon instead. Kept for backwards compatibility during migration */
  logoEmoji?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 28,
  xl: 40,
}

export function OrganizationLogo({
  logoUrl,
  logoIcon,
  logoEmoji,
  name,
  size = 'md',
  className,
}: OrganizationLogoProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Use logoIcon if provided, otherwise check if logoEmoji is actually an icon name
  const iconName = logoIcon || (logoEmoji && ICON_REGISTRY[logoEmoji] ? logoEmoji : null)

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
      <AvatarFallback className="bg-[#f5f5f5] text-[#0a0a0a]">
        {iconName ? <IconByName name={iconName} size={iconSizes[size]} /> : initials}
      </AvatarFallback>
    </Avatar>
  )
}
