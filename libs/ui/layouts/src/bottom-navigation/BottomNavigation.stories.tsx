import { useState } from 'react';

import { BottomNavigation, type NavItem } from './BottomNavigation';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Layouts/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'Mobile-first fixed bottom navigation bar for touch-first interfaces. ' +
          'Hidden on md+ screens (`md:hidden`). Provides 44px minimum touch targets for WCAG AAA compliance. ' +
          'Supports 4-5 navigation items with optional notification badges.',
      },
    },
  },
  argTypes: {
    activeId: {
      control: 'select',
      options: ['home', 'network', 'wifi', 'vpn', 'settings', 'monitor', 'alerts'],
      description: 'ID of the currently active navigation item',
    },
    items: {
      description: 'Array of navigation items to display',
    },
    className: {
      control: 'text',
      description: 'Optional custom className for the nav element',
    },
  },
  decorators: [
    (Story) => (
      <div
        className="relative"
        style={{
          height: '100vh',
          maxWidth: 390,
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div className="text-muted-foreground overflow-y-auto p-4 pb-24 text-sm">
          Page content goes here. The bottom navigation is pinned to the bottom of this viewport.
        </div>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BottomNavigation>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default state with home active and 4 core navigation items
 */
export const Default: Story = {
  args: {
    activeId: 'home',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home' },
      { id: 'network', label: 'Network', icon: 'lucide:network' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield' },
      { id: 'settings', label: 'Settings', icon: 'lucide:settings' },
    ] satisfies NavItem[],
  },
};

/**
 * Mobile viewport (375px) - typical phone size
 */
export const Mobile: Story = {
  args: {
    activeId: 'home',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield' },
      { id: 'monitor', label: 'Monitor', icon: 'lucide:activity' },
      { id: 'settings', label: 'Settings', icon: 'lucide:settings' },
    ] satisfies NavItem[],
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

/**
 * With notification badges showing different counts
 */
export const WithBadges: Story = {
  args: {
    activeId: 'home',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield', badge: 2 },
      { id: 'monitor', label: 'Monitor', icon: 'lucide:activity', badge: 99 },
      { id: 'alerts', label: 'Alerts', icon: 'lucide:bell', badge: 142 },
    ] satisfies NavItem[],
  },
};

/**
 * Five navigation items (secondary item overflows)
 */
export const FiveItems: Story = {
  args: {
    activeId: 'network',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home' },
      { id: 'network', label: 'Network', icon: 'lucide:network' },
      { id: 'wifi', label: 'WiFi', icon: 'lucide:wifi' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield' },
      { id: 'settings', label: 'Settings', icon: 'lucide:settings' },
    ] satisfies NavItem[],
  },
};

/**
 * Active VPN tab with badge
 */
export const VPNActive: Story = {
  args: {
    activeId: 'vpn',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield', badge: 1 },
      { id: 'monitor', label: 'Monitor', icon: 'lucide:activity' },
      { id: 'settings', label: 'Settings', icon: 'lucide:settings' },
    ] satisfies NavItem[],
  },
};

/**
 * Interactive story with local state - tab changes on click
 */
export const Interactive: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('home');
    const items: NavItem[] = [
      { id: 'home', label: 'Home', icon: 'lucide:home', onClick: () => setActiveId('home') },
      {
        id: 'vpn',
        label: 'VPN',
        icon: 'lucide:shield',
        onClick: () => setActiveId('vpn'),
        badge: 1,
      },
      {
        id: 'monitor',
        label: 'Monitor',
        icon: 'lucide:activity',
        onClick: () => setActiveId('monitor'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'lucide:settings',
        onClick: () => setActiveId('settings'),
      },
    ];
    return (
      <div
        className="relative"
        style={{
          height: '100vh',
          maxWidth: 390,
          margin: '0 auto',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div className="text-muted-foreground p-4 pb-24 text-sm">
          Active tab: <strong>{activeId}</strong>. Tap nav items to change active state.
        </div>
        <BottomNavigation
          activeId={activeId}
          items={items}
        />
      </div>
    );
  },
};

/**
 * With links instead of onClick handlers
 */
export const WithLinks: Story = {
  args: {
    activeId: 'home',
    items: [
      { id: 'home', label: 'Home', icon: 'lucide:home', href: '/' },
      { id: 'vpn', label: 'VPN', icon: 'lucide:shield', href: '/vpn' },
      { id: 'monitor', label: 'Monitor', icon: 'lucide:activity', href: '/monitor' },
      { id: 'settings', label: 'Settings', icon: 'lucide:settings', href: '/settings' },
    ] satisfies NavItem[],
  },
};
