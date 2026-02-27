/**
 * Storybook stories for ARPTable component
 * Covers: empty state, collapsible behavior, all ARP status variants, mixed entries, large dataset
 */

import { type ARPEntry } from '@nasnet/core/types';

import { ARPTable } from './ARPTable';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ARPTable> = {
  title: 'App/Network/ARPTable',
  component: ARPTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays the router ARP table (IP-to-MAC mappings) with sortable columns and collapsible section header. Supports complete, incomplete, and failed ARP entry statuses.',
      },
    },
  },
  argTypes: {
    defaultCollapsed: {
      control: 'boolean',
      description: 'Whether the table section starts collapsed',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the root element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ARPTable>;

// --- Shared mock data ---

const completeEntries: ARPEntry[] = [
  {
    id: 'arp-1',
    ipAddress: '192.168.1.1',
    macAddress: 'D4:CA:6D:AA:11:22',
    interface: 'bridge1',
    status: 'complete',
    isDynamic: true,
  },
  {
    id: 'arp-2',
    ipAddress: '192.168.1.10',
    macAddress: 'B8:27:EB:CC:44:55',
    interface: 'ether1',
    status: 'complete',
    isDynamic: false,
  },
  {
    id: 'arp-3',
    ipAddress: '192.168.1.20',
    macAddress: '00:1A:2B:3C:4D:5E',
    interface: 'ether2',
    status: 'complete',
    isDynamic: true,
  },
];

const mixedEntries: ARPEntry[] = [
  {
    id: 'arp-1',
    ipAddress: '192.168.1.1',
    macAddress: 'D4:CA:6D:AA:11:22',
    interface: 'bridge1',
    status: 'complete',
    isDynamic: true,
  },
  {
    id: 'arp-2',
    ipAddress: '10.0.0.5',
    macAddress: 'FF:FF:FF:00:00:00',
    interface: 'ether1',
    status: 'incomplete',
    isDynamic: true,
  },
  {
    id: 'arp-3',
    ipAddress: '172.16.0.100',
    macAddress: '00:00:00:00:00:00',
    interface: 'vlan10',
    status: 'failed',
    isDynamic: false,
  },
  {
    id: 'arp-4',
    ipAddress: '192.168.1.50',
    macAddress: 'A0:B1:C2:D3:E4:F5',
    interface: 'ether2',
    status: 'complete',
    isDynamic: true,
  },
  {
    id: 'arp-5',
    ipAddress: '192.168.1.99',
    macAddress: '11:22:33:44:55:66',
    interface: 'bridge1',
    status: 'incomplete',
    isDynamic: true,
  },
];

const largeDataset: ARPEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `arp-large-${i}`,
  ipAddress: `192.168.${Math.floor(i / 4)}.${10 + (i % 4) * 20}`,
  macAddress: `AA:BB:CC:DD:EE:${String(i).padStart(2, '0')}`,
  interface: ['ether1', 'ether2', 'bridge1', 'vlan10'][i % 4],
  status: (['complete', 'complete', 'complete', 'incomplete', 'failed'] as const)[i % 5],
  isDynamic: i % 3 !== 0,
}));

// --- Stories ---

export const Default: Story = {
  args: {
    entries: completeEntries,
    defaultCollapsed: false,
  },
};

export const EmptyState: Story = {
  args: {
    entries: [],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no ARP entries are present the component renders an empty-state placeholder with a Network icon.',
      },
    },
  },
};

export const AllStatusVariants: Story = {
  args: {
    entries: mixedEntries,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows all three ARP status badge variants: complete (green), incomplete (amber), and failed (red).',
      },
    },
  },
};

export const DefaultCollapsed: Story = {
  args: {
    entries: completeEntries,
    defaultCollapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The table starts collapsed. The section header shows the count but the table body is hidden until toggled.',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    entries: largeDataset,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the table with 12 entries across multiple interfaces. Columns are sortable by IP, MAC, Interface, and Status.',
      },
    },
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [
      {
        id: 'arp-single',
        ipAddress: '10.10.0.1',
        macAddress: 'FE:DC:BA:98:76:54',
        interface: 'ether1',
        status: 'complete',
        isDynamic: false,
      },
    ],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with a single ARP entry.',
      },
    },
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
