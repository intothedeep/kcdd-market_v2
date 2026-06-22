/**
 * About Page
 * Sections linked from homepage and footer via anchor IDs
 */

import { useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Heart, Building2, Receipt, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AboutPage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } else {
      window.scrollTo(0, 0)
    }
  }, [hash])

  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl space-y-16">
        {/* Header */}
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            About KC Digital Drive
          </h1>
          <p className="text-xl text-muted-foreground">
            Making Kansas City a digital leader and improving quality of life for all people in the
            region.
          </p>
        </div>

        {/* Mission */}
        <section>
          <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
          <p className="text-muted-foreground">
            KC Digital Drive connects generous donors with community-based organizations that need
            technology equipment. We believe that access to technology is essential for education,
            employment, and community engagement.
          </p>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24">
          <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
          <ol className="list-inside list-decimal space-y-3 text-muted-foreground">
            <li>Community organizations submit requests for technology equipment</li>
            <li>Our team vets organizations to ensure they're legitimate 501(c)(3) nonprofits</li>
            <li>Donors browse requests and choose where to make an impact</li>
            <li>Equipment or funding is provided directly to the organization</li>
            <li>Both parties can track progress and confirm fulfillment</li>
          </ol>
        </section>

        {/* Impact */}
        <section id="impact" className="scroll-mt-24">
          <h2 className="mb-4 text-2xl font-bold">Impact</h2>
          <p className="mb-4 text-muted-foreground">
            Since our launch, we've helped bridge the digital divide by connecting donors with
            organizations serving the Kansas City metro area, including all counties in Missouri and
            Kansas.
          </p>
          <div className="grid grid-cols-3 gap-6 rounded-lg bg-muted/50 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--brand-primary))]">150+</p>
              <p className="text-sm text-muted-foreground">Requests Fulfilled</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--brand-primary))]">45+</p>
              <p className="text-sm text-muted-foreground">Organizations Served</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[hsl(var(--brand-primary))]">$85K+</p>
              <p className="text-sm text-muted-foreground">Total Donated</p>
            </div>
          </div>
        </section>

        {/* For Donors */}
        <section id="for-donors" className="scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-primary)/0.1)]">
              <Heart className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold">For Donors</h2>
              <p className="mb-4 text-muted-foreground">
                Making a difference in your community has never been easier. Browse technology
                requests from verified nonprofits, choose the cause that speaks to you, and fund it
                directly. Your entire donation goes to the organization — no middleman fees.
              </p>
              <ul className="mb-6 space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Browse real campaigns from verified Kansas City nonprofits
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Fund specific items — laptops, software, equipment
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Receive proof of delivery and impact updates
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Get instant tax receipts for every donation
                </li>
              </ul>
              <Link to="/campaigns">
                <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]">
                  Browse Campaigns
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* For Organizations */}
        <section id="for-organizations" className="scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-primary)/0.1)]">
              <Building2 className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold">For Organizations</h2>
              <p className="mb-4 text-muted-foreground">
                If you're a 501(c)(3) organization in the Kansas City area, KC Digital Drive can
                help you get the technology your team needs. Submit requests for specific equipment,
                and our donor community will help fund them.
              </p>
              <ul className="mb-6 space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Register and verify your 501(c)(3) status
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Post specific technology requests with details on usage
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Receive funding directly via secure Stripe payments
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Share impact stories and build donor relationships
                </li>
              </ul>
              <Link to="/sign-up">
                <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]">
                  Register Your Organization
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Tax Benefits */}
        <section id="tax-benefits" className="scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-primary)/0.1)]">
              <Receipt className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold">Tax Benefits</h2>
              <p className="mb-4 text-muted-foreground">
                Every donation made through KC Digital Drive is 100% tax-deductible. All recipient
                organizations are verified 501(c)(3) nonprofits, so your contributions qualify for
                full tax deductions.
              </p>
              <ul className="mb-4 space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Instant tax receipts emailed after each donation
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  Annual donation summaries available for download
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
                  All organizations verified as tax-exempt under IRS Section 501(c)(3)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Verification */}
        <section id="verification" className="scroll-mt-24">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand-primary)/0.1)]">
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold">Verification Process</h2>
              <p className="mb-4 text-muted-foreground">
                Trust is at the core of KC Digital Drive. Every organization on our platform goes
                through a verification process before they can post requests.
              </p>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-xs font-bold text-white">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Application</strong> — Organizations
                    register and provide their EIN and 501(c)(3) documentation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-xs font-bold text-white">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Review</strong> — Our team cross-references
                    IRS records, verifies the organization's mission, and confirms they serve the KC
                    metro area.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--brand-primary))] text-xs font-bold text-white">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Approval</strong> — Verified organizations
                    receive a badge and can begin posting technology requests to the platform.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
