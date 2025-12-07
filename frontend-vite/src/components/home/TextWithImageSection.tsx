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

export function TextWithImageSection({ 
  data,
  imagePosition = 'right'
}: TextWithImageSectionProps) {
  const { 
    subtitle, 
    heading, 
    description, 
    listItems = [],
    imageUrl,
    imageAlt = 'Feature image',
    imagePlaceholderColor = '#1b5858'
  } = data

  const textContent = (
    <div className="flex-1 flex flex-col gap-[22px] items-start text-black">
      {subtitle && (
        <p className="text-base font-normal w-full">
          {subtitle}
        </p>
      )}
      
      <h2 className="text-[30px] font-bold leading-normal w-full">
        {heading}
      </h2>
      
      <div className="text-base font-normal w-full">
        <p className="mb-0">{description}</p>
        {listItems.length > 0 && (
          <>
            <p className="mb-0">&nbsp;</p>
            <ul className="list-disc ml-6">
              {listItems.map((item, index) => (
                <li key={index} className="mb-0">{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )

  const imageElement = (
    <div 
      className="flex-1 h-[390px] rounded-[10px] overflow-hidden"
      style={!imageUrl ? { backgroundColor: imagePlaceholderColor } : undefined}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )

  return (
    <section className="py-[30px] px-4">
      <div className={`max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-[38px] items-center ${imagePosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
        {textContent}
        {imageElement}
      </div>
    </section>
  )
}

