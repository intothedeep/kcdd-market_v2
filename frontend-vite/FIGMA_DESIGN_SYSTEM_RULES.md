# KCDD Market v2 - Figma Design System Rules Document

## Executive Summary

This document outlines the design system, component architecture, and styling approach used in the KCDD Market v2 frontend application. It provides guidance for integrating Figma designs with this codebase using the Figma MCP (Model Context Protocol).

**Framework**: React 18.2 + TypeScript 5.3
**Styling**: Tailwind CSS 3.4.1 with CSS variables
**UI Library**: shadcn/ui (Radix UI primitives)
**Build Tool**: Vite 5.0
**Icons**: Lucide React 0.344

---

## 1. Token Definitions

### 1.1 Color System

The design system uses **CSS custom properties (variables)** defined in `/frontend-vite/src/styles/globals.css` with HSL color format for dynamic theme support.

**Location**: `/frontend-vite/src/styles/globals.css`

**Format**: HSL with CSS variables

```css
@layer base {
  :root {
    /* Brand Colors - Change these to update theme */
    --brand-primary: 166 51% 22%;     /* #1b5858 - Main teal */
    --brand-primary-light: 123 45% 81%;  /* #c4e5c1 - Light green */
    --brand-accent: 166 51% 22%;      /* #1b5858 - Accent */
    --brand-orange: 21 91% 48%;       /* #ea580c - CTA Orange */
    --brand-lime: 68 94% 60%;         /* #dbf938 - Lime accent */

    /* Semantic Colors - Brand aligned */
    --success: 166 51% 22%;           /* #1b5858 - Brand teal */
    --info: 123 45% 81%;              /* #c4e5c1 - Brand light green */
    --warning: 21 91% 48%;            /* #ea580c - Brand orange */
    --error: 21 91% 48%;              /* #ea580c - Brand orange */
    --violet: 68 94% 60%;             /* #dbf938 - Brand lime */

    /* Shadcn defaults */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: var(--brand-primary);
    --primary-foreground: 0 0% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 21 91% 48%;        /* #ea580c - Brand orange */
    --destructive-foreground: 0 0% 100%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: var(--brand-primary);
    --radius: 0.5rem;
  }
}
```

**Key Color Tokens**:

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `--brand-primary` | `166 51% 22%` | `#1b5858` | Primary brand teal |
| `--brand-primary-light` | `123 45% 81%` | `#c4e5c1` | Light green accent |
| `--brand-orange` | `21 91% 48%` | `#ea580c` | CTA Orange |
| `--brand-lime` | `68 94% 60%` | `#dbf938` | Lime accent |
| `--success` | `166 51% 22%` | `#1b5858` | Success states (brand teal) |
| `--info` | `123 45% 81%` | `#c4e5c1` | Info states (light green) |
| `--error` | `21 91% 48%` | `#ea580c` | Error states (brand orange) |
| `--violet` | `68 94% 60%` | `#dbf938` | Accent (brand lime) |
| `--background` | `0 0% 100%` | `#ffffff` | Page background |
| `--foreground` | `222.2 84% 4.9%` | `#1a1a1f` | Primary text |
| `--destructive` | `21 91% 48%` | `#ea580c` | Destructive actions (brand orange) |
| `--radius` | - | `0.5rem` | Border radius base |

**Usage in Tailwind**:
```tsx
className="bg-primary text-primary-foreground"
className="border-border bg-card text-card-foreground"
className="text-[hsl(var(--brand-primary))]"  // Direct variable usage
```

---

### 1.2 Typography Tokens

Typography uses **Tailwind's default configuration** with system fonts.

**Font Stack**: `Inter, system-ui, sans-serif`

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Small labels, captions |
| `text-sm` | 14px | Secondary text, descriptions |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Large body |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | Page headings |
| `text-3xl` | 30px | Large headings |
| `text-4xl` | 36px | Hero subheadings |
| `text-5xl` | 48px | Hero headings |

**Font Weights**:
| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text, buttons |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |
| `font-extrabold` | 800 | Large headings |
| `font-black` | 900 | Logo |

---

### 1.3 Spacing Tokens

Tailwind CSS default spacing scale (4px base unit).

```tsx
// Common spacing values
p-2   // 8px
p-3   // 12px
p-4   // 16px
p-5   // 20px
p-6   // 24px
gap-4 // 16px
gap-5 // 20px
```

