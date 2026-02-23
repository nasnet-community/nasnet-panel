/**
 * MobileAppShell Storybook Stories
 *
 * Responsive app shell layout component stories covering:
 * - Default responsive layout (mobile frame by default)
 * - With/without header, navigation, status banner
 * - Desktop sidebar visibility
 * - Wizard layout (no navigation)
 * - Multi-viewport testing (mobile/tablet/desktop)
 *
 * **Stories cover:**
 * - Happy path (default dashboard layout)
 * - Time-based greeting integration
 * - Status banner states (warning, error)
 * - Desktop responsive behavior
 * - Wizard flows (no navigation)
 */

import { MobileAppShell } from './mobile-app-shell';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MobileAppShell> = {
  title: 'Layouts/MobileAppShell',
  component: MobileAppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Responsive app shell layout for mobile, tablet, and desktop platforms. Combines header, bottom navigation, status banner, and optional sidebar in a responsive container. Provides semantic HTML structure with proper landmark elements for accessibility.',
      },
    },
  },
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
    { id: 'home', label: 'Home', icon: 'lucide:home' },
    { id: 'vpn', label: 'VPN', icon: 'lucide:shield' },
    { id: 'monitor', label: 'Monitor', icon: 'lucide:activity' },
    { id: 'settings', label: 'Settings', icon: 'lucide:settings' },
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
  name: 'No Navigation (Wizard Layout)',
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

// ---------------------------------------------------------------------------
// Viewport-based Stories (Section 17 Storybook requirements)
// ---------------------------------------------------------------------------

export const Mobile375px: Story = {
  name: 'Viewport: Mobile 375px',
  parameters: {
    viewport: {
      defaultViewport: 'iphone13',
      viewports: {
        iphone13: {
          name: 'iPhone 13',
          styles: { width: '375px', height: '812px' },
          type: 'mobile',
        },
      },
    },
  },
  args: {
    header: { title: 'Dashboard', greeting: true, subtitle: 'MikroTik hEX S' },
    navigation: defaultNavigation,
    children: MockContent,
  },
};

export const Tablet768px: Story = {
  name: 'Viewport: Tablet 768px',
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
      viewports: {
        ipad: {
          name: 'iPad',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
      },
    },
  },
  args: {
    header: { title: 'Dashboard', greeting: true, subtitle: 'MikroTik hEX S' },
    navigation: defaultNavigation,
    sidebar: MockSidebarContent,
    showSidebarOnDesktop: true,
    children: MockContent,
  },
};

export const Desktop1280px: Story = {
  name: 'Viewport: Desktop 1280px',
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
      viewports: {
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    header: { title: 'Dashboard', greeting: true, subtitle: 'MikroTik hEX S' },
    navigation: defaultNavigation,
    sidebar: MockSidebarContent,
    showSidebarOnDesktop: true,
    children: MockContent,
  },
};

// ---------------------------------------------------------------------------
// Error & Loading States (Section 17 requirements)
// ---------------------------------------------------------------------------

export const WithLoadingState: Story = {
  name: 'Loading Content',
  args: {
    header: { title: 'Dashboard', greeting: true },
    navigation: defaultNavigation,
    children: (
      <div className="p-4 flex flex-col gap-4">
        <div className="h-28 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {['', '', '', ''].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-36 rounded-xl bg-muted animate-pulse" />
      </div>
    ),
  },
};

export const WithErrorState: Story = {
  name: 'Error State (Offline)',
  args: {
    header: { title: 'Dashboard' },
    navigation: defaultNavigation,
    statusBanner: {
      status: 'error',
      visible: true,
      children: null,
      content: (
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium">Router offline — tap to reconnect</span>
          <button className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded-md">
            Retry
          </button>
        </div>
      ),
    },
    children: (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No data available</p>
          <p className="text-muted-foreground text-xs mt-2">Reconnect to view router status</p>
        </div>
      </div>
    ),
  },
};

export const WithEmptyState: Story = {
  name: 'Empty State (No Services)',
  args: {
    header: { title: 'Services' },
    navigation: { ...defaultNavigation, activeId: 'settings' },
    children: (
      <div className="p-4 flex flex-col gap-4 items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-semibold">No services installed</p>
          <p className="text-muted-foreground text-sm mt-2">Browse the marketplace to add features</p>
          <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            Explore Services
          </button>
        </div>
      </div>
    ),
  },
};
