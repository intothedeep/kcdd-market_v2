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
  prefix?: string
  suffix?: string
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

export function StatsSection({ stats, content, showContent = true }: StatsSectionProps) {
  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="stats-heading">
      <div className="mx-auto max-w-[1200px] rounded-[10px] bg-[hsl(var(--brand-primary))] p-6 md:p-8">
        <div
          className={`flex flex-col ${showContent && content ? 'lg:flex-row' : ''} items-start gap-8 lg:items-center`}
        >
          {/* Stats Grid */}
          <div
            className={`flex flex-col gap-6 md:flex-row md:gap-8 ${showContent && content ? 'flex-1' : 'w-full justify-center'}`}
          >
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-1 flex-col gap-1.5">
                {typeof stat.value === 'number' ? (
                  <div className="flex items-baseline">
                    {stat.prefix && (
                      <span className="text-[46px] font-bold leading-normal text-white">
                        {stat.prefix}
                      </span>
                    )}
                    <AnimatedCounter
                      value={stat.value}
                      className="text-[46px] font-bold leading-normal text-white"
                    />
                    {stat.suffix && (
                      <span className="text-[46px] font-bold leading-normal text-white">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[46px] font-bold leading-normal text-white" role="text">
                    {stat.prefix}
                    {stat.value}
                    {stat.suffix}
                  </div>
                )}
                <h3 className="text-base font-bold leading-5 text-white">{stat.label}</h3>
                <p className="text-sm font-medium leading-[18px] text-white">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Right Content Block (Optional) */}
          {showContent && content && (
            <article className="flex w-full flex-col gap-1.5 lg:w-[387px]">
              <h2 id="stats-heading" className="text-base font-bold leading-5 text-white">
                {content.heading}
              </h2>
              <p className="text-sm font-medium leading-[18px] text-white">{content.description}</p>
              {content.linkText && content.linkHref && (
                <Link
                  to={content.linkHref}
                  className="text-sm font-medium leading-[18px] text-white underline transition-opacity hover:opacity-80"
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
