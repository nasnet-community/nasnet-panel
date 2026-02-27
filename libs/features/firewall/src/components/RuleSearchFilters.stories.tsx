/**
 * RuleSearchFilters Storybook Stories
 *
 * Stories for the firewall rule search and filter panel component.
 * Demonstrates all filter combinations, active badge states, and responsive layout.
 *
 * @module @nasnet/features/firewall
 */

import { useState } from 'react';

import { fn } from 'storybook/test';

import type { FirewallFilters } from '@nasnet/core/types';

import { RuleSearchFilters } from './RuleSearchFilters';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * RuleSearchFilters - Multi-field filter panel for firewall rules
 *
 * Provides a complete search and filter interface for the firewall rule table.
 * Combines a debounced text search with four dropdown filters (chain, action,
 * protocol, status), shows active filter badges, and includes a "Clear all" button.
 *
 * ## Features
 *
 * - **Debounced search**: 300ms delay on text input to avoid excessive re-renders
 * - **Chain filter**: All / Input / Forward / Output / Prerouting / Postrouting
 * - **Action filter**: All / Accept / Drop / Reject / Log
 * - **Protocol filter**: All / TCP / UDP / ICMP
 * - **Status filter**: All / Enabled / Disabled
 * - **Active filter badges**: Removable badge for each non-default filter value
 * - **Clear all button**: Resets every filter to its default in one click
 * - **Active count badge**: Header badge showing the number of active filters
 * - **Mobile collapsible**: Dropdowns hidden behind a toggle on narrow viewports
 *
 * ## Props
 *
 * | Prop               | Type                               | Description                          |
 * |--------------------|-------------------------------------|--------------------------------------|
 * | `filters`          | `FirewallFilters`                  | Current filter state                 |
 * | `onChange`         | `(partial: FirewallFilters) => void` | Partial update callback              |
 * | `onClearAll`       | `() => void`                       | Reset all filters to defaults        |
 * | `activeFilterCount`| `number`                           | Badge count shown in header          |
 * | `className`        | `string?`                          | Additional CSS classes               |
 *
 * ## Usage
 *
 * ```tsx
 * const [filters, setFilters] = useState<FirewallFilters>({});
 *
 * const handleChange = (partial: Partial<FirewallFilters>) =>
 *   setFilters((prev) => ({ ...prev, ...partial }));
 *
 * const handleClearAll = () => setFilters({});
 *
 * const activeCount = Object.entries(filters).filter(
 *   ([, v]) => v && v !== 'all'
 * ).length;
 *
 * <RuleSearchFilters
 *   filters={filters}
 *   onChange={handleChange}
 *   onClearAll={handleClearAll}
 *   activeFilterCount={activeCount}
 * />
 * ```
 */
const meta = {
  title: 'Features/Firewall/RuleSearchFilters',
  component: RuleSearchFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-field search and filter panel for firewall rules. ' +
          'Supports text search, four dropdown filters, active badge display, and "Clear all".',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    activeFilterCount: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'Number of active (non-default) filters to show in the header badge',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the outer wrapper',
    },
    onChange: {
      action: 'filterChanged',
      description: 'Called with a partial FirewallFilters object when any filter changes',
    },
    onClearAll: {
      action: 'clearAll',
      description: 'Called when the "Clear all" button is clicked',
    },
  },
  args: {
    onChange: fn(),
    onClearAll: fn(),
  },
} satisfies Meta<typeof RuleSearchFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default state — no filters active
// ---------------------------------------------------------------------------

/**
 * Default
 *
 * All filters at their default values. The header shows no active-count badge.
 * Dropdowns display "All Chains", "All Actions", "All Protocols", "All Status".
 */
export const Default: Story = {
  args: {
    filters: {},
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No filters applied. All dropdowns show "All …" and the active-filter ' +
          'badge is hidden. The search input is empty.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Single active filter
// ---------------------------------------------------------------------------

/**
 * WithSearchTerm
 *
 * A search term pre-populated in the input. A removable badge "192.168.1.0"
 * appears below the filter controls.
 */
export const WithSearchTerm: Story = {
  args: {
    filters: {
      search: '192.168.1.0',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Search field pre-filled with an IP address. The active-filter badge ' +
          'shows `"192.168.1.0"` with an × to remove it.',
      },
    },
  },
};

/**
 * ChainFilterActive
 *
 * Chain filter set to "forward". The dropdown reflects the selection
 * and a "Chain: forward" badge appears below.
 */
export const ChainFilterActive: Story = {
  args: {
    filters: {
      chain: 'forward',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Chain filter set to "forward". Dropdown shows the selected option ' +
          'and a removable "Chain: forward" badge is displayed.',
      },
    },
  },
};

