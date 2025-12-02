/**
 * Home Page
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'
import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Dev Status Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container py-4 text-center">
          <h2 className="text-2xl font-bold">Hello World!</h2>
          <p className="text-sm mt-1">System Running | Frontend: OK | Database: OK | API: Needs Setup</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-4 pb-8 pt-6 md:py-10">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
            Bridge the Digital Divide
            <br className="hidden sm:inline" />
            <span className="text-primary"> in Kansas City</span>
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Connect donors with technology equipment requests from Kansas City community
            organizations. Make an impact today.
          </p>
          <div className="flex gap-4">
            <Link to={routes.requests}>
              <Button size="lg">Browse Requests</Button>
            </Link>
            <Link to={routes.about}>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Browse Requests</h3>
            <p className="text-muted-foreground">
              Explore technology needs from vetted community organizations in the KC metro.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Make a Donation</h3>
            <p className="text-muted-foreground">
              Choose a request, provide equipment or funding, and track your impact.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">See Your Impact</h3>
            <p className="text-muted-foreground">
              View your contribution history and see how you're helping bridge the digital divide.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

