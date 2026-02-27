/**
 * FirewallQuickStats Storybook Stories
 *
 * Stories for the compact firewall rule distribution summary component.
 * Demonstrates chain distribution bars, action breakdown, and various data states.
 *
 * @module @nasnet/features/firewall
 */

import { FirewallQuickStats } from './FirewallQuickStats';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * FirewallQuickStats - Compact summary of firewall chain and action distribution
 *
 * Displays a quick-glance breakdown of firewall rules organized by chain
 * (input, forward, output) and action type (accept, drop, reject).
 *
 * ## Features
 *
 * - **Chain distribution bars**: Proportional bars showing rule count per chain
 * - **Color-coded chains**: input=blue, forward=purple, output=amber
 * - **Action breakdown**: Stacked bar and legend for accept/drop/reject counts
 * - **Loading skeleton**: Animated placeholder while fetching
 * - **Empty state**: Friendly message when no rules are configured
 *
 * ## Usage
 *
 * ```tsx
 * import { FirewallQuickStats } from '@nasnet/features/firewall';
 *
 * function FirewallSidebar() {
 *   return (
 *     <aside>
 *       <FirewallQuickStats />
 *     </aside>
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/FirewallQuickStats',
  component: FirewallQuickStats,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact sidebar widget showing rule distribution by chain and action type. ' +
          'Used in the firewall dashboard overview for a quick statistical snapshot.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FirewallQuickStats>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * Component as rendered within the firewall overview panel.
 * Data is fetched from the connected router via the Apollo/React Query hooks.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default rendering. The component fetches rule data from the active router ' +
          'and displays chain bars and action distribution.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              { id: '*1', chain: 'input', action: 'accept', disabled: false, order: 0 },
              { id: '*2', chain: 'input', action: 'accept', disabled: false, order: 1 },
              { id: '*3', chain: 'input', action: 'drop', disabled: false, order: 2 },
              { id: '*4', chain: 'input', action: 'accept', disabled: false, order: 3 },
              { id: '*5', chain: 'forward', action: 'accept', disabled: false, order: 4 },
              { id: '*6', chain: 'forward', action: 'drop', disabled: false, order: 5 },
              { id: '*7', chain: 'forward', action: 'drop', disabled: false, order: 6 },
              { id: '*8', chain: 'forward', action: 'reject', disabled: false, order: 7 },
              { id: '*9', chain: 'output', action: 'accept', disabled: false, order: 8 },
              { id: '*10', chain: 'output', action: 'drop', disabled: true, order: 9 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * WithClassName
 *
 * Shows how the className prop applies additional Tailwind classes for
 * layout integration within parent containers.
 */
export const WithClassName: Story = {
  args: {
    className: 'shadow-lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The className prop passes additional classes to the outer container, ' +
          'allowing integration within sidebar layouts or grid cells.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              { id: '*1', chain: 'input', action: 'accept', disabled: false, order: 0 },
              { id: '*2', chain: 'forward', action: 'drop', disabled: false, order: 1 },
              { id: '*3', chain: 'output', action: 'accept', disabled: false, order: 2 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * HeavyInputChain
 *
 * Scenario where the input chain has significantly more rules than forward/output.
 * Demonstrates how bars scale proportionally to the highest chain count.
 */
export const HeavyInputChain: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Input chain dominates with 15 rules while forward has 5 and output has 2. ' +
          'Chain bars are relative to the maximum — input fills 100%, others scale down.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              ...Array.from({ length: 8 }, (_, i) => ({
                id: `*input-accept-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: i,
              })),
              ...Array.from({ length: 5 }, (_, i) => ({
                id: `*input-drop-${i}`,
                chain: 'input',
                action: 'drop',
                disabled: false,
                order: 8 + i,
              })),
              {
                id: '*input-disabled',
                chain: 'input',
                action: 'accept',
                disabled: true,
                order: 13,
              },
              { id: '*input-disabled2', chain: 'input', action: 'drop', disabled: true, order: 14 },
              { id: '*fwd1', chain: 'forward', action: 'accept', disabled: false, order: 15 },
              { id: '*fwd2', chain: 'forward', action: 'drop', disabled: false, order: 16 },
              { id: '*fwd3', chain: 'forward', action: 'reject', disabled: false, order: 17 },
              { id: '*fwd4', chain: 'forward', action: 'accept', disabled: false, order: 18 },
              { id: '*fwd5', chain: 'forward', action: 'accept', disabled: false, order: 19 },
              { id: '*out1', chain: 'output', action: 'accept', disabled: false, order: 20 },
              { id: '*out2', chain: 'output', action: 'accept', disabled: false, order: 21 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * AllDropRules
 *
 * All active rules use the drop action, which fills the action bar entirely in red.
 * Useful for verifying the action legend renders correctly in a single-color scenario.
 */
export const AllDropRules: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Every active rule has action=drop. The stacked action bar renders entirely red, ' +
          'and the accept/reject legend counts show zero.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              { id: '*1', chain: 'input', action: 'drop', disabled: false, order: 0 },
              { id: '*2', chain: 'input', action: 'drop', disabled: false, order: 1 },
              { id: '*3', chain: 'forward', action: 'drop', disabled: false, order: 2 },
              { id: '*4', chain: 'forward', action: 'drop', disabled: false, order: 3 },
              { id: '*5', chain: 'output', action: 'drop', disabled: false, order: 4 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * LoadingState
 *
 * Skeleton animation displayed while the hook is fetching data.
 * Three skeleton rows replace the chain bars until data resolves.
 */
export const LoadingState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton shown while firewall rules are being fetched from the router. ' +
          'Three animated placeholder bars replace chain stats.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: async () => {
            await new Promise((resolve) => setTimeout(resolve, 60000));
            return { data: [] };
          },
        },
      ],
    },
  },
};

/**
 * EmptyState
 *
 * No firewall rules have been configured on this router.
 * Displays a friendly message prompting the user to add rules.
 */
export const EmptyState: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no firewall rules exist on the router. ' +
          'Shows "No firewall rules configured" message.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: { data: [] },
        },
      ],
    },
  },
};
