import { Home, Shield, Activity, Settings } from 'lucide-react';

import { MobileAppShell } from './mobile-app-shell';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MobileAppShell> = {
  title: 'Layouts/MobileAppShell',
  component: MobileAppShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      // Simulate a mobile viewport frame
      <div
        style={{
          width: 390,
          height: 844,
          margin: '0 auto',
          border: '2px solid #d1d5db',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--color-background, #fff)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MobileAppShell>;

// ---------------------------------------------------------------------------
// Shared placeholder blocks
// ---------------------------------------------------------------------------

const defaultNavigation = {
  activeId: 'home',
  items: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'vpn', label: 'VPN', icon: Shield },
    { id: 'monitor', label: 'Monitor', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

const MockContent = (
  <div className="p-4 flex flex-col gap-4">
    <div className="h-28 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
      Router health summary card
    </div>
    <div className="grid grid-cols-2 gap-3">
      {['CPU 12%', 'RAM 34MB', 'Uptime 3d', 'Clients 8'].map((label) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card p-4 text-sm font-medium text-center"
        >
          {label}
        </div>
      ))}
    </div>
    <div className="h-36 rounded-xl bg-muted/50 border border-border flex items-center justify-center text-xs text-muted-foreground">
      Traffic graph placeholder
    </div>
  </div>
);

const MockSidebarContent = (
  <div className="p-4 flex flex-col gap-2 h-full">
    {['Dashboard', 'Network', 'VPN', 'Firewall', 'Services', 'Settings'].map((item) => (
      <div
        key={item}
        className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent cursor-pointer"
      >
        {item}
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    header: { title: 'Dashboard' },
    navigation: defaultNavigation,
    children: MockContent,
  },
};

export const WithGreeting: Story = {
  args: {
    header: {
      title: 'Dashboard',
      greeting: true,
      subtitle: 'MikroTik hEX S · 192.168.88.1',
    },
    navigation: defaultNavigation,
    children: MockContent,
  },
};

export const WithStatusBanner: Story = {
  args: {
    header: { title: 'Dashboard' },
    navigation: { ...defaultNavigation, activeId: 'vpn' },
    statusBanner: {
      status: 'warning',
      visible: true,
      children: null,
      content: (
        <span className="text-sm font-medium">
          Connection degraded &mdash; tap for details
        </span>
      ),
    },
    children: MockContent,
  },
};

export const WithErrorBanner: Story = {
  args: {
    header: { title: 'Dashboard' },
    navigation: defaultNavigation,
    statusBanner: {
      status: 'error',
      visible: true,
      children: null,
      content: (
        <span className="text-sm font-medium">
          Router offline &mdash; reconnecting&hellip;
        </span>
      ),
    },
    children: MockContent,
  },
};

export const WithDesktopSidebar: Story = {
  name: 'With Desktop Sidebar (visible on md+)',
  parameters: {
    // Widen the canvas so the sidebar is visible
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    header: { title: 'Dashboard', subtitle: 'MikroTik hEX S' },
    navigation: defaultNavigation,
    sidebar: MockSidebarContent,
    showSidebarOnDesktop: true,
    children: MockContent,
  },
};

export const NoNavigation: Story = {
  args: {
    header: { title: 'Setup Wizard', subtitle: 'Step 1 of 4' },
    children: (
      <div className="p-4 flex flex-col gap-4 items-center">
        <div className="h-40 w-full rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
          Wizard step content
        </div>
      </div>
    ),
  },
};
