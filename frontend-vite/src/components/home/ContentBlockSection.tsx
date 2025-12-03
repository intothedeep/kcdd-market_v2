/**
 * Content Block Section Component
 * Location: src/components/home/ContentBlockSection.tsx
 * 
 * Content section with image and CTA buttons on dark background
 */

import { Button } from '@/components/ui/button'

export function ContentBlockSection() {
  return (
    <section className="bg-[#103032] py-8 md:py-12 px-4" aria-labelledby="content-block-heading">
      <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-10 items-center">
        {/* Image Placeholder */}
        <figure className="w-full lg:flex-1 h-[390px] bg-[#d25c2c] rounded-[10px]" aria-label="Feature image placeholder" />
        
        {/* Text Content */}
        <article className="w-full lg:flex-1 flex flex-col gap-6">
          <p className="text-base text-white">Lorem ipsum dolor sit amet</p>
          
          <h2 id="content-block-heading" className="text-[30px] font-bold text-white leading-normal">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </h2>
          
          <div className="text-base text-white">
            <p className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Lorem ipsum dolor si</li>
              <li>incididunt ut labor</li>
              <li>qua. Ut enim ad mi</li>
              <li>ut labore et dol</li>
            </ul>
          </div>
          
          <nav className="flex gap-4" aria-label="Secondary actions">
            <Button
              className="bg-[#d25c2c] text-white border-2 border-[#d25c2c] hover:bg-transparent hover:text-[#d25c2c] focus-visible:ring-2 focus-visible:ring-[#d25c2c] focus-visible:ring-offset-2 active:scale-95 transition-all duration-200 rounded-full h-10 px-4"
            >
              Login
            </Button>
            <Button
              className="bg-white text-[#103032] border-2 border-white hover:bg-transparent hover:text-white hover:border-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 active:scale-95 transition-all duration-200 rounded-full h-10 px-4"
            >
              Login
            </Button>
          </nav>
        </article>
      </div>
    </section>
  )
}

