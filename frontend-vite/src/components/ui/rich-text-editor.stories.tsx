import type { Meta, StoryObj } from '@storybook/react'
import { RichTextEditor } from './rich-text-editor'
import { useState } from 'react'

const meta: Meta<typeof RichTextEditor> = {
  title: 'UI/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="w-full max-w-2xl">
        <RichTextEditor value={value} onChange={setValue} />
      </div>
    )
  },
}

export const WithContent: Story = {
  render: () => {
    const [value, setValue] = useState(
      '<h2>Welcome to the Editor</h2><p>This is a <strong>rich text editor</strong> built with <em>Tiptap</em>.</p><ul><li>Bold, italic, underline</li><li>Headings (H1-H6)</li><li>Lists and alignment</li><li>Links and images</li></ul><blockquote>This is a blockquote for emphasis.</blockquote>'
    )
    return (
      <div className="w-full max-w-2xl">
        <RichTextEditor value={value} onChange={setValue} />
      </div>
    )
  },
}

export const DarkMode: Story = {
  render: () => {
    const [value, setValue] = useState(
      '<h2>Dark Mode Editor</h2><p>This editor supports a dark mode variant for use on dark backgrounds.</p>'
    )
    return (
      <div className="w-full max-w-2xl rounded-lg bg-[#0d2628] p-6">
        <RichTextEditor value={value} onChange={setValue} darkMode />
      </div>
    )
  },
}

export const CustomPlaceholder: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="w-full max-w-2xl">
        <RichTextEditor
          value={value}
          onChange={setValue}
          placeholder="Describe your campaign goals..."
        />
      </div>
    )
  },
}
