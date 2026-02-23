/**
 * RawPage Storybook Stories
 *
 * Interactive stories for RAW page domain component.
 * Demonstrates page states, chain tabs, wizards, and performance section.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { RawRule } from '@nasnet/core/types';

import { RawPage } from './RawPage';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

/**
 * RawPage - RAW firewall rules management page
 *
 * The RawPage component provides the main interface for managing RAW firewall rules
 * with chain tabs, quick action buttons, and performance explanations.
 *
 * ## Features
 *
 * - **Chain Tabs**: Switch between prerouting and output chains
 * - **Quick Actions**: Add Rule, Bogon Filter wizard
 * - **Notice Banner**: Explains RAW table purpose and use cases
 * - **Performance Section**: Collapsible explanation of RAW vs Filter
 * - **Empty State**: Helpful guidance when no rules exist
 * - **Loading Skeletons**: Smooth loading experience
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (all incoming packets)
 * - **output**: Packets originating from router
 *
 * ## Usage
 *
 * ```tsx
 * import { RawPage } from '@nasnet/features/firewall/pages';
 *
 * function MyApp() {
 *   return <RawPage />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/RawPage',
  component: RawPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'RAW firewall rules management page with chain tabs and wizards.',
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
        <div className="min-h-screen bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RawPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty Prerouting Chain
 *
 * No rules in prerouting chain - shows empty state with suggested actions.
 * Notice banner explains RAW table purpose.
 */
export const EmptyPrerouting: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
      rules: [],
      isLoading: false,
    },
  },
};

/**
 * Empty Output Chain
 *
 * No rules in output chain - shows empty state.
 */
export const EmptyOutput: Story = {
  parameters: {
    mockData: {
      chain: 'output',
      rules: [],
      isLoading: false,
    },
  },
};

/**
 * With Rules - Prerouting
 *
 * Prerouting chain with multiple configured rules.
 * Shows notice banner and populated table.
 */
export const WithRulesPrerouting: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
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
          order: 0,
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
          order: 1,
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
          order: 2,
        },
        {
          id: '*4',
          chain: 'prerouting',
          action: 'drop',
          protocol: 'tcp',
          comment: 'Rate limit SYN packets (DDoS protection)',
          disabled: false,
          packets: 156,
          bytes: 9360,
          order: 3,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * With Rules - Output
 *
 * Output chain with configured rules.
 */
export const WithRulesOutput: Story = {
  parameters: {
    mockData: {
      chain: 'output',
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
          order: 0,
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
          order: 1,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * Loading State
 *
 * Shows loading skeletons while fetching rules from router.
 */
export const Loading: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
      rules: [],
      isLoading: true,
    },
  },
};

/**
 * Performance Section Expanded
 *
 * Shows the collapsible performance explanation section in expanded state.
 * Includes RAW vs Filter comparison and packet flow diagram.
 */
export const PerformanceSectionExpanded: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
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
          order: 0,
        },
      ] as RawRule[],
      isLoading: false,
      performanceSectionExpanded: true,
    },
  },
};

/**
 * High Traffic Scenario
 *
 * Shows rules with high packet/byte counts typical of production routers.
 */
export const HighTrafficScenario: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
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
          order: 0,
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
          order: 1,
        },
        {
          id: '*3',
          chain: 'prerouting',
          action: 'drop',
          protocol: 'tcp',
          comment: 'SYN flood protection',
          disabled: false,
          packets: 452156,
          bytes: 27129360,
          order: 2,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * Mobile View
 *
 * Mobile-optimized layout with bottom navigation and card-based rules.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    mockData: {
      chain: 'prerouting',
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
          order: 0,
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
          order: 1,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * Tablet View
 *
 * Tablet layout with collapsible sidebar and hybrid density.
 */
export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    mockData: {
      chain: 'prerouting',
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
          order: 0,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * With Disabled Rules
 *
 * Shows mix of enabled and disabled rules with appropriate styling.
 */
export const WithDisabledRules: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
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
          order: 0,
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
          order: 1,
        },
        {
          id: '*3',
          chain: 'prerouting',
          action: 'notrack',
          protocol: 'udp',
          dstPort: '53',
          comment: 'DNS notrack (DISABLED for debugging)',
          disabled: true,
          packets: 0,
          bytes: 0,
          order: 2,
        },
      ] as RawRule[],
      isLoading: false,
    },
  },
};

/**
 * Notice Banner Variants
 *
 * Shows the info notice banner explaining RAW table purpose prominently.
 */
export const NoticeBannerFocus: Story = {
  parameters: {
    mockData: {
      chain: 'prerouting',
      rules: [],
      isLoading: false,
    },
  },
};
