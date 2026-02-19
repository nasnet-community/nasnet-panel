/**
 * DNS Server List Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { fn } from '@storybook/test';

import { DnsServerList, type DnsServer } from './DnsServerList';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Features/Network/DNS/DnsServerList',
  component: DnsServerList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'DNS server list with drag-and-drop reordering. Dynamic servers (from DHCP/PPPoE) are read-only and cannot be reordered or removed.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    servers: {
      description: 'Array of DNS servers (static and dynamic)',
      control: 'object',
    },
    loading: {
      description: 'Loading state disables all interactions',
      control: 'boolean',
    },
    onReorder: {
      description: 'Callback when servers are reordered via drag-and-drop',
      action: 'reordered',
    },
    onRemove: {
      description: 'Callback when a static server is removed',
      action: 'removed',
    },
    onAdd: {
      description: 'Callback when add button is clicked',
      action: 'add clicked',
    },
  },
  args: {
    onReorder: fn(),
    onRemove: fn(),
    onAdd: fn(),
  },
} satisfies Meta<typeof DnsServerList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== Default Stories =====

/**
 * Default state with mix of static and dynamic servers
 */
export const Default: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '192.168.1.1', isDynamic: true },
    ],
  },
};

/**
 * Empty state with no servers configured
 */
export const Empty: Story = {
  args: {
    servers: [],
  },
};

/**
 * Only static servers (all can be reordered/removed)
 */
export const OnlyStaticServers: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '9.9.9.9', isDynamic: false },
      { id: '4', address: '208.67.222.222', isDynamic: false },
    ],
  },
};

/**
 * Only dynamic servers (from DHCP/PPPoE, read-only)
 */
export const OnlyDynamicServers: Story = {
  args: {
    servers: [
      { id: '1', address: '192.168.1.1', isDynamic: true },
      { id: '2', address: '192.168.1.2', isDynamic: true },
    ],
  },
};

/**
 * Single server
 */
export const SingleServer: Story = {
  args: {
    servers: [{ id: '1', address: '1.1.1.1', isDynamic: false }],
  },
};

/**
 * Loading state (all interactions disabled)
 */
export const Loading: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '192.168.1.1', isDynamic: true },
    ],
    loading: true,
  },
};

/**
 * Many servers (tests scrolling behavior)
 */
export const ManyServers: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '9.9.9.9', isDynamic: false },
      { id: '4', address: '208.67.222.222', isDynamic: false },
      { id: '5', address: '208.67.220.220', isDynamic: false },
      { id: '6', address: '64.6.64.6', isDynamic: false },
      { id: '7', address: '192.168.1.1', isDynamic: true },
      { id: '8', address: '192.168.1.2', isDynamic: true },
    ],
  },
};

// ===== Interactive Stories =====

/**
 * Demonstrates reordering interaction
 * (In Storybook, use drag handles to reorder static servers)
 */
export const InteractiveReordering: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '9.9.9.9', isDynamic: false },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the drag handles (⋮⋮) to reorder static servers. Dynamic servers cannot be reordered.',
      },
    },
  },
};

/**
 * Demonstrates remove interaction
 */
export const InteractiveRemove: Story = {
  args: {
    servers: [
      { id: '1', address: '1.1.1.1', isDynamic: false },
      { id: '2', address: '8.8.8.8', isDynamic: false },
      { id: '3', address: '192.168.1.1', isDynamic: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the X button to remove static servers. Dynamic servers cannot be removed.',
      },
    },
  },
};

// ===== Edge Cases =====

/**
 * Dynamic server at the top (common scenario)
 */
export const DynamicServerFirst: Story = {
  args: {
    servers: [
      { id: '1', address: '192.168.1.1', isDynamic: true },
      { id: '2', address: '1.1.1.1', isDynamic: false },
      { id: '3', address: '8.8.8.8', isDynamic: false },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Dynamic servers take priority in DNS resolution order. This story shows a dynamic server at the top.',
      },
    },
  },
};

/**
 * Long IP addresses (IPv4 max length)
 */
export const LongAddresses: Story = {
  args: {
    servers: [
      { id: '1', address: '255.255.255.255', isDynamic: false },
      { id: '2', address: '123.123.123.123', isDynamic: false },
      { id: '3', address: '198.198.198.198', isDynamic: true },
    ],
  },
};
