import { DHCPLeaseManagementPage } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPLeaseManagementPage> = {
  title: 'App/Network/DHCP/Leases',
  component: DHCPLeaseManagementPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Lease Management page with platform-auto-detection. Desktop shows table-based layout with bulk selection; mobile shows card-based layout with swipe actions. Supports filtering, search, bulk operations, and CSV export.',
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
type Story = StoryObj<typeof DHCPLeaseManagementPage>;

export const Default: Story = {
  args: {
    routerId: '192.168.1.1',
  },
};

export const EmptyRouterId: Story = {
  args: {
    routerId: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Lease management with an empty router ID, simulating no router connected.',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    routerId: '192.168.1.1',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering with card-based layout and swipe actions for lease management.',
      },
    },
  },
};

export const DesktopView: Story = {
  args: {
    routerId: '192.168.1.1',
  },
  parameters: {
    viewport: { defaultViewport: 'responsive' },
    docs: {
      description: {
        story: 'Desktop viewport rendering with table-based layout and bulk selection checkboxes.',
      },
    },
  },
};
