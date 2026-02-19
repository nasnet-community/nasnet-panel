/**
 * NATRulesTable Storybook Stories
 *
 * Interactive stories for the NAT rules table component.
 * Demonstrates action badge variants, chain filtering, sorting, and row actions.
 *
 * @module @nasnet/features/firewall
 */

import { fn } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import type { NATRule } from '@nasnet/core/types';
import { NATRulesTable } from './NATRulesTable';

/**
 * NATRulesTable - NAT rules management table
 *
 * Displays all NAT rules from the MikroTik router in a sortable data table.
 * Supports srcnat (outgoing masquerade / src-nat) and dstnat (port forwarding / redirect) chains.
 *
 * ## Action Badge Variants
 *
 * | Action | Badge | Typical Use |
 * |--------|-------|-------------|
 * | `masquerade` | Blue (info) | Internet sharing, hide LAN behind WAN IP |
 * | `dst-nat` | Secondary | Port forwarding — redirect inbound traffic to internal host |
 * | `src-nat` | Default | Manual SNAT — explicit source address translation |
 * | `redirect` | Yellow (warning) | Transparent proxy — redirect locally |
 *
 * ## Columns
 *
 * `#` · Chain · Action · Protocol · Src Address · Dst Address · To Addresses · To Ports · Comment · Actions
 *
 * ## Features
 *
 * - **Sortable columns**: Click any column header to sort ascending/descending
 * - **Row actions**: Edit (triggers `onEditRule`), Toggle enable/disable, Delete with `SafetyConfirmation`
 * - **Disabled rules**: Rendered with `opacity-50` and strikethrough text
 * - **Chain filter**: Optional `chain` prop scopes to `srcnat` or `dstnat`
 * - **SafetyConfirmation**: 3-second countdown before destructive delete
 *
 * ## Usage
 *
 * ```tsx
 * import { NATRulesTable } from '@nasnet/features/firewall';
 *
 * <NATRulesTable
 *   chain="dstnat"
 *   onEditRule={(rule) => setEditingRule(rule)}
 * />
 * ```
 */
const meta: Meta<typeof NATRulesTable> = {
  title: 'Features/Firewall/NATRulesTable',
  component: NATRulesTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sortable NAT rules table with color-coded action badges, inline enable/disable toggle, and SafetyConfirmation delete dialog. Fetches data from the router API via React Query.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    chain: {
      control: 'select',
      options: [undefined, 'all', 'srcnat', 'dstnat'],
      description: 'Filter to a specific NAT chain. "all" or undefined shows all chains.',
      table: {
        type: { summary: "'srcnat' | 'dstnat' | 'all' | undefined" },
        defaultValue: { summary: 'undefined' },
      },
    },
    onEditRule: {
      description: 'Callback invoked when the user clicks Edit on a NAT rule row.',
      table: {
        type: { summary: '(rule: NATRule) => void' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the table wrapper.',
    },
  },
  args: {
    onEditRule: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default (All Chains)
 *
 * Shows all NAT rules across srcnat and dstnat chains.
 * In a live environment this connects to the router API.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default rendering with no chain filter — displays all NAT rules. Connects to the router API; shows loading skeleton while fetching.',
      },
    },
  },
};

/**
 * Srcnat Chain (Masquerade / Internet Sharing)
 *
 * Typical srcnat chain contains masquerade rules for internet sharing.
 * These rules translate the source address of outgoing packets.
 */
export const SrcnatChain: Story = {
  args: {
    chain: 'srcnat',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Filtered to the SRCNAT chain. Contains masquerade rules (hiding LAN IPs behind WAN) and explicit src-nat rules. Action badges render in blue (masquerade) or default (src-nat).',
      },
    },
  },
};

/**
 * Dstnat Chain (Port Forwarding)
 *
 * The dstnat chain typically holds port forwarding rules (dst-nat)
 * and transparent proxy redirects.
 */
export const DstnatChain: Story = {
  args: {
    chain: 'dstnat',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Filtered to the DSTNAT chain. Port forwarding rules (dst-nat) redirect inbound traffic to internal hosts. "To Addresses" and "To Ports" columns contain the forwarding targets.',
      },
    },
  },
};

/**
 * With Edit Rule Callback
 *
 * Demonstrates the onEditRule callback interaction.
 * Click the "Edit" action on any row to fire the callback (visible in Actions panel).
 */
export const WithEditCallback: Story = {
  args: {
    onEditRule: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit callback wired up. Click "Edit" from the row action dropdown to invoke onEditRule with the full NATRule object. The parent page uses this to open a NAT rule form.',
      },
    },
  },
};

/**
 * All Chain
 *
 * Explicitly passing chain="all" behaves identically to the default
 * (no chain filtering) — shows all NAT rules.
 */
export const AllChain: Story = {
  args: {
    chain: 'all',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Explicit chain="all" — equivalent to omitting the prop. Both srcnat and dstnat rules appear in the same table, sortable by the Chain column.',
      },
    },
  },
};

/**
 * Mobile Viewport
 *
 * NATRulesTable renders the desktop table on all viewports.
 * On very small screens, the table scrolls horizontally.
 * The mobile-specific layout lives in NATRulesTableMobile.
 */
export const MobileViewport: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'NATRulesTable (desktop variant) on a narrow viewport. The table scrolls horizontally to accommodate all columns. For a true mobile layout, use NATRulesTableMobile directly.',
      },
    },
  },
};
