/**
 * AlertTemplateBrowserNew Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases the platform-routing AlertTemplateBrowserNew component which
 * automatically delegates to the Desktop (≥640px) or Mobile (<640px) presenter.
 *
 * Stories cover:
 * - Default full template catalogue
 * - Category pre-filtered views (Network, Security, Resources)
 * - Loading skeleton state
 * - Error state
 * - Empty result set
 * - Mobile viewport
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { GET_ALERT_RULE_TEMPLATES } from '@nasnet/api-client/queries';

import { AlertTemplateBrowserNew } from './AlertTemplateBrowserNew';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertTemplateBrowserNew> = {
  title: 'Features/Alerts/AlertTemplateBrowserNew',
  component: AlertTemplateBrowserNew,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Platform-routing browser for alert rule templates. On desktop (≥640px) it renders a sidebar-filter + grid layout via `AlertTemplateBrowserDesktop`. On mobile (<640px) it renders a list + bottom-sheet filter layout via `AlertTemplateBrowserMobile`. Both presenters share the headless `useTemplateBrowser` hook for filter, sort, search, and selection state.',
      },
    },
  },
  argTypes: {
    initialCategory: {
      control: 'select',
      options: ['', 'NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM', 'CUSTOM'],
      description: 'Pre-select a category filter on mount',
    },
    onApply: { action: 'apply' },
    onViewDetail: { action: 'view-detail' },
  },
};

export default meta;
type Story = StoryObj<typeof AlertTemplateBrowserNew>;

// =============================================================================
// Inline Mock Templates
// =============================================================================

const networkTemplate1 = {
  id: 'network-device-offline',
  name: 'Device Offline Alert',
  description: 'Alert when a device goes offline for an extended period.',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [{ field: 'status', operator: 'EQUALS', value: 'offline' }],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'DURATION_SECONDS',
      label: 'Offline Duration',
      type: 'DURATION',
      required: true,
      defaultValue: '60',
      min: 30,
      max: 3600,
      unit: 'seconds',
      description: 'How long the device must be offline before alerting.',
    },
  ],
  throttle: { maxAlerts: 1, periodSeconds: 300, groupByField: 'device_id' },
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

const networkTemplate2 = {
  id: 'network-high-traffic',
  name: 'High Traffic Alert',
  description: 'Alert when interface traffic exceeds configured threshold.',
  category: 'NETWORK',
  severity: 'WARNING',
  eventType: 'network.traffic.high',
  conditions: [{ field: 'traffic_mbps', operator: 'GREATER_THAN', value: '{{THRESHOLD_MBPS}}' }],
  channels: ['inapp'],
  variables: [
    {
      name: 'THRESHOLD_MBPS',
      label: 'Traffic Threshold',
      type: 'INTEGER',
      required: true,
      defaultValue: '100',
      min: 1,
      max: 10000,
      unit: 'Mbps',
      description: 'Traffic in Mbps that triggers the alert.',
    },
  ],
  throttle: null,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-05T00:00:00Z',
  updatedAt: '2024-01-05T00:00:00Z',
};

const securityTemplate = {
  id: 'security-brute-force',
  name: 'Brute Force Detection',
  description: 'Alert when repeated failed login attempts are detected.',
  category: 'SECURITY',
  severity: 'CRITICAL',
  eventType: 'auth.login.failed',
  conditions: [{ field: 'failure_count', operator: 'GREATER_THAN', value: '{{MAX_FAILURES}}' }],
  channels: ['email', 'inapp', 'webhook'],
  variables: [
    {
      name: 'MAX_FAILURES',
      label: 'Max Failed Attempts',
      type: 'INTEGER',
      required: true,
      defaultValue: '5',
      min: 3,
      max: 50,
      description: 'Number of failures before alerting.',
    },
  ],
  throttle: { maxAlerts: 3, periodSeconds: 3600, groupByField: 'source_ip' },
  isBuiltIn: true,
  version: '2.1.0',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-03-10T14:00:00Z',
};

const resourcesTemplate = {
  id: 'resources-high-cpu',
  name: 'High CPU Usage',
  description: 'Alert when CPU usage sustains above a threshold.',
  category: 'RESOURCES',
  severity: 'WARNING',
  eventType: 'system.cpu.high',
  conditions: [{ field: 'cpu_percent', operator: 'GREATER_THAN', value: '{{CPU_THRESHOLD}}' }],
  channels: ['inapp'],
  variables: [
    {
      name: 'CPU_THRESHOLD',
      label: 'CPU Threshold',
      type: 'PERCENTAGE',
      required: true,
      defaultValue: '85',
      min: 50,
      max: 99,
      unit: '%',
      description: 'CPU percentage above which to alert.',
    },
  ],
  throttle: null,
  isBuiltIn: true,
  version: '1.2.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-20T09:00:00Z',
};

const vpnTemplate = {
  id: 'vpn-tunnel-down',
  name: 'VPN Tunnel Down',
  description: 'Alert when a VPN tunnel unexpectedly disconnects.',
  category: 'VPN',
  severity: 'CRITICAL',
  eventType: 'vpn.tunnel.down',
  conditions: [{ field: 'tunnel_status', operator: 'EQUALS', value: 'disconnected' }],
  channels: ['email', 'inapp'],
  variables: [],
  throttle: { maxAlerts: 2, periodSeconds: 600, groupByField: 'tunnel_id' },
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

const customTemplate = {
  id: 'custom-my-event',
  name: 'My Custom Event Alert',
  description: 'User-created alert for a specific application event.',
  category: 'CUSTOM',
  severity: 'INFO',
  eventType: 'custom.event',
  conditions: [{ field: 'event_name', operator: 'EQUALS', value: 'app-started' }],
  channels: ['inapp'],
  variables: [],
  throttle: null,
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-10T00:00:00Z',
};

const allTemplates = [
  networkTemplate1,
  networkTemplate2,
  securityTemplate,
  resourcesTemplate,
  vpnTemplate,
  customTemplate,
];

// Helper to build the most common mock (all templates, variable delay)
function buildAllTemplatesMock(delay = 300) {
  return [
    {
      request: { query: GET_ALERT_RULE_TEMPLATES, variables: {} },
      result: { data: { alertRuleTemplates: allTemplates } },
      delay,
    },
  ];
}

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — all templates displayed with no initial category filter.
 */
