/**
 * AddressListManager Storybook Stories
 *
 * Comprehensive Storybook documentation for the AddressListManager pattern component.
 * Demonstrates all variants, states, and platform presenters (Mobile, Tablet, Desktop).
 *
 * Features:
 * - Empty state with helpful messaging
 * - Loaded with few lists
 * - Expanded list with entries visible
 * - Lists with dynamic entries (added by firewall actions)
 * - Large list with 10,000+ entries (virtualization demo)
 * - Loading skeleton states
 * - Error states with actionable messaging
 * - All three platform presenters (Mobile, Tablet, Desktop)
 * - Accessibility testing with axe-core
 * - Interactive play functions for user interactions
 *
 * @see NAS-7.3: Implement Address Lists
 * @see Docs/design/ux-design/6-component-library.md
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md section 17 (Storybook)
 */

import { fn, within, screen, userEvent } from 'storybook/test';

const action = (name: string): ReturnType<typeof fn> => fn().mockName(name);

import { AddressListManager } from './AddressListManager';

import type { AddressList, AddressListEntry, FirewallRule } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AddressListManager> = {
  title: 'Patterns/AddressListManager',
  component: AddressListManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AddressListManager displays firewall address lists with expandable entries. ' +
          'Implements Headless + Platform Presenters pattern with Mobile/Desktop variants. ' +
          'Features virtualization for large lists (10,000+ entries), sortable columns, and referencing rules modal.',
      },
    },
  },
  argTypes: {
    lists: {
      description: 'Array of address lists to display',
      control: 'object',
    },
    isLoading: {
      description: 'Loading state',
      control: 'boolean',
    },
    error: {
      description: 'Error state',
      control: 'object',
    },
    onDeleteList: {
      description: 'Callback when a list is deleted',
      action: 'deleteList',
    },
    onFetchReferencingRules: {
      description: 'Function to fetch rules referencing a list',
      action: 'fetchReferencingRules',
    },
    enableVirtualization: {
      description: 'Enable virtualization for large lists',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AddressListManager>;

// Mock data generators

function generateEntry(index: number, listName: string, dynamic = false): AddressListEntry {
  return {
    id: `entry-${listName}-${index}`,
    list: listName,
    address: `192.168.${Math.floor(index / 256)}.${index % 256}`,
    comment: index % 3 === 0 ? `Entry ${index} comment` : undefined,
    timeout: index % 5 === 0 ? '1d' : undefined,
    creationTime: new Date(Date.now() - index * 60000).toISOString(),
    dynamic,
    disabled: index % 10 === 0,
  };
}

function generateList(
  name: string,
  entryCount: number,
  dynamicCount: number,
  referencingRulesCount: number,
  withEntries = false
): AddressList {
  return {
    name,
    entryCount,
    dynamicCount,
    referencingRulesCount,
    entries: withEntries
      ? Array.from({ length: Math.min(entryCount, 50) }, (_, i) =>
          generateEntry(i, name, i < dynamicCount)
        )
      : undefined,
  };
}

const mockFirewallRules: FirewallRule[] = [
  {
    id: 'rule-1',
    chain: 'input',
    action: 'accept',
    comment: 'Allow trusted devices',
    disabled: false,
  },
  {
    id: 'rule-2',
    chain: 'forward',
    action: 'drop',
    comment: 'Block suspicious IPs',
    disabled: false,
  },
];

// Stories

/**
 * Story 1: Empty State - Default (Desktop)
 * Shows the component when no address lists exist.
 * Displays helpful empty state messaging with suggested action.
 */
export const Empty: Story = {
  args: {
    lists: [],
    isLoading: false,
    emptyMessage: 'No address lists found. Create your first list to get started.',
    onDeleteList: action('deleteList'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no address lists exist. Provides clear messaging and action button.',
      },
    },
  },
};

/**
 * Story 1b: Empty State - Mobile
 * Mobile viewport showing empty state on small screen.
 */
export const EmptyMobile: Story = {
  args: Empty.args,
  parameters: {
    viewport: {
      name: 'Mobile (375px)',
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Empty state optimized for mobile devices (<640px). Touch-friendly layout.',
      },
    },
  },
};

/**
 * Story 1c: Empty State - Tablet
 * Tablet viewport showing empty state on medium screen.
 */
