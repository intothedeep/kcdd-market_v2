/**
 * ========================================
 * FEATURE CARDS WITH IMAGE SECTION COMPONENT
 * ========================================
 *
 * Location: src/components/home/FeatureCardsWithImageSection.tsx
 *
 * DESCRIPTION:
 * A section with header row (title + CTA) and content row
 * (2x2 feature cards grid + large image/placeholder).
 * Light background with teal accents.
 *
 * LAYOUT:
 * ┌─────────────────────────────────────────────┐
 * │  [Subtitle]                                 │
 * │  [Heading]                    [CTA Button]  │
 * ├─────────────────────────────────────────────┤
 * │  ┌───────┐ ┌───────┐  ┌───────────────────┐│
 * │  │ Card  │ │ Card  │  │                   ││
 * │  └───────┘ └───────┘  │      Image/       ││
 * │  ┌───────┐ ┌───────┐  │    Placeholder    ││
 * │  │ Card  │ │ Card  │  │                   ││
 * │  └───────┘ └───────┘  └───────────────────┘│
 * └─────────────────────────────────────────────┘
 *
 * ========================================
 */

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export interface FeatureCardWithImageItem {
  icon?: React.ReactNode
  title: string
  description: string
  linkText?: string
  linkHref?: string
}

export interface FeatureCardsWithImageSectionData {
  subtitle?: string
  heading: string
  buttonLabel?: string
  buttonHref?: string
  cards: [
    FeatureCardWithImageItem,
    FeatureCardWithImageItem,
    FeatureCardWithImageItem,
    FeatureCardWithImageItem,
  ]
  imageUrl?: string
  imageAlt?: string
  imagePlaceholderColor?: string
}

interface FeatureCardsWithImageSectionProps {
  data: FeatureCardsWithImageSectionData
}

function FeatureCard({ card }: { card: FeatureCardWithImageItem }) {
  return (
    <div className="flex h-full flex-col items-start justify-end rounded-[10px] bg-white p-5">
      <div className="flex w-full max-w-[250px] flex-col items-start gap-1.5">
        {/* Icon */}
        <div className="flex items-center justify-center rounded-full bg-[#c4e5c1] p-2.5">
          {card.icon || <PlusCircle className="size-6 text-[#1b5858]" />}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold leading-5 text-[#1b5858]">{card.title}</h3>

        {/* Description */}
        <p className="text-sm font-medium leading-[18px] text-[#1b5858]">{card.description}</p>

        {/* Link */}
        {card.linkText &&
          (card.linkHref ? (
            <Link
              to={card.linkHref}
              className="text-sm font-medium leading-[18px] text-[#1b5858] underline transition-opacity hover:opacity-80"
            >
              {card.linkText}
            </Link>
          ) : (
            <span className="text-sm font-medium leading-[18px] text-[#1b5858] underline">
              {card.linkText}
            </span>
          ))}
      </div>
    </div>
  )
}

export function FeatureCardsWithImageSection({ data }: FeatureCardsWithImageSectionProps) {
  const {
    subtitle,
    heading,
    buttonLabel,
    buttonHref,
    cards,
    imageUrl,
    imageAlt = 'Feature image',
    imagePlaceholderColor = '#1b5858',
  } = data

  return (
    <section className="bg-[#f8faf9] px-4 py-[30px]">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-2.5">
        {/* Header Row */}
        <div className="flex flex-col items-start justify-between gap-4 pb-2.5 sm:flex-row sm:items-end">
          <div className="flex flex-col items-start gap-2.5 text-[#1b5858]">
            {subtitle && <p className="text-base font-normal">{subtitle}</p>}
            <h2 className="text-[30px] font-bold leading-normal">{heading}</h2>
          </div>

          {buttonLabel &&
            (buttonHref ? (
              <Link to={buttonHref}>
                <Button className="h-9 shrink-0 gap-2 rounded-full bg-[#1b5858] px-4 text-white shadow-sm hover:bg-[#1b5858]/90">
                  <PlusCircle className="size-4" />
                  {buttonLabel}
                </Button>
              </Link>
            ) : (
              <Button className="h-9 shrink-0 gap-2 rounded-full bg-[#1b5858] px-4 text-white shadow-sm hover:bg-[#1b5858]/90">
                <PlusCircle className="size-4" />
                {buttonLabel}
              </Button>
            ))}
        </div>

        {/* Content Row */}
        <div className="flex h-auto flex-col gap-5 lg:h-[408px] lg:flex-row">
          {/* Left: 2x2 Cards Grid */}
          <div className="grid h-full w-full grid-cols-2 gap-5 lg:w-[555px]">
            {cards.map((card, index) => (
              <FeatureCard key={index} card={card} />
            ))}
          </div>

          {/* Right: Image/Placeholder */}
          <div
            className="min-h-[300px] flex-1 overflow-hidden rounded-[10px] lg:min-h-0"
            style={!imageUrl ? { backgroundColor: imagePlaceholderColor } : undefined}
          >
            {imageUrl && (
              <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
