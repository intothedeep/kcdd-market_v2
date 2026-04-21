/**
 * Home Page Stats Data
 * Location: src/data/homeStats.ts
 *
 * Statistics for the homepage stats section
 */

import { Stat, StatsContent } from '@/components/home/StatsSection'

export const homeStats: Stat[] = [
  {
    value: 150,
    label: 'Requests Fulfilled',
    description: 'Technology needs met',
  },
  {
    value: 45,
    label: 'Organizations Served',
    description: 'CBOs empowered',
  },
  {
    value: 85000,
    label: 'Total Donated',
    description: 'In community support',
    prefix: '$',
  },
]

export const homeStatsContent: StatsContent = {
  heading: 'Making an Impact Together',
  description:
    'KC Digital Drive connects generous donors with community-based organizations in Kansas City. Every donation directly supports local nonprofits with their technology needs.',
  linkText: 'View Impact Reports',
  linkHref: '/about#impact',
}