export const EmptyTablet: Story = {
  args: Empty.args,
  parameters: {
    viewport: {
      name: 'Tablet (768px)',
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Empty state optimized for tablet devices (640-1024px). Balanced layout.',
      },
    },
  },
};

/**
 * Story 2: Loaded State - Desktop
 * Shows a few address lists with various configurations.
 * Demonstrates typical use case with multiple lists of different sizes.
 */
export const Loaded: Story = {
  args: {
    lists: [
      generateList('trusted_devices', 24, 0, 3, true),
      generateList('blocklist', 156, 12, 5, true),
      generateList('vpn_clients', 8, 0, 2, true),
      generateList('internal_network', 45, 0, 1, true),
      generateList('guest_network', 12, 2, 1, true),
    ],
    isLoading: false,
    onDeleteList: action('deleteList'),
    onFetchReferencingRules: async (listName: string) => {
      action('fetchReferencingRules')(listName);
      return mockFirewallRules;
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default loaded state with 5 address lists of varying sizes and dynamic entry counts. ' +
          'Desktop view shows dense table with sortable columns.',
      },
    },
  },
};

/**
 * Story 2b: Loaded State - Mobile
 * Mobile viewport showing loaded state with card list.
 */
export const LoadedMobile: Story = {
  args: Loaded.args,
  parameters: {
    viewport: {
      name: 'Mobile (375px)',
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Loaded state optimized for mobile. Shows card-based list with Sheet panels for detailed entries.',
      },
    },
  },
};

/**
 * Story 2c: Loaded State - Tablet
 * Tablet viewport showing loaded state with master-detail layout.
 */
export const LoadedTablet: Story = {
  args: Loaded.args,
  parameters: {
    viewport: {
      name: 'Tablet (768px)',
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Loaded state optimized for tablet. Shows master-detail layout with collapsible list panel.',
      },
    },
  },
};

/**
 * Story 3: Expanded List - Desktop
 * Shows a list expanded with its entries visible inline.
 * Demonstrates the expanded row detail view with entries.
 */
export const ExpandedList: Story = {
  args: {
    lists: [
      generateList('trusted_devices', 24, 0, 3, true),
      generateList('blocklist', 156, 12, 5, true),
      generateList('vpn_clients', 8, 0, 2, true),
    ],
    isLoading: false,
    onDeleteList: action('deleteList'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows expanded row view with entries displayed inline. ' +
          'Desktop: entries shown in expanded row. Mobile/Tablet: entries shown in Sheet.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Find and click first expandable row (if table is visible)
    const rows = canvas.queryAllByRole('button', { hidden: false });
    if (rows.length > 0) {
      // Try to find and click an expand button
      const expandButtons = rows.filter((btn) =>
        btn.textContent?.includes('trusted_devices')
      );
      if (expandButtons.length > 0) {
        await userEvent.click(expandButtons[0]);
      }
    }
  },
};

/**
 * Story 4: Lists with Dynamic Entries
 * Shows lists that include dynamic entries (added by firewall actions)
 */
export const WithDynamicEntries: Story = {
  args: {
    lists: [
      generateList('auto_blocklist', 45, 28, 2, true),
      generateList('ddos_sources', 120, 95, 4, true),
      generateList('failed_logins', 67, 67, 1, true),
    ],
    isLoading: false,
    onDeleteList: action('deleteList'),
  },
};

/**
 * Story 5: Large List (Virtualization Demo)
 * Shows a list with 10,000+ entries to demonstrate virtualization
 */
export const LargeList: Story = {
  args: {
    lists: [
      {
        name: 'threat_intelligence',
        entryCount: 12543,
        dynamicCount: 0,
        referencingRulesCount: 1,
        entries: Array.from({ length: 12543 }, (_, i) =>
          generateEntry(i, 'threat_intelligence', false)
        ),
      },
      generateList('trusted_devices', 24, 0, 3, true),
      generateList('vpn_clients', 8, 0, 2, true),
    ],
    isLoading: false,
    enableVirtualization: true,
    onDeleteList: action('deleteList'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates virtualization with a list containing 12,543 entries. ' +
          'Only visible rows are rendered for optimal performance.',
      },
    },
  },
};

/**
 * Story 6: Loading State - Desktop
 * Shows the loading skeleton while data is being fetched.
 */
export const Loading: Story = {
  args: {
    lists: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state shown while fetching address lists from the router. ' +
          'Skeleton provides visual feedback about upcoming content.',
      },
    },
  },
};

