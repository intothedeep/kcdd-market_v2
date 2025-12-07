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
import { CirclePlus } from 'lucide-react'

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
  cards: [FeatureCardWithImageItem, FeatureCardWithImageItem, FeatureCardWithImageItem, FeatureCardWithImageItem]
  imageUrl?: string
  imageAlt?: string
  imagePlaceholderColor?: string
}

interface FeatureCardsWithImageSectionProps {
  data: FeatureCardsWithImageSectionData
}

function FeatureCard({ card }: { card: FeatureCardWithImageItem }) {
  return (
    <div className="bg-white flex flex-col items-start justify-end p-5 rounded-[10px] h-full">
      <div className="flex flex-col gap-1.5 items-start max-w-[250px] w-full">
        {/* Icon */}
        <div className="bg-[#c4e5c1] flex items-center justify-center p-2.5 rounded-full">
          {card.icon || <CirclePlus className="size-6 text-[#1b5858]" />}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-base text-[#1b5858] leading-5">
          {card.title}
        </h3>
        
        {/* Description */}
        <p className="font-medium text-sm text-[#1b5858] leading-[18px]">
          {card.description}
        </p>
        
        {/* Link */}
        {card.linkText && (
          card.linkHref ? (
            <Link 
              to={card.linkHref}
              className="font-medium text-sm text-[#1b5858] leading-[18px] underline hover:opacity-80 transition-opacity"
            >
              {card.linkText}
            </Link>
          ) : (
            <span className="font-medium text-sm text-[#1b5858] leading-[18px] underline">
              {card.linkText}
            </span>
          )
        )}
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
    imagePlaceholderColor = '#1b5858'
  } = data

  return (
    <section className="bg-[#f8faf9] py-[30px] px-4">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-2.5">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between pb-2.5">
          <div className="flex flex-col gap-2.5 items-start text-[#1b5858]">
            {subtitle && (
              <p className="text-base font-normal">
                {subtitle}
              </p>
            )}
            <h2 className="text-[30px] font-bold leading-normal">
              {heading}
            </h2>
          </div>

          {buttonLabel && (
            buttonHref ? (
              <Link to={buttonHref}>
                <Button 
                  className="bg-[#1b5858] text-white rounded-full h-9 px-4 gap-2 hover:bg-[#1b5858]/90 shadow-sm shrink-0"
                >
                  <CirclePlus className="size-4" />
                  {buttonLabel}
                </Button>
              </Link>
            ) : (
              <Button 
                className="bg-[#1b5858] text-white rounded-full h-9 px-4 gap-2 hover:bg-[#1b5858]/90 shadow-sm shrink-0"
              >
                <CirclePlus className="size-4" />
                {buttonLabel}
              </Button>
            )
          )}
        </div>

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[408px]">
          {/* Left: 2x2 Cards Grid */}
          <div className="grid grid-cols-2 gap-5 w-full lg:w-[555px] h-full">
            {cards.map((card, index) => (
              <FeatureCard key={index} card={card} />
            ))}
          </div>

          {/* Right: Image/Placeholder */}
          <div 
            className="flex-1 rounded-[10px] min-h-[300px] lg:min-h-0 overflow-hidden"
            style={!imageUrl ? { backgroundColor: imagePlaceholderColor } : undefined}
          >
            {imageUrl && (
              <img 
                src={imageUrl} 
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

