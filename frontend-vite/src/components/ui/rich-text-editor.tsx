/**
 * Rich Text Editor Component
 * A WYSIWYG editor built with Tiptap
 */

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Quote,
  Undo,
  Redo,
  ChevronDown,
  ImageIcon,
} from 'lucide-react'
import { useState, useRef, useEffect as useEffectRef } from 'react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  darkMode?: boolean
}

interface MenuButtonProps {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title: string
  darkMode?: boolean
}

function MenuButton({ onClick, isActive, children, title, darkMode }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        darkMode
          ? isActive
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/10'
          : isActive
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      )}
    >
      {children}
    </button>
  )
}

// Heading dropdown component
function HeadingDropdown({ editor, darkMode }: { editor: Editor; darkMode?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffectRef(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const headingLevels = [
    { level: 1, label: 'Heading 1', icon: Heading1 },
    { level: 2, label: 'Heading 2', icon: Heading2 },
    { level: 3, label: 'Heading 3', icon: Heading3 },
    { level: 4, label: 'Heading 4', icon: Heading4 },
    { level: 5, label: 'Heading 5', icon: Heading5 },
    { level: 6, label: 'Heading 6', icon: Heading6 },
  ] as const

  const getCurrentHeading = () => {
    for (const h of headingLevels) {
      if (editor.isActive('heading', { level: h.level })) {
        return `H${h.level}`
      }
    }
    return 'Paragraph'
  }

  const isAnyHeadingActive = headingLevels.some(h => editor.isActive('heading', { level: h.level }))

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors',
          darkMode
            ? isAnyHeadingActive
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10'
            : isAnyHeadingActive
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <span className="font-medium min-w-[70px] text-left">{getCurrentHeading()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[140px]',
          darkMode ? 'bg-[#1b5858] border border-white/10' : 'bg-white border border-gray-200'
        )}>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setParagraph().run()
              setIsOpen(false)
            }}
            className={cn(
              'w-full text-left px-3 py-1.5 text-sm',
              darkMode
                ? 'text-white/80 hover:bg-white/10'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Paragraph
          </button>
          {headingLevels.map(({ level, label, icon: Icon }) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level }).run()
                setIsOpen(false)
              }}
              className={cn(
                'w-full text-left px-3 py-1.5 flex items-center gap-2',
                darkMode
                  ? editor.isActive('heading', { level })
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                  : editor.isActive('heading', { level })
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className={cn('h-4 w-4', level > 3 && 'h-3.5 w-3.5')} />
              <span className={cn(
                level === 1 && 'text-lg font-bold',
                level === 2 && 'text-base font-bold',
                level === 3 && 'text-sm font-semibold',
                level === 4 && 'text-sm font-medium',
                level === 5 && 'text-xs font-medium',
                level === 6 && 'text-xs'
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuBar({ editor, darkMode }: { editor: Editor | null; darkMode?: boolean }) {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 p-2 border-b',
        darkMode ? 'border-white/10 bg-[#0d2628]' : 'border-gray-200 bg-gray-50'
      )}
    >
      {/* Text Formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
        darkMode={darkMode}
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
        darkMode={darkMode}
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline"
        darkMode={darkMode}
      >
        <UnderlineIcon className="h-4 w-4" />
      </MenuButton>

      <div className={cn('w-px h-5 mx-1', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Headings Dropdown */}
      <HeadingDropdown editor={editor} darkMode={darkMode} />

      <div className={cn('w-px h-5 mx-1', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
        darkMode={darkMode}
      >
        <List className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
        darkMode={darkMode}
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>

      <div className={cn('w-px h-5 mx-1', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Alignment */}
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
        darkMode={darkMode}
      >
        <AlignLeft className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
        darkMode={darkMode}
      >
        <AlignCenter className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
        darkMode={darkMode}
      >
        <AlignRight className="h-4 w-4" />
      </MenuButton>

      <div className={cn('w-px h-5 mx-1', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Block Quote, Link & Image */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
        darkMode={darkMode}
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        title="Add Link"
        darkMode={darkMode}
      >
        <LinkIcon className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={addImage}
        isActive={editor.isActive('image')}
        title="Add Image"
        darkMode={darkMode}
      >
        <ImageIcon className="h-4 w-4" />
      </MenuButton>

      <div className={cn('w-px h-5 mx-1', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Undo/Redo */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
        darkMode={darkMode}
      >
        <Undo className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
        darkMode={darkMode}
      >
        <Redo className="h-4 w-4" />
      </MenuButton>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  darkMode = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: darkMode ? 'text-[#dbf938] underline' : 'text-blue-600 underline',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: darkMode
          ? 'before:content-[attr(data-placeholder)] before:text-white/40 before:float-left before:h-0 before:pointer-events-none'
          : 'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:h-0 before:pointer-events-none',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
          // Heading sizes
          'prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6',
          'prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-3 prose-h2:mt-5',
          'prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-4',
          'prose-h4:text-lg prose-h4:font-semibold prose-h4:mb-2 prose-h4:mt-4',
          'prose-h5:text-base prose-h5:font-medium prose-h5:mb-2 prose-h5:mt-3',
          'prose-h6:text-sm prose-h6:font-medium prose-h6:mb-2 prose-h6:mt-3 prose-h6:uppercase prose-h6:tracking-wide',
          darkMode
            ? 'prose-invert prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-em:text-white/90 prose-ul:text-white/90 prose-ol:text-white/90 prose-blockquote:text-white/70 prose-blockquote:border-white/30'
            : 'prose-headings:text-gray-900 prose-p:text-gray-700'
        ),
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        darkMode ? 'bg-[#183c3f] border-[#1b5858]' : 'bg-white border-gray-300 shadow-sm',
        className
      )}
    >
      <MenuBar editor={editor} darkMode={darkMode} />
      <div className={cn(darkMode ? '' : 'bg-white')}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