/**
 * Story 6b: Loading State - Mobile
 * Loading skeleton on mobile viewport.
 */
export const LoadingMobile: Story = {
  args: Loading.args,
  parameters: {
    viewport: {
      name: 'Mobile (375px)',
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Loading skeleton optimized for mobile screens.',
      },
    },
  },
};

/**
 * Story 7: Error State - Desktop
 * Shows error handling with professional error messaging.
 */
export const ErrorState: Story = {
  args: {
    lists: [],
    isLoading: false,
    error: new Error('Failed to load address lists from router'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state shown when address list fetch fails. ' +
          'Displays actionable error message with retry option.',
      },
    },
  },
};

/**
 * Story 7b: Error State - Mobile
 * Error state on mobile viewport.
 */
export const ErrorMobile: Story = {
  args: ErrorState.args,
  parameters: {
    viewport: {
      name: 'Mobile (375px)',
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Error state optimized for mobile screens with touch-friendly retry button.',
      },
    },
  },
};

/**
 * Story 8: With Referencing Rules
 * Shows lists with high rule reference counts
 */
export const WithReferencingRules: Story = {
  args: {
    lists: [
      generateList('trusted_network', 45, 0, 12, true),
      generateList('blocklist', 3456, 234, 8, true),
      generateList('vpn_allowed', 28, 0, 5, true),
      generateList('internal_servers', 15, 0, 15, true),
    ],
    isLoading: false,
    onDeleteList: action('deleteList'),
    onFetchReferencingRules: async (listName: string) => {
      action('fetchReferencingRules')(listName);
      // Simulate async delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockFirewallRules;
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows address lists with various referencing rule counts. ' +
          'Click "Show Rules" badge to fetch and display rules using this list.',
      },
    },
  },
};

/**
 * Story 9: Mixed Entry Types
 * Shows lists with IPs, CIDR notation, and IP ranges
 */
export const MixedEntryTypes: Story = {
  args: {
    lists: [
      {
        name: 'network_ranges',
        entryCount: 8,
        dynamicCount: 0,
        referencingRulesCount: 2,
        entries: [
          {
            id: 'entry-1',
            list: 'network_ranges',
            address: '192.168.1.100',
            comment: 'Single IP address',
            dynamic: false,
            disabled: false,
          },
          {
            id: 'entry-2',
            list: 'network_ranges',
            address: '10.0.0.0/24',
            comment: 'CIDR subnet notation',
            dynamic: false,
            disabled: false,
          },
          {
            id: 'entry-3',
            list: 'network_ranges',
            address: '172.16.0.1-172.16.0.50',
            comment: 'IP range notation',
            dynamic: false,
            disabled: false,
          },
          {
            id: 'entry-4',
            list: 'network_ranges',
            address: '203.0.113.0/28',
            comment: 'Small subnet',
            timeout: '12h',
            dynamic: false,
            disabled: false,
          },
          {
            id: 'entry-5',
            list: 'network_ranges',
            address: '198.51.100.42',
            comment: 'Dynamic entry with timeout',
            timeout: '1d',
            dynamic: true,
            disabled: false,
          },
          {
            id: 'entry-6',
            list: 'network_ranges',
            address: '192.0.2.0/24',
            comment: 'Disabled entry',
            dynamic: false,
            disabled: true,
          },
        ],
      },
    ],
    isLoading: false,
    onDeleteList: action('deleteList'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates different address formats supported by MikroTik: ' +
          'single IPs, CIDR notation, IP ranges, with various states (dynamic, timeout, disabled).',
      },
    },
  },
};

/**
 * Story 10: Virtualization Disabled
 * Shows large list WITHOUT virtualization (performance comparison)
 */
export const VirtualizationDisabled: Story = {
  args: {
    lists: [
      {
        name: 'large_list_no_virt',
        entryCount: 1000,
        dynamicCount: 0,
        referencingRulesCount: 1,
        entries: Array.from({ length: 1000 }, (_, i) =>
          generateEntry(i, 'large_list_no_virt', false)
        ),
      },
    ],
    isLoading: false,
    enableVirtualization: false,
    onDeleteList: action('deleteList'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows 1,000 entries WITHOUT virtualization. ' +
          'Compare rendering performance with the "Large List" story that has virtualization enabled.',
      },
    },
  },
};
