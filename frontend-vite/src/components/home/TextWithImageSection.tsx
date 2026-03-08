/**
 * ========================================
 * TEXT WITH IMAGE SECTION COMPONENT
 * ========================================
 *
 * Location: src/components/home/TextWithImageSection.tsx
 *
 * DESCRIPTION:
 * A two-column section with text content on one side and
 * an image/placeholder on the other. Light background with
 * black text.
 *
 * LAYOUT:
 * ┌─────────────────────────────────────────────┐
 * │  [Subtitle]           ┌───────────────────┐│
 * │  [Heading]            │                   ││
 * │  [Description]        │  Image/Placeholder││
 * │  • List item          │                   ││
 * │  • List item          │                   ││
 * │                       └───────────────────┘│
 * └─────────────────────────────────────────────┘
 *
 * ========================================
 */

export interface TextWithImageSectionData {
  subtitle?: string
  heading: string
  description: string
  listItems?: string[]
  imageUrl?: string
  imageAlt?: string
  imagePlaceholderColor?: string
}

interface TextWithImageSectionProps {
  data: TextWithImageSectionData
  imagePosition?: 'left' | 'right'
}

export function TextWithImageSection({ data, imagePosition = 'right' }: TextWithImageSectionProps) {
  const {
    subtitle,
    heading,
    description,
    listItems = [],
    imageUrl,
    imageAlt = 'Feature image',
    imagePlaceholderColor = '#1b5858',
  } = data

  const textContent = (
    <div className="flex flex-1 flex-col items-start gap-[22px] text-black">
      {subtitle && <p className="w-full text-base font-normal">{subtitle}</p>}

      <h2 className="w-full text-[30px] font-bold leading-normal">{heading}</h2>

      <div className="w-full text-base font-normal">
        <p className="mb-0">{description}</p>
        {listItems.length > 0 && (
          <>
            <p className="mb-0">&nbsp;</p>
            <ul className="ml-6 list-disc">
              {listItems.map((item, index) => (
                <li key={index} className="mb-0">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )

  const imageElement = (
    <div
      className="h-[390px] flex-1 overflow-hidden rounded-[10px]"
      style={!imageUrl ? { backgroundColor: imagePlaceholderColor } : undefined}
    >
      {imageUrl && <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />}
    </div>
  )

  return (
    <section className="px-4 py-[30px]">
      <div
        className={`mx-auto flex max-w-[1000px] flex-col items-center gap-[38px] lg:flex-row ${imagePosition === 'left' ? 'lg:flex-row-reverse' : ''}`}
      >
        {textContent}
        {imageElement}
      </div>
    </section>
  )
}
