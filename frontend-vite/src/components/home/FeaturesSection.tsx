/**
 * Features Section Component
 * Location: src/components/home/FeaturesSection.tsx
 * 
 * Displays the 3 main features: CBOs Submit, Donors Claim, Fulfillment Tracking
 */

import { FileText, Heart, BarChart3 } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: 'CBOs Submit Requests',
      description: 'Community-based organizations submit detailed technology equipment requests, explaining their needs and the impact they\'ll create.'
    },
    {
      icon: Heart,
      title: 'Donors Claim Requests',
      description: 'Generous donors browse through requests and claim the ones that align with their interests and capacity to help.'
    },
    {
      icon: BarChart3,
      title: 'Fulfillment Tracking',
      description: 'We track the entire fulfillment process and measure the real impact on Kansas City communities.'
    }
  ]

  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">How It Works</h2>
      
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

