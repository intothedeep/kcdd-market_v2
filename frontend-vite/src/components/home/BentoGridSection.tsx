/**
 * ========================================
 * BENTO GRID SECTION COMPONENT
 * ========================================
 *
 * Location: src/components/home/BentoGridSection.tsx
 *
 * DESCRIPTION:
 * A bento-style grid layout with 4 cards in a 3-column, 2-row grid.
 * Cards can span multiple columns and have customizable backgrounds
 * (colors or images in the future).
 *
 * LAYOUT:
 * ┌─────────────────┬─────────┐
 * │    Card 1       │ Card 2  │
 * │  (2 cols)       │ (1 col) │
 * ├─────────┬───────┴─────────┤
 * │ Card 3  │     Card 4      │
 * │ (1 col) │    (2 cols)     │
 * └─────────┴─────────────────┘
 *
 * ========================================
 * USAGE
 * ========================================
 *
 * ```tsx
 * import { BentoGridSection } from '@/components/home/BentoGridSection'
 *
 * <BentoGridSection
 *   cards={[
 *     {
 *       title: 'Card Title',
 *       description: 'Card description...',
 *       linkText: 'Learn more',
 *       linkHref: '/learn-more',
 *       backgroundColor: '#1b5858',
 *       textColor: 'light'
 *     },
 *     // ... more cards
 *   ]}
 * />
 * ```
 *
 * ========================================
 */

import { Link } from 'react-router-dom'

export interface BentoCardData {
  title: string
  description: string
  linkText?: string
  linkHref?: string
  backgroundColor: string
  textColor: 'light' | 'dark' // 'light' = white text, 'dark' = black text
  // Optional background image. Rendered behind the text with a darkening
  // gradient so the copy stays legible regardless of the photo.
  backgroundImageUrl?: string
  backgroundImageAlt?: string
}

interface BentoGridSectionProps {
  cards: [BentoCardData, BentoCardData, BentoCardData, BentoCardData] // Exactly 4 cards
}

function BentoCard({ card, className }: { card: BentoCardData; className?: string }) {
  const textColorClass = card.textColor === 'light' ? 'text-white' : 'text-black'
  const hasImage = Boolean(card.backgroundImageUrl)

  return (
    <div
      className={`relative flex flex-col items-start justify-end overflow-hidden rounded-[10px] p-5 ${className}`}
      style={{ backgroundColor: card.backgroundColor }}
    >
      {hasImage && (
        <>
          <img
            src={card.backgroundImageUrl}
            alt={card.backgroundImageAlt || ''}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden={card.backgroundImageAlt ? undefined : true}
          />
          {/* Bottom-up gradient keeps text legible without hiding the photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
          {card.backgroundImageUrl?.includes('kcdd_placeholder=1') && (
            <span className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Placeholder photo
            </span>
          )}
        </>
      )}
      <div
        className={`relative z-10 flex max-w-[250px] flex-col gap-1.5 ${
          hasImage ? 'text-white' : textColorClass
        }`}
      >
        <h3 className="text-base font-bold leading-5">{card.title}</h3>
        <p className="text-sm font-medium leading-[18px]">{card.description}</p>
        {card.linkText &&
          (card.linkHref ? (
            <Link
              to={card.linkHref}
              className="text-sm font-medium leading-[18px] underline transition-opacity hover:opacity-80"
            >
              {card.linkText}
            </Link>
          ) : (
            <span className="text-sm font-medium leading-[18px] underline">{card.linkText}</span>
          ))}
      </div>
    </div>
  )
}

export function BentoGridSection({ cards }: BentoGridSectionProps) {
  return (
    <section className="px-4 py-8 md:py-12">
      <div className="mx-auto max-w-[1000px]">
        {/* Desktop Grid: 3 columns, 2 rows */}
        <div className="hidden h-[584px] grid-cols-3 grid-rows-2 gap-2.5 md:grid">
          {/* Card 1: Top-left, spans 2 columns */}
          <BentoCard card={cards[0]} className="col-span-2 row-start-1" />

          {/* Card 2: Top-right, 1 column */}
          <BentoCard card={cards[1]} className="col-start-3 row-start-1" />

          {/* Card 3: Bottom-left, 1 column */}
          <BentoCard card={cards[2]} className="col-start-1 row-start-2" />

          {/* Card 4: Bottom-right, spans 2 columns */}
          <BentoCard card={cards[3]} className="col-span-2 col-start-2 row-start-2" />
        </div>

        {/* Mobile Stack: Single column */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {cards.map((card, index) => (
            <BentoCard key={index} card={card} className="min-h-[250px]" />
          ))}
        </div>
      </div>
    </section>
  )
}
