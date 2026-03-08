/**
 * Do Not Sell My Personal Information Page
 */

export function DoNotSellPage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            Do Not Sell My Personal Information
          </h1>
          <p className="text-sm text-muted-foreground">
            Your California Privacy Rights
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            KC Digital Drive respects your privacy and is committed to complying with the
            California Consumer Privacy Act (CCPA) and other applicable privacy laws.
          </p>

          <h2 className="text-2xl font-bold">Our Commitment</h2>
          <p>
            <strong>We do not sell your personal information.</strong> KC Digital Drive has never
            sold personal information and has no plans to do so in the future. We believe your
            data belongs to you, and we only use it to provide and improve our services.
          </p>

          <h2 className="text-2xl font-bold">What This Means for You</h2>
          <p>
            Under the CCPA, California residents have the right to opt out of the sale of their
            personal information. Since we do not sell personal information, there is no need
            to submit an opt-out request. However, we want to be transparent about our practices
            and give you control over your data.
          </p>

          <h2 className="text-2xl font-bold">Your Rights Under CCPA</h2>
          <p>As a California resident, you have the right to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Know:</strong> Request information about the categories and specific pieces
              of personal information we have collected about you.
            </li>
            <li>
              <strong>Delete:</strong> Request deletion of your personal information, subject to
              certain exceptions.
            </li>
            <li>
              <strong>Non-Discrimination:</strong> Exercise your privacy rights without receiving
              discriminatory treatment.
            </li>
            <li>
              <strong>Opt-Out:</strong> Opt out of the sale of personal information (though we do
              not sell personal information).
            </li>
          </ul>

          <h2 className="text-2xl font-bold">How We Use Your Information</h2>
          <p>We collect and use personal information solely for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Processing donations and providing tax receipts</li>
            <li>Managing your account and preferences</li>
            <li>Communicating about campaigns and organization updates</li>
            <li>Improving our website and services</li>
            <li>Complying with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold">Third-Party Service Providers</h2>
          <p>
            We work with trusted third-party service providers (such as payment processors and
            email services) who may process your data on our behalf. These providers are
            contractually obligated to protect your information and only use it for the specific
            purposes we direct.
          </p>

          <h2 className="text-2xl font-bold">Exercising Your Rights</h2>
          <p>To exercise any of your privacy rights, you can:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Email us at: privacy@kcdigitaldrive.org</li>
            <li>Submit a request through your account settings</li>
            <li>Contact us by mail at our Kansas City address</li>
          </ul>
          <p>
            We will respond to verifiable consumer requests within 45 days. If we need more time,
            we will notify you of the reason and extension period.
          </p>

          <h2 className="text-2xl font-bold">Verification</h2>
          <p>
            To protect your privacy, we may need to verify your identity before processing your
            request. We will ask you to provide information that matches the information we have
            on file.
          </p>

          <h2 className="text-2xl font-bold">Authorized Agents</h2>
          <p>
            You may designate an authorized agent to make a request on your behalf. We will
            require verification that you have authorized the agent to act on your behalf.
          </p>

          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p>
            If you have questions about this notice or your privacy rights, please contact us:
          </p>
          <p>
            KC Digital Drive<br />
            Email: privacy@kcdigitaldrive.org<br />
            Kansas City, MO
          </p>
        </div>
      </div>
    </div>
  )
}
