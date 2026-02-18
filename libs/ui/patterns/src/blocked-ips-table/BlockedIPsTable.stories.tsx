/**
 * BlockedIPsTable Storybook Stories
 *
 * Visual documentation and testing for blocked IPs table pattern component.
 *
 * Stories:
 * - Default (mixed dynamic and permanent)
 * - Empty state
 * - Loading state
 * - With selection (bulk operations)
 * - IPv6 addresses
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/blocked-ips-table
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { fn } from '@storybook/test';

import { BlockedIPsTable } from './BlockedIPsTable';
import {
  mockBlockedIPs,
  mockBlockedIP1,
  mockBlockedIP2,
  mockBlockedIP3,
  mockBlockedIP5,
  mockTopBlockedIPs,
  generateMockBlockedIPs,
} from '../__test-utils__/rate-limit-fixtures';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * BlockedIPsTable - Display and manage blocked IP addresses
 *
 * The BlockedIPsTable component provides a comprehensive interface for viewing and managing
 * IP addresses that have been blocked by rate limiting rules. It supports bulk operations,
 * filtering, and automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Block count tracking**: Shows how many times each IP was blocked
 * - **Timeout display**: Shows when dynamic blocks will expire
 * - **Bulk operations**: Whitelist or remove multiple IPs at once
 * - **Filtering**: Filter by dynamic/permanent, list name, or search by IP
 * - **Sorting**: Sort by block count, first/last blocked time
 * - **Platform adaptive**: Mobile cards vs Desktop table
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Block Types
 *
 * - **Dynamic**: Automatically added by rules with timeout (auto-expires)
 * - **Permanent**: Manually added or no timeout (requires manual removal)
 *
 * ## Bulk Actions
 *
 * - **Whitelist**: Add selected IPs to whitelist (prevents future blocking)
 * - **Remove**: Remove selected IPs from blocklist (immediate unblock)
 *
 * ## Usage
 *
 * ```tsx
 * import { BlockedIPsTable } from '@nasnet/ui/patterns/blocked-ips-table';
 * import { useBlockedIPs } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: blockedIPs, isLoading } = useBlockedIPs(routerId);
 *
 *   return (
 *     <BlockedIPsTable
 *       blockedIPs={blockedIPs}
 *       loading={isLoading}
 *       onWhitelist={async (ips) => await addToWhitelist(ips)}
 *       onRemove={async (ips) => await removeBlocked(ips)}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/Rate Limiting/BlockedIPsTable',
  component: BlockedIPsTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Blocked IPs table with bulk operations, filtering, sorting, and timeout tracking.',
      },
    },
    // Enable accessibility testing
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    blockedIPs: {
      control: 'object',
      description: 'Array of blocked IP addresses',
    },
    loading: {
      control: 'boolean',
      description: 'Is table loading',
    },
    showFilters: {
      control: 'boolean',
      description: 'Show filter bar',
    },
    selectable: {
      control: 'boolean',
      description: 'Enable row selection for bulk operations',
    },
    onWhitelist: { action: 'whitelisted' },
    onRemove: { action: 'removed' },
    onRefresh: { action: 'refreshed' },
  },
  args: {
    loading: false,
    showFilters: true,
    selectable: true,
    onWhitelist: fn(),
    onRemove: fn(),
    onRefresh: fn(),
  },
} satisfies Meta<typeof BlockedIPsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story: Default (Mixed Types)
// =============================================================================

/**
 * Default State - Mixed Block Types
 *
 * Shows both dynamic (with timeout) and permanent (no timeout) blocked IPs.
 * Includes IPv4 and IPv6 addresses.
 */
export const Default: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view with mixed block types: dynamic (blue badge) and permanent (gray badge). Shows block counts and timeouts.',
      },
    },
  },
};

// =============================================================================
// Story: Empty State
// =============================================================================

/**
 * Empty State
 *
 * Shows empty state when no IPs are blocked.
 * Displays helpful message that protection is working.
 */
export const Empty: Story = {
  args: {
    blockedIPs: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no IPs are blocked. Shows positive message that rate limiting is active.',
      },
    },
  },
};

// =============================================================================
// Story: Loading State
// =============================================================================

/**
 * Loading State
 *
 * Shows skeleton loading state while fetching blocked IPs.
 */
export const Loading: Story = {
  args: {
    blockedIPs: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while fetching blocked IPs from router.',
      },
    },
  },
};

// =============================================================================
// Story: Top Offenders (Sorted by Block Count)
// =============================================================================

/**
 * Top Offenders
 *
 * Shows blocked IPs sorted by block count (descending).
 * Highlights most persistent attackers.
 */
export const TopOffenders: Story = {
  args: {
    blockedIPs: mockTopBlockedIPs,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Blocked IPs sorted by block count. Shows top offenders with highest attack frequency.',
      },
    },
  },
};

// =============================================================================
// Story: With Selection (Bulk Operations)
// =============================================================================

/**
 * With Selection for Bulk Operations
 *
 * Shows table with checkboxes for selecting multiple IPs.
 * Demonstrates bulk whitelist and remove actions.
 */
export const WithSelection: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
    selectable: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with selection checkboxes. Select multiple IPs to whitelist or remove in bulk.',
      },
    },
  },
};

