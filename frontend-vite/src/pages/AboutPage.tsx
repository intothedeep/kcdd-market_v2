/**
 * About Page
 */

export function AboutPage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            About KC Digital Drive
          </h1>
          <p className="text-xl text-muted-foreground">
            Making Kansas City a digital leader and improving quality of life for all people in the
            region.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <h2 className="text-2xl font-bold">Our Mission</h2>
          <p>
            KC Digital Drive connects generous donors with community-based organizations that need
            technology equipment. We believe that access to technology is essential for education,
            employment, and community engagement.
          </p>

          <h2 className="text-2xl font-bold">How It Works</h2>
          <ol className="list-inside list-decimal space-y-2">
            <li>Community organizations submit requests for technology equipment</li>
            <li>Our team vets organizations to ensure they're legitimate</li>
            <li>Donors browse requests and choose where to make an impact</li>
            <li>Equipment or funding is provided directly to the organization</li>
            <li>Both parties can track progress and confirm fulfillment</li>
          </ol>

          <h2 className="text-2xl font-bold">Impact</h2>
          <p>
            Since our launch, we've helped bridge the digital divide by connecting donors with
            organizations serving the Kansas City metro area, including all counties in Missouri and
            Kansas.
          </p>
        </div>
      </div>
    </div>
  )
}
