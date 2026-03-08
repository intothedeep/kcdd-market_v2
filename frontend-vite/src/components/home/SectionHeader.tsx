/**
 * ========================================
 * SECTION HEADER COMPONENT
 * ========================================
 *
 * Location: src/components/home/SectionHeader.tsx
 *
 * DESCRIPTION:
 * A centered text block with a bold heading and description.
 * Used to introduce sections with a title and subtitle.
 *
 * ========================================
 * USAGE
 * ========================================
 *
 * ```tsx
 * import { SectionHeader } from '@/components/home/SectionHeader'
 *
 * <SectionHeader
 *   heading="Our Services"
 *   description="Discover what we have to offer..."
 * />
 * ```
 *
 * ========================================
 */

export interface SectionHeaderData {
  heading: string
  description: string
}

interface SectionHeaderProps {
  data: SectionHeaderData
}

export function SectionHeader({ data }: SectionHeaderProps) {
  const { heading, description } = data

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-center gap-[22px] px-4 py-10 text-center text-black">
      <h2 className="w-full text-[30px] font-bold">{heading}</h2>
      <p className="w-full text-base font-normal">{description}</p>
    </div>
  )
}
