/**
 * Public FAQ Page
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { faqData } from '@/data/faqData'

export function FaqPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (key: string) => setExpanded(expanded === key ? null : key)

  return (
    <div className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about KC Digital Drive.
          </p>
        </div>

        <div className="space-y-10">
          {faqData.map((category) => (
            <div key={category.title}>
              <h2 className="mb-4 text-lg font-semibold">{category.title}</h2>
              <div className="divide-y rounded-lg border">
                {category.items.map((item, i) => {
                  const key = `${category.title}-${i}`
                  return (
                    <div key={key} className="px-4 py-3">
                      <button
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => toggle(key)}
                      >
                        <span className="font-medium">{item.question}</span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded === key ? 'rotate-90' : ''}`}
                        />
                      </button>
                      {expanded === key && (
                        <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg bg-muted/50 p-6 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="mb-2 font-semibold">Still have questions?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Our team is here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <Link to="/contact">
            <Button className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)]">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
