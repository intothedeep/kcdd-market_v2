import type { Meta, StoryObj } from '@storybook/react'
import { IconPicker, IconByName } from './icon-picker'
import { useState } from 'react'

const meta: Meta<typeof IconPicker> = {
  title: 'UI/IconPicker',
  component: IconPicker,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof IconPicker>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>()
    return (
      <div className="w-80">
        <IconPicker value={value} onChange={setValue} />
        {value && <p className="mt-2 text-sm text-muted-foreground">Selected: {value}</p>}
      </div>
    )
  },
}

export const WithPreselected: Story = {
  render: () => {
    const [value, setValue] = useState('heart')
    return (
      <div className="w-80">
        <IconPicker value={value} onChange={setValue} />
      </div>
    )
  },
}

export const IconByNameExamples: Story = {
  name: 'IconByName Helper',
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <IconByName name="heart" size={32} className="text-red-500" />
        <span className="text-xs text-muted-foreground">heart</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <IconByName name="star" size={32} className="text-yellow-500" />
        <span className="text-xs text-muted-foreground">star</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <IconByName name="users" size={32} className="text-blue-500" />
        <span className="text-xs text-muted-foreground">users</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <IconByName name="leaf" size={32} className="text-green-500" />
        <span className="text-xs text-muted-foreground">leaf</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <IconByName name="rocket" size={32} className="text-purple-500" />
        <span className="text-xs text-muted-foreground">rocket</span>
      </div>
    </div>
  ),
}
