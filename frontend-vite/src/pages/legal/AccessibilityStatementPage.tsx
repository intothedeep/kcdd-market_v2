/**
 * Accessibility Statement Page
 */

export function AccessibilityStatementPage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Accessibility Statement
          </h1>
          <p className="text-sm text-muted-foreground">Our commitment to digital inclusion</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            KC Digital Drive is committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and applying
            the relevant accessibility standards.
          </p>

          <h2 className="text-2xl font-bold">Our Commitment</h2>
          <p>
            As an organization dedicated to bridging the digital divide, we believe that technology
            should be accessible to everyone. We strive to ensure our website is usable by people of
            all abilities and disabilities.
          </p>

          <h2 className="text-2xl font-bold">Conformance Status</h2>
          <p>
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
            standards. These guidelines explain how to make web content more accessible for people
            with disabilities.
          </p>

          <h2 className="text-2xl font-bold">Accessibility Features</h2>
          <p>Our website includes the following accessibility features:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Keyboard Navigation:</strong> All interactive elements are accessible via
              keyboard for users who cannot use a mouse.
            </li>
            <li>
              <strong>Screen Reader Compatibility:</strong> Our pages are structured with proper
              headings and landmarks for screen reader users.
            </li>
            <li>
              <strong>Alternative Text:</strong> Images include descriptive alternative text for
              users who cannot see them.
            </li>
            <li>
              <strong>Color Contrast:</strong> We maintain sufficient color contrast ratios between
              text and background colors.
            </li>
            <li>
              <strong>Resizable Text:</strong> Text can be resized up to 200% without loss of
              content or functionality.
            </li>
            <li>
              <strong>Focus Indicators:</strong> Visible focus indicators help keyboard users
              identify their current location on the page.
            </li>
            <li>
              <strong>Form Labels:</strong> All form inputs have associated labels for clarity and
              screen reader compatibility.
            </li>
            <li>
              <strong>Skip Links:</strong> Skip navigation links allow users to bypass repetitive
              content.
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Technologies Used</h2>
          <p>
            The accessibility of this website relies on the following technologies to work with your
            browser and any assistive technologies or plugins installed on your computer:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>HTML</li>
            <li>CSS</li>
            <li>JavaScript</li>
            <li>WAI-ARIA</li>
          </ul>

          <h2 className="text-2xl font-bold">Known Limitations</h2>
          <p>
            While we strive to ensure accessibility, some content may not be fully accessible. We
            are actively working to identify and resolve any accessibility barriers. Known issues
            include:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              Some older PDF documents may not be fully accessible. We are working to update these
              documents.
            </li>
            <li>
              Third-party content embedded on our site may not meet all accessibility standards.
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Feedback</h2>
          <p>
            We welcome your feedback on the accessibility of KC Digital Drive. Please let us know if
            you encounter accessibility barriers:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>Email: accessibility@kcdigitaldrive.org</li>
            <li>Phone: Available upon request</li>
          </ul>
          <p>We try to respond to accessibility feedback within 5 business days.</p>

          <h2 className="text-2xl font-bold">Assessment Approach</h2>
          <p>KC Digital Drive assesses the accessibility of our website through:</p>
          <ul className="list-inside list-disc space-y-2">
            <li>Self-evaluation using accessibility testing tools</li>
            <li>User testing with people who use assistive technologies</li>
            <li>Regular code reviews with accessibility in mind</li>
          </ul>

          <h2 className="text-2xl font-bold">Enforcement Procedure</h2>
          <p>
            If you are not satisfied with our response to your accessibility concern, you may
            contact the appropriate enforcement agency in your jurisdiction.
          </p>

          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p>For questions about our accessibility efforts, please contact:</p>
          <p>
            KC Digital Drive
            <br />
            Email: accessibility@kcdigitaldrive.org
            <br />
            Kansas City, MO
          </p>
        </div>
      </div>
    </div>
  )
}
