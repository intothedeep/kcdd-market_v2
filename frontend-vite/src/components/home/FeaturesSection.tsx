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
  showHeading = false 
}: FeaturesSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="features-heading">
      {showHeading ? (
        <h2 id="features-heading" className="text-3xl font-bold text-center mb-8">
          {heading}
        </h2>
      ) : (
        <h2 id="features-heading" className="sr-only">{heading}</h2>
      )}
      
      <div className="flex flex-col md:flex-row gap-5 items-center justify-center">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <article key={index} className="flex flex-col gap-4 items-start w-full md:w-[253px]">
              <div className="bg-[hsl(var(--brand-primary))] flex items-center justify-center p-2.5 rounded-[31px] w-11 h-11" aria-hidden="true">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col gap-1.5 text-black w-full">
                <h3 className="font-bold text-base leading-5">{feature.title}</h3>
                <p className="font-medium text-sm leading-[18px]">
                  {feature.description}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