---

### 1.4 Border Radius Tokens

```css
--radius: 0.5rem;  /* 8px - Base radius */
```

| Class | Value | Computed |
|-------|-------|----------|
| `rounded-lg` | `var(--radius)` | 8px |
| `rounded-md` | `calc(var(--radius) - 2px)` | 6px |
| `rounded-sm` | `calc(var(--radius) - 4px)` | 4px |
| `rounded-full` | 9999px | Full circle |

---

## 2. Component Library Architecture

### 2.1 Component Structure

**Location**: `/frontend-vite/src/components/`

```
components/
├── ui/                    # shadcn/ui base components (51 files)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   └── index.ts           # Central export file
├── home/                  # Landing page sections
│   ├── HeroSection.tsx
│   ├── StatsSection.tsx
│   └── ...
├── organization/          # Organization-specific
│   ├── OrganizationHero.tsx
│   └── ...
├── Navbar.tsx
├── Footer.tsx
└── ...
```

**Import Pattern**:
```tsx
import { Button, Card, CardHeader, Input } from '@/components/ui'
```

---

### 2.2 Button Component

**File**: `/frontend-vite/src/components/ui/button.tsx`

**Variants**:
| Variant | Description | Classes |
|---------|-------------|---------|
| `default` | Primary button | `bg-primary text-primary-foreground` |
| `destructive` | Danger button | `bg-destructive text-destructive-foreground` |
| `outline` | Bordered button | `border border-input bg-background` |
| `secondary` | Secondary button | `bg-secondary text-secondary-foreground` |
| `ghost` | Transparent button | `hover:bg-accent` |
| `link` | Link style | `text-primary underline-offset-4` |

**Sizes**:
| Size | Height | Padding |
|------|--------|---------|
| `default` | h-10 | px-4 py-2 |
| `sm` | h-9 | px-3 |
| `lg` | h-11 | px-8 |
| `icon` | h-10 w-10 | - |

**Usage**:
```tsx
<Button variant="default" size="lg">Primary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost" size="sm">Ghost Small</Button>
```

---

### 2.3 Card Component

**File**: `/frontend-vite/src/components/ui/card.tsx`

**Sub-components**:
- `Card` - Container with border and shadow
- `CardHeader` - Header section (p-6)
- `CardTitle` - Title (text-2xl font-semibold)
- `CardDescription` - Description (text-sm text-muted)
- `CardContent` - Main content (p-6 pt-0)
- `CardFooter` - Footer section (p-6 pt-0)

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

---

### 2.4 Badge Component

**Variants**:
| Variant | Description |
|---------|-------------|
| `default` | Primary background |
| `secondary` | Secondary background |
| `destructive` | Red/danger |
| `outline` | Bordered only |

---

### 2.5 Complete Component List (51 Components)

**Form Components**: Button, Input, Textarea, Label, Select, Checkbox, Switch

**Display Components**: Card, Badge, Avatar, Skeleton, Separator, Alert, ScrollArea, Table

**Overlay Components**: Dialog, AlertDialog, Popover, Toast, Toaster

**Navigation Components**: DropdownMenu, Tabs, Accordion, Command, Sidebar

---

## 3. Frameworks & Libraries

### 3.1 Core Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.3",
  "@clerk/clerk-react": "^4.30.0",
  "@supabase/supabase-js": "^2.39.7",
  "@stripe/react-stripe-js": "^2.4.0",
  "lucide-react": "^0.344.0",
  "tailwindcss": "^3.4.1",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.1"
}
```

### 3.2 Build Configuration

**Vite Config** (`/frontend-vite/vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
})
```

**Path Alias**: `@/*` maps to `./src/*`

---

## 4. Asset Management

### 4.1 Asset Structure

```
src/
├── assets/
│   └── images/
public/
└── images/
```

### 4.2 Asset Import Pattern

```tsx
// Public folder reference
<img src="/images/photo.jpg" alt="description" />

// Or bundled import
import image from '@/assets/images/filename.jpg'
<img src={image} alt="description" />
```

### 4.3 Image Optimization

```tsx
className="object-cover"   // Fill container, crop
className="object-contain" // Fit entirely
```

---

## 5. Icon System

### 5.1 Icon Library

**Lucide React** - version 0.344

**Import Pattern**:
```tsx
import { Heart, Settings, ChevronDown, X } from 'lucide-react'
```

### 5.2 Icon Sizing

```tsx
className="w-4 h-4"   // 16px - Small, inline
className="w-6 h-6"   // 24px - Standard
className="size-4"    // 16px - Shorthand
className="size-6"    // 24px - Shorthand
```

### 5.3 Common Icons

```
Heart, Settings, ChevronDown, X, Plus, Pencil
Save, Send, CheckCircle2, AlertCircle, Loader2
Share2, Facebook, Twitter, Linkedin, Mail
ArrowLeft, Calendar, Users, Target, Globe
Building2, Shield, Flag, Phone, MessageCircle
```

---

## 6. Styling Approach

### 6.1 CSS Methodology

**Utility-First CSS** using **Tailwind CSS**

**Global Styles**: `/frontend-vite/src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CSS variables here */
  }
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 6.2 Responsive Design

