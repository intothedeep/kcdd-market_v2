/**
 * ========================================
 * FOOTER COMPONENT
 * ========================================
 *
 * Location: src/components/Footer.tsx
 * Data File: src/data/footer.ts
 *
 * DESCRIPTION:
 * Site-wide footer with link columns, newsletter signup,
 * and legal links. Dark teal background.
 *
 * ========================================
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Apple, Facebook, Twitter, Instagram, Linkedin, Loader2, CheckCircle } from 'lucide-react'
import { subscribeToNewsletter } from '@/lib/supabase'

export interface FooterLinkColumn {
  title: string
  links: { label: string; href: string }[]
}

export interface FooterData {
  linkColumns: FooterLinkColumn[]
  newsletter: {
    title: string
    description: string
    placeholder: string
    buttonLabel: string
  }
  socialLinks: { icon: string; href: string; label: string }[]
  legalLinks: { label: string; href: string }[]
  bottomSocialLinks?: { icon: string; href: string; label: string }[]
}

interface FooterProps {
  data: FooterData
}

// Icon mapping for social links
const iconMap: Record<string, React.ElementType> = {
  apple: Apple,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
}

function SocialIcon({
  iconName,
  variant = 'white',
}: {
  iconName: string
  variant?: 'white' | 'teal'
}) {
  const Icon = iconMap[iconName] || Apple
  const bgColor = variant === 'white' ? 'bg-white' : 'bg-[#1b5858]'
  const iconColor = variant === 'white' ? 'text-[#103032]' : 'text-white'

  return (
    <div className={`${bgColor} flex items-center justify-center rounded-full p-[5px]`}>
      <Icon className={`size-4 ${iconColor}`} />
    </div>
  )
}

export function Footer({ data }: FooterProps) {
  const { linkColumns, newsletter, socialLinks, legalLinks, bottomSocialLinks } = data

  // Newsletter form state
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await subscribeToNewsletter(email, 'footer')
      setIsSuccess(true)
      setEmail('')
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (err) {
      console.error('Newsletter subscription error:', err)
      setError('Failed to subscribe. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <footer className="bg-[#103032] px-4 py-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2.5">
        {/* Top Section */}
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row">
          {/* Link Columns */}
          <div className="flex flex-wrap gap-3">
            {linkColumns.map((column, colIndex) => (
              <div key={colIndex} className="flex w-[162px] flex-col gap-1.5">
                <h3 className="text-base font-bold leading-5 text-[#dbf938]">{column.title}</h3>
                {column.links.map((link, linkIndex) => (
                  <Link
                    key={linkIndex}
                    to={link.href}
                    className="text-sm font-medium leading-[18px] text-[#d5d5d5] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Newsletter Section */}
          <div className="flex w-full flex-col gap-1.5 lg:w-auto lg:max-w-[350px]">
            <h3 className="text-base font-bold leading-5 text-white">{newsletter.title}</h3>
            <p className="text-sm font-medium leading-[18px] text-white">
              {newsletter.description}
            </p>

            {/* Email Input Form */}
            <form onSubmit={handleNewsletterSubmit} className="flex items-end gap-2 pb-1.5 pt-4">
              <div className="flex flex-1 flex-col gap-2">
                <label
                  htmlFor="newsletter-email"
                  className="text-sm font-medium leading-none text-white"
                >
                  EMAIL:
                </label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={newsletter.placeholder}
                  className="h-9 rounded-lg border-[#e5e5e5] bg-white shadow-sm"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || isSuccess}
                className="h-9 rounded-full bg-[#f5f5f5] px-4 text-[#171717] shadow-sm hover:bg-white disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle className="size-4 text-green-600" />
                ) : (
                  newsletter.buttonLabel
                )}
              </Button>
            </form>

            {/* Success/Error Messages */}
            {isSuccess && (
              <p className="text-sm font-medium text-[#dbf938]">Thanks for subscribing!</p>
            )}
            {error && <p className="text-sm font-medium text-red-400">{error}</p>}

            {/* Social Links (white) */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="transition-opacity hover:opacity-80"
                >
                  <SocialIcon iconName={social.icon} variant="white" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-start justify-between gap-4 pt-10 md:flex-row md:items-end">
          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-[#d5d5d5]">
            {legalLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                className="underline transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bottom Social Links (teal) */}
          {bottomSocialLinks && bottomSocialLinks.length > 0 && (
            <div className="flex items-center gap-2">
              {bottomSocialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="transition-opacity hover:opacity-80"
                >
                  <SocialIcon iconName={social.icon} variant="teal" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
