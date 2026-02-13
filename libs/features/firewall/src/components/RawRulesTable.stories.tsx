/**
 * RawRulesTable Storybook Stories
 *
 * Interactive stories for RAW rules table domain component.
 * Demonstrates table states, drag-drop reordering, and platform variants.
 *
 * @module @nasnet/features/firewall/components
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { RawRulesTable } from './RawRulesTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RawRule } from '@nasnet/core/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

/**
 * RawRulesTable - RAW firewall rules display and management
 *
 * The RawRulesTable component displays RAW firewall rules in a sortable, filterable table
 * with drag-drop reordering and inline enable/disable toggles.
 *
 * ## Features
 *
 * - **Platform Adaptive**: Desktop table vs mobile card layout
 * - **Drag-drop Reordering**: Change rule position via drag-drop (desktop only)
 * - **Inline Toggle**: Enable/disable rules with optimistic updates
 * - **Counter Visualization**: Packet/byte counters with mini sparklines
 * - **CRUD Actions**: Edit, duplicate, delete with Safety Pipeline
 * - **Empty State**: Helpful empty state with suggested actions
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (processes all incoming packets)
 * - **output**: Packets originating from router
 *
 * ## Usage
 *
 * ```tsx
 * import { RawRulesTable } from '@nasnet/features/firewall/components';
 *
 * function MyComponent() {
 *   return <RawRulesTable chain="prerouting" />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/RawRulesTable',
  component: RawRulesTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'RAW firewall rules table with drag-drop reordering and platform-specific layouts.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  argTypes: {
    chain: {
      control: 'radio',
      options: ['prerouting', 'output', undefined],
      description: 'Filter by chain (undefined = all chains)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    chain: 'prerouting',
  },
} satisfies Meta<typeof RawRulesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty State
 *
 * No rules configured yet - shows helpful empty state with suggested actions.
 */
export const Empty: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      rules: [],
    },
  },
};

/**
 * With Rules - Prerouting Chain
 *
 * Multiple RAW rules in prerouting chain with various actions (drop, notrack, accept).
 * Demonstrates counter visualization and enabled/disabled states.
 */
export const WithRules: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '0.0.0.0/8',
          inInterface: 'ether1',
          comment: 'Drop bogon network - this network',
          disabled: false,
          packets: 42185,
          bytes: 3374800,
          position: 0,
        },
        {
          id: '*2',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '127.0.0.0/8',
          inInterface: 'ether1',
          comment: 'Drop bogon - loopback on WAN',
          disabled: false,
          packets: 0,
          bytes: 0,
          position: 1,
        },
        {
          id: '*3',
          chain: 'prerouting',
          action: 'notrack',
          protocol: 'udp',
          dstPort: '123',
          comment: 'Bypass conntrack for NTP',
          disabled: false,
          packets: 8523,
          bytes: 682400,
          position: 2,
        },
        {
          id: '*4',
          chain: 'prerouting',
          action: 'drop',
          protocol: 'tcp',
          tcpFlags: 'syn',
          limit: '50/5s,100:packet',
          comment: 'Rate limit SYN packets (DDoS protection)',
          disabled: false,
          packets: 156,
          bytes: 9360,
          position: 3,
        },
        {
          id: '*5',
          chain: 'prerouting',
          action: 'accept',
          srcAddressList: 'trusted_networks',
          comment: 'Accept from trusted address list',
          disabled: true,
          packets: 0,
          bytes: 0,
          position: 4,
        },
      ] as RawRule[],
    },
  },
};

/**
 * With Rules - Output Chain
 *
 * RAW rules in output chain (packets originating from router).
 */
export const OutputChain: Story = {
  args: {
    chain: 'output',
  },
  parameters: {
    mockData: {
      rules: [
        {
          id: '*6',
          chain: 'output',
          action: 'notrack',
          protocol: 'udp',
          dstPort: '53',
          comment: 'Bypass conntrack for DNS queries',
          disabled: false,
          packets: 15240,
          bytes: 1219200,
          position: 0,
        },
        {
          id: '*7',
          chain: 'output',
          action: 'accept',
          dstAddress: '192.168.88.0/24',
          comment: 'Accept to LAN',
          disabled: false,
          packets: 98452,
          bytes: 145872000,
          position: 1,
        },
      ] as RawRule[],
    },
  },
};

/**
 * Loading State
 *
 * Skeleton loading while fetching rules from router.
 */
export const Loading: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      isLoading: true,
    },
  },
};

/**
 * With Disabled Rules
 *
 * Shows how disabled rules appear with opacity-50 and muted styling.
 */
export const WithDisabledRules: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '192.168.0.0/16',
          inInterface: 'ether1',
          comment: 'Drop RFC1918 on WAN (DISABLED for testing)',
          disabled: true,
          packets: 0,
          bytes: 0,
          position: 0,
        },
        {
          id: '*2',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '10.0.0.0/8',
          inInterface: 'ether1',
          comment: 'Drop RFC1918 Class A (active)',
          disabled: false,
          packets: 2341,
          bytes: 187280,
          position: 1,
        },
      ] as RawRule[],
    },
  },
};

/**
 * High Traffic Rules
 *
 * Rules with high packet/byte counts to demonstrate counter visualization.
 */
export const HighTrafficRules: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '0.0.0.0/8',
          inInterface: 'ether1',
          comment: 'Bogon filter - heavy traffic',
          disabled: false,
          packets: 18523456,
          bytes: 1481876480,
          position: 0,
        },
        {
          id: '*2',
          chain: 'prerouting',
          action: 'notrack',
          protocol: 'udp',
          dstPort: '53',
          comment: 'DNS notrack - high volume',
          disabled: false,
          packets: 9234567,
          bytes: 738765360,
          position: 1,
        },
      ] as RawRule[],
    },
  },
};

/**
 * Mobile View
 *
 * Card-based layout optimized for mobile devices with touch-friendly controls.
 */
export const MobileView: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '0.0.0.0/8',
          inInterface: 'ether1',
          comment: 'Drop bogon network',
          disabled: false,
          packets: 42185,
          bytes: 3374800,
          position: 0,
        },
        {
          id: '*2',
          chain: 'prerouting',
          action: 'notrack',
          protocol: 'udp',
          dstPort: '123',
          comment: 'Bypass conntrack for NTP',
          disabled: false,
          packets: 8523,
          bytes: 682400,
          position: 1,
        },
      ] as RawRule[],
    },
  },
};

/**
 * Tablet View
 *
 * Hybrid layout for tablet devices (640-1024px).
 */
export const TabletView: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '0.0.0.0/8',
          comment: 'Bogon filter',
          disabled: false,
          packets: 42185,
          bytes: 3374800,
          position: 0,
        },
      ] as RawRule[],
    },
  },
};

/**
 * With Unused Rules
 *
 * Rules with zero packet matches showing "No matches" badge.
 */
export const WithUnusedRules: Story = {
  args: {
    chain: 'prerouting',
  },
  parameters: {
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '198.51.100.0/24',
          comment: 'TEST-NET-2 (no matches yet)',
          disabled: false,
          packets: 0,
          bytes: 0,
          position: 0,
        },
        {
          id: '*2',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '203.0.113.0/24',
          comment: 'TEST-NET-3 (no matches)',
          disabled: false,
          packets: 0,
          bytes: 0,
          position: 1,
        },
        {
          id: '*3',
          chain: 'prerouting',
          action: 'drop',
          srcAddress: '0.0.0.0/8',
          comment: 'Active bogon drop',
          disabled: false,
          packets: 42185,
          bytes: 3374800,
          position: 2,
        },
      ] as RawRule[],
    },
  },
};
