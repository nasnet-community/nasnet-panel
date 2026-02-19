import { useState } from 'react';

import {
  Home,
  Shield,
  Activity,
  Settings,
  Wifi,
  Bell,
  Network,
} from 'lucide-react';

import { BottomNavigation, type NavItem } from './BottomNavigation';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Layouts/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Render against a light background that makes the fixed bar visible
    backgrounds: { default: 'light' },
    docs: {
      description: {
        component:
          'Mobile-first fixed bottom navigation bar. Hidden on md+ screens (`md:hidden`). ' +
          'Use `forcePlatform` in stories by wrapping in a constrained viewport.',
      },
    },
  },
  decorators: [
    (Story) => (
      // Constrain to a mobile-sized container so the `fixed` bar is visible
      <div className="relative" style={{ height: '100vh', maxWidth: 390, margin: '0 auto', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div className="p-4 pb-24 text-sm text-muted-foreground">
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

export const Default: Story = {
  args: {
    activeId: 'home',
  },
};

export const VPNActive: Story = {
  args: {
    activeId: 'vpn',
  },
};

export const MonitorActive: Story = {
  args: {
    activeId: 'monitor',
  },
};

export const WithBadges: Story = {
  args: {
    activeId: 'home',
    items: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'vpn', label: 'VPN', icon: Shield, badge: 2 },
      { id: 'monitor', label: 'Monitor', icon: Activity, badge: 99 },
      { id: 'alerts', label: 'Alerts', icon: Bell, badge: 142 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] satisfies NavItem[],
  },
};

export const FiveItems: Story = {
  args: {
    activeId: 'network',
    items: [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'network', label: 'Network', icon: Network },
      { id: 'wifi', label: 'WiFi', icon: Wifi },
      { id: 'vpn', label: 'VPN', icon: Shield },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] satisfies NavItem[],
  },
};

/**
 * Interactive story with local state so the active tab actually changes on click.
 */
export const Interactive: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('home');
    const items: NavItem[] = [
      { id: 'home', label: 'Home', icon: Home, onClick: () => setActiveId('home') },
      { id: 'vpn', label: 'VPN', icon: Shield, onClick: () => setActiveId('vpn'), badge: 1 },
      { id: 'monitor', label: 'Monitor', icon: Activity, onClick: () => setActiveId('monitor') },
      { id: 'settings', label: 'Settings', icon: Settings, onClick: () => setActiveId('settings') },
    ];
    return (
      <div className="relative" style={{ height: '100vh', maxWidth: 390, margin: '0 auto', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div className="p-4 pb-24 text-sm text-muted-foreground">
          Active tab: <strong>{activeId}</strong>. Tap the nav items below.
        </div>
        <BottomNavigation activeId={activeId} items={items} />
      </div>
    );
  },
};
