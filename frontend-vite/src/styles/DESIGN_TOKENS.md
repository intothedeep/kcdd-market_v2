# KC DIME Design System

A comprehensive guide to colors, typography, and components used throughout the application.

---

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Components](#components)
   - [UI Components](#ui-components)
   - [Layout Components](#layout-components)
   - [Home Page Sections](#home-page-sections)
   - [Organization Components](#organization-components)
   - [Form Components](#form-components)

---

## Colors

### Brand Colors (CSS Variables)

These are defined in `globals.css` and should be used via CSS variables for consistency.

| Variable                | HSL           | Hex       | Usage                    |
| ----------------------- | ------------- | --------- | ------------------------ |
| `--brand-primary`       | `166 51% 22%` | `#1b5858` | Main brand teal          |
| `--brand-primary-light` | `123 45% 81%` | `#c4e5c1` | Light green accent       |
| `--brand-accent`        | `166 51% 22%` | `#1b5858` | Accent (same as primary) |

**Usage:**

```tsx
className = 'text-[hsl(var(--brand-primary))]'
className = 'bg-[hsl(var(--brand-primary-light))]'
```

---

### Primary Palette

| Hex       | Name     | Usage                               |
| --------- | -------- | ----------------------------------- |
| `#1b5858` | Teal 500 | Primary brand color, buttons, links |
| `#164444` | Teal 600 | Hover states                        |
| `#183c3f` | Teal 700 | Dark accents                        |
| `#103032` | Teal 800 | Darkest teal, footer background     |

---

### Accent Colors

| Hex       | Name        | Usage                              |
| --------- | ----------- | ---------------------------------- |
| `#ea580c` | Orange 600  | CTA buttons, highlights            |
| `#dc4c06` | Orange 700  | Hover state for orange             |
| `#dbf938` | Lime        | Accent highlights, footer headings |
| `#c4e5c1` | Green Light | Success backgrounds                |

---

### Neutral Colors

| Hex       | Name     | Usage                 |
| --------- | -------- | --------------------- |
| `#0a0a0a` | Gray 950 | Primary text          |
| `#171717` | Gray 900 | Headings              |
| `#737373` | Gray 500 | Secondary/muted text  |
| `#e5e5e5` | Gray 200 | Borders               |
| `#f5f5f5` | Gray 100 | Light backgrounds     |
| `#fafafa` | Gray 50  | Dashboard backgrounds |
| `#ffffff` | White    | Pure white            |

---

### Semantic Colors (Brand Aligned)

| Hex       | Name         | CSS Variable           | Usage                |
| --------- | ------------ | ---------------------- | -------------------- |
| `#1b5858` | Brand Teal   | `--success`            | Success states       |
| `#d1fae5` | Emerald 100  | `--success-light`      | Success backgrounds  |
| `#c4e5c1` | Light Green  | `--info`               | Info states          |
| `#ea580c` | Brand Orange | `--warning`, `--error` | Warning/Error states |
| `#fee2e2` | Red 100      | `--error-light`        | Error backgrounds    |
| `#dbf938` | Brand Lime   | `--violet`             | Accent highlights    |

---

### Social Brand Colors (Brand Aligned)

| Hex       | Platform  | Notes             |
| --------- | --------- | ----------------- |
| `#dbf938` | Facebook  | Brand lime        |
| `#c4e5c1` | LinkedIn  | Brand light green |
| `#1b5858` | Instagram | Brand teal        |

---

## Typography

### Font Family

| Font                | Usage                     |
| ------------------- | ------------------------- |
| `Inter, sans-serif` | Primary font for all text |

---

### Font Sizes

| Class         | Size | Description             |
| ------------- | ---- | ----------------------- |
| `text-xs`     | 12px | Labels, captions        |
| `text-sm`     | 14px | Body text (most common) |
| `text-base`   | 16px | Standard body           |
| `text-lg`     | 18px | Large body              |
| `text-xl`     | 20px | Section headings        |
| `text-2xl`    | 24px | Page headings           |
| `text-3xl`    | 30px | Large headings          |
| `text-4xl`    | 36px | Hero subheadings        |
| `text-5xl`    | 48px | Hero headings           |
| `text-[30px]` | 30px | Logo                    |
| `text-[46px]` | 46px | Stats numbers           |

---

### Font Weights

| Class            | Weight | Description              |
| ---------------- | ------ | ------------------------ |
| `font-normal`    | 400    | Body text                |
| `font-medium`    | 500    | Emphasized text, buttons |
| `font-semibold`  | 600    | Subheadings              |
| `font-bold`      | 700    | Headings                 |
| `font-extrabold` | 800    | Large headings           |
| `font-black`     | 900    | Logo                     |

---

### Line Height & Spacing

| Class             | Description         |
| ----------------- | ------------------- |
| `leading-tight`   | 1.25 - Headings     |
| `leading-normal`  | 1.5 - Standard      |
| `leading-relaxed` | 1.625 - Body text   |
| `tracking-tight`  | -0.025em - Headings |
| `tracking-wide`   | 0.025em - Uppercase |

---

## Components

### UI Components

Located in `src/components/ui/`

#### Button

**File:** `ui/button.tsx`

**Variants:**
| Variant | Description | Classes |
|---------|-------------|---------|
| `default` | Primary button | `bg-primary text-primary-foreground` |
| `destructive` | Danger button | `bg-destructive text-destructive-foreground` |
| `outline` | Bordered button | `border border-input bg-background` |
| `secondary` | Secondary button | `bg-secondary text-secondary-foreground` |
| `ghost` | Transparent button | `hover:bg-accent` |
| `link` | Link style | `text-primary underline-offset-4` |

**Sizes:**
| Size | Height | Padding |
|------|--------|---------|
| `default` | h-10 | px-4 py-2 |
| `sm` | h-9 | px-3 |
| `lg` | h-11 | px-8 |
| `icon` | h-10 w-10 | - |

**Usage:**

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="lg">Click me</Button>
<Button variant="outline" size="sm">Secondary</Button>

// Custom styled (common patterns)
<Button className="rounded-full bg-[#ea580c] text-white">CTA</Button>
<Button className="rounded-full bg-[hsl(var(--brand-primary))]">Primary</Button>
```

---

#### Card

**File:** `ui/card.tsx`

**Sub-components:**

- `Card` - Container with border and shadow
- `CardHeader` - Header section (p-6)
- `CardTitle` - Title (text-2xl font-semibold)
- `CardDescription` - Description (text-sm text-muted)
- `CardContent` - Main content (p-6 pt-0)
- `CardFooter` - Footer section (p-6 pt-0)

**Usage:**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
;<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

---

#### Badge

**File:** `ui/badge.tsx`

**Variants:**
| Variant | Description |
|---------|-------------|
| `default` | Primary background |
| `secondary` | Secondary background |
| `destructive` | Red/danger |
| `outline` | Bordered only |

**Usage:**

```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

---

#### Input

**File:** `ui/input.tsx`

**Base styles:** `h-10 w-full rounded-md border px-3 py-2 text-sm`

**Usage:**

```tsx
import { Input } from '@/components/ui/input'

<Input type="text" placeholder="Enter text..." />
<Input type="email" className="rounded-full" />
```

---

#### Select

**File:** `ui/select.tsx`

**Sub-components:**

- `Select` - Root wrapper
- `SelectTrigger` - Button that opens dropdown
- `SelectValue` - Selected value display
- `SelectContent` - Dropdown container
- `SelectItem` - Individual option
- `SelectGroup` - Group of options
- `SelectLabel` - Group label

**Usage:**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
;<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

#### Other UI Components

| Component      | File                   | Description          |
| -------------- | ---------------------- | -------------------- |
| `Accordion`    | `ui/accordion.tsx`     | Collapsible sections |
| `Alert`        | `ui/alert.tsx`         | Alert messages       |
| `AlertDialog`  | `ui/alert-dialog.tsx`  | Confirmation dialogs |
| `Avatar`       | `ui/avatar.tsx`        | User avatars         |
| `Checkbox`     | `ui/checkbox.tsx`      | Checkbox inputs      |
| `Dialog`       | `ui/dialog.tsx`        | Modal dialogs        |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Dropdown menus       |
| `Label`        | `ui/label.tsx`         | Form labels          |
| `Popover`      | `ui/popover.tsx`       | Popovers             |
| `ScrollArea`   | `ui/scroll-area.tsx`   | Custom scrollbars    |
| `Separator`    | `ui/separator.tsx`     | Divider lines        |
| `Skeleton`     | `ui/skeleton.tsx`      | Loading placeholders |
| `Switch`       | `ui/switch.tsx`        | Toggle switches      |
| `Table`        | `ui/table.tsx`         | Data tables          |
| `Tabs`         | `ui/tabs.tsx`          | Tab navigation       |
| `Textarea`     | `ui/textarea.tsx`      | Multi-line inputs    |
| `Toast`        | `ui/toast.tsx`         | Toast notifications  |

---

### Layout Components

#### Navbar

**File:** `src/components/Navbar.tsx`

**Structure:**

```
[Left: Nav Links] | [Center: Logo] | [Right: Action Buttons]
```

**Features:**

- Centered logo with `flex-shrink-0`
- Responsive (hidden nav on mobile)
- Dashboard dropdown for multi-role users
- Clerk authentication integration

---

#### Footer

**File:** `src/components/Footer.tsx`

**Props:**

```tsx
interface FooterData {
  linkColumns: FooterLinkColumn[]
  newsletter: { title; description; placeholder; buttonLabel }
  socialLinks: { icon; href; label }[]
  legalLinks: { label; href }[]
}
```

**Features:**

- Dark teal background (`#103032`)
- Link columns
- Newsletter signup form
- Social media icons
- Legal links

---

#### NoticeBanner

**File:** `src/components/NoticeBanner.tsx`

**Description:** Scrolling notice banner at top of page

**Styles:**

- Background: `--brand-primary-light`
- Text: `--brand-primary`

---

### Home Page Sections

Located in `src/components/home/`

#### HeroSection

**File:** `home/HeroSection.tsx`

**Features:**

- Centered headline with decorative image grids
- Two CTA buttons: "Browse Requests" and "Learn More"
- Responsive (image grids hidden on mobile)
- Image overlay effects

---

#### StatsSection

**File:** `home/StatsSection.tsx`

**Props:**

```tsx
interface Stat {
  value: string | number
  label: string
  description: string
}

interface StatsContent {
  heading: string
  description: string
  linkText?: string
  linkHref?: string
}
```

**Features:**

- Animated counter for numeric values
- Primary teal background
- Optional content block

---

#### AnimatedCounter

**File:** `home/AnimatedCounter.tsx`

**Props:**

```tsx
interface AnimatedCounterProps {
  value: number
  className?: string
}
```

---

#### Other Home Sections

| Component                      | Description              |
| ------------------------------ | ------------------------ |
| `BentoGridSection`             | Grid of feature cards    |
| `ContentBlockSection`          | Text + image section     |
| `FeatureCardsSection`          | Feature highlights       |
| `FeatureCardsWithImageSection` | Features with side image |
| `FeaturesSection`              | Feature list             |
| `SectionHeader`                | Section title component  |
| `TextWithImageSection`         | Text and image layout    |

---

### Organization Components

Located in `src/components/organization/`

| Component                  | Description                      |
| -------------------------- | -------------------------------- |
| `OrganizationHero`         | Profile hero with cover image    |
| `OrganizationLogo`         | Logo display with fallback emoji |
| `OrganizationSidebar`      | Stats, contact info, CTA         |
| `OrganizationAboutTab`     | About section content            |
| `OrganizationCampaignsTab` | Campaign listings                |
| `OrganizationTeamTab`      | Team members                     |
| `OrganizationUpdatesTab`   | News updates                     |

---

### Form Components

| Component             | File                      | Description            |
| --------------------- | ------------------------- | ---------------------- |
| `CampaignForm`        | `CampaignForm.tsx`        | Campaign creation form |
| `CampaignFormModal`   | `CampaignFormModal.tsx`   | Modal wrapper          |
| `OnboardingModal`     | `OnboardingModal.tsx`     | User onboarding        |
| `RoleSelectionModal`  | `RoleSelectionModal.tsx`  | Role selection         |
| `StripeConnectButton` | `StripeConnectButton.tsx` | Stripe connection      |

---

## Quick Reference

### Common Patterns

```tsx
// Primary CTA Button
<Button className="rounded-full bg-[#ea580c] hover:bg-[#dc4c06] text-white">
  Donate Now
</Button>

// Outline Button
<Button
  variant="outline"
  className="rounded-full border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))]"
>
  Learn More
</Button>

// Card with hover
<Card className="hover:shadow-lg transition-shadow">
  ...
</Card>

// Muted text
<p className="text-sm text-[#737373]">Description</p>

// Section heading
<h2 className="text-2xl font-bold text-[#0a0a0a]">Title</h2>

// Badge with custom color
<Badge className="bg-[#c4e5c1] text-[#1b5858]">Active</Badge>
```

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── home/                  # Home page sections
│   │   ├── HeroSection.tsx
│   │   ├── StatsSection.tsx
│   │   └── ...
│   ├── organization/          # Organization profile components
│   │   ├── OrganizationSidebar.tsx
│   │   └── ...
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
├── layouts/
│   ├── MainLayout.tsx         # With footer
│   └── DashboardLayout.tsx    # Without footer
└── styles/
    ├── globals.css            # CSS variables
    └── DESIGN_TOKENS.md       # This file
```

---

## Component Count Summary

| Category      | Count  |
| ------------- | ------ |
| UI Components | 21     |
| Home Sections | 9      |
| Organization  | 7      |
| Layout        | 4      |
| Forms/Modals  | 5      |
| Other         | 5      |
| **Total**     | **51** |
