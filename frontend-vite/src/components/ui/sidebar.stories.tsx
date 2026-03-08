import type { Meta, StoryObj } from '@storybook/react'
import { Sidebar, SidebarGroup, SidebarItem, SidebarFooter } from './sidebar'
import { Home, Users, Settings, BarChart3, FileText, LogOut, HelpCircle, Store } from 'lucide-react'

const meta: Meta<typeof Sidebar> = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[500px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Default: Story = {
  render: () => (
    <Sidebar>
      <SidebarGroup label="Main">
        <SidebarItem icon={<Home className="h-4 w-4" />} active>
          Dashboard
        </SidebarItem>
        <SidebarItem icon={<Store className="h-4 w-4" />}>Marketplace</SidebarItem>
        <SidebarItem icon={<Users className="h-4 w-4" />}>Organizations</SidebarItem>
        <SidebarItem icon={<FileText className="h-4 w-4" />}>Campaigns</SidebarItem>
        <SidebarItem icon={<BarChart3 className="h-4 w-4" />}>Analytics</SidebarItem>
      </SidebarGroup>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarItem icon={<HelpCircle className="h-4 w-4" />}>Help</SidebarItem>
          <SidebarItem icon={<Settings className="h-4 w-4" />}>Settings</SidebarItem>
          <SidebarItem icon={<LogOut className="h-4 w-4" />}>Sign Out</SidebarItem>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  ),
}

export const WithoutIcons: Story = {
  render: () => (
    <Sidebar>
      <SidebarGroup label="Navigation">
        <SidebarItem active>Dashboard</SidebarItem>
        <SidebarItem>Marketplace</SidebarItem>
        <SidebarItem>Organizations</SidebarItem>
        <SidebarItem>Campaigns</SidebarItem>
      </SidebarGroup>
    </Sidebar>
  ),
}

export const MultipleGroups: Story = {
  render: () => (
    <Sidebar>
      <SidebarGroup label="Overview">
        <SidebarItem icon={<Home className="h-4 w-4" />} active>
          Dashboard
        </SidebarItem>
        <SidebarItem icon={<BarChart3 className="h-4 w-4" />}>Analytics</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Management">
        <SidebarItem icon={<Store className="h-4 w-4" />}>Marketplace</SidebarItem>
        <SidebarItem icon={<Users className="h-4 w-4" />}>Organizations</SidebarItem>
        <SidebarItem icon={<FileText className="h-4 w-4" />}>Campaigns</SidebarItem>
      </SidebarGroup>
      <SidebarGroup label="Account">
        <SidebarItem icon={<Settings className="h-4 w-4" />}>Settings</SidebarItem>
      </SidebarGroup>
    </Sidebar>
  ),
}
