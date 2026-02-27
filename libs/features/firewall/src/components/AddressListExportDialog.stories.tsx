/**
 * Storybook stories for AddressListExportDialog
 *
 * Demonstrates export dialog with CSV, JSON, and RouterOS script formats
 * for varying sizes and types of address list entries.
 */

import { AddressListExportDialog } from './AddressListExportDialog';

import type { AddressListEntry } from '../utils/addressListFormatters';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Data
// ============================================================================

const singleEntry: AddressListEntry[] = [
  { address: '203.0.113.42', comment: 'Blocked attacker', timeout: '7d' },
];

const smallList: AddressListEntry[] = [
  { address: '192.168.1.100', comment: 'NAS server', disabled: false },
  { address: '192.168.1.101', comment: 'Print server' },
  { address: '192.168.1.200', comment: 'Management PC', timeout: '30d' },
  { address: '10.0.0.50', comment: 'VPN endpoint' },
  { address: '10.0.0.51' },
];

const blockList: AddressListEntry[] = [
  { address: '198.51.100.1', comment: 'Known bad actor', timeout: '7d' },
  { address: '198.51.100.2', comment: 'Port scanner', timeout: '1d' },
  { address: '198.51.100.0/28', comment: 'Blocked subnet' },
  { address: '203.0.113.0/24', comment: 'Abuse block' },
  { address: '203.0.113.50', comment: 'Brute force', timeout: '12h' },
  { address: '203.0.113.51', comment: 'Brute force', timeout: '12h' },
  { address: '203.0.113.52', comment: 'Brute force', timeout: '12h' },
  { address: '198.51.100.100-198.51.100.110', comment: 'IP range block' },
];

const largeList: AddressListEntry[] = Array.from({ length: 150 }, (_, i) => ({
  address: `10.${Math.floor(i / 255)}.${Math.floor((i % 255) / 16)}.${(i % 16) + 1}`,
  comment: `Auto-blocked #${i + 1}`,
  timeout: i % 3 === 0 ? '1d' : undefined,
}));

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AddressListExportDialog> = {
  title: 'Features/Firewall/AddressListExportDialog',
  component: AddressListExportDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog for exporting firewall address list entries in CSV, JSON, or RouterOS script (.rsc) formats. ' +
          'Provides a live preview of the formatted output and options to download or copy to clipboard.',
      },
    },
  },
  argTypes: {
    listName: { control: 'text', description: 'Name of the address list being exported' },
    triggerText: { control: 'text', description: 'Label text for the trigger button' },
    entries: { control: false, description: 'Array of address list entries to export' },
  },
};

export default meta;
type Story = StoryObj<typeof AddressListExportDialog>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    listName: 'blocklist',
    entries: smallList,
    triggerText: 'Export',
  },
};

export const SingleEntry: Story = {
  args: {
    listName: 'single-block',
    entries: singleEntry,
    triggerText: 'Export Entry',
  },
  parameters: {
    docs: {
      description: {
        story: 'Export dialog with a single address entry. Demonstrates minimal-data preview.',
      },
    },
  },
};

export const BlocklistExport: Story = {
  args: {
    listName: 'blocklist',
    entries: blockList,
    triggerText: 'Export Blocklist',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A realistic blocklist with mixed IP types: single IPs, subnets, and ranges with timeouts.',
      },
    },
  },
};

export const LargeExport: Story = {
  args: {
    listName: 'auto-blocked',
    entries: largeList,
    triggerText: 'Export 150 Entries',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Large export with 150 entries — the preview is truncated and shows a "truncated" notice.',
      },
    },
  },
};

export const CustomTriggerText: Story = {
  args: {
    listName: 'allowlist',
    entries: smallList,
    triggerText: 'Download Allowlist',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows customised trigger button text via the `triggerText` prop.',
      },
    },
  },
};

export const EmptyList: Story = {
  args: {
    listName: 'empty-list',
    entries: [],
    triggerText: 'Export (Empty)',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: exporting an empty address list. Preview and size info should handle zero entries gracefully.',
      },
    },
  },
};
