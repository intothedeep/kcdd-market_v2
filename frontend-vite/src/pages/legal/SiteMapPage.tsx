/**
 * Site Map Page
 */

import { Link } from 'react-router-dom'
import { routes } from '@/config'

export function SiteMapPage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">Site Map</h1>
          <p className="text-xl text-muted-foreground">Navigate all areas of KC Digital Drive</p>
        </div>

        <div className="space-y-8">
          {/* Main Pages */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Main Pages</h2>
            <ul className="space-y-2">
              <li>
                <Link to={routes.home} className="text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to={routes.about} className="text-primary hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to={routes.requests} className="text-primary hover:underline">
                  Browse Requests
                </Link>
              </li>
            </ul>
          </section>

          {/* Account */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Account</h2>
            <ul className="space-y-2">
              <li>
                <Link to={routes.signIn} className="text-primary hover:underline">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to={routes.signUp} className="text-primary hover:underline">
                  Create Account
                </Link>
              </li>
            </ul>
          </section>

          {/* Donor Area */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">For Donors</h2>
            <ul className="space-y-2">
              <li>
                <Link to={routes.donor.dashboard} className="text-primary hover:underline">
                  Donor Dashboard
                </Link>
              </li>
              <li>
                <Link to={routes.donor.dashboard} className="text-primary hover:underline">
                  My Donations
                </Link>
              </li>
              <li>
                <Link to={routes.donor.profile} className="text-primary hover:underline">
                  Donor Profile
                </Link>
              </li>
            </ul>
          </section>

          {/* Organization Area */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">For Organizations</h2>
            <ul className="space-y-2">
              <li>
                <Link to={routes.cbo.dashboard} className="text-primary hover:underline">
                  Organization Dashboard
                </Link>
              </li>
              <li>
                <Link to={routes.cbo.requests} className="text-primary hover:underline">
                  Manage Requests
                </Link>
              </li>
              <li>
                <Link to={routes.cbo.newRequest} className="text-primary hover:underline">
                  Submit New Request
                </Link>
              </li>
              <li>
                <Link to={routes.cbo.profile} className="text-primary hover:underline">
                  Organization Profile
                </Link>
              </li>
            </ul>
          </section>

          {/* Legal Pages */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Legal & Policies</h2>
            <ul className="space-y-2">
              <li>
                <Link to={routes.legal.privacy} className="text-primary hover:underline">
                  Privacy Statement
                </Link>
              </li>
              <li>
                <Link to={routes.legal.doNotSell} className="text-primary hover:underline">
                  Do Not Sell My Personal Information
                </Link>
              </li>
              <li>
                <Link to={routes.legal.accessibility} className="text-primary hover:underline">
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <Link to={routes.legal.terms} className="text-primary hover:underline">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to={routes.legal.cpsia} className="text-primary hover:underline">
                  GCC-CPSIA Compliance
                </Link>
              </li>
              <li>
                <Link to={routes.legal.sitemap} className="text-primary hover:underline">
                  Site Map
                </Link>
              </li>
            </ul>
          </section>

          {/* Support */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Support & Contact</h2>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground">
                  Email:{' '}
                  <a
                    href="mailto:support@kcdigitaldrive.org"
                    className="text-primary hover:underline"
                  >
                    support@kcdigitaldrive.org
                  </a>
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  For accessibility concerns:{' '}
                  <a
                    href="mailto:accessibility@kcdigitaldrive.org"
                    className="text-primary hover:underline"
                  >
                    accessibility@kcdigitaldrive.org
                  </a>
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">
                  For privacy questions:{' '}
                  <a
                    href="mailto:privacy@kcdigitaldrive.org"
                    className="text-primary hover:underline"
                  >
                    privacy@kcdigitaldrive.org
                  </a>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
