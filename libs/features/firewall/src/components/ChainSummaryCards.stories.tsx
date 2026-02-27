/**
 * ChainSummaryCards Storybook Stories
 *
 * Stories for the firewall chain summary card grid component.
 * Demonstrates selection, action distribution, error/loading states, and chain variants.
 *
 * @module @nasnet/features/firewall
 */

import { fn } from 'storybook/test';

import type { FirewallChain } from '@nasnet/core/types';

import { ChainSummaryCards } from './ChainSummaryCards';

import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * ChainSummaryCards - Per-chain statistics cards with selection support
 *
 * Renders three clickable summary cards (input, forward, output), each showing
 * the total rule count, accept/drop/disabled breakdown, and a proportional
 * action-distribution color bar. Clicking a card filters the rule table below.
 *
 * ## Features
 *
 * - **Color-coded cards**: input=blue left-border, forward=purple, output=amber
 * - **Rule count badge**: Large number showing total rules per chain
 * - **Stats grid**: Accept / Drop / Disabled counts in a 3-column grid
 * - **Action distribution bar**: Proportional accept (green) / drop (red) / reject (orange)
 * - **Toggle selection**: Click to filter; click again to deselect
 * - **Selected highlight**: Ring + tinted background on active card
 * - **Loading skeleton**: Three animated placeholder cards
 * - **Error state**: Error message when the API call fails
 *
 * ## Usage
 *
 * ```tsx
 * const [selectedChain, setSelectedChain] = useState<FirewallChain | null>(null);
 *
 * <ChainSummaryCards
 *   selectedChain={selectedChain}
 *   onChainSelect={setSelectedChain}
 * />
 * ```
 */
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

const meta = {
  title: 'Features/Firewall/ChainSummaryCards',
  component: ChainSummaryCards,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryWrapper>
        <Story />
      </QueryWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Three-card summary grid showing rule statistics per firewall chain. ' +
          'Cards are interactive — clicking filters the associated rule table.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    selectedChain: {
      control: 'radio',
      options: [null, 'input', 'forward', 'output'],
      description: 'Currently selected/highlighted chain',
    },
    onChainSelect: {
      action: 'chainSelected',
      description: 'Callback fired when a chain card is clicked',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name',
    },
  },
  args: {
    onChainSelect: fn(),
    selectedChain: null,
  },
} satisfies Meta<typeof ChainSummaryCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * All three main chains with realistic rule distributions.
 * No chain is pre-selected; the header shows "Click a chain to filter rules."
 */
