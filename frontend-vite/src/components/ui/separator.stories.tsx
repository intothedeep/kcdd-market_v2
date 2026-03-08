import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Section Title</h4>
        <p className="text-sm text-muted-foreground">Some description text here.</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Another Section</h4>
        <p className="text-sm text-muted-foreground">More content below the separator.</p>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
    </div>
  ),
}

export const InNavigation: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <span className="cursor-pointer font-medium">Home</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">Products</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">About</span>
      <Separator orientation="vertical" />
      <span className="cursor-pointer text-muted-foreground hover:text-foreground">Contact</span>
    </div>
  ),
}

export const InList: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <div className="py-3">
        <div className="font-medium">Item 1</div>
        <div className="text-sm text-muted-foreground">Description for item 1</div>
      </div>
      <Separator />
      <div className="py-3">
        <div className="font-medium">Item 2</div>
        <div className="text-sm text-muted-foreground">Description for item 2</div>
      </div>
      <Separator />
      <div className="py-3">
        <div className="font-medium">Item 3</div>
        <div className="text-sm text-muted-foreground">Description for item 3</div>
      </div>
    </div>
  ),
}

export const WithDifferentColors: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Separator />
      <Separator className="bg-primary" />
      <Separator className="bg-destructive" />
      <Separator className="bg-muted-foreground" />
    </div>
  ),
}
