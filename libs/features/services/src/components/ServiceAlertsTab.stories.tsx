/**
 * Storybook stories for ServiceAlertsTab
 *
 * Platform-agnostic wrapper implementing Headless + Platform Presenters (ADR-018).
 * Automatically selects:
 * - Mobile (<640px): Card-based list with swipe-to-acknowledge and 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with sortable columns and bulk operations
 *
 * Because this component fetches data via Apollo Client (useServiceAlertsTab hook),
 * stories demonstrate the visual API surface and props. Use MSW or Apollo mocks
 * in your test environment for full data-driven stories.
 */

import type { Meta, StoryObj } from '@storybook/react';

import { ServiceAlertsTab } from './ServiceAlertsTab';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ServiceAlertsTab> = {
  title: 'Features/Services/ServiceAlertsTab',
  component: ServiceAlertsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays all alerts for a specific service instance. ' +
          'On Desktop/Tablet: dense DataTable with multi-select bulk acknowledge, ' +
          'sortable columns, severity filter, and pagination. ' +
          'On Mobile: card-based layout with swipe gestures and 44px touch targets. ' +
          'Platform selection is automatic via PlatformProvider context. ' +
          'Requires a live Apollo Client — will show loading state in Storybook isolation.',
      },
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional CSS class for custom styling',
    },
  },
  args: {
    routerId: 'router-main-01',
    instanceId: 'xray-instance-abc123',
  },
};

export default meta;
type Story = StoryObj<typeof ServiceAlertsTab>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default view for an Xray VPN service instance.
 * Shows the desktop DataTable layout in standard sizing.
 */
export const Default: Story = {
  name: 'Default (Xray VPN Instance)',
  args: {
    routerId: 'router-main-01',
    instanceId: 'xray-instance-abc123',
  },
};

/**
 * Alerts tab for a Tor service instance.
 * Demonstrates that the component works with any service instance ID.
 */
export const TorServiceAlerts: Story = {
  name: 'Tor Service Alerts',
  args: {
    routerId: 'router-main-01',
    instanceId: 'tor-instance-xyz789',
  },
};

/**
 * Alerts for an AdGuard Home instance on a secondary router.
 * Tests cross-router usage with a different routerId.
 */
export const SecondaryRouterInstance: Story = {
  name: 'Secondary Router (AdGuard Home)',
  args: {
    routerId: 'router-edge-02',
    instanceId: 'adguard-instance-001',
  },
};

/**
 * Mobile viewport — renders ServiceAlertsTabMobile with card layout.
 * Card-based presentation with swipe-to-acknowledge and 44px touch targets.
 */
export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  args: {
    routerId: 'router-main-01',
    instanceId: 'xray-instance-abc123',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile (<640px) the ServiceAlertsTabMobile presenter is used: ' +
          'card-based list, filter chips, and touch-optimized acknowledge buttons.',
      },
    },
  },
};

/**
 * Tablet viewport — uses the Desktop presenter (>= 640px threshold).
 */
export const TabletViewport: Story = {
  name: 'Tablet Viewport',
  args: {
    routerId: 'router-main-01',
    instanceId: 'singbox-instance-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'On tablet (640-1024px) the component uses the Desktop presenter ' +
          'with the same DataTable layout as full desktop.',
      },
    },
  },
};

/**
 * With a custom CSS class for embedding in a wider page container.
 */
export const WithCustomClass: Story = {
  name: 'Custom CSS Class',
  args: {
    routerId: 'router-main-01',
    instanceId: 'psiphon-instance-m1',
    className: 'rounded-xl border shadow-sm',
  },
};
