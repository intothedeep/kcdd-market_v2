/**
 * Public Contact Page
 */

import { useState } from 'react'
import { Mail, Phone, Clock, MapPin, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CONTACT_INFO, SOCIAL_LINKS } from '@/constants/contact'

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSending(false)
    setSent(true)
    setForm({ name: '', email: '', subject: 'general', message: '' })
  }

  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            Have a question or want to get involved? We'd love to hear from you.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <Mail className="mb-2 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <p className="text-sm font-medium">Email</p>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="text-sm text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
            >
              {CONTACT_INFO.email}
            </a>
          </Card>
          <Card className="p-4">
            <Phone className="mb-2 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <p className="text-sm font-medium">Phone</p>
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="text-sm text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
            >
              {CONTACT_INFO.phone}
            </a>
          </Card>
          <Card className="p-4">
            <Clock className="mb-2 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <p className="text-sm font-medium">Hours</p>
            <p className="text-sm text-muted-foreground">{CONTACT_INFO.hours}</p>
          </Card>
          <Card className="p-4">
            <MapPin className="mb-2 h-5 w-5 text-[hsl(var(--brand-primary))]" />
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-muted-foreground">
              {CONTACT_INFO.address.street}, {CONTACT_INFO.address.city},{' '}
              {CONTACT_INFO.address.state} {CONTACT_INFO.address.zip}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <h2 className="mb-1 text-lg font-semibold">Send a Message</h2>
              <p className="mb-6 text-sm text-muted-foreground">We'll respond within 24 hours.</p>

              {sent ? (
                <div className="rounded-lg bg-green-50 p-6 text-center">
                  <p className="font-medium text-green-800">Message sent!</p>
                  <p className="mt-1 text-sm text-green-700">
                    We'll get back to you within 24 hours.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <select
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="report">Report an Issue</option>
                      <option value="organization">Organization Inquiry</option>
                      <option value="donation">Donation Question</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help?"
                      className="h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]"
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <h3 className="mb-3 font-semibold">Follow Us</h3>
              <div className="space-y-2">
                {Object.entries(SOCIAL_LINKS).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm capitalize text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="mb-3 font-semibold">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <a
                  href="/faq"
                  className="block text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
                >
                  Frequently Asked Questions
                </a>
                <a
                  href="/about"
                  className="block text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
                >
                  About Us
                </a>
                <a
                  href="/campaigns"
                  className="block text-muted-foreground hover:text-[hsl(var(--brand-primary))]"
                >
                  Browse Requests
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