// =============================================================================
// Story: Many Blocked IPs (100+)
// =============================================================================

/**
 * Many Blocked IPs (Performance Test)
 *
 * Tests virtualization with 200+ blocked IPs.
 * Should maintain 60fps scrolling.
 */
export const ManyBlockedIPs: Story = {
  args: {
    blockedIPs: generateMockBlockedIPs(250, (i) => ({
      blockCount: Math.floor(Math.random() * 500),
      dynamic: i % 3 !== 0,
      timeout: i % 3 === 0 ? '' : ['1h', '6h', '1d', '1w'][i % 4],
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Performance test with 250 blocked IPs. Uses virtualized table for smooth 60fps scrolling.',
      },
    },
  },
};

// =============================================================================
// Story: IPv6 Only
// =============================================================================

/**
 * IPv6 Addresses Only
 *
 * Shows table with only IPv6 blocked addresses.
 * Demonstrates proper IPv6 formatting.
 */
export const IPv6Only: Story = {
  args: {
    blockedIPs: [
      {
        address: '2001:db8::1',
        list: 'rate-limited',
        blockCount: 25,
        firstBlocked: new Date('2025-01-10T11:00:00Z'),
        lastBlocked: new Date('2025-01-10T13:00:00Z'),
        timeout: '1d',
        dynamic: true,
      },
      {
        address: '2001:db8:85a3::8a2e:370:7334',
        list: 'ddos-attackers',
        blockCount: 150,
        firstBlocked: new Date('2025-01-05T08:00:00Z'),
        lastBlocked: new Date('2025-01-10T15:45:00Z'),
        timeout: '',
        dynamic: false,
      },
      {
        address: 'fe80::1',
        list: 'rate-limited',
        blockCount: 10,
        firstBlocked: new Date('2025-01-10T14:00:00Z'),
        lastBlocked: new Date('2025-01-10T14:30:00Z'),
        timeout: '6h',
        dynamic: true,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with only IPv6 addresses. Shows proper formatting and display.',
      },
    },
  },
};

// =============================================================================
// Story: Dynamic Only
// =============================================================================

/**
 * Dynamic Blocks Only
 *
 * Shows only dynamically blocked IPs (with timeout).
 * All will auto-expire after timeout period.
 */
export const DynamicOnly: Story = {
  args: {
    blockedIPs: mockBlockedIPs.filter((ip) => ip.dynamic),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only dynamic blocks with timeouts. All show blue badges and expiration times.',
      },
    },
  },
};

// =============================================================================
// Story: Permanent Only
// =============================================================================

/**
 * Permanent Blocks Only
 *
 * Shows only permanently blocked IPs (no timeout).
 * Require manual removal.
 */
export const PermanentOnly: Story = {
  args: {
    blockedIPs: mockBlockedIPs.filter((ip) => !ip.dynamic),
  },
  parameters: {
    docs: {
      description: {
        story: 'Only permanent blocks without timeouts. All show gray badges.',
      },
    },
  },
};

// =============================================================================
// Story: Mobile Presenter
// =============================================================================

/**
 * Mobile Variant
 *
 * Forces mobile presenter (card layout).
 * Optimized for touch: 44px targets, swipe actions, compact info.
 */
export const MobileView: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile card layout (<640px). Swipe actions for whitelist/remove, 44px touch targets.',
      },
    },
  },
};

// =============================================================================
// Story: Desktop Presenter
// =============================================================================

/**
 * Desktop Variant
 *
 * Forces desktop presenter (dense table).
 * Optimized for keyboard: sortable columns, inline actions, keyboard shortcuts.
 */
export const DesktopView: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop table layout (>1024px). Dense data display with sortable columns and inline actions.',
      },
    },
  },
};

// =============================================================================
// Story: High Block Counts
// =============================================================================

/**
 * High Block Counts
 *
 * Shows IPs with very high block counts (1000+).
 * Demonstrates number formatting (K, M suffixes).
 */
export const HighBlockCounts: Story = {
  args: {
    blockedIPs: [
      {
        ...mockBlockedIP2,
        blockCount: 15000,
      },
      {
        ...mockBlockedIP3,
        blockCount: 5400,
      },
      {
        ...mockBlockedIP1,
        blockCount: 250000,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'IPs with high block counts. Numbers formatted with K/M suffixes for readability.',
      },
    },
  },
};

// =============================================================================
// Story: Without Filters
// =============================================================================

/**
 * Without Filter Bar
 *
 * Hides filter bar for cleaner layout.
 * Useful when filters aren't needed.
 */
export const NoFilters: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
    showFilters: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table without filter bar. Cleaner layout when filtering is not needed.',
      },
    },
  },
};

// =============================================================================
// Story: Non-Selectable
// =============================================================================

/**
 * Non-Selectable (Read-Only)
 *
 * Disables row selection and bulk operations.
 * Useful for monitoring views or when actions aren't permitted.
 */
export const NonSelectable: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
    selectable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only table without selection checkboxes. Individual actions still available.',
      },
    },
  },
};

// =============================================================================
// Story: Accessibility Test
// =============================================================================

/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export const AccessibilityTest: Story = {
  args: {
    blockedIPs: mockBlockedIPs,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Accessibility validation. All buttons have labels, 7:1 contrast ratio, keyboard navigable.',
      },
    },
  },
};
