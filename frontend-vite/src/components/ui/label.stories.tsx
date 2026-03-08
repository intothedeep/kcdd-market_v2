import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
  render: () => <Label>Email address</Label>,
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="required-email">
        Email <span className="text-destructive">*</span>
      </Label>
      <Input type="email" id="required-email" placeholder="Required field" />
    </div>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="disabled-input" className="opacity-70">
        Disabled Field
      </Label>
      <Input id="disabled-input" disabled placeholder="Cannot edit" />
    </div>
  ),
}

export const FormLabels: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="first-name">First Name</Label>
        <Input id="first-name" placeholder="John" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="last-name">Last Name</Label>
        <Input id="last-name" placeholder="Doe" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="form-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input type="email" id="form-email" placeholder="john@example.com" />
        <p className="text-sm text-muted-foreground">We&apos;ll never share your email.</p>
      </div>
    </div>
  ),
}
