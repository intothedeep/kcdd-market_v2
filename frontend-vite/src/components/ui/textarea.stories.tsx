import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'
import { Label } from './label'
import { Button } from './button'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled.',
    disabled: true,
  },
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'This is some pre-filled text content. You can edit this text to see how the textarea behaves with existing content.',
  },
}

export const WithDescription: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="bio">Bio</Label>
      <Textarea placeholder="Tell us about yourself" id="bio" />
      <p className="text-sm text-muted-foreground">
        Your bio will be displayed on your public profile.
      </p>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="subject">Subject</Label>
        <input
          type="text"
          id="subject"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What is this regarding?"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Please provide as much detail as possible..."
          className="min-h-[150px]"
        />
      </div>
      <Button className="w-full">Submit</Button>
    </div>
  ),
}

export const CharacterCount: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="limited">Message (max 280 characters)</Label>
      <Textarea
        id="limited"
        placeholder="Type your message..."
        maxLength={280}
        className="resize-none"
      />
      <p className="text-right text-sm text-muted-foreground">0 / 280</p>
    </div>
  ),
}

export const FeedbackForm: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">Share Your Feedback</h3>
        <p className="text-sm text-muted-foreground">
          We value your input to help us improve our platform.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="feedback">Your Feedback</Label>
        <Textarea
          id="feedback"
          placeholder="What can we do better? Any features you'd like to see?"
          className="min-h-[120px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Submit Feedback</Button>
      </div>
    </div>
  ),
}
