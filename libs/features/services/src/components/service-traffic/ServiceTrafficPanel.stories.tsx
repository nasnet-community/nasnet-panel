/**
 * Storybook stories for ServiceTrafficPanel
 *
 * Platform wrapper (Headless + Platform Presenters pattern, ADR-018).
 * Renders ServiceTrafficPanelDesktop or ServiceTrafficPanelMobile based on viewport.
 *
 * Because this component fetches live data via Apollo Client, stories
 * use decorators that mock the Apollo provider and demonstrate the
 * visual shape with static props.
 */

import { fn } from 'storybook/test';

import { ServiceTrafficPanel } from './ServiceTrafficPanel';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ServiceTrafficPanel> = {
  title: 'Features/Services/Traffic/ServiceTrafficPanel',
  component: ServiceTrafficPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Traffic statistics panel for a service instance. ' +
          'Displays real-time upload/download rates, total traffic counters, ' +
          'quota usage with progress bar, and a per-device bandwidth breakdown. ' +
          'Automatically selects Desktop (dense grid) or Mobile (stacked cards) presenter ' +
          'based on platform context. Requires a live Apollo Client for data fetching.',
      },
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  argTypes: {
    historyHours: {
      control: { type: 'select' },
      options: [1, 6, 12, 24, 48, 168],
      description: 'Hours of historical traffic data to display',
    },
    onClose: { action: 'onClose' },
  },
  args: {
    routerID: 'router-main-01',
    instanceID: 'xray-instance-abc123',
    instanceName: 'Xray VPN Service',
    historyHours: 24,
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ServiceTrafficPanel>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default panel showing an Xray VPN service with 24-hour history window.
 * Requires a connected Apollo Client — will show loading state in isolation.
 */
export const Default: Story = {
  name: 'Default (Xray VPN, 24h)',
  args: {
    instanceName: 'Xray VPN Service',
    historyHours: 24,
  },
};

/**
 * Tor anonymity service traffic panel.
 * Demonstrates a different service type with a 6-hour history.
 */
export const TorService: Story = {
  name: 'Tor Service (6h history)',
  args: {
    instanceID: 'tor-instance-xyz789',
    instanceName: 'Tor Hidden Service',
    historyHours: 6,
  },
};

/**
 * Long history window of 7 days (168 hours).
 * Tests that the panel handles large historical datasets correctly.
 */
export const WeeklyHistory: Story = {
  name: 'Weekly History (168h)',
  args: {
    instanceName: 'AdGuard Home',
    instanceID: 'adguard-instance-001',
    historyHours: 168,
  },
};

/**
 * Mobile viewport presentation.
 * Demonstrates the stacked card layout with 44px touch targets.
 */
export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  args: {
    instanceName: 'Psiphon Pro',
    instanceID: 'psiphon-instance-m1',
    historyHours: 24,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile viewports the panel switches to ServiceTrafficPanelMobile: ' +
          'stacked cards, larger touch targets, and simplified metrics.',
      },
    },
  },
};

/**
 * Panel without a close callback — used when embedded directly in a page
 * rather than shown as an overlay or modal.
 */
export const EmbeddedNoClose: Story = {
  name: 'Embedded (No Close Button)',
  args: {
    instanceName: 'Sing-box Tunnel',
    instanceID: 'singbox-instance-001',
    onClose: undefined,
  },
};

/**
 * Custom CSS class passed to apply full-width layout in a parent container.
 */
export const FullWidth: Story = {
  name: 'Full Width Layout',
  args: {
    instanceName: 'MTProxy Service',
    instanceID: 'mtproxy-instance-002',
    className: 'w-full',
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};
