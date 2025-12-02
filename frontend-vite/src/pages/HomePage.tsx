/**
 * Home Page
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="w-full bg-white py-5 px-5 md:py-8">
      <div className="w-full max-w-none">
        <div className="flex items-center gap-5">
          {/* Left Decorative Grid */}
          <div className="hidden lg:grid flex-1 h-[500px] grid-cols-6 grid-rows-7 gap-2.5">
            <div className="col-start-5 col-span-2 row-start-2 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-3 col-span-2 row-start-1 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-3 col-span-2 row-start-4 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-1 col-span-2 row-start-5 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-1 col-span-2 row-start-2 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-[22px] py-10">
            <h1 className="text-[30px] md:text-[40px] lg:text-[48px] font-bold text-black text-center leading-tight">
              Bridge the Digital Divide
              <br />
              <span className="text-[hsl(var(--brand-primary))]">in Kansas City</span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-600 text-center max-w-2xl leading-relaxed">
              Connect donors with technology equipment requests from Kansas City community organizations. Make an impact today.
            </p>

            <div className="flex gap-4 items-center">
              <Link to={routes.requests}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))] hover:text-white h-10 px-4"
                >
                  Browse Requests
                </Button>
              </Link>
              <Link to={routes.about}>
                <Button
                  size="lg"
                  className="rounded-full bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(var(--brand-primary))]/90 h-10 px-4"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Decorative Grid */}
          <div className="hidden lg:grid flex-1 h-[500px] grid-cols-6 grid-rows-7 gap-2.5">
            <div className="col-start-1 col-span-2 row-start-4 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-3 col-span-2 row-start-5 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-3 col-span-2 row-start-2 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-5 col-span-2 row-start-1 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
            <div className="col-start-5 col-span-2 row-start-4 row-span-3 bg-[hsl(var(--brand-primary))] rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
