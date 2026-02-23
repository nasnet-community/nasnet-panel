import { DHCPServerDetail } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPServerDetail> = {
  title: 'App/Network/DHCP/ServerDetail',
  component: DHCPServerDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Server Detail page with tabbed interface showing Overview, Leases, Static Bindings, and Settings. Supports lease-to-static conversion, server configuration editing, and static binding management.',
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
type Story = StoryObj<typeof DHCPServerDetail>;

export const Default: Story = {
  render: () => <DHCPServerDetail />,
};

export const NoRouterConnected: Story = {
  render: () => <DHCPServerDetail />,
  parameters: {
    docs: {
      description: {
        story:
          'Server detail page when no router is connected. Data fetching will fail gracefully.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => <DHCPServerDetail />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering of the server detail page with adapted tab layout.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <DHCPServerDetail />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Desktop viewport rendering of the server detail page with full tab interface and dense layout.',
      },
    },
  },
};
