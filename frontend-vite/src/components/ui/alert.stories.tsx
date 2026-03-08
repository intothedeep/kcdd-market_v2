import type { Meta, StoryObj } from '@storybook/react'
import { Alert, AlertTitle, AlertDescription } from './alert'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again to continue.
      </AlertDescription>
    </Alert>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>This is an informational message with an icon.</AlertDescription>
    </Alert>
  ),
}

export const Success: Story = {
  render: () => (
    <Alert className="border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Success!</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
}

export const Warning: Story = {
  render: () => (
    <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This action cannot be undone. Please proceed with caution.
      </AlertDescription>
    </Alert>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is the default alert style.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>This indicates an error or destructive action.</AlertDescription>
      </Alert>

      <Alert className="border-green-500 bg-green-50 text-green-800 [&>svg]:text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>Custom success styling using className.</AlertDescription>
      </Alert>

      <Alert className="border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>Custom warning styling using className.</AlertDescription>
      </Alert>
    </div>
  ),
}
