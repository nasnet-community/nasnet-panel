/**
 * FilterRulesTable Storybook Stories
 *
 * Interactive stories for the platform-aware filter rules table component.
 * Demonstrates the Headless + Platform Presenters pattern and responsive behavior.
 *
 * FilterRulesTable is a thin wrapper that delegates to:
 * - FilterRulesTableDesktop: Dense table with drag-drop reordering
 * - FilterRulesTableMobile: Card-based touch-friendly layout
 *
 * @module @nasnet/features/firewall
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FilterRulesTable } from './FilterRulesTable';

import type { Meta, StoryObj } from '@storybook/react';

// Shared QueryClient — no retries so stories show loading/empty states predictably
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

function QueryWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * FilterRulesTable - Platform-aware filter rules management component
 *
 * This component automatically detects the user's platform (mobile/desktop)
 * and renders the most appropriate presenter for the context.
 *
 * ## Platform Behavior
 *
 * - **Desktop (>=640px):** Dense sortable table with drag-drop reordering,
 *   inline enable/disable toggle, and icon-only CRUD action buttons.
 * - **Mobile (<640px):** Touch-optimized card layout with 44px minimum touch
 *   targets, full-width edit button, and icon-only duplicate/delete buttons.
 *
 * ## Features
 *
 * - **Drag-drop reordering** (Desktop only): Grip handle on left side
 * - **Inline toggle**: Switch to enable/disable rules without opening editor
 * - **Counter visualization**: Packets and bytes hit counts per rule
 * - **Disabled rules styling**: Reduced opacity (opacity-50) for disabled rules
 * - **Unused rules indicator**: Highlight rules with 0 packet hits
 * - **Action badges**: Color-coded badges — accept (green), drop (red),
 *   reject (red), log (blue), jump (yellow), passthrough (default)
 * - **Chain filter**: Optional `chain` prop to scope display to one chain
 *
 * ## Chain Values
 *
 * - `input` — Traffic destined for the router itself
 * - `forward` — Traffic passing through the router
 * - `output` — Traffic originating from the router
 *
 * ## Usage
 *
 * ```tsx
 * import { FilterRulesTable } from '@nasnet/features/firewall';
 *
 * // Show all filter rules
 * <FilterRulesTable />
 *
 * // Show only input chain rules
 * <FilterRulesTable chain="input" />
 * ```
 */
const meta = {
  title: 'Features/Firewall/FilterRulesTable',
  component: FilterRulesTable,
  decorators: [
    (Story) => (
      <QueryWrapper>
        <Story />
      </QueryWrapper>
    ),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Platform-aware filter rules table. Automatically renders as a dense sortable table on desktop or a touch-optimized card list on mobile. Connects to the router API via React Query hooks.',
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
      options: [undefined, 'input', 'forward', 'output'],
      description: 'Filter rules to a specific firewall chain. Omit to show all chains.',
      table: {
        type: { summary: "'input' | 'forward' | 'output' | undefined" },
        defaultValue: { summary: 'undefined (all chains)' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the wrapper element.',
    },
  },
} satisfies Meta<typeof FilterRulesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default (All Chains)
 *
 * Shows all filter rules from all chains.
 * The component connects to the router API via React Query.
 * In Storybook without a live router, it will show the loading then empty state.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default rendering with no chain filter — shows all firewall chains (input, forward, output). Connects to live router API; renders loading skeleton then the rule table.',
      },
    },
  },
};

/**
 * Input Chain
 *
 * Filtered to show only the INPUT chain — rules that govern traffic
 * destined for the router itself (e.g., management access, ping, SSH).
 */
export const InputChain: Story = {
  args: {
    chain: 'input',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Scoped to the INPUT chain. These rules control which traffic can reach the router itself — commonly used to allow SSH from LAN while blocking external management access.',
      },
    },
  },
};

/**
 * Forward Chain
 *
 * Filtered to show only the FORWARD chain — rules that govern traffic
 * passing through the router between networks.
 */
export const ForwardChain: Story = {
  args: {
    chain: 'forward',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Scoped to the FORWARD chain. These rules control inter-network traffic — typically the most complex chain with established/related connection acceptance and drop policies.',
      },
    },
  },
};

/**
 * Output Chain
 *
 * Filtered to show only the OUTPUT chain — rules for traffic that
 * originates from the router itself.
 */
export const OutputChain: Story = {
  args: {
    chain: 'output',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Scoped to the OUTPUT chain. Controls traffic generated by the router process itself — useful for restricting outbound management traffic or router-initiated connections.',
      },
    },
  },
};

/**
 * Mobile Viewport
 *
 * Same component rendered inside a mobile viewport.
 * Platform detection switches to FilterRulesTableMobile (card layout).
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
          'Mobile card-based layout. Platform detector fires at <640px, switching to FilterRulesTableMobile. Each rule renders as a Card with 44px touch-target action buttons (Edit, Duplicate, Delete).',
      },
    },
  },
};

/**
 * Mobile Input Chain
 *
 * Mobile variant scoped to the input chain — demonstrates that the
 * chain prop is forwarded correctly through the platform wrapper.
 */
export const MobileInputChain: Story = {
  args: {
    chain: 'input',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile card layout scoped to the INPUT chain. Demonstrates that the chain prop threads through both Mobile and Desktop platform presenters identically.',
      },
    },
  },
};

/**
 * With Custom ClassName
 *
 * Demonstrates className forwarding for layout control within a panel.
 */
export const WithCustomClassName: Story = {
  args: {
    className: 'border rounded-lg overflow-hidden',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom className applied to the outer wrapper. Useful for constraining height, adding borders, or embedding inside a panel layout.',
      },
    },
  },
};
