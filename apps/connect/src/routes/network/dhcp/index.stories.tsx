import { DHCPServerList } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPServerList> = {
  title: 'App/Network/DHCP/ServerList',
  component: DHCPServerList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Server List page displaying all configured DHCP servers with responsive mobile/desktop views. Supports enable, disable, delete actions and navigation to server details.',
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
type Story = StoryObj<typeof DHCPServerList>;

export const Default: Story = {
  render: () => <DHCPServerList />,
};

export const NoRouterConnected: Story = {
  render: () => <DHCPServerList />,
  parameters: {
    docs: {
      description: {
        story:
          'Server list when no router is connected. Shows empty or error state.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => <DHCPServerList />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering with card-based layout instead of data tables.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <DHCPServerList />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Desktop viewport rendering with full data table layout and all action controls.',
      },
    },
  },
};
