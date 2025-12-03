/**
 * ========================================
 * CONTENT BLOCK SECTION COMPONENT
 * ========================================
 * 
 * Location: src/components/home/ContentBlockSection.tsx
 * Data File: src/data/homeContentBlock.ts
 * Documentation: frontend-vite/REUSABLE_COMPONENTS.md
 * 
 * DESCRIPTION:
 * Reusable section for displaying content with an image/placeholder,
 * heading, description, optional bullet list, and CTA buttons.
 * Features dark background with customizable colors.
 * 
 * ========================================
 * USAGE EXAMPLES
 * ========================================
 * 
 * 1. BASIC USAGE (with data file):
 * ```tsx
 * import { ContentBlockSection } from '@/components/home/ContentBlockSection'
 * import { homeContentBlock } from '@/data/homeContentBlock'
 * 
 * <ContentBlockSection data={homeContentBlock} />
 * ```
 * 
 * 2. IMAGE ON RIGHT SIDE:
 * ```tsx
 * <ContentBlockSection 
 *   data={homeContentBlock} 
 *   imagePosition="right" 
 * />
 * ```
 * 
 * 3. INLINE DATA:
 * ```tsx
 * <ContentBlockSection 
 *   data={{
 *     heading: 'Get Started Today',
 *     description: 'Join our community...',
 *     buttons: [
 *       { label: 'Sign Up', href: '/signup', variant: 'primary' }
 *     ]
 *   }}
 * />
 * ```
 * 
 * 4. MINIMAL VERSION (no lists, no buttons):
 * ```tsx
 * <ContentBlockSection 
 *   data={{
 *     heading: 'Simple Message',
 *     description: 'Keep it simple.'
 *   }}
 * />
 * ```
 * 
 * ========================================
 * PROPS DOCUMENTATION
 * ========================================
 * 
 * @prop {ContentBlockData} data - REQUIRED
 *   Configuration object containing all content
 *   See ContentBlockData interface below for details
 * 
 * @prop {('left' | 'right')} imagePosition - OPTIONAL
 *   Position of the image/placeholder
 *   - 'left': Image on left, text on right (default)
 *   - 'right': Image on right, text on left
 *   Default: 'left'
 * 
 * ========================================
 * INTERFACE: ContentBlockButton
 * ========================================
 * Used in the data.buttons array
 * 
 * @property {string} label - Button text (REQUIRED)
 * @property {string} [href] - Link destination (uses React Router)
 * @property {() => void} [onClick] - Click handler (for non-link buttons)
 * @property {('primary' | 'secondary')} [variant] - Button style
 *   - 'primary': Accent color background
 *   - 'secondary': White background
 *   Default: 'primary'
 * 
 * ========================================
 * INTERFACE: ContentBlockData
 * ========================================
 * Main configuration object
 * 
 * REQUIRED FIELDS:
 * @property {string} heading - Main heading text (h2 element)
 * @property {string} description - Main paragraph text
 * 
 * OPTIONAL FIELDS:
 * @property {string} [subtitle] - Small text above heading
 * @property {string[]} [listItems] - Bullet points (ul > li)
 * @property {string} [imageUrl] - Image URL (shows placeholder if omitted)
 * @property {string} [imageAlt] - Alt text for image (default: "Feature image")
 * @property {ContentBlockButton[]} [buttons] - CTA buttons (0-3 recommended)
 * @property {string} [backgroundColor] - Section background (default: '#103032')
 * @property {string} [imageBackgroundColor] - Placeholder/accent (default: '#d25c2c')
 * 
 * ========================================
 * CUSTOMIZATION GUIDE
 * ========================================
 * 
 * TO REMOVE ELEMENTS:
 * - Subtitle: Remove `subtitle` field or set to undefined
 * - List: Remove `listItems` field or set to []
 * - Buttons: Remove `buttons` field or set to []
 * - Image: Remove `imageUrl` field (shows placeholder)
 * 
 * TO CHANGE COLORS:
 * ```tsx
 * data={{
 *   heading: 'Custom Colors',
 *   description: 'Example',
 *   backgroundColor: '#1e3a5f',        // Navy blue
 *   imageBackgroundColor: '#ff6b6b'    // Coral red
 * }}
 * ```
 * 
 * TO ADD IMAGE:
 * ```tsx
 * data={{
 *   heading: 'With Photo',
 *   description: 'Shows real image',
 *   imageUrl: '/images/team.jpg',
 *   imageAlt: 'Our team members'
 * }}
 * ```
 * 
 * ========================================
 * FEATURES
 * ========================================
 * ✓ Fully responsive (mobile → desktop)
 * ✓ Semantic HTML (section, article, nav, figure)
 * ✓ Accessible (ARIA labels, focus states)
 * ✓ TypeScript typed
 * ✓ Customizable colors
 * ✓ Optional elements
 * ✓ Button hover effects
 * ✓ Supports React Router links
 * 
 * ========================================
 */

