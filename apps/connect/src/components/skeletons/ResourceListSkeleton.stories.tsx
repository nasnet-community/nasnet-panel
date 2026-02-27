import { ResourceListSkeleton } from './ResourceListSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ResourceListSkeleton> = {
  title: 'App/Skeletons/ResourceListSkeleton',
  component: ResourceListSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading skeleton for resource list and table views. Used for VPN servers, firewall rules, DHCP leases, and other tabular data. Provides a skeleton layout with header, search/filter bar, data table, and pagination controls.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceListSkeleton>;

export const Default: Story = {
  args: {
    rows: 10,
    columns: 4,
    showFilters: true,
    showActions: true,
    showPagination: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 900 }}>
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: {
    rows: 5,
    columns: 3,
    showFilters: false,
    showActions: false,
    showPagination: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 500 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithoutPagination: Story = {
  args: {
    rows: 8,
    columns: 4,
    showFilters: true,
    showActions: true,
    showPagination: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 800 }}>
        <Story />
      </div>
    ),
  ],
};

export const Full: Story = {
  args: {
    rows: 15,
    columns: 5,
    showFilters: true,
    showActions: true,
    showPagination: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1000 }}>
        <Story />
      </div>
    ),
  ],
};