export const Default: Story = {
  args: {
    selectedChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default view with input (12 rules), forward (8 rules), and output (4 rules). ' +
          'No chain is selected. Click any card to highlight it.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              // --- input chain: 7 accept, 3 drop, 2 disabled ---
              ...Array.from({ length: 7 }, (_, i) => ({
                id: `*in-a-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: i,
              })),
              ...Array.from({ length: 3 }, (_, i) => ({
                id: `*in-d-${i}`,
                chain: 'input',
                action: 'drop',
                disabled: false,
                order: 7 + i,
              })),
              ...Array.from({ length: 2 }, (_, i) => ({
                id: `*in-x-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: true,
                order: 10 + i,
              })),
              // --- forward chain: 5 accept, 3 drop ---
              ...Array.from({ length: 5 }, (_, i) => ({
                id: `*fwd-a-${i}`,
                chain: 'forward',
                action: 'accept',
                disabled: false,
                order: 12 + i,
              })),
              ...Array.from({ length: 3 }, (_, i) => ({
                id: `*fwd-d-${i}`,
                chain: 'forward',
                action: 'drop',
                disabled: false,
                order: 17 + i,
              })),
              // --- output chain: 3 accept, 1 reject ---
              ...Array.from({ length: 3 }, (_, i) => ({
                id: `*out-a-${i}`,
                chain: 'output',
                action: 'accept',
                disabled: false,
                order: 20 + i,
              })),
              { id: '*out-r-0', chain: 'output', action: 'reject', disabled: false, order: 23 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * InputChainSelected
 *
 * The input chain card is pre-selected, showing the highlighted blue ring state.
 * The section subtitle reads "Filtering by input chain".
 */
export const InputChainSelected: Story = {
  args: {
    selectedChain: 'input' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Input chain is pre-selected. Card shows blue ring + tinted background. ' +
          'Subtitle updates to "Filtering by input chain".',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              ...Array.from({ length: 6 }, (_, i) => ({
                id: `*in-a-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: i,
              })),
              { id: '*in-d-0', chain: 'input', action: 'drop', disabled: false, order: 6 },
              { id: '*fwd-a-0', chain: 'forward', action: 'accept', disabled: false, order: 7 },
              { id: '*fwd-d-0', chain: 'forward', action: 'drop', disabled: false, order: 8 },
              { id: '*out-a-0', chain: 'output', action: 'accept', disabled: false, order: 9 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * ForwardChainSelected
 *
 * Forward chain is selected (purple highlight). Useful for reviewing rules that
 * process traffic passing through the router between interfaces.
 */
export const ForwardChainSelected: Story = {
  args: {
    selectedChain: 'forward' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Forward chain is selected. Purple ring + tinted background on the forward card. ' +
          'Typical use-case: filtering LAN-to-WAN routing rules.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              { id: '*in-a-0', chain: 'input', action: 'accept', disabled: false, order: 0 },
              ...Array.from({ length: 10 }, (_, i) => ({
                id: `*fwd-a-${i}`,
                chain: 'forward',
                action: i < 6 ? 'accept' : 'drop',
                disabled: false,
                order: 1 + i,
              })),
              { id: '*out-a-0', chain: 'output', action: 'accept', disabled: false, order: 11 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * HighRuleCount
 *
 * A router with many rules across all chains — representative of a production
 * firewall deployment with 60+ rules. Tests layout at high numbers.
 */
export const HighRuleCount: Story = {
  args: {
    selectedChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Production-level rule counts: input (32), forward (24), output (8). ' +
          'Verifies large numbers render correctly inside the stat grid.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [
              ...Array.from({ length: 20 }, (_, i) => ({
                id: `*in-a-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: false,
                order: i,
              })),
              ...Array.from({ length: 8 }, (_, i) => ({
                id: `*in-d-${i}`,
                chain: 'input',
                action: 'drop',
                disabled: false,
                order: 20 + i,
              })),
              ...Array.from({ length: 4 }, (_, i) => ({
                id: `*in-x-${i}`,
                chain: 'input',
                action: 'accept',
                disabled: true,
                order: 28 + i,
              })),
              ...Array.from({ length: 16 }, (_, i) => ({
                id: `*fwd-a-${i}`,
                chain: 'forward',
                action: 'accept',
                disabled: false,
                order: 32 + i,
              })),
              ...Array.from({ length: 6 }, (_, i) => ({
                id: `*fwd-d-${i}`,
                chain: 'forward',
                action: 'drop',
                disabled: false,
                order: 48 + i,
              })),
              ...Array.from({ length: 2 }, (_, i) => ({
                id: `*fwd-r-${i}`,
                chain: 'forward',
                action: 'reject',
                disabled: false,
                order: 54 + i,
              })),
              ...Array.from({ length: 6 }, (_, i) => ({
                id: `*out-a-${i}`,
                chain: 'output',
                action: 'accept',
                disabled: false,
                order: 56 + i,
              })),
              { id: '*out-d-0', chain: 'output', action: 'drop', disabled: false, order: 62 },
              { id: '*out-d-1', chain: 'output', action: 'drop', disabled: false, order: 63 },
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
 * Three skeleton placeholder cards while rule data is being fetched.
 */
export const LoadingState: Story = {
  args: {
    selectedChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state: three animated skeleton cards rendered while ' +
          'rules are fetched from the MikroTik router.',
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
 * EmptyChains
 *
 * Router has no filter rules at all. All three chain cards show 0 rules.
 */
export const EmptyChains: Story = {
  args: {
    selectedChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No firewall rules configured. All three chain cards display 0 totals ' +
          'with empty action distribution bars.',
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
