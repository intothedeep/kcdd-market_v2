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
import { PlusCircle } from 'lucide-react'

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
    <div className="flex flex-col items-start justify-end rounded-[10px] bg-white p-5">
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

export function FeatureCardsSection({ data }: FeatureCardsSectionProps) {
  const { subtitle, heading, description, listItems = [], buttonLabel, buttonHref, cards } = data

  return (
    <section className="bg-[#f8faf9] px-4 py-[30px]">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-5 lg:flex-row">
        {/* Left Content */}
        <div className="flex flex-1 flex-col items-start justify-center gap-[22px] text-[#1b5858]">
          <div className="flex w-full flex-col items-start gap-5">
            <div className="flex w-full flex-col items-start gap-2.5">
              {subtitle && <p className="w-full text-base font-normal">{subtitle}</p>}
              <h2 className="w-full text-[30px] font-bold">{heading}</h2>
            </div>

            <div className="w-full text-base font-normal">
              <p className="mb-0">{description}</p>
              {listItems.length > 0 && (
                <ul className="ml-6 mt-2 list-disc">
                  {listItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {buttonLabel &&
            (buttonHref ? (
              <Link to={buttonHref}>
                <Button className="h-9 gap-2 rounded-full bg-[#1b5858] px-4 text-white shadow-sm hover:bg-[#1b5858]/90">
                  <PlusCircle className="size-4" />
                  {buttonLabel}
                </Button>
              </Link>
            ) : (
              <Button className="h-9 gap-2 rounded-full bg-[#1b5858] px-4 text-white shadow-sm hover:bg-[#1b5858]/90">
                <PlusCircle className="size-4" />
                {buttonLabel}
              </Button>
            ))}
        </div>

        {/* Right Grid - 2x2 Cards */}
        <div className="grid w-full grid-cols-2 gap-5 lg:w-[555px]">
          {cards.map((card, index) => (
            <FeatureCard key={index} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
