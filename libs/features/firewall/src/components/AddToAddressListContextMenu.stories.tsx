/**
 * Storybook stories for AddToAddressListContextMenu
 *
 * Demonstrates the right-click / click-triggered dropdown context menu
 * for quickly adding an IP address to an existing or new firewall address list.
 *
 * Click the trigger element (the styled IP span) to open the dropdown.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AddToAddressListContextMenu } from './AddToAddressListContextMenu';

// ============================================================================
// Mock Callbacks
// ============================================================================

/** Simulates a successful add with a short delay */
const mockAddSuccess = async (listName: string, ipAddress: string): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  console.info(`Added ${ipAddress} to "${listName}"`);
};

/** Simulates a network error during add */
const mockAddFailure = async (listName: string, ipAddress: string): Promise<void> => {
  await new Promise<void>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Failed to reach router while adding ${ipAddress} to "${listName}"`)),
      500
    )
  );
};

const commonLists = ['blocklist', 'allowlist', 'vpn-peers', 'local-network', 'temp-block'];

const manyLists = [
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
  'admin-hosts',
  'monitoring',
];

// ============================================================================
// Shared Trigger Element
// ============================================================================

/** Reusable trigger element — styled IP address span */
const IpTrigger = ({ ip }: { ip: string }) => (
  <span
    className="font-mono text-sm cursor-pointer select-none px-2 py-1 rounded border border-dashed border-muted-foreground/40 hover:border-primary hover:bg-primary/5 transition-colors"
    aria-label={`Open address list menu for ${ip}`}
  >
    {ip}
  </span>
);

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof AddToAddressListContextMenu> = {
  title: 'Features/Firewall/AddToAddressListContextMenu',
  component: AddToAddressListContextMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Layer 3 domain component providing a DropdownMenu context menu for adding an IP address ' +
          'to a firewall address list. ' +
          'Click (or right-click) the trigger child to open the menu. ' +
          'When existing lists are provided, a nested sub-menu lets the user pick one directly. ' +
          'A "Create new list with this IP" option opens an inline Dialog for naming a new list. ' +
          'Toasts confirm success or report errors. ' +
          'Desktop-only: mobile handling is delegated to IPAddressDisplay + Sheet.',
      },
    },
  },
  argTypes: {
    ipAddress: {
      control: 'text',
      description: 'The IP address that will be added to the chosen list',
    },
    existingLists: {
      control: false,
      description: 'Pre-existing address list names offered as quick-add targets',
    },
    onAddToList: {
      action: 'onAddToList',
      description: 'Async callback called with (listName, ipAddress) when an add is confirmed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddToAddressListContextMenu>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default — common IP with a set of existing lists and a successful callback.
 */
export const Default: Story = {
  args: {
    ipAddress: '203.0.113.42',
    existingLists: commonLists,
    onAddToList: mockAddSuccess,
    children: <IpTrigger ip="203.0.113.42" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click the IP span to open the dropdown. Hover "Add to existing list" to expand the ' +
          'sub-menu of 5 address lists. Selecting a list calls onAddToList and shows a success toast.',
      },
    },
  },
};

/**
 * No existing lists — only the "Create new list" option is shown.
 */
export const NoExistingLists: Story = {
  args: {
    ipAddress: '192.168.1.50',
    existingLists: [],
    onAddToList: mockAddSuccess,
    children: <IpTrigger ip="192.168.1.50" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no existing lists are provided the sub-trigger is replaced by a disabled ' +
          '"No existing lists" item. Only "Create new list with this IP" is actionable.',
      },
    },
  },
};

/**
 * Many lists — the sub-menu is scrollable at max-height 300px.
 */
export const ManyLists: Story = {
  args: {
    ipAddress: '10.0.0.99',
    existingLists: manyLists,
    onAddToList: mockAddSuccess,
    children: <IpTrigger ip="10.0.0.99" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'With 12 address lists the sub-menu becomes scrollable (max-height: 300px). ' +
          'Verify that all entries are reachable via scroll and keyboard navigation.',
      },
    },
  },
};

/**
 * IPv6-style address string — verifies the component is not IP-version specific.
 */
export const Ipv6Address: Story = {
  args: {
    ipAddress: '2001:db8::1',
    existingLists: commonLists,
    onAddToList: mockAddSuccess,
    children: <IpTrigger ip="2001:db8::1" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The component accepts any string as ipAddress. This story uses an IPv6 address to ' +
          'confirm it is displayed verbatim in the create-list dialog and toast messages.',
      },
    },
  },
};

/**
 * Failure callback — simulates a router error so the destructive toast is shown.
 */
export const AddFailure: Story = {
  args: {
    ipAddress: '198.51.100.1',
    existingLists: commonLists,
    onAddToList: mockAddFailure,
    children: <IpTrigger ip="198.51.100.1" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onAddToList rejects, a destructive toast is shown with the error message. ' +
          'Select any existing list to trigger the simulated failure.',
      },
    },
  },
};

/**
 * No callback provided — verifies the component handles missing onAddToList gracefully.
 */
export const NoCallback: Story = {
  args: {
    ipAddress: '172.16.0.1',
    existingLists: commonLists,
    children: <IpTrigger ip="172.16.0.1" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onAddToList is omitted the handler exits early without throwing. ' +
          'Selecting a list is a no-op — no toast is shown.',
      },
    },
  },
};