export const Default: Story = {
  args: {
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildAllTemplatesMock(300)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Pre-filtered to the Network category.
 */
export const FilteredByNetwork: Story = {
  args: {
    initialCategory: 'NETWORK',
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: GET_ALERT_RULE_TEMPLATES, variables: { category: 'NETWORK' } },
            result: { data: { alertRuleTemplates: [networkTemplate1, networkTemplate2] } },
            delay: 200,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Browser opened with the NETWORK category pre-selected via the `initialCategory` prop.',
      },
    },
  },
};

/**
 * Pre-filtered to the Security category.
 */
export const FilteredBySecurity: Story = {
  args: {
    initialCategory: 'SECURITY',
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: GET_ALERT_RULE_TEMPLATES, variables: { category: 'SECURITY' } },
            result: { data: { alertRuleTemplates: [securityTemplate] } },
            delay: 200,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading skeleton — long server delay forces skeleton to remain visible.
 */
export const Loading: Story = {
  args: {
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildAllTemplatesMock(60000)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state shown while template data is being fetched from the server.',
      },
    },
  },
};

/**
 * Error state — server returns an error for the templates query.
 */
export const LoadError: Story = {
  args: {
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: GET_ALERT_RULE_TEMPLATES, variables: {} },
            error: new Error('Failed to load templates — connection refused'),
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Displays the error view when the GraphQL query for templates fails.',
      },
    },
  },
};

/**
 * Empty — server returns an empty template list.
 */
export const Empty: Story = {
  args: {
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: { query: GET_ALERT_RULE_TEMPLATES, variables: {} },
            result: { data: { alertRuleTemplates: [] } },
            delay: 200,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no templates are available or all are filtered out.',
      },
    },
  },
};

/**
 * Mobile viewport — renders the AlertTemplateBrowserMobile presenter.
 */
export const Mobile: Story = {
  args: {
    onApply: fn(),
    onViewDetail: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildAllTemplatesMock(200)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'On viewports narrower than 640px the component renders the touch-optimised mobile presenter with a bottom-sheet filter panel.',
      },
    },
  },
};
