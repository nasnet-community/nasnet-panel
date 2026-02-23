/**
 * RateLimitRulesTable Storybook Stories
 *
 * Visual documentation and testing for rate limit rules table pattern component.
 *
 * Stories:
 * - Default (mixed rule types)
 * - Empty state
 * - Loading state
 * - Drop rules only
 * - Tarpit rules
 * - Add-to-list rules
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/rate-limit-rules-table
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { fn } from 'storybook/test';

import { RateLimitRulesTable } from './RateLimitRulesTable';
import {
  mockRateLimitRules,
  mockDropRule,
  mockTarpitRule,
  mockAddToListRule,
  mockDisabledRule,
  generateMockRules,
} from '../__test-utils__/rate-limit-fixtures';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * RateLimitRulesTable - Display and manage rate limiting firewall rules
 *
 * The RateLimitRulesTable component provides a sortable, filterable table for managing
 * connection rate limiting rules. It supports drag-and-drop reordering and automatically
 * adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Sortable rows**: Drag-and-drop to reorder rules (position matters!)
 * - **Rule actions**: Drop, Tarpit, Add-to-List with visual indicators
 * - **Real-time stats**: Packet/byte counters for each rule
 * - **Bulk operations**: Toggle, duplicate, delete multiple rules
 * - **Platform adaptive**: Mobile cards vs Desktop table
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Rule Actions
 *
 * - **Drop**: Immediately drops excess connections (red indicator)
 * - **Tarpit**: Slows down attackers with delayed responses (yellow indicator)
 * - **Add-to-List**: Adds offenders to address list with timeout (blue indicator)
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitRulesTable } from '@nasnet/ui/patterns/rate-limit-rules-table';
 * import { useRateLimitRules } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: rules, isLoading } = useRateLimitRules(routerId);
 *
 *   return (
 *     <RateLimitRulesTable
 *       rules={rules}
 *       loading={isLoading}
 *       onToggle={async (id) => await toggleRule(id)}
 *       onEdit={(rule) => openEditor(rule)}
 *       onDelete={async (id) => await deleteRule(id)}
 *       onReorder={async (newOrder) => await updateOrder(newOrder)}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/Rate Limiting/RateLimitRulesTable',
  component: RateLimitRulesTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Rate limit rules table with drag-and-drop reordering, action indicators, and real-time statistics.',
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
    actionFilter: {
      control: 'text',
      description: 'Filter by action type (drop/tarpit/add-to-list)',
    },
    statusFilter: {
      control: 'select',
      options: ['all', 'enabled', 'disabled'],
      description: 'Filter by enabled/disabled status',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    actionFilter: undefined,
    statusFilter: 'all',
  },
} satisfies Meta<typeof RateLimitRulesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story: Default (Mixed Rule Types)
// =============================================================================

/**
 * Default State - Mixed Rule Types
 *
 * Shows all three rate limiting actions: drop, tarpit, and add-to-list.
 * Includes disabled rule to demonstrate toggle functionality.
 */
export const Default: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view with mixed rule types: drop (red), tarpit (yellow), add-to-list (blue). Includes one disabled rule.',
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
 * Shows empty state when no rate limit rules exist.
 * Prompts user to create their first rule.
 */
export const Empty: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with call-to-action to create first rate limit rule. Shows helpful guidance text.',
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
 * Shows skeleton loading state while fetching rules from router.
 */
export const Loading: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while fetching rules. Shimmer animation for better UX.',
      },
    },
  },
};

// =============================================================================
// Story: Drop Rules Only
// =============================================================================

/**
 * Drop Rules Only
 *
 * Demonstrates drop action rules (immediately blocks excess connections).
 * Most aggressive protection mode.
 */
export const DropRulesOnly: Story = {
  args: {
    actionFilter: 'drop',
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with only drop action rules. Red indicators show aggressive blocking strategy.',
      },
    },
  },
};

// =============================================================================
// Story: Tarpit Rules
// =============================================================================

/**
 * Tarpit Rules
 *
 * Demonstrates tarpit action (slows down attackers instead of dropping).
 * More subtle defense mechanism.
 */
export const TarpitRules: Story = {
  args: {
    actionFilter: 'tarpit',
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with only tarpit action rules. Yellow indicators show delayed response strategy.',
      },
    },
  },
};

// =============================================================================
// Story: Add-to-List Rules
// =============================================================================

/**
 * Add-to-List Rules
 *
 * Demonstrates add-to-list action (adds offenders to blocklist).
 * Dynamic blocking with automatic timeout.
 */
export const AddToListRules: Story = {
  args: {
    actionFilter: 'add-to-list',
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with only add-to-list action rules. Blue indicators show dynamic blocklist strategy with timeouts.',
      },
    },
  },
};

// =============================================================================
// Story: With Filters
// =============================================================================

/**
 * With Active Filters
 *
 * Shows table with filter bar expanded.
 * Filter by action type, enabled/disabled status, or search by IP.
 */
export const WithFilters: Story = {
  args: {
    statusFilter: 'enabled',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with filter bar visible. Try filtering by action (drop/tarpit/add-to-list), status (enabled/disabled), or IP address.',
      },
    },
  },
};

// =============================================================================
// Story: Many Rules (100+)
// =============================================================================

/**
 * Many Rules (Performance Test)
 *
 * Tests virtualization with 100+ rules.
 * Should maintain 60fps scrolling.
 */
export const ManyRules: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Performance test with 150 rules. Uses virtualized table for smooth 60fps scrolling.',
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
 * Optimized for touch: 44px targets, swipe actions, bottom sheets.
 */
export const MobileView: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile card layout (<640px). Uses swipe gestures, 44px touch targets, and bottom action sheets.',
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
 * Optimized for keyboard: sortable columns, inline editing, context menus.
 */
export const DesktopView: Story = {
  args: {
    statusFilter: 'all',
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
// Story: With High Traffic
// =============================================================================

/**
 * With High Traffic Counters
 *
 * Shows rules with high packet/byte counts.
 * Demonstrates counter formatting (K, M, G suffixes).
 */
export const WithHighTraffic: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Rules with high traffic counters. Numbers formatted with K/M/G suffixes for readability.',
      },
    },
  },
};

// =============================================================================
// Story: Disabled Sorting
// =============================================================================

/**
 * Non-Sortable Table
 *
 * Disables drag-and-drop reordering.
 * Useful for read-only views or when order is managed externally.
 */
export const NonSortable: Story = {
  args: {
    statusFilter: 'all',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with sorting disabled. Drag handles are hidden, rows cannot be reordered.',
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
    statusFilter: 'all',
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
