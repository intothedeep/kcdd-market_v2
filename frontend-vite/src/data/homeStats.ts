/**
 * Home Page Stats Data
 * Location: src/data/homeStats.ts
 * 
 * Statistics for the homepage stats section
 */

import { Stat, StatsContent } from '@/components/home/StatsSection'

export const homeStats: Stat[] = [
  {
    value: 42,
    label: 'Fulfilled Requests',
    description: 'Successfully completed'
  },
  {
    value: 28,
    label: 'CBOs Served',
    description: 'Organizations helped'
  },
  {
    value: 156,
    label: 'Total Impact',
    description: 'Value delivered'
  }
]

export const homeStatsContent: StatsContent = {
  heading: 'Title Label',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim',
  linkText: 'Lorem ipsum dolor',
  linkHref: '#'
}

