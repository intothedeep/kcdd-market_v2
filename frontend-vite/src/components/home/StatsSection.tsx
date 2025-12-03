/**
 * Stats Section Component
 * Location: src/components/home/StatsSection.tsx
 * 
 * Displays statistics and metrics with dark teal background
 */

export function StatsSection() {
  const stats = [
    { value: '1k.', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,' },
    { value: '1k.', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,' },
    { value: '1k.', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,' }
  ]

  return (
    <section className="container mx-auto px-4 py-8 md:py-12" aria-labelledby="stats-heading">
      <div className="bg-[hsl(var(--brand-primary))] rounded-[10px] p-6 md:p-8 max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          {/* Stats Grid */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-1.5 flex-1">
                <div className="text-[46px] font-bold text-white leading-normal" role="text">
                  {stat.value}
                </div>
                <p className="text-sm font-medium text-white leading-[18px]">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right Content Block */}
          <article className="flex flex-col gap-1.5 w-full lg:w-[387px]">
            <h2 id="stats-heading" className="text-base font-bold text-white leading-5">
              Title Label
            </h2>
            <p className="text-sm font-medium text-white leading-[18px]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            </p>
            <a 
              href="#" 
              className="text-sm font-medium text-white leading-[18px] underline hover:opacity-80 transition-opacity"
            >
              Lorem ipsum dolor
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}

