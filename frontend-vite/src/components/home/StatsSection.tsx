/**
 * Stats Section Component
 * Location: src/components/home/StatsSection.tsx
 * 
 * Reusable section for displaying statistics and metrics with animated counters
 */

import { Link } from 'react-router-dom'
import { AnimatedCounter } from './AnimatedCounter'

export interface Stat {
  value: string | number
  label: string
  description: string
}

export interface StatsContent {
  heading: string
  description: string
  linkText?: string
  linkHref?: string
}

interface StatsSectionProps {
  stats: Stat[]
  content?: StatsContent
  showContent?: boolean
}

export function StatsSection({ 
  stats,
  content,
  showContent = true
}: StatsSectionProps) {

  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="stats-heading">
      <div className="bg-[hsl(var(--brand-primary))] rounded-[10px] p-6 md:p-8 max-w-[1200px] mx-auto">
        <div className={`flex flex-col ${showContent && content ? 'lg:flex-row' : ''} gap-8 items-start lg:items-center`}>
          {/* Stats Grid */}
          <div className={`flex flex-col md:flex-row gap-6 md:gap-8 ${showContent && content ? 'flex-1' : 'w-full justify-center'}`}>
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-1.5 flex-1">
                {typeof stat.value === 'number' ? (
                  <AnimatedCounter 
                    value={stat.value} 
                    className="text-[46px] font-bold text-white leading-normal"
                  />
                ) : (
                  <div className="text-[46px] font-bold text-white leading-normal" role="text">
                    {stat.value}
                  </div>
                )}
                <h3 className="text-base font-bold text-white leading-5">
                  {stat.label}
                </h3>
                <p className="text-sm font-medium text-white leading-[18px]">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right Content Block (Optional) */}
          {showContent && content && (
            <article className="flex flex-col gap-1.5 w-full lg:w-[387px]">
              <h2 id="stats-heading" className="text-base font-bold text-white leading-5">
                {content.heading}
              </h2>
              <p className="text-sm font-medium text-white leading-[18px]">
                {content.description}
              </p>
              {content.linkText && content.linkHref && (
                <Link 
                  to={content.linkHref}
                  className="text-sm font-medium text-white leading-[18px] underline hover:opacity-80 transition-opacity"
                >
                  {content.linkText}
                </Link>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  )
}

