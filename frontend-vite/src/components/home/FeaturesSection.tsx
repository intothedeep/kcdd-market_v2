/**
 * Features Section Component
 * Location: src/components/home/FeaturesSection.tsx
 *
 * Reusable section for displaying feature cards with icons, titles, and descriptions
 */

import { LucideIcon } from 'lucide-react'

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface FeaturesSectionProps {
  features: Feature[]
  heading?: string
  showHeading?: boolean
}

export function FeaturesSection({
  features,
  heading = 'How It Works',
  showHeading = false,
}: FeaturesSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="features-heading">
      {showHeading ? (
        <h2 id="features-heading" className="mb-8 text-center text-3xl font-bold">
          {heading}
        </h2>
      ) : (
        <h2 id="features-heading" className="sr-only">
          {heading}
        </h2>
      )}

      <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <article key={index} className="flex w-full flex-col items-start gap-4 md:w-[253px]">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[31px] bg-[hsl(var(--brand-primary))] p-2.5"
                aria-hidden="true"
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex w-full flex-col gap-1.5 text-black">
                <h3 className="text-base font-bold leading-5">{feature.title}</h3>
                <p className="text-sm font-medium leading-[18px]">{feature.description}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
