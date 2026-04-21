/**
 * Home Page Content Block Data
 * Location: src/data/homeContentBlock.ts
 *
 * Configuration for the content block section on the homepage.
 * This data is passed to the ContentBlockSection component.
 *
 * Component Location: src/components/home/ContentBlockSection.tsx
 * Usage in HomePage: <ContentBlockSection data={homeContentBlock} imagePosition="left" />
 *
 * @see REUSABLE_COMPONENTS.md for detailed usage examples
 */

import { ContentBlockData } from '@/components/home/ContentBlockSection'

/**
 * Content Block Configuration
 *
 * ALL FIELDS EXPLAINED:
 *
 * @property {string} [subtitle] - OPTIONAL
 *   Small text above the heading (eyebrow text)
 *   Example: "Our Mission" or "How It Works"
 *   Remove this field to hide the subtitle
 *
 * @property {string} heading - REQUIRED
 *   Main heading for this section (h2 tag)
 *   Example: "Bridge the Digital Divide"
 *   This is the only required field
 *
 * @property {string} description - REQUIRED
 *   Main paragraph text explaining the section
 *   Keep it concise (2-3 sentences recommended)
 *
 * @property {string[]} [listItems] - OPTIONAL
 *   Bullet point list items
 *   Each string becomes a <li> element
 *   Remove this field or set to empty array [] to hide the list
 *   Recommended: 3-5 items maximum for readability
 *
 * @property {string} [imageUrl] - OPTIONAL
 *   Path to image file (e.g., "/images/my-photo.jpg")
 *   If not provided, shows colored placeholder box
 *   Image should be at least 800x800px for best quality
 *
 * @property {string} [imageAlt] - OPTIONAL
 *   Alt text for the image (accessibility)
 *   Default: "Feature image"
 *   Always provide meaningful alt text for accessibility
 *
 * @property {ContentBlockButton[]} [buttons] - OPTIONAL
 *   Array of CTA buttons (0-3 recommended)
 *   Button properties:
 *     - label: Button text (required)
 *     - href: Link URL using React Router (optional)
 *     - onClick: Click handler function (optional)
 *     - variant: 'primary' or 'secondary' (optional, default: 'primary')
 *   Remove this field or set to empty array [] to hide buttons
 *
 * @property {string} [backgroundColor] - OPTIONAL
 *   Background color for the entire section
 *   Accepts any valid CSS color (hex, rgb, hsl)
 *   Default: '#103032' (dark teal)
 *
 * @property {string} [imageBackgroundColor] - OPTIONAL
 *   Background color for image placeholder (when no imageUrl)
 *   Also used for primary button color
 *   Default: '#DBF938' (lime/chartreuse)
 *
 * USAGE IN HOMEPAGE:
 * import { homeContentBlock } from '@/data/homeContentBlock'
 * <ContentBlockSection data={homeContentBlock} imagePosition="left" />
 *
 * IMAGE POSITION OPTIONS:
 * - imagePosition="left"  - Image on left, text on right
 * - imagePosition="right" - Image on right, text on left
 */
export const homeContentBlock: ContentBlockData = {
  // Optional: Small text above heading
  subtitle: 'Simple Process, Real Impact',

  // Required: Main section heading
  heading: 'How It Works',

  // Required: Main description paragraph
  description:
    'Our simple three-step process makes it easy for donors to connect with community needs and for organizations to get the technology they require.',

  // Optional: Bullet point list
  listItems: [
    'Organizations post their technology needs',
    'Donors browse and fund requests directly',
    'Track your impact with delivery confirmation',
  ],

  // Optional: CTA buttons
  buttons: [
    { label: 'Browse Requests', href: '/requests', variant: 'primary' },
    { label: 'Learn More', href: '/about', variant: 'secondary' },
  ],

  // Optional: Section background color (default: '#103032')
  backgroundColor: '#103032',

  // Optional: Placeholder/button accent color (default: '#DBF938')
  imageBackgroundColor: '#DBF938',
}

/**
 * QUICK EXAMPLES FOR COMMON MODIFICATIONS:
 *
 * 1. MINIMAL VERSION (heading and description only):
 * export const homeContentBlock: ContentBlockData = {
 *   heading: 'Your Heading Here',
 *   description: 'Your description here.'
 * }
 *
 * 2. WITH IMAGE (no placeholder):
 * export const homeContentBlock: ContentBlockData = {
 *   heading: 'Our Story',
 *   description: 'Learn about our mission.',
 *   imageUrl: '/images/team.jpg',
 *   imageAlt: 'Our team members'
 * }
 *
 * 3. WITH ONE BUTTON:
 * export const homeContentBlock: ContentBlockData = {
 *   heading: 'Get Started',
 *   description: 'Join us today!',
 *   buttons: [
 *     { label: 'Sign Up', href: '/signup', variant: 'primary' }
 *   ]
 * }
 *
 * 4. WITHOUT LIST ITEMS:
 * export const homeContentBlock: ContentBlockData = {
 *   heading: 'Simple Message',
 *   description: 'Just a paragraph, no bullets.',
 *   buttons: [...]
 * }
 */
