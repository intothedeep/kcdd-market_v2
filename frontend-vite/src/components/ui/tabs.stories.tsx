import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you&apos;re done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const SimpleTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="p-4">
        Content for Tab 1
      </TabsContent>
      <TabsContent value="tab2" className="p-4">
        Content for Tab 2
      </TabsContent>
      <TabsContent value="tab3" className="p-4">
        Content for Tab 3
      </TabsContent>
    </Tabs>
  ),
}

export const OrganizationProfile: Story = {
  render: () => (
    <Tabs defaultValue="about" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="impact">Impact</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="about" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">About Us</h3>
          <p className="text-muted-foreground">
            We are a nonprofit organization dedicated to bridging the digital divide in underserved
            communities. Our mission is to provide technology resources and education to those who
            need it most.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="campaigns" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Campaigns</h3>
          <p className="text-muted-foreground">
            3 active campaigns raising funds for technology needs.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="impact" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Our Impact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Devices Donated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1,200+</div>
              <div className="text-sm text-muted-foreground">People Helped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$50K</div>
              <div className="text-sm text-muted-foreground">Raised</div>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="team" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Our Team</h3>
          <p className="text-muted-foreground">
            Meet the dedicated individuals behind our mission.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const SettingsTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-full max-w-xl">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input defaultValue="John Doe" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" defaultValue="john@example.com" />
        </div>
        <Button>Save Changes</Button>
      </TabsContent>
      <TabsContent value="security" className="pt-4">
        <p className="text-muted-foreground">Security settings content here.</p>
      </TabsContent>
      <TabsContent value="notifications" className="pt-4">
        <p className="text-muted-foreground">Notification preferences content here.</p>
      </TabsContent>
      <TabsContent value="billing" className="pt-4">
        <p className="text-muted-foreground">Billing information content here.</p>
      </TabsContent>
    </Tabs>
  ),
}
