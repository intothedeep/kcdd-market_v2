/**
 * Home Page Features Data
 * Location: src/data/homeFeatures.ts
 * 
 * Centralized data for homepage features
 * Can be easily modified or replaced with API calls
 */

import { FileText, Heart, BarChart3 } from 'lucide-react'
import { Feature } from '@/components/home/FeaturesSection'

export const homeFeatures: Feature[] = [
  {
    icon: FileText,
    title: 'CBOs Submit Requests',
    description: 'Community-based organizations submit detailed technology equipment requests, explaining their needs and the impact they\'ll create.'
  },
  {
    icon: Heart,
    title: 'Donors Claim Requests',
    description: 'Generous donors browse through requests and claim the ones that align with their interests and capacity to help.'
  },
  {
    icon: BarChart3,
    title: 'Fulfillment Tracking',
    description: 'We track the entire fulfillment process and measure the real impact on Kansas City communities.'
  }
]

