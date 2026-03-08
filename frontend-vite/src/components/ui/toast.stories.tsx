import type { Meta, StoryObj } from '@storybook/react'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
import { Button } from './button'

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toast>

export const Default: Story = {
  render: () => (
    <Toast open>
      <div className="grid gap-1">
        <ToastTitle>Notification</ToastTitle>
        <ToastDescription>This is a default toast notification.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Toast variant="destructive" open>
      <div className="grid gap-1">
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>Something went wrong. Please try again.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Toast open>
      <div className="grid gap-1">
        <ToastTitle>Undo Action</ToastTitle>
        <ToastDescription>Your changes have been saved.</ToastDescription>
      </div>
      <ToastAction altText="Undo">Undo</ToastAction>
      <ToastClose />
    </Toast>
  ),
}

export const Success: Story = {
  render: () => (
    <Toast open className="border-green-500 bg-green-50">
      <div className="grid gap-1">
        <ToastTitle className="text-green-800">Success!</ToastTitle>
        <ToastDescription className="text-green-700">
          Your donation has been processed successfully.
        </ToastDescription>
      </div>
      <ToastClose className="text-green-800 hover:text-green-900" />
    </Toast>
  ),
}

export const Warning: Story = {
  render: () => (
    <Toast open className="border-yellow-500 bg-yellow-50">
      <div className="grid gap-1">
        <ToastTitle className="text-yellow-800">Warning</ToastTitle>
        <ToastDescription className="text-yellow-700">
          Your session will expire in 5 minutes.
        </ToastDescription>
      </div>
      <ToastAction altText="Extend session" className="border-yellow-500 text-yellow-800">
        Extend
      </ToastAction>
      <ToastClose className="text-yellow-800 hover:text-yellow-900" />
    </Toast>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Toast open>
        <div className="grid gap-1">
          <ToastTitle>Default Toast</ToastTitle>
          <ToastDescription>This is the default style.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast variant="destructive" open>
        <div className="grid gap-1">
          <ToastTitle>Destructive Toast</ToastTitle>
          <ToastDescription>This indicates an error.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>

      <Toast open className="border-green-500 bg-green-50">
        <div className="grid gap-1">
          <ToastTitle className="text-green-800">Success Toast</ToastTitle>
          <ToastDescription className="text-green-700">Operation completed.</ToastDescription>
        </div>
        <ToastClose className="text-green-800" />
      </Toast>
    </div>
  ),
}

export const UsageExample: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These are static examples. In a real app, use the useToast hook to trigger toasts.
      </p>
      <div className="flex gap-2">
        <Button variant="outline">Show Success Toast</Button>
        <Button variant="outline">Show Error Toast</Button>
        <Button variant="outline">Show Warning Toast</Button>
      </div>
      <Toast open>
        <div className="grid gap-1">
          <ToastTitle>Example Toast</ToastTitle>
          <ToastDescription>This would appear when triggered by the button above.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </div>
  ),
}
