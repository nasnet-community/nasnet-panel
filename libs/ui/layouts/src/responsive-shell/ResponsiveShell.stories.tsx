import { useState } from 'react';

import { Home, Shield, Activity, Settings } from 'lucide-react';

import { ResponsiveShell } from './ResponsiveShell';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ResponsiveShell> = {
  title: 'Layouts/ResponsiveShell',
  component: ResponsiveShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The top-level layout wrapper that automatically selects MobileAppShell or AppShell ' +
          'based on viewport width. Use `forcePlatform` to pin a specific layout in stories.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ResponsiveShell>;

// ---------------------------------------------------------------------------
// Shared mock content
// ---------------------------------------------------------------------------

const MockDesktopHeader = (
  <div className="h-full flex items-center px-6 gap-4">
    <span className="font-semibold">NasNetConnect</span>
    <nav className="ml-auto flex gap-6 text-sm text-muted-foreground">
      <a href="/dashboard">Dashboard</a>
      <a href="/network">Network</a>
      <a href="/firewall">Firewall</a>
    </nav>
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
      A
    </div>
  </div>
);

const MockSidebar = (
  <div className="p-3 flex flex-col gap-1 h-full">
    {['Dashboard', 'Network', 'VPN', 'Firewall', 'Diagnostics', 'Services', 'Settings'].map(
      (item) => (
        <div
          key={item}
          className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent cursor-pointer truncate"
        >
          {item}
        </div>
      )
    )}
  </div>
);

const MockPageContent = (
  <div className="p-6 flex flex-col gap-4">
    <h2 className="text-xl font-semibold">Dashboard</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {['CPU 12%', 'RAM 34 MB', 'Uptime 3d', 'Clients 8'].map((label) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-center"
        >
          {label}
        </div>
      ))}
    </div>
    <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
      Traffic graph
    </div>
  </div>
);

const mobileNavigation = {
  activeId: 'home',
  items: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'vpn', label: 'VPN', icon: Shield },
    { id: 'monitor', label: 'Monitor', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

const mobileHeaderProps = {
  title: 'Dashboard',
  greeting: true,
  subtitle: 'MikroTik hEX S · 192.168.88.1',
};

// ---------------------------------------------------------------------------
// Stories (use forcePlatform to lock the rendered layout)
// ---------------------------------------------------------------------------

export const DesktopLayout: Story = {
  name: 'Desktop Layout (forced)',
  args: {
    forcePlatform: 'desktop',
    header: MockDesktopHeader,
    sidebar: MockSidebar,
    sidebarCollapsed: false,
    children: MockPageContent,
  },
};

export const DesktopCollapsedSidebar: Story = {
  name: 'Desktop Layout — Sidebar Collapsed',
  args: {
    forcePlatform: 'desktop',
    header: MockDesktopHeader,
    sidebar: MockSidebar,
    sidebarCollapsed: true,
    children: MockPageContent,
  },
};

export const TabletLayout: Story = {
  name: 'Tablet Layout (forced)',
  args: {
    forcePlatform: 'tablet',
    header: MockDesktopHeader,
    sidebar: MockSidebar,
    children: MockPageContent,
  },
};

export const MobileLayout: Story = {
  name: 'Mobile Layout (forced)',
  decorators: [
    (Story) => (
      <div
        style={{
          width: 390,
          height: 844,
          margin: '0 auto',
          border: '2px solid #d1d5db',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    forcePlatform: 'mobile',
    mobileHeaderProps,
    mobileNavigationProps: mobileNavigation,
    children: MockPageContent,
  },
};

export const MobileWithBanner: Story = {
  name: 'Mobile Layout — With Status Banner',
  decorators: [
    (Story) => (
      <div
        style={{
          width: 390,
          height: 844,
          margin: '0 auto',
          border: '2px solid #d1d5db',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    forcePlatform: 'mobile',
    mobileHeaderProps,
    mobileNavigationProps: { ...mobileNavigation, activeId: 'vpn' },
    statusBannerProps: {
      status: 'warning',
      visible: true,
      children: null,
      content: <span className="text-sm font-medium">Connection degraded</span>,
    },
    children: MockPageContent,
  },
};

/**
 * Interactive story: sidebar collapse is controlled by local state.
 * Demonstrates wiring `sidebarCollapsed` + `onSidebarToggle` the same way
 * the app layer connects the Zustand sidebar store.
 */
export const InteractiveDesktop: Story = {
  name: 'Interactive — Sidebar Toggle (Desktop)',
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <ResponsiveShell
        forcePlatform="desktop"
        header={MockDesktopHeader}
        sidebar={MockSidebar}
        sidebarCollapsed={collapsed}
        onSidebarToggle={() => setCollapsed((c) => !c)}
      >
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Sidebar is <strong>{collapsed ? 'collapsed' : 'expanded'}</strong>. Use the
            toggle button on the sidebar edge or press Ctrl+B / Cmd+B.
          </p>
          {MockPageContent}
        </div>
      </ResponsiveShell>
    );
  },
};

export const WithBanner: Story = {
  name: 'Desktop Layout — With Offline Banner',
  args: {
    forcePlatform: 'desktop',
    header: MockDesktopHeader,
    sidebar: MockSidebar,
    banner: (
      <div className="bg-warning text-white px-6 py-2 text-sm text-center font-medium">
        Offline mode &mdash; reconnecting to router&hellip;
      </div>
    ),
    children: MockPageContent,
  },
};
