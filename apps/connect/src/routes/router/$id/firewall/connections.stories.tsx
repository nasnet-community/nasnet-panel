import { ConnectionsPage } from '@nasnet/features/firewall';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ConnectionsPage> = {
  title: 'App/Router/Firewall/Connections',
  component: ConnectionsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route component for firewall connection tracking (/router/:id/firewall/connections). ' +
          'Displays active firewall connections with auto-refresh every 5 seconds, ' +
          'filtering by IP/port/protocol/state, kill connection support, and ' +
          'connection tracking settings. Supports virtualized rendering for 10,000+ connections.',
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
type Story = StoryObj<typeof ConnectionsPage>;

export const Default: Story = {
  render: () => <ConnectionsPage />,
};

export const ConnectionsList: Story = {
  name: 'Connections List Tab',
  render: () => <ConnectionsPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Default connections list tab showing active firewall connections. ' +
          'Supports auto-refresh at 5-second intervals, filtering by IP, port, protocol, and state, ' +
          'and the ability to kill individual connections with confirmation.',
      },
    },
  },
};

export const SettingsTab: Story = {
  name: 'Settings Tab (annotated)',
  render: () => <ConnectionsPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Click the "Settings" tab to view connection tracking configuration. ' +
          'Allows updating tracking settings with Dangerous confirmation dialog. ' +
          'Settings include TCP/UDP/ICMP timeouts and generic timeout values.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <ConnectionsPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <ConnectionsPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
