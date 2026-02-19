/**
 * Storybook stories for AddressListImportDialog
 *
 * Demonstrates the multi-step import dialog: select, preview, importing, and complete.
 * Covers scenarios with no existing lists, existing lists for autocomplete, and
 * a simulated async import callback.
 */

import { AddressListImportDialog } from './AddressListImportDialog';

import type { ParsedAddress } from '../utils/addressListParsers';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Simulates a successful import with a short artificial delay.
 */
const mockImportSuccess = async (listName: string, entries: ParsedAddress[]): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 1500));
  console.info(`Imported ${entries.length} entries into "${listName}"`);
};

/**
 * Simulates a failed import (e.g., network error).
 */
const mockImportFailure = async (_listName: string, _entries: ParsedAddress[]): Promise<void> => {
  await new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Connection to router timed out')), 1000)
  );
};

const existingLists = ['blocklist', 'allowlist', 'vpn-peers', 'local-network', 'temp-block'];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AddressListImportDialog> = {
  title: 'Features/Firewall/AddressListImportDialog',
  component: AddressListImportDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-step dialog for bulk-importing firewall address list entries. ' +
          'Supports CSV, JSON, and plain-text formats via file upload, drag-and-drop, or paste. ' +
          'Includes format auto-detection, per-entry validation, and a progress indicator during import.',
      },
    },
  },
  argTypes: {
    routerId: { control: 'text', description: 'Router ID used for the import operation' },
    existingLists: {
      control: false,
      description: 'Existing list names surfaced in the target-list autocomplete',
    },
    onImport: { action: 'onImport', description: 'Callback invoked when import is confirmed' },
  },
};

export default meta;
type Story = StoryObj<typeof AddressListImportDialog>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    routerId: 'router-1',
    existingLists,
    onImport: mockImportSuccess,
  },
};

export const NoExistingLists: Story = {
  args: {
    routerId: 'router-1',
    existingLists: [],
    onImport: mockImportSuccess,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no existing lists are provided, the target-list field renders as a plain text input rather than a dropdown.',
      },
    },
  },
};

export const WithSuccessfulImport: Story = {
  args: {
    routerId: 'router-1',
    existingLists,
    onImport: mockImportSuccess,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the full happy path: select → parse/validate → preview → import (1.5 s delay) → complete.',
      },
    },
  },
};

export const WithFailingImport: Story = {
  args: {
    routerId: 'router-1',
    existingLists,
    onImport: mockImportFailure,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a router connection timeout during import. After the parse step the import attempt will fail and an error alert is shown on the preview step.',
      },
    },
  },
};

export const ManyExistingLists: Story = {
  args: {
    routerId: 'router-2',
    existingLists: [
      'blocklist',
      'allowlist',
      'vpn-peers',
      'local-network',
      'temp-block',
      'tor-exit-nodes',
      'cloudflare-ips',
      'office-subnets',
      'guest-wifi',
      'iot-devices',
    ],
    onImport: mockImportSuccess,
  },
  parameters: {
    docs: {
      description: {
        story: 'Target-list autocomplete with a large set of pre-existing lists.',
      },
    },
  },
};

export const NoImportCallback: Story = {
  args: {
    routerId: 'router-1',
    existingLists,
    // onImport intentionally omitted — the Import button should be disabled
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: when `onImport` is not provided the Import button remains disabled on the preview step.',
      },
    },
  },
};
