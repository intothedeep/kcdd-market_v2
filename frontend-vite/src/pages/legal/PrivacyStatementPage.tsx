/**
 * Privacy Statement Page
 */

export function PrivacyStatementPage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Privacy Statement
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            KC Digital Drive ("we," "our," or "us") is committed to protecting your privacy. This
            Privacy Statement explains how we collect, use, disclose, and safeguard your information
            when you visit our website and use our services.
          </p>

          <h2 className="text-2xl font-bold">Information We Collect</h2>
          <p>We may collect information about you in various ways, including:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Personal Data:</strong> Name, email address, phone number, and mailing address
              when you register for an account or make a donation.
            </li>
            <li>
              <strong>Payment Information:</strong> Credit card numbers and billing information when
              you make a donation (processed securely through our payment processor).
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our website, including
              pages visited, time spent on pages, and navigation patterns.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, IP address, device type, and
              operating system.
            </li>
          </ul>

          <h2 className="text-2xl font-bold">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Process donations and provide receipts</li>
            <li>Communicate with you about your account and our services</li>
            <li>Send updates about campaigns you've supported</li>
            <li>Improve our website and user experience</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and ensure security</li>
          </ul>

          <h2 className="text-2xl font-bold">Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Service Providers:</strong> Third-party vendors who assist us in operating our
              website and processing payments.
            </li>
            <li>
              <strong>Community Organizations:</strong> When you donate to a specific organization,
              we may share your name and donation amount (unless you choose to donate anonymously).
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights.
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your
            personal information. However, no method of transmission over the Internet is 100%
            secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold">Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>

          <h2 className="text-2xl font-bold">Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our
            website. You can control cookie preferences through your browser settings.
          </p>

          <h2 className="text-2xl font-bold">Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>

          <h2 className="text-2xl font-bold">Changes to This Statement</h2>
          <p>
            We may update this Privacy Statement from time to time. We will notify you of any
            changes by posting the new Privacy Statement on this page and updating the "Last
            updated" date.
          </p>

          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p>
            If you have questions about this Privacy Statement or our privacy practices, please
            contact us at:
          </p>
          <p>
            KC Digital Drive
            <br />
            Email: privacy@kcdigitaldrive.org
            <br />
            Kansas City, MO
          </p>
        </div>
      </div>
    </div>
  )
}
