/**
 * DNS Static Entries List Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * Platform-adaptive list of static DNS hostname→IP mappings.
 * Desktop: sortable DataTable. Mobile: card-based layout.
 * Stories cover the full range of data states and interaction modes.
 */

import { fn } from 'storybook/test';

import type { DNSStaticEntry } from '@nasnet/core/types';

import { DnsStaticEntriesList } from './DnsStaticEntriesList';

import type { Meta, StoryObj } from '@storybook/react';

// ─── Shared mock data ─────────────────────────────────────────────────────

const mockEntries: DNSStaticEntry[] = [
  {
    '.id': '*1',
    name: 'nas.local',
    address: '192.168.88.50',
    ttl: '86400',
    type: 'A',
    comment: 'Network-attached storage',
    disabled: false,
  },
  {
    '.id': '*2',
    name: 'printer.local',
    address: '192.168.88.51',
    ttl: '3600',
    type: 'A',
    comment: 'Office printer',
    disabled: false,
  },
  {
    '.id': '*3',
    name: 'router.lan',
    address: '192.168.88.1',
    ttl: '604800',
    type: 'A',
    comment: 'Gateway router',
    disabled: false,
  },
  {
    '.id': '*4',
    name: 'pi.hole',
    address: '192.168.88.53',
    ttl: '86400',
    type: 'A',
    comment: 'Pi-hole DNS filter',
    disabled: false,
  },
  {
    '.id': '*5',
    name: 'camera-front.local',
    address: '192.168.88.100',
    ttl: '86400',
    type: 'A',
    comment: '',
    disabled: false,
  },
];

const meta = {
  title: 'Features/Network/DNS/DnsStaticEntriesList',
  component: DnsStaticEntriesList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive component for displaying static DNS entries. On desktop and tablet it renders a sortable DataTable; on mobile it renders a card-based layout. Supports Edit, Delete (with confirmation dialog), and Add actions. Entries are sorted alphabetically by hostname.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    entries: {
      description: 'Array of static DNS entries to display',
      control: 'object',
    },
    loading: {
      description: 'Disables all edit/delete/add interactions while true',
      control: 'boolean',
    },
    onEdit: {
      description: 'Called with the entry object when Edit is clicked',
      action: 'edit',
    },
    onDelete: {
      description: 'Called with the entry .id when Delete is confirmed',
      action: 'delete',
    },
    onAdd: {
      description: 'Called when the Add Static Entry button is clicked',
      action: 'add',
    },
  },
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onAdd: fn(),
  },
} satisfies Meta<typeof DnsStaticEntriesList>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * Default state with a realistic set of static DNS entries.
 */
export const Default: Story = {
  args: {
    entries: mockEntries,
  },
};

/**
 * Empty state — no static entries configured yet.
 * Shows the EmptyState component with an Add action.
 */
export const Empty: Story = {
  args: {
    entries: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no static entries exist, an EmptyState component guides the user to add their first entry.',
      },
    },
  },
};

/**
 * Single entry — minimal list.
 */
export const SingleEntry: Story = {
  args: {
    entries: [
      {
        '.id': '*1',
        name: 'nas.local',
        address: '192.168.88.50',
        ttl: '86400',
        type: 'A',
        comment: 'Network-attached storage',
        disabled: false,
      },
    ],
  },
};

/**
 * Loading state — all actions are disabled during an async operation.
 */
export const Loading: Story = {
  args: {
    entries: mockEntries,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While an operation (add/edit/delete) is in progress all Edit, Delete, and Add buttons are disabled.',
      },
    },
  },
};

/**
 * Entries with mixed TTL values — verifies human-readable TTL formatting.
 */
export const MixedTTLValues: Story = {
  args: {
    entries: [
      {
        '.id': '*1',
        name: 'hourly.local',
        address: '10.0.0.10',
        ttl: '3600',
        comment: '1 hour TTL',
        disabled: false,
      },
      {
        '.id': '*2',
        name: 'daily.local',
        address: '10.0.0.11',
        ttl: '86400',
        comment: '1 day TTL',
        disabled: false,
      },
      {
        '.id': '*3',
        name: 'weekly.local',
        address: '10.0.0.12',
        ttl: '604800',
        comment: '7 day TTL',
        disabled: false,
      },
      {
        '.id': '*4',
        name: 'no-cache.local',
        address: '10.0.0.13',
        ttl: '0',
        comment: 'No caching (TTL 0)',
        disabled: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the TTL column formats seconds into human-readable strings (1 hour, 1 day, 7 days, etc.).',
      },
    },
  },
};

/**
 * Entries without comments — verifies graceful handling of empty comment field.
 */
export const NoComments: Story = {
  args: {
    entries: [
      {
        '.id': '*1',
        name: 'alpha.lan',
        address: '172.16.0.10',
        ttl: '86400',
        disabled: false,
      },
      {
        '.id': '*2',
        name: 'beta.lan',
        address: '172.16.0.11',
        ttl: '86400',
        disabled: false,
      },
      {
        '.id': '*3',
        name: 'gamma.lan',
        address: '172.16.0.12',
        ttl: '86400',
        disabled: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Entries without comments show an em-dash (—) in the Comment column.',
      },
    },
  },
};

/**
 * Large list — tests alphabetical sorting and table scroll behavior.
 */
export const LargeList: Story = {
  args: {
    entries: [
      { '.id': '*1', name: 'alpha.local', address: '10.10.0.1', ttl: '86400', disabled: false },
      { '.id': '*2', name: 'beta.local', address: '10.10.0.2', ttl: '86400', disabled: false },
      {
        '.id': '*3',
        name: 'cam-01.local',
        address: '10.10.0.3',
        ttl: '3600',
        comment: 'Front door camera',
        disabled: false,
      },
      {
        '.id': '*4',
        name: 'cam-02.local',
        address: '10.10.0.4',
        ttl: '3600',
        comment: 'Garage camera',
        disabled: false,
      },
      { '.id': '*5', name: 'delta.lan', address: '10.10.0.5', ttl: '86400', disabled: false },
      {
        '.id': '*6',
        name: 'files.local',
        address: '10.10.0.6',
        ttl: '604800',
        comment: 'File server',
        disabled: false,
      },
      {
        '.id': '*7',
        name: 'gateway.lan',
        address: '10.10.0.254',
        ttl: '604800',
        comment: 'Main router',
        disabled: false,
      },
      {
        '.id': '*8',
        name: 'media.local',
        address: '10.10.0.8',
        ttl: '86400',
        comment: 'Plex server',
        disabled: false,
      },
      {
        '.id': '*9',
        name: 'nas.local',
        address: '10.10.0.9',
        ttl: '86400',
        comment: 'Synology NAS',
        disabled: false,
      },
      {
        '.id': '*10',
        name: 'printer.local',
        address: '10.10.0.10',
        ttl: '3600',
        comment: 'HP LaserJet',
        disabled: false,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Ten entries verifying alphabetical sort order and that the Add button remains accessible below the table.',
      },
    },
  },
};