**Tailwind Breakpoints**:
| Prefix | Min Width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px |

**Mobile-First Approach**:
```tsx
className="w-full md:w-1/2 lg:w-1/3"
className="text-sm md:text-base lg:text-lg"
className="hidden lg:block"
```

### 6.3 Class Composition

**Using `cn()` utility** from `@/lib/utils`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage**:
```tsx
className={cn(
  "base-class",
  condition && "conditional-class",
  props.className
)}
```

---

## 7. Project Structure

```
frontend-vite/
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── home/              # Landing page sections
│   │   ├── organization/      # Org profile components
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── admin/
│   │   ├── cbo/
│   │   ├── donor/
│   │   └── ...
│   ├── routes/                # Route definitions
│   ├── layouts/               # Layout components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities & clients
│   ├── data/                  # Static data
│   ├── config/                # Configuration
│   ├── constants/             # Constants
│   ├── types/                 # TypeScript types
│   ├── styles/
│   │   └── globals.css        # Global styles
│   ├── App.tsx
│   └── main.tsx
├── public/
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 8. Figma Integration Guidelines

### 8.1 Design to Code Mapping

**Color Selection**:
- Primary teal: `#1b5858` → `hsl(var(--brand-primary))`
- Light green: `#c4e5c1` → `hsl(var(--brand-primary-light))`
- Create Figma variables matching CSS variables

**Component Mapping**:
- Map Figma components to shadcn/ui equivalents
- Button → `<Button variant="..." size="...">`
- Card → `<Card>` with subcomponents
- Badge → `<Badge variant="...">`

**Typography**:
- Use Inter or system fonts
- Map font sizes to Tailwind classes
- Apply consistent weights (medium, semibold, bold)

**Spacing**:
- 4px base unit
- Common: 8px, 12px, 16px, 20px, 24px
- Match Tailwind spacing utilities

**Breakpoints**:
- Mobile: 320px
- Tablet: 768px
- Desktop: 1024px
- Large: 1400px

### 8.2 Code Connect Setup

Link Figma components to:
- `/frontend-vite/src/components/ui/` for base components
- Use TypeScript props from component files
- Map CVA variants in metadata

---

## 9. Common Implementation Patterns

### 9.1 Form Pattern

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="space-y-4">
  <div>
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
  </div>
  <Button type="submit">Submit</Button>
</div>
```

### 9.2 Modal Pattern

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### 9.3 Tab Pattern

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

## 10. Quick Reference

### Primary Colors
| Name | Hex | Tailwind |
|------|-----|----------|
| Teal 500 | `#1b5858` | `bg-primary` / `text-[hsl(var(--brand-primary))]` |
| Green Light | `#c4e5c1` | `bg-[hsl(var(--brand-primary-light))]` |
| Orange 600 | `#ea580c` | `bg-[#ea580c]` |
| Gray 950 | `#0a0a0a` | `text-foreground` |
| Gray 500 | `#737373` | `text-muted-foreground` |

### Common Button Patterns
```tsx
// Primary CTA
<Button className="rounded-full bg-[#ea580c] text-white">Donate Now</Button>

// Outline
<Button variant="outline" className="rounded-full border-[hsl(var(--brand-primary))]">
  Learn More
</Button>

// Primary brand
<Button className="rounded-full bg-[hsl(var(--brand-primary))]">Submit</Button>
```

---

**Document Version**: 1.0
**Last Updated**: March 8, 2026
**Framework**: React 18.2 + TypeScript 5.3 + Tailwind CSS 3.4
