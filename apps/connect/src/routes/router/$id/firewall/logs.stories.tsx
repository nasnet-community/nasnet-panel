import { FirewallLogsPage } from '@nasnet/features/firewall';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FirewallLogsPage> = {
  title: 'App/Router/Firewall/Logs',
  component: FirewallLogsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route component for firewall logs (/router/:id/firewall/logs). ' +
          'Displays firewall log entries with sidebar filters (desktop) or bottom sheet filters (mobile), ' +
          'statistics panel, auto-refresh controls, log export, and rule navigation via log prefix clicks. ' +
          'Uses ARIA live regions for announcing new log entries.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FirewallLogsPage>;

export const Default: Story = {
  render: () => <FirewallLogsPage />,
};

export const DesktopLayout: Story = {
  name: 'Desktop Layout',
  render: () => <FirewallLogsPage />,
  parameters: {
    viewport: { defaultViewport: 'responsive' },
    docs: {
      description: {
        story:
          'Desktop layout with sidebar filters on the left, main log viewer in the center, ' +
          'and stats panel. Supports keyboard navigation and dense data display.',
      },
    },
  },
};

export const MobileLayout: Story = {
  name: 'Mobile Layout',
  render: () => <FirewallLogsPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile layout renders log entries as cards with a bottom sheet for filters. ' +
          'Touch-friendly controls with 44px minimum tap targets.',
      },
    },
  },
};

export const WithAutoRefresh: Story = {
  name: 'Auto-Refresh Controls',
  render: () => <FirewallLogsPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the auto-refresh controls: play/pause toggle and interval selector. ' +
          'When active, new log entries stream in and are announced via ARIA live regions.',
      },
    },
  },
};
