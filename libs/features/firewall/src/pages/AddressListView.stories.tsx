/**
 * AddressListView Storybook Stories
 *
 * Interactive stories for the Address List View page domain component.
 * Demonstrates page states, CRUD operations, import/export dialogs, and empty states.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AddressListView } from './AddressListView';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

/**
 * AddressListView - Firewall address list management page
 *
 * The AddressListView page provides the main interface for managing MikroTik firewall
 * address lists with full CRUD support, bulk CSV import, and export functionality.
 *
 * ## Features
 *
 * - **View Lists**: Browse all address lists with entry counts grouped by name
 * - **Add Entries**: Create individual address list entries via a Sheet form
 * - **Bulk Import**: Import entries in CSV format via Import Dialog
 * - **Export**: Export address list entries for backup or reuse
 * - **Delete**: Remove individual entries with safety confirmation
 * - **Empty State**: Helpful guidance when no address lists exist
 * - **Loading Skeletons**: Smooth loading experience during data fetch
 * - **Error State**: Clear error display with destructive alert
 * - **Accessibility**: WCAG AAA compliant with ARIA labels and keyboard navigation
 *
 * ## Use Cases
 *
 * - Block known malicious IP ranges
 * - Whitelist trusted IPs for admin access
 * - Group IPs for firewall rule targeting
 * - Geographic blocking via CIDR ranges
 *
 * ## Usage
 *
 * ```tsx
 * import { AddressListView } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <AddressListView />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/Pages/AddressListView',
  component: AddressListView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main page for managing MikroTik firewall address lists with CRUD operations, bulk import, and export. Orchestrates the AddressListManager pattern with data fetching and dialogs.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof AddressListView>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Empty State
 *
 * No address lists configured yet. Shows an empty state card with dashed border
 * and two CTAs: Create Entry and Import. Guides users to get started.
 */
export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no address lists exist. Two action buttons guide users to create their first entry or import from CSV.',
      },
    },
    mockData: {
      lists: [],
      isLoading: false,
      error: null,
    },
  },
};

/**
 * With Address Lists
 *
 * Populated view showing multiple address lists with entries.
 * Demonstrates the AddressListManager with blocklists, whitelists, and geo-block groups.
 */
export const WithAddressLists: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Populated address list view with multiple groups: blocked_ips, admin_whitelist, and geo_block. Shows entry counts and management actions per list.',
      },
    },
    mockData: {
      lists: [
        {
          name: 'blocked_ips',
          entries: [
            {
              id: '*1',
              list: 'blocked_ips',
              address: '203.0.113.0/24',
              comment: 'Known malware C2 range',
              disabled: false,
              creationTime: '2024-01-15T10:00:00Z',
            },
            {
              id: '*2',
              list: 'blocked_ips',
              address: '198.51.100.42',
              comment: 'Brute force attacker',
              disabled: false,
              creationTime: '2024-01-20T14:30:00Z',
            },
            {
              id: '*3',
              list: 'blocked_ips',
              address: '192.0.2.100',
              comment: 'Port scanner',
              disabled: true,
              creationTime: '2024-01-22T09:15:00Z',
            },
          ],
        },
        {
          name: 'admin_whitelist',
          entries: [
            {
              id: '*4',
              list: 'admin_whitelist',
              address: '192.168.1.100',
              comment: 'Admin workstation',
              disabled: false,
              creationTime: '2024-01-01T08:00:00Z',
            },
            {
              id: '*5',
              list: 'admin_whitelist',
              address: '10.0.0.50',
              comment: 'IT manager laptop',
              disabled: false,
              creationTime: '2024-01-01T08:05:00Z',
            },
          ],
        },
        {
          name: 'geo_block',
          entries: [
            {
              id: '*6',
              list: 'geo_block',
              address: '1.0.0.0/8',
              comment: 'APNIC - blocked region',
              disabled: false,
              creationTime: '2024-01-10T12:00:00Z',
            },
          ],
        },
      ],
      isLoading: false,
      error: null,
    },
  },
};

/**
 * Loading State
 *
 * Shows animated loading skeleton while address lists are being fetched from the router.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton displayed while fetching address lists from MikroTik router. Three skeleton rows with pulse animation.',
      },
    },
    mockData: {
      lists: [],
      isLoading: true,
      error: null,
    },
  },
};

/**
 * Error State
 *
 * Shows a destructive alert banner when the address list data cannot be fetched.
 * Includes error message from the API response.
 */
export const ErrorState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Error state with destructive alert. Displayed when the router API returns an error or is unreachable. Shows the error message from the failed request.',
      },
    },
    mockData: {
      lists: [],
      isLoading: false,
      error: new Error('Connection to router timed out. Please verify the router is online.'),
    },
  },
};

/**
 * Mobile View
 *
 * Mobile-optimized layout with bottom Sheet for add entry and card-based list display.
 * Demonstrates the responsive platform presenter switching at <640px.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-responsive view (<640px). Sheet opens from the bottom (h-[90vh]) instead of the right. Touch-optimized 44px action buttons.',
      },
    },
    mockData: {
      lists: [
        {
          name: 'blocked_ips',
          entries: [
            {
              id: '*1',
              list: 'blocked_ips',
              address: '203.0.113.0/24',
              comment: 'Known malware C2 range',
              disabled: false,
              creationTime: '2024-01-15T10:00:00Z',
            },
            {
              id: '*2',
              list: 'blocked_ips',
              address: '198.51.100.42',
              comment: 'Brute force attacker',
              disabled: false,
              creationTime: '2024-01-20T14:30:00Z',
            },
          ],
        },
      ],
      isLoading: false,
      error: null,
    },
  },
};
