# Reusable Components Guide

This guide shows how to use prop-based components for maximum reusability.

## FeaturesSection Component

### Component Location
`src/components/home/FeaturesSection.tsx`

### Props Interface

```typescript
interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface FeaturesSectionProps {
  features: Feature[]        // Required: Array of features to display
  heading?: string           // Optional: Section heading (default: "How It Works")
  showHeading?: boolean      // Optional: Show/hide heading (default: false)
}
```

## Usage Examples

### Example 1: Using Imported Data (Recommended)

**Data File:** `src/data/homeFeatures.ts`

```typescript
import { FileText, Heart, BarChart3 } from 'lucide-react'
import { Feature } from '@/components/home/FeaturesSection'

export const homeFeatures: Feature[] = [
  {
    icon: FileText,
    title: 'CBOs Submit Requests',
    description: 'Community-based organizations submit...'
  },
  {
    icon: Heart,
    title: 'Donors Claim Requests',
    description: 'Generous donors browse through...'
  },
  {
    icon: BarChart3,
    title: 'Fulfillment Tracking',
    description: 'We track the entire fulfillment...'
  }
]
```

**Page Usage:**

```typescript
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { homeFeatures } from '@/data/homeFeatures'

export function HomePage() {
  return (
    <main>
      <FeaturesSection features={homeFeatures} />
    </main>
  )
}
```

### Example 2: Inline Data

```typescript
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { Check, Star, Zap } from 'lucide-react'

export function AboutPage() {
  const aboutFeatures = [
    {
      icon: Check,
      title: 'Quality Assured',
      description: 'Every request is verified by our team'
    },
    {
      icon: Star,
      title: 'Top Rated',
      description: '5-star ratings from donors'
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Quick turnaround on all requests'
    }
  ]

  return (
    <main>
      <FeaturesSection 
        features={aboutFeatures} 
        heading="Why Choose Us"
        showHeading={true}
      />
    </main>
  )
}
```

### Example 3: From API/Database

```typescript
import { useState, useEffect } from 'react'
import { FeaturesSection, Feature } from '@/components/home/FeaturesSection'
import { Users, TrendingUp, Award } from 'lucide-react'

// Icon mapping for dynamic data
const iconMap = {
  users: Users,
  trending: TrendingUp,
  award: Award
}

export function DynamicPage() {
  const [features, setFeatures] = useState<Feature[]>([])

  useEffect(() => {
    // Fetch from API
    fetch('/api/features')
      .then(res => res.json())
      .then(data => {
        const mappedFeatures = data.map((item: any) => ({
          icon: iconMap[item.iconName] || Users,
          title: item.title,
          description: item.description
        }))
        setFeatures(mappedFeatures)
      })
  }, [])

  if (features.length === 0) return <div>Loading...</div>

  return (
    <main>
      <FeaturesSection features={features} />
    </main>
  )
}
```

### Example 4: Multiple Sections on Same Page

```typescript
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { homeFeatures } from '@/data/homeFeatures'
import { donorFeatures } from '@/data/donorFeatures'
import { cboFeatures } from '@/data/cboFeatures'

export function FullPage() {
  return (
    <main>
      <section>
        <h1>Welcome</h1>
      </section>

      {/* Section 1: How it works */}
      <FeaturesSection 
        features={homeFeatures} 
        heading="How It Works"
        showHeading={true}
      />

      {/* Section 2: For Donors */}
      <FeaturesSection 
        features={donorFeatures} 
        heading="Donor Benefits"
        showHeading={true}
      />

      {/* Section 3: For CBOs */}
      <FeaturesSection 
        features={cboFeatures} 
        heading="Organization Benefits"
        showHeading={true}
      />
    </main>
  )
}
```

## Data Organization

### Recommended Structure

```
src/
├── components/
│   └── home/
│       └── FeaturesSection.tsx    # Reusable component
├── data/
│   ├── homeFeatures.ts            # Homepage data
│   ├── donorFeatures.ts           # Donor-specific data
│   └── cboFeatures.ts             # CBO-specific data
└── pages/
    ├── HomePage.tsx               # Uses homeFeatures
    ├── DonorPage.tsx              # Uses donorFeatures
    └── CBOPage.tsx                # Uses cboFeatures
```

## Benefits

✅ **Reusable:** Use the same component across multiple pages  
✅ **Maintainable:** Data is separated from presentation  
✅ **Type-Safe:** TypeScript ensures data matches interface  
✅ **Flexible:** Can use static data, imported data, or API data  
✅ **Testable:** Easy to test with mock data  
✅ **Scalable:** Add as many feature sections as needed

## Adding New Lucide Icons

1. Import from `lucide-react`:
```typescript
import { NewIcon } from 'lucide-react'
```

2. Add to your feature data:
```typescript
{
  icon: NewIcon,
  title: 'New Feature',
  description: 'Description here'
}
```

Browse all available icons: https://lucide.dev/icons/

## Next Steps

To apply this pattern to other components:

1. **Identify repetitive data** in components
2. **Create TypeScript interfaces** for the data shape
3. **Add props to component** function signature
4. **Move data to separate files** in `src/data/`
5. **Import and pass as props** from pages

This pattern makes your codebase more maintainable and scalable! 🚀

