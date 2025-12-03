/**
 * Home Page
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'
import { FileText, Heart, BarChart3 } from 'lucide-react'

export function HomePage() {
  return (
    <div className="w-full bg-white py-5 px-5 md:py-8">
      <div className="w-full max-w-none">
        <div className="flex items-center gap-5">
          {/* Left Decorative Grid */}
          <div className="hidden lg:grid flex-1 h-[650px] grid-cols-6 grid-rows-7 gap-2.5">
            <div className="col-start-5 col-span-2 row-start-2 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/cheerful-black-man-looking-at-camera-on-street-2025-01-07-04-40-17-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-3 col-span-2 row-start-1 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/close-up-portrait-of-millennial-black-female-creat-2024-10-21-18-29-53-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-3 col-span-2 row-start-4 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/face-of-mature-handsome-persian-man-looking-at-cam-2025-01-29-01-56-31-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-1 col-span-2 row-start-5 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/portrait-of-a-young-woman-2025-04-04-09-20-52-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-1 col-span-2 row-start-2 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/portrait-of-mid-adult-bearded-indian-man-looking-a-2025-01-09-12-53-48-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
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
          <div className="hidden lg:grid flex-1 h-[650px] grid-cols-6 grid-rows-7 gap-2.5">
            <div className="col-start-1 col-span-2 row-start-4 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/short-haired-mixed-race-woman-on-grey-2025-03-07-14-38-42-utc (1).jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-3 col-span-2 row-start-5 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/young-asian-man-wearing-blue-sweater-against-gray-2025-01-29-02-37-51-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-3 col-span-2 row-start-2 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/young-beautiful-african-american-black-woman-with-2025-01-08-23-40-19-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-5 col-span-2 row-start-1 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/cheerful-black-man-looking-at-camera-on-street-2025-01-07-04-40-17-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
            <div className="col-start-5 col-span-2 row-start-4 row-span-3 rounded-[10px] overflow-hidden relative group">
              <img 
                src="/images/close-up-portrait-of-millennial-black-female-creat-2024-10-21-18-29-53-utc.jpg" 
                alt="Community member"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,black_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-5 items-center justify-center">
          {/* Feature 1 */}
          <div className="flex flex-col gap-4 items-start w-full md:w-[253px]">
            <div className="bg-[hsl(var(--brand-primary))] flex items-center justify-center p-2.5 rounded-[31px] w-11 h-11">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1.5 text-black w-full">
              <h3 className="font-bold text-base leading-5">CBOs Submit Requests</h3>
              <p className="font-medium text-sm leading-[18px]">
                Community-based organizations submit detailed technology equipment requests, explaining their needs and the impact they'll create.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col gap-4 items-start w-full md:w-[253px]">
            <div className="bg-[hsl(var(--brand-primary))] flex items-center justify-center p-2.5 rounded-[31px] w-11 h-11">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1.5 text-black w-full">
              <h3 className="font-bold text-base leading-5">Donors Claim Requests</h3>
              <p className="font-medium text-sm leading-[18px]">
                Generous donors browse through requests and claim the ones that align with their interests and capacity to help.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col gap-4 items-start w-full md:w-[253px]">
            <div className="bg-[hsl(var(--brand-primary))] flex items-center justify-center p-2.5 rounded-[31px] w-11 h-11">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1.5 text-black w-full">
              <h3 className="font-bold text-base leading-5">Fulfillment Tracking</h3>
              <p className="font-medium text-sm leading-[18px]">
                We track the entire fulfillment process and measure the real impact on Kansas City communities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="bg-[hsl(var(--brand-primary))] rounded-[10px] p-6 md:p-8 max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            {/* Stats Grid */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
              {/* Stat 1 */}
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="text-[46px] font-bold text-white leading-normal">1k.</div>
                <p className="text-sm font-medium text-white leading-[18px]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                </p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="text-[46px] font-bold text-white leading-normal">1k.</div>
                <p className="text-sm font-medium text-white leading-[18px]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                </p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="text-[46px] font-bold text-white leading-normal">1k.</div>
                <p className="text-sm font-medium text-white leading-[18px]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                </p>
              </div>
            </div>

            {/* Right Content Block */}
            <div className="flex flex-col gap-1.5 w-full lg:w-[387px]">
              <h3 className="text-base font-bold text-white leading-5">Title Label</h3>
              <p className="text-sm font-medium text-white leading-[18px]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              </p>
              <a href="#" className="text-sm font-medium text-white leading-[18px] underline hover:opacity-80">
                Lorem ipsum dolor
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