import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

/**
 * Button configuration for CTA buttons
 */
export interface ContentBlockButton {
  label: string                    // Button text
  href?: string                    // React Router link (optional)
  onClick?: () => void             // Click handler (optional)
  variant?: 'primary' | 'secondary' // Style variant
}

/**
 * Main data structure for content block
 * Only heading and description are required
 */
export interface ContentBlockData {
  subtitle?: string                // Optional eyebrow text
  heading: string                  // Main heading (required)
  description: string              // Main paragraph (required)
  listItems?: string[]             // Optional bullet list
  imageUrl?: string                // Optional image (shows placeholder if omitted)
  imageAlt?: string                // Alt text for accessibility
  buttons?: ContentBlockButton[]   // Optional CTA buttons
  backgroundColor?: string         // Section background color
  imageBackgroundColor?: string    // Placeholder/accent color
}

/**
 * Component props
 */
interface ContentBlockSectionProps {
  data: ContentBlockData           // Content configuration (required)
  imagePosition?: 'left' | 'right' // Image placement (default: 'left')
}

export function ContentBlockSection({ 
  data,
  imagePosition = 'left'
}: ContentBlockSectionProps) {
  const {
    subtitle,
    heading,
    description,
    listItems = [],
    imageUrl,
    imageAlt = 'Feature image',
    buttons = [],
    backgroundColor = '#103032',
    imageBackgroundColor = '#d25c2c'
  } = data
  // Image component
  const imageElement = (
    <figure 
      className="w-full lg:flex-1 h-[390px] rounded-[10px] overflow-hidden" 
      style={!imageUrl ? { backgroundColor: imageBackgroundColor } : undefined}
      aria-label={imageAlt}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      )}
    </figure>
  )

  // Text content component
  const textContent = (
    <article className="w-full lg:flex-1 flex flex-col gap-6">
      <div>
        {subtitle && (
          <p className="text-base text-white">{subtitle}</p>
        )}
        
        <h2 id="content-block-heading" className="text-[30px] font-bold text-white leading-normal">
          {heading}
        </h2>
      </div>
      
      <div className="text-base text-white">
        <p className={listItems.length > 0 ? 'mb-4' : ''}>
          {description}
        </p>
        {listItems.length > 0 && (
          <ul className="list-disc ml-6 space-y-1">
            {listItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      
      {buttons.length > 0 && (
        <nav className="flex gap-4" aria-label="Content actions">
          {buttons.map((button, index) => {
            const isPrimary = button.variant !== 'secondary'
            const btnBgColor = isPrimary ? imageBackgroundColor : '#ffffff'
            const btnTextColor = isPrimary ? '#ffffff' : backgroundColor
            const btnBorderColor = isPrimary ? imageBackgroundColor : '#ffffff'
            const hoverTextColor = isPrimary ? imageBackgroundColor : '#ffffff'
            
            const buttonElement = (
              <Button
                key={index}
                onClick={button.onClick}
                className="border-2 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 transition-all duration-200 rounded-full h-10 px-4"
                style={{
                  backgroundColor: btnBgColor,
                  color: btnTextColor,
                  borderColor: btnBorderColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = hoverTextColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = btnBgColor
                  e.currentTarget.style.color = btnTextColor
                }}
              >
                {button.label}
              </Button>
            )

            return button.href ? (
              <Link key={index} to={button.href}>
                {buttonElement}
              </Link>
            ) : buttonElement
          })}
        </nav>
      )}
    </article>
  )

  return (
    <section 
      className="py-8 md:py-12 px-4" 
      style={{ backgroundColor }}
      aria-labelledby="content-block-heading"
    >
      <div className={`max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-10 items-center ${imagePosition === 'right' ? 'lg:flex-row-reverse' : ''}`}>
        {imageElement}
        {textContent}
      </div>
    </section>
  )
}