/**
 * ActionFilterActive
 *
 * Action filter set to "drop". Shows a "Action: drop" badge and the
 * select trigger reads "Drop".
 */
export const ActionFilterActive: Story = {
  args: {
    filters: {
      action: 'drop',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Action filter set to "drop". Useful for quickly finding all blocking rules.',
      },
    },
  },
};

/**
 * ProtocolFilterActive
 *
 * Protocol filter set to "tcp". Shows a "Protocol: tcp" badge.
 */
export const ProtocolFilterActive: Story = {
  args: {
    filters: {
      protocol: 'tcp',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Protocol filter set to "tcp". Narrows the rule table to TCP-specific rules only.',
      },
    },
  },
};

/**
 * StatusFilterDisabled
 *
 * Status filter set to "disabled". Shows only disabled (inactive) firewall rules,
 * useful for auditing redundant configurations.
 */
export const StatusFilterDisabled: Story = {
  args: {
    filters: {
      status: 'disabled',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Status filter set to "disabled". Surfaces disabled rules to help admins ' +
          'review and clean up inactive configurations.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Multiple active filters
// ---------------------------------------------------------------------------

/**
 * MultipleFiltersActive
 *
 * Three filters active simultaneously: chain=input, action=drop, protocol=tcp.
 * All three badges are rendered and the header badge shows "3 active".
 */
export const MultipleFiltersActive: Story = {
  args: {
    filters: {
      chain: 'input',
      action: 'drop',
      protocol: 'tcp',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three filters active: chain=input, action=drop, protocol=tcp. ' +
          'All three removable badges appear; header badge reads "3 active".',
      },
    },
  },
};

/**
 * AllFiltersActive
 *
 * Every possible filter has a non-default value, including a search term.
 * Demonstrates the maximum badge count (5) and verifies the "Clear all" button
 * placement and wrapping behavior.
 */
export const AllFiltersActive: Story = {
  args: {
    filters: {
      search: '192.168.0',
      chain: 'forward',
      action: 'accept',
      protocol: 'udp',
      status: 'enabled',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'All five filter dimensions are set. Five badges appear with a "Clear all" button ' +
          'at the end of the badge row. Header badge reads "5 active".',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Interactive story (stateful)
// ---------------------------------------------------------------------------

/**
 * Interactive
 *
 * A fully wired stateful story that allows Storybook users to interact with
 * all filter controls and see badge state update in real time.
 */
export const Interactive: Story = {
  args: {
    filters: {},
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 0,
  },
  render: () => {
    const [filters, setFilters] = useState<FirewallFilters>({});

    const handleChange = (partial: Partial<FirewallFilters>) =>
      setFilters((prev) => ({ ...prev, ...partial }));

    const handleClearAll = () => setFilters({});

    const activeFilterCount = Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== '' && v !== 'all'
    ).length;

    return (
      <div className="max-w-2xl">
        <RuleSearchFilters
          filters={filters}
          onChange={handleChange}
          onClearAll={handleClearAll}
          activeFilterCount={activeFilterCount}
        />
        <pre className="mt-4 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {JSON.stringify({ filters, activeFilterCount }, null, 2)}
        </pre>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive story. All filter controls are wired to local state. ' +
          'A JSON debug panel below shows the current filter values in real time.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Responsive
// ---------------------------------------------------------------------------

/**
 * MobileView
 *
 * Narrow viewport (mobile1). Dropdown filters are collapsed behind the
 * "Show Filters" toggle button; only the search input and toggle are visible.
 */
export const MobileView: Story = {
  args: {
    filters: {},
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 0,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile layout. Dropdown filters are hidden by default and revealed by ' +
          'tapping the "Show Filters" button. Active filter count appears in the toggle badge.',
      },
    },
  },
};

/**
 * MobileWithActiveFilters
 *
 * Mobile viewport with two active filters. The toggle button badge shows "2"
 * even when filters are collapsed, alerting the user that filters are in effect.
 */
export const MobileWithActiveFilters: Story = {
  args: {
    filters: {
      chain: 'input',
      action: 'drop',
    },
    onChange: fn(),
    onClearAll: fn(),
    activeFilterCount: 2,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile view with two active filters. The "Show Filters" button displays ' +
          'a "2" badge so users know filters are active even when the panel is closed.',
      },
    },
  },
};
