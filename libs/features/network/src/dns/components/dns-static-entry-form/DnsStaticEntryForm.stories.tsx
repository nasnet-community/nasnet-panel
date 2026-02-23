/**
 * DNS Static Entry Form Storybook Stories
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 *
 * Form for creating and editing static DNS hostname-to-IP mappings.
 * Includes RFC 1123 hostname validation, IPv4 input, TTL config,
 * optional comment, and duplicate hostname detection.
 */

import { fn } from 'storybook/test';

import { DnsStaticEntryForm } from './DnsStaticEntryForm';

import type { Meta, StoryObj } from '@storybook/react';

// ─── Shared existing entries for duplicate detection ───────────────────────

const existingEntries = [
  { id: '*1', name: 'nas.local' },
  { id: '*2', name: 'printer.local' },
  { id: '*3', name: 'router.lan' },
];

const meta = {
  title: 'Features/Network/DNS/DnsStaticEntryForm',
  component: DnsStaticEntryForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form for creating or editing a static DNS entry (hostname → IP mapping). Validates RFC 1123 hostnames, accepts IPv4 addresses via the IPInput component, configures TTL in seconds (0–604800), and supports an optional comment. Detects duplicate hostnames against the existing entries list.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      description: 'Create a new entry or edit an existing one',
      control: { type: 'select' },
      options: ['create', 'edit'],
    },
    initialValues: {
      description: 'Pre-fill form fields when editing an existing entry',
      control: 'object',
    },
    existingEntries: {
      description: 'List used for duplicate hostname detection',
      control: 'object',
    },
    currentEntryId: {
      description:
        'ID of the entry being edited — excluded from duplicate check',
      control: 'text',
    },
    isLoading: {
      description: 'Disables all fields and buttons during async save',
      control: 'boolean',
    },
    onSubmit: {
      description: 'Called with validated form values on submission',
      action: 'submitted',
    },
    onCancel: {
      description: 'Called when the Cancel button is clicked',
      action: 'cancelled',
    },
  },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    existingEntries,
  },
} satisfies Meta<typeof DnsStaticEntryForm>;

export default meta;
type Story = StoryObj<typeof DnsStaticEntryForm>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * Create mode — blank form ready for a new entry.
 */
export const CreateMode: Story = {
  args: {
    mode: 'create',
    initialValues: {},
  },
};

/**
 * Edit mode — form pre-filled with an existing entry's values.
 */
export const EditMode: Story = {
  args: {
    mode: 'edit',
    currentEntryId: '*2',
    initialValues: {
      name: 'printer.local',
      address: '192.168.88.51',
      ttl: 3600,
      comment: 'Office laser printer (HP)',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode with all fields pre-filled from the selected entry. The current entry ID is excluded from the duplicate hostname check.',
      },
    },
  },
};

/**
 * Pre-filled hostname and IP — useful for testing auto-suggest flows.
 */
export const PreFilledHostnameAndIP: Story = {
  args: {
    mode: 'create',
    initialValues: {
      name: 'media.local',
      address: '192.168.88.75',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hostname and IP fields pre-filled; TTL defaults to 86400 (1 day). User only needs to add an optional comment and submit.',
      },
    },
  },
};

/**
 * Loading state — all fields and buttons are disabled during save.
 */
export const Loading: Story = {
  args: {
    mode: 'create',
    initialValues: {
      name: 'cam-front.local',
      address: '192.168.88.100',
      ttl: 3600,
      comment: 'Front door camera',
    },
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While the save mutation is in flight all form fields and buttons are disabled, and the submit button shows "Saving...".',
      },
    },
  },
};

/**
 * Short TTL (1 hour) — suitable for frequently-changing devices.
 */
export const ShortTTL: Story = {
  args: {
    mode: 'create',
    initialValues: {
      name: 'laptop.local',
      address: '192.168.88.200',
      ttl: 3600,
      comment: 'Developer laptop (DHCP lease)',
    },
  },
  parameters: {
    docs: {
      description: {
        story: '1-hour TTL (3600 s) for a device whose IP may change frequently.',
      },
    },
  },
};

/**
 * Maximum TTL (7 days) — suitable for infrastructure devices.
 */
export const MaxTTL: Story = {
  args: {
    mode: 'edit',
    currentEntryId: '*3',
    initialValues: {
      name: 'router.lan',
      address: '192.168.88.1',
      ttl: 604800,
      comment: 'Core router — static IP, never changes',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Maximum 7-day TTL (604800 s) for a static infrastructure device whose IP never changes.',
      },
    },
  },
};
