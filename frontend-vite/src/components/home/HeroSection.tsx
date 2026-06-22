/**
 * Hero Section Component
 * Location: src/components/home/HeroSection.tsx
 *
 * Main hero section with decorative image grids and primary CTA buttons
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'
import { SignInButton, useUser } from '@clerk/clerk-react'
import { useUserType } from '@/hooks/useClerkSupabase'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  const { isSignedIn } = useUser()
  const { userType } = useUserType()
  const orgCtaClass =
    'h-10 w-full rounded-full border-2 border-[hsl(var(--brand-primary))] bg-transparent px-6 text-[hsl(var(--brand-primary))] transition-all duration-200 hover:bg-[hsl(var(--brand-primary))] hover:text-white focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))] focus-visible:ring-offset-2 active:scale-95 sm:w-auto'

  return (
    <section className="w-full bg-white" aria-labelledby="hero-heading">
      <div className="w-full max-w-none px-5 py-5 md:py-8">
        <div className="flex items-center gap-5">
          {/* Left Decorative Grid */}
          <aside
            className="hidden h-[650px] flex-1 grid-cols-6 grid-rows-7 gap-2.5 lg:grid"
            aria-hidden="true"
          >
            <figure className="group relative col-span-2 col-start-5 row-span-3 row-start-2 overflow-hidden rounded-[10px]">
              <img
                src="/images/cheerful-black-man-looking-at-camera-on-street-2025-01-07-04-40-17-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-3 row-span-3 row-start-1 overflow-hidden rounded-[10px]">
              <img
                src="/images/close-up-portrait-of-millennial-black-female-creat-2024-10-21-18-29-53-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-3 row-span-3 row-start-4 overflow-hidden rounded-[10px]">
              <img
                src="/images/face-of-mature-handsome-persian-man-looking-at-cam-2025-01-29-01-56-31-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-1 row-span-3 row-start-5 overflow-hidden rounded-[10px]">
              <img
                src="/images/portrait-of-a-young-woman-2025-04-04-09-20-52-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-1 row-span-3 row-start-2 overflow-hidden rounded-[10px]">
              <img
                src="/images/portrait-of-mid-adult-bearded-indian-man-looking-a-2025-01-09-12-53-48-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
          </aside>

          {/* Center Content */}
          <div className="flex flex-1 flex-col items-center justify-center gap-[22px] py-10">
            <h1
              id="hero-heading"
              className="text-center text-[30px] font-bold leading-tight text-black md:text-[40px] lg:text-[48px]"
            >
              Real tech.
              <br />
              <span className="text-[hsl(var(--brand-primary))]">For the people who need it.</span>
            </h1>

            <p className="max-w-2xl text-center text-base leading-relaxed text-gray-600 md:text-lg">
              KC DIME is a Kansas City tech nonprofit. We connect donors with laptops, hotspots,
              tablets, and equipment requests from local community organizations <em>and</em>{' '}
              individuals — so the digital divide gets smaller, one device at a time.
            </p>

            <nav
              className="flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center"
              aria-label="Primary actions"
            >
              <Link to={routes.requests} className="block w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-10 w-full rounded-full border-2 border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))] px-6 text-white transition-all duration-200 hover:bg-transparent hover:text-[hsl(var(--brand-primary))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))] focus-visible:ring-offset-2 active:scale-95 sm:w-auto"
                >
                  Browse campaigns &amp; donate
                </Button>
              </Link>
              {isSignedIn && userType === 'cbo' ? (
                <Link
                  to={`${routes.cbo.dashboard}?section=create-campaign`}
                  className="block w-full sm:w-auto"
                >
                  <Button size="lg" className={orgCtaClass}>
                    Create new campaign
                  </Button>
                </Link>
              ) : isSignedIn ? (
                <Link to={routes.cbo.setup} className="block w-full sm:w-auto">
                  <Button size="lg" className={orgCtaClass}>
                    Register organization
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button size="lg" className={orgCtaClass}>
                    Register organization
                  </Button>
                </SignInButton>
              )}
            </nav>
          </div>

          {/* Right Decorative Grid */}
          <aside
            className="hidden h-[650px] flex-1 grid-cols-6 grid-rows-7 gap-2.5 lg:grid"
            aria-hidden="true"
          >
            <figure className="group relative col-span-2 col-start-1 row-span-3 row-start-4 overflow-hidden rounded-[10px]">
              <img
                src="/images/short-haired-mixed-race-woman-on-grey-2025-03-07-14-38-42-utc (1).jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-3 row-span-3 row-start-5 overflow-hidden rounded-[10px]">
              <img
                src="/images/young-asian-man-wearing-blue-sweater-against-gray-2025-01-29-02-37-51-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-3 row-span-3 row-start-2 overflow-hidden rounded-[10px]">
              <img
                src="/images/young-beautiful-african-american-black-woman-with-2025-01-08-23-40-19-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-5 row-span-3 row-start-1 overflow-hidden rounded-[10px]">
              <img
                src="/images/cheerful-black-man-looking-at-camera-on-street-2025-01-07-04-40-17-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
            <figure className="group relative col-span-2 col-start-5 row-span-3 row-start-4 overflow-hidden rounded-[10px]">
              <img
                src="/images/close-up-portrait-of-millennial-black-female-creat-2024-10-21-18-29-53-utc.jpg"
                alt="Community member"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20" />
            </figure>
          </aside>
        </div>
      </div>
    </section>
  )
}
