import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'
import { Label } from './label'

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    checked: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: {},
}

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const SettingsExample: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notifications">Notifications</Label>
          <p className="text-sm text-muted-foreground">Receive notifications about updates.</p>
        </div>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="marketing">Marketing emails</Label>
          <p className="text-sm text-muted-foreground">Receive emails about new features.</p>
        </div>
        <Switch id="marketing" />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="security">Security alerts</Label>
          <p className="text-sm text-muted-foreground">Get notified about security issues.</p>
        </div>
        <Switch id="security" defaultChecked />
      </div>
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Privacy Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-public">Public profile</Label>
          <Switch id="profile-public" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-email">Show email</Label>
          <Switch id="show-email" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="activity-status">Activity status</Label>
          <Switch id="activity-status" defaultChecked />
        </div>
      </div>
    </div>
  ),
}
