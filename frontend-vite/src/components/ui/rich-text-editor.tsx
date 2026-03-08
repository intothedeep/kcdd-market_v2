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
import { useEffect, useCallback } from 'react'
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
  Upload,
  X,
  AlertCircle,
} from 'lucide-react'
import { useState, useRef, useEffect as useEffectRef } from 'react'
import { cn } from '@/lib/utils'

// Image upload constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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
        'rounded p-1.5 transition-colors',
        darkMode
          ? isActive
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
          : isActive
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  )
}

// Image Upload Modal Component
interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onImageInsert: (dataUrl: string) => void
  darkMode?: boolean
}

function ImageUploadModal({ isOpen, onClose, onImageInsert, darkMode }: ImageUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setError(null)
    setPreview(null)
    setIsProcessing(false)
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const reader = new FileReader()

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if needed
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compress to JPEG with quality 0.8
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const processFile = async (file: File) => {
    setError(null)
    setIsProcessing(true)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image')
      setIsProcessing(false)
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Your file will be compressed.`
      )
    }

    try {
      const dataUrl = await compressImage(file)
      setPreview(dataUrl)
    } catch (err) {
      setError('Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleInsert = () => {
    if (preview) {
      onImageInsert(preview)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          'relative mx-4 w-full max-w-md rounded-xl shadow-2xl',
          darkMode ? 'bg-[#1b5858]' : 'bg-white'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-4',
            darkMode ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <h3 className={cn('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-900')}>
            Upload Image
          </h3>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-1 transition-colors',
              darkMode ? 'text-white/70 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!preview ? (
            <>
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all',
                  isDragging
                    ? darkMode
                      ? 'border-white bg-white/10'
                      : 'border-blue-500 bg-blue-50'
                    : darkMode
                      ? 'border-white/30 hover:border-white/50 hover:bg-white/5'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                )}
              >
                <Upload
                  className={cn(
                    'mx-auto mb-3 h-10 w-10',
                    darkMode ? 'text-white/50' : 'text-gray-400'
                  )}
                />
                <p className={cn('mb-1 font-medium', darkMode ? 'text-white' : 'text-gray-700')}>
                  {isDragging ? 'Drop image here' : 'Drag & drop an image'}
                </p>
                <p className={cn('text-sm', darkMode ? 'text-white/60' : 'text-gray-500')}>
                  or click to browse
                </p>
                <p className={cn('mt-2 text-xs', darkMode ? 'text-white/40' : 'text-gray-400')}>
                  JPEG, PNG, GIF, WebP • Max 2MB • Will be resized to max {MAX_WIDTH}px
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div
                className={cn(
                  'relative overflow-hidden rounded-lg border',
                  darkMode ? 'border-white/10' : 'border-gray-200'
                )}
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 w-full bg-gray-100 object-contain"
                />
                <button
                  onClick={() => setPreview(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p
                className={cn('text-center text-xs', darkMode ? 'text-white/60' : 'text-gray-500')}
              >
                Image will be compressed and embedded in the editor
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 rounded-lg p-3 text-sm',
                error.includes('compressed')
                  ? darkMode
                    ? 'bg-yellow-500/20 text-yellow-200'
                    : 'bg-yellow-50 text-yellow-700'
                  : darkMode
                    ? 'bg-red-500/20 text-red-200'
                    : 'bg-red-50 text-red-700'
              )}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div
              className={cn(
                'mt-3 flex items-center justify-center gap-2',
                darkMode ? 'text-white/70' : 'text-gray-600'
              )}
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing image...
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex justify-end gap-2 border-t p-4',
            darkMode ? 'border-white/10' : 'border-gray-200'
          )}
        >
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg px-4 py-2 font-medium transition-colors',
              darkMode ? 'text-white/70 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!preview || isProcessing}
            className={cn(
              'rounded-lg px-4 py-2 font-medium transition-colors',
              preview && !isProcessing
                ? 'bg-[#ea580c] text-white hover:bg-[#dc4c06]'
                : darkMode
                  ? 'cursor-not-allowed bg-white/10 text-white/30'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
            )}
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
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

  const isAnyHeadingActive = headingLevels.some((h) =>
    editor.isActive('heading', { level: h.level })
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors',
          darkMode
            ? isAnyHeadingActive
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
            : isAnyHeadingActive
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <span className="min-w-[70px] text-left font-medium">{getCurrentHeading()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-lg py-1 shadow-lg',
            darkMode ? 'border border-white/10 bg-[#1b5858]' : 'border border-gray-200 bg-white'
          )}
        >
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setParagraph().run()
              setIsOpen(false)
            }}
            className={cn(
              'w-full px-3 py-1.5 text-left text-sm',
              darkMode ? 'text-white/80 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'
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
                'flex w-full items-center gap-2 px-3 py-1.5 text-left',
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
              <span
                className={cn(
                  level === 1 && 'text-lg font-bold',
                  level === 2 && 'text-base font-bold',
                  level === 3 && 'text-sm font-semibold',
                  level === 4 && 'text-sm font-medium',
                  level === 5 && 'text-xs font-medium',
                  level === 6 && 'text-xs'
                )}
              >
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
  const [showImageModal, setShowImageModal] = useState(false)

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleImageInsert = (dataUrl: string) => {
    editor.chain().focus().setImage({ src: dataUrl }).run()
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-0.5 border-b p-2',
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

      <div className={cn('mx-1 h-5 w-px', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

      {/* Headings Dropdown */}
      <HeadingDropdown editor={editor} darkMode={darkMode} />

      <div className={cn('mx-1 h-5 w-px', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

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

      <div className={cn('mx-1 h-5 w-px', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

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

      <div className={cn('mx-1 h-5 w-px', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

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
        onClick={() => setShowImageModal(true)}
        isActive={editor.isActive('image')}
        title="Add Image"
        darkMode={darkMode}
      >
        <ImageIcon className="h-4 w-4" />
      </MenuButton>

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onImageInsert={handleImageInsert}
        darkMode={darkMode}
      />

      <div className={cn('mx-1 h-5 w-px', darkMode ? 'bg-white/20' : 'bg-gray-300')} />

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
        'overflow-hidden rounded-lg border',
        darkMode ? 'border-[#1b5858] bg-[#183c3f]' : 'border-gray-300 bg-white shadow-sm',
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
