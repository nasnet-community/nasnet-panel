/**
 * ManglePage Storybook Stories
 *
 * Interactive stories for the Mangle page domain component.
 * Demonstrates chain tabs, flow diagram, rule editor, and various data states.
 *
 * @module @nasnet/features/firewall/pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ManglePage } from './ManglePage';

import type { Meta, StoryObj } from '@storybook/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
  },
});

/**
 * ManglePage - Mangle firewall rules management page
 *
 * The ManglePage provides the main interface for managing MikroTik mangle rules
 * with multi-chain tab navigation and a visual packet flow diagram.
 *
 * ## Features
 *
 * - **Chain Tabs**: All / prerouting / input / forward / output / postrouting
 * - **View Flow**: Opens MangleFlowDiagram dialog showing packet processing stages
 * - **Add Rule**: Opens MangleRuleEditor in a Sheet (bottom on mobile, right on desktop)
 * - **MangleRulesTable**: Drag-drop, inline toggle, action badges per chain
 * - **Empty States**: Chain-specific guidance when no rules are configured
 * - **Loading Skeletons**: Animated skeleton rows during data fetch
 * - **Responsive**: Table on desktop, card-based on mobile
 * - **Accessibility**: WCAG AAA compliant with ARIA roles and keyboard navigation
 *
 * ## Mangle Chains (MikroTik Packet Flow Order)
 *
 * 1. **prerouting**: All incoming packets before routing decision
 * 2. **input**: Packets destined for the router itself
 * 3. **forward**: Packets passing through the router
 * 4. **output**: Packets originating from the router
 * 5. **postrouting**: All outgoing packets after routing decision
 *
 * ## Common Use Cases
 *
 * - QoS traffic marking (VoIP, gaming, streaming)
 * - Policy-based routing (multi-WAN)
 * - DSCP marking for downstream QoS
 * - Connection marking for queue trees
 *
 * ## Usage
 *
 * ```tsx
 * import { ManglePage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <ManglePage />;
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/Pages/ManglePage',
  component: ManglePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main page for managing mangle rules with 5-chain tab navigation (prerouting/input/forward/output/postrouting), visual flow diagram, and responsive rule editor.',
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
} satisfies Meta<typeof ManglePage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Empty State - All Chains
 *
 * No mangle rules configured across any chain. Shows the generic empty state
 * on the "All" tab with a single "Add Mangle Rule" CTA.
 */
export const EmptyAllChains: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state on the "All" tab. Generic guidance to create the first mangle rule. "View Flow" button is still accessible to explain the packet processing model.',
      },
    },
    mockData: {
      rules: [],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};

/**
 * Empty State - Specific Chain
 *
 * The prerouting chain has no rules. Shows a chain-specific empty state
 * that names the chain in the message, guiding users to the right context.
 */
export const EmptyPreroutingChain: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Chain-specific empty state on the "prerouting" tab. Message is customized to reference the chain name, helping users understand where to add QoS marking rules.',
      },
    },
    mockData: {
      rules: [],
      isLoading: false,
      selectedChain: 'prerouting',
    },
  },
};

/**
 * With QoS Mangle Rules
 *
 * Real-world QoS configuration showing mark-connection, mark-packet, and change-dscp
 * rules across prerouting and forward chains. Classic VoIP prioritization setup.
 */
export const WithQoSRules: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Populated view with VoIP QoS mangle rules. Demonstrates the three-stage QoS pattern: mark-connection (identify traffic), mark-packet (tag packets), change-dscp (set priority). Visible across prerouting and forward chains.',
      },
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'mark-connection',
          position: 0,
          newConnectionMark: 'voip_traffic',
          protocol: 'udp',
          dstPort: '5060-5061',
          connectionState: ['new'],
          passthrough: true,
          disabled: false,
          log: false,
          comment: 'Mark VoIP SIP signaling',
          packets: 15234,
          bytes: 8123456,
        },
        {
          id: '*2',
          chain: 'forward',
          action: 'mark-packet',
          position: 1,
          newPacketMark: 'voip_rtp',
          protocol: 'udp',
          dstPort: '10000-20000',
          connectionMark: 'voip_traffic',
          passthrough: false,
          disabled: false,
          log: false,
          comment: 'Mark VoIP RTP packets for queue tree',
          packets: 89456,
          bytes: 45123789,
        },
        {
          id: '*3',
          chain: 'prerouting',
          action: 'change-dscp',
          position: 2,
          newDscp: 46,
          connectionMark: 'voip_traffic',
          disabled: false,
          log: false,
          comment: 'Set EF DSCP (46) for VoIP - Expedited Forwarding',
          packets: 104690,
          bytes: 53246891,
        },
        {
          id: '*4',
          chain: 'prerouting',
          action: 'mark-connection',
          position: 3,
          newConnectionMark: 'guest_traffic',
          srcAddress: '192.168.2.0/24',
          passthrough: true,
          disabled: false,
          log: false,
          comment: 'Mark guest network connections',
          packets: 234567,
          bytes: 98765432,
        },
        {
          id: '*5',
          chain: 'forward',
          action: 'mark-routing',
          position: 4,
          newRoutingMark: 'wan2_route',
          connectionMark: 'guest_traffic',
          passthrough: false,
          disabled: false,
          log: false,
          comment: 'Route guest traffic via WAN2',
          packets: 234560,
          bytes: 98760000,
        },
        {
          id: '*6',
          chain: 'postrouting',
          action: 'change-dscp',
          position: 5,
          newDscp: 0,
          outInterface: 'ether1',
          disabled: false,
          log: false,
          comment: 'Reset DSCP on WAN egress (carrier compliance)',
          packets: 1234567,
          bytes: 5678901234,
        },
      ],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};

/**
 * Loading State
 *
 * Animated skeleton rows while mangle rules are being fetched from the router.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Loading state with pulse skeleton rows. Displayed while the ManglePage fetches rules from RouterOS. Chain tabs remain visible and interactive.',
      },
    },
    mockData: {
      rules: [],
      isLoading: true,
      selectedChain: 'all',
    },
  },
};

/**
 * Mobile View
 *
 * Mobile layout (<640px) with scrollable chain tabs and card-based rule display.
 * "View Flow" and "Add Rule" buttons in the header; sheet opens from the bottom.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile-responsive layout (<640px). Chain tabs scroll horizontally (overflow-x-auto). Rule editor Sheet opens from the bottom (h-[90vh]). Touch-optimized 44px buttons.',
      },
    },
    mockData: {
      rules: [
        {
          id: '*1',
          chain: 'prerouting',
          action: 'mark-connection',
          position: 0,
          newConnectionMark: 'voip_traffic',
          protocol: 'udp',
          dstPort: '5060-5061',
          connectionState: ['new'],
          passthrough: true,
          disabled: false,
          log: false,
          comment: 'Mark VoIP SIP signaling',
          packets: 15234,
          bytes: 8123456,
        },
        {
          id: '*2',
          chain: 'forward',
          action: 'mark-packet',
          position: 1,
          newPacketMark: 'voip_rtp',
          protocol: 'udp',
          dstPort: '10000-20000',
          connectionMark: 'voip_traffic',
          passthrough: false,
          disabled: false,
          log: false,
          comment: 'Mark VoIP RTP packets',
          packets: 89456,
          bytes: 45123789,
        },
      ],
      isLoading: false,
      selectedChain: 'all',
    },
  },
};
