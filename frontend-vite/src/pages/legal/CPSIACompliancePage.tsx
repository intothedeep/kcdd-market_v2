/**
 * GCC-CPSIA Compliance Page
 */

export function CPSIACompliancePage() {
  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
            GCC-CPSIA Compliance
          </h1>
          <p className="text-sm text-muted-foreground">
            Consumer Product Safety Improvement Act Compliance
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            KC Digital Drive is committed to the safety of all users, especially children. This
            page outlines our compliance with the Consumer Product Safety Improvement Act (CPSIA)
            and our General Conformity Certificate (GCC) practices.
          </p>

          <h2 className="text-2xl font-bold">About CPSIA</h2>
          <p>
            The Consumer Product Safety Improvement Act (CPSIA) of 2008 is a United States law
            that establishes consumer product safety standards, particularly for children's
            products. The law is enforced by the Consumer Product Safety Commission (CPSC).
          </p>

          <h2 className="text-2xl font-bold">Our Commitment</h2>
          <p>
            When KC Digital Drive facilitates donations of products or equipment, we are
            committed to ensuring that:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Products intended for children meet all applicable CPSIA safety standards
            </li>
            <li>
              Lead content in children's products complies with federal limits
            </li>
            <li>
              Products do not contain prohibited phthalates
            </li>
            <li>
              Required testing and certifications are maintained where applicable
            </li>
          </ul>

          <h2 className="text-2xl font-bold">General Conformity Certificate (GCC)</h2>
          <p>
            A General Conformity Certificate (GCC) is a document that certifies that a product
            complies with all applicable consumer product safety rules. For applicable products
            distributed through our platform:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              We work with organizations to ensure donated equipment meets safety standards
            </li>
            <li>
              We verify that technology products have appropriate safety certifications
            </li>
            <li>
              We maintain records of compliance documentation as required
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Children's Products</h2>
          <p>
            Under CPSIA, a children's product is defined as a consumer product designed or
            intended primarily for children 12 years of age or younger. For such products:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Products must be tested by a CPSC-accepted laboratory
            </li>
            <li>
              A Children's Product Certificate (CPC) must be issued
            </li>
            <li>
              Products must have permanent tracking labels
            </li>
            <li>
              Lead content must not exceed 100 ppm in accessible parts
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Technology Equipment Safety</h2>
          <p>
            Technology equipment distributed through KC Digital Drive typically includes
            computers, tablets, and related accessories. We ensure these products:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Meet FCC requirements for electronic devices
            </li>
            <li>
              Have appropriate UL or equivalent safety certifications
            </li>
            <li>
              Include necessary safety documentation and warnings
            </li>
            <li>
              Are free from known safety defects or recalls
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Recall Information</h2>
          <p>
            We monitor CPSC recall announcements to ensure products distributed through our
            platform are not subject to active recalls. If a recalled product is identified:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>We immediately cease distribution of the affected product</li>
            <li>We notify organizations that may have received the product</li>
            <li>We assist with recall remedies as appropriate</li>
          </ul>

          <h2 className="text-2xl font-bold">Reporting Safety Concerns</h2>
          <p>
            If you have concerns about the safety of a product received through KC Digital
            Drive, please:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Stop using the product immediately</li>
            <li>Contact us at safety@kcdigitaldrive.org</li>
            <li>
              Report the issue to the CPSC at{' '}
              <a
                href="https://www.saferproducts.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                SaferProducts.gov
              </a>
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Resources</h2>
          <p>
            For more information about product safety regulations:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a
                href="https://www.cpsc.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Consumer Product Safety Commission (CPSC)
              </a>
            </li>
            <li>
              <a
                href="https://www.cpsc.gov/Regulations-Laws--Standards/Statutes/The-Consumer-Product-Safety-Improvement-Act"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                CPSIA Information
              </a>
            </li>
          </ul>

          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p>
            For questions about our CPSIA compliance practices, please contact:
          </p>
          <p>
            KC Digital Drive<br />
            Email: safety@kcdigitaldrive.org<br />
            Kansas City, MO
          </p>
        </div>
      </div>
    </div>
  )
}
