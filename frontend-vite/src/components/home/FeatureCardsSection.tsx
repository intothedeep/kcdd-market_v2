/**
 * ========================================
 * FEATURE CARDS SECTION COMPONENT
 * ========================================
 * 
 * Location: src/components/home/FeatureCardsSection.tsx
 * 
 * DESCRIPTION:
 * A section with text content on the left and a 2x2 grid of
 * feature cards on the right. Light background with teal accents.
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────┐
 * │  [Subtitle]         ┌───────┐ ┌───────┐    │
 * │  [Heading]          │ Card  │ │ Card  │    │
 * │  [Description]      └───────┘ └───────┘    │
 * │  • List item        ┌───────┐ ┌───────┐    │
 * │  [Button]           │ Card  │ │ Card  │    │
 * │                     └───────┘ └───────┘    │
 * └─────────────────────────────────────────────┘
 * 
 * ========================================
 */

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CirclePlus } from 'lucide-react'

export interface FeatureCardItem {
  icon?: React.ReactNode
  title: string
  description: string
  linkText?: string
  linkHref?: string
}

export interface FeatureCardsSectionData {
  subtitle?: string
  heading: string
  description: string
  listItems?: string[]
  buttonLabel?: string
  buttonHref?: string
  cards: [FeatureCardItem, FeatureCardItem, FeatureCardItem, FeatureCardItem]
}

interface FeatureCardsSectionProps {
  data: FeatureCardsSectionData
}

function FeatureCard({ card }: { card: FeatureCardItem }) {
  return (
    <div className="bg-white flex flex-col items-start justify-end p-5 rounded-[10px]">
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

export function FeatureCardsSection({ data }: FeatureCardsSectionProps) {
  const { subtitle, heading, description, listItems = [], buttonLabel, buttonHref, cards } = data

  return (
    <section className="bg-[#f8faf9] py-[30px] px-4">
      <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-5 items-center">
        {/* Left Content */}
        <div className="flex-1 flex flex-col gap-[22px] items-start justify-center text-[#1b5858]">
          <div className="flex flex-col gap-5 items-start w-full">
            <div className="flex flex-col gap-2.5 items-start w-full">
              {subtitle && (
                <p className="text-base font-normal w-full">
                  {subtitle}
                </p>
              )}
              <h2 className="text-[30px] font-bold w-full">
                {heading}
              </h2>
            </div>
            
            <div className="text-base font-normal w-full">
              <p className="mb-0">{description}</p>
              {listItems.length > 0 && (
                <ul className="list-disc ml-6 mt-2">
                  {listItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {buttonLabel && (
            buttonHref ? (
              <Link to={buttonHref}>
                <Button 
                  className="bg-[#1b5858] text-white rounded-full h-9 px-4 gap-2 hover:bg-[#1b5858]/90 shadow-sm"
                >
                  <CirclePlus className="size-4" />
                  {buttonLabel}
                </Button>
              </Link>
            ) : (
              <Button 
                className="bg-[#1b5858] text-white rounded-full h-9 px-4 gap-2 hover:bg-[#1b5858]/90 shadow-sm"
              >
                <CirclePlus className="size-4" />
                {buttonLabel}
              </Button>
            )
          )}
        </div>

        {/* Right Grid - 2x2 Cards */}
        <div className="grid grid-cols-2 gap-5 w-full lg:w-[555px]">
          {cards.map((card, index) => (
            <FeatureCard key={index} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}

