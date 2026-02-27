/**
 * MangleRulesTable Storybook Stories
 *
 * Interactive stories for mangle rules table domain component.
 * Demonstrates data display, drag-drop reordering, and responsive variants.
 *
 * @module @nasnet/features/firewall
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { MangleRule } from '@nasnet/core/types';

import { MangleRulesTable } from './MangleRulesTable';

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

// Create a wrapper with QueryClient for React Query hooks
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
 * MangleRulesTable - Domain component for mangle rules management
 *
 * The MangleRulesTable component provides a comprehensive interface for viewing
 * and managing MikroTik mangle rules with drag-drop reordering, inline toggles,
 * and action buttons.
 *
 * ## Features
 *
 * - **Drag-drop reordering**: Reorder rules with visual feedback using dnd-kit
 * - **Inline toggle**: Enable/disable rules without opening editor
 * - **Action buttons**: Edit, Duplicate, Delete with confirmation
 * - **Rule counters**: Packets/bytes hit counts for each rule
 * - **Disabled styling**: Visual indication for disabled rules (opacity-50)
 * - **Unused rules badge**: Highlight rules with 0 hits
 * - **Action badges**: Color-coded badges for different action types
 * - **Responsive**: Desktop table view, mobile card view
 *
 * ## Action Badge Colors
 *
 * - **mark-connection**: Blue - Traffic identification
 * - **mark-packet**: Purple - Per-packet marking
 * - **mark-routing**: Green - Policy routing
 * - **change-dscp**: Orange - QoS prioritization
 * - **change-ttl/mss**: Cyan/Pink - Advanced manipulation
 * - **accept**: Green - Terminal allow
 * - **drop**: Red - Terminal block
 * - **jump**: Indigo - Chain jumping
 * - **log**: Gray - Logging
 *
 * ## Usage
 *
 * ```tsx
 * import { MangleRulesTable } from '@nasnet/features/firewall';
 *
 * function ManglePage() {
 *   return (
 *     <div className="p-6">
 *       <h1>Mangle Rules</h1>
 *       <MangleRulesTable />
 *     </div>
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/MangleRulesTable',
  component: MangleRulesTable,
  decorators: [
    (Story) => (
      <QueryWrapper>
        <Story />
      </QueryWrapper>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Mangle rules table with drag-drop reordering, inline toggles, and action buttons.',
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
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text', description: 'Optional CSS class name' },
    chain: { control: 'text', description: 'Optional firewall chain filter' },
  },
  args: {},
} satisfies Meta<typeof MangleRulesTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Mock Data
// ============================================================================

const mockRules: MangleRule[] = [
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
    comment: 'Mark VoIP SIP signaling traffic',
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
  {
    id: '*3',
    chain: 'prerouting',
    action: 'change-dscp',
    position: 2,
    newDscp: 46, // EF - Expedited Forwarding for VoIP
    connectionMark: 'voip_traffic',
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Set EF DSCP for VoIP traffic',
    packets: 104690,
    bytes: 53246891,
  },
  {
    id: '*4',
    chain: 'prerouting',
    action: 'mark-connection',
    position: 3,
    newConnectionMark: 'gaming_traffic',
    protocol: 'tcp',
    dstPort: '27015-27030',
    connectionState: ['new'],
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Mark Steam gaming traffic',
    packets: 5678,
    bytes: 2345678,
  },
  {
    id: '*5',
    chain: 'forward',
    action: 'mark-routing',
    position: 4,
    newRoutingMark: 'wan2_route',
    srcAddress: '192.168.2.0/24',
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Route guest network through WAN2',
    packets: 234567,
    bytes: 123456789,
  },
  {
    id: '*6',
    chain: 'forward',
    action: 'drop',
    position: 5,
    protocol: 'tcp',
    dstPort: '25',
    passthrough: true,
    comment: 'Block outbound SMTP (prevent spam)',
    disabled: true, // Disabled rule
    log: true,
    logPrefix: 'BLOCKED_SMTP: ',
    packets: 0,
    bytes: 0,
  },
  {
    id: '*7',
    chain: 'prerouting',
    action: 'mark-connection',
    position: 6,
    newConnectionMark: 'video_streaming',
    protocol: 'tcp',
    dstPort: '80,443',
    srcAddress: '192.168.1.0/24',
    layer7Protocol: 'youtube',
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Mark YouTube traffic for shaping',
    packets: 456789,
    bytes: 987654321,
  },
  {
    id: '*8',
    chain: 'postrouting',
    action: 'change-dscp',
    position: 7,
    newDscp: 0, // Best effort (reset DSCP)
    outInterface: 'ether1-wan',
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Reset DSCP on WAN interface',
    packets: 1234567,
    bytes: 5678901234,
  },
  {
    id: '*9',
    chain: 'forward',
    action: 'log',
    position: 8,
    protocol: 'icmp',
    passthrough: true,
    logPrefix: 'ICMP_FORWARD: ',
    disabled: false,
    log: true,
    comment: 'Log forwarded ICMP for debugging',
    packets: 0, // Unused rule (0 hits)
    bytes: 0,
  },
  {
    id: '*10',
    chain: 'input',
    action: 'accept',
    position: 9,
    protocol: 'tcp',
    dstPort: '22',
    srcAddress: '192.168.1.0/24',
    passthrough: true,
    disabled: false,
    log: false,
    comment: 'Allow SSH from LAN',
    packets: 3456,
    bytes: 789012,
  },
];

// ============================================================================
// Stories
// ============================================================================

/**
 * Empty State
 *
 * Shows empty state message when no rules are configured.
 * Displays helpful message to guide users to create their first rule.
 */
export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state with no mangle rules configured. Shows helpful message with call-to-action.',
      },
    },
    msw: {
      handlers: [
        // Mock empty response
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: [] },
        },
      ],
    },
  },
};

/**
 * With Rules
 *
 * Populated table showing various rule types and configurations.
 * Demonstrates action badges, chain badges, matchers, and counters.
 */
export const WithRules: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Table with 10 mangle rules showing various action types, chains, and matchers. Includes VoIP QoS, gaming traffic, policy routing, and security rules.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
      ],
    },
  },
};

/**
 * Loading State
 *
 * Shows loading skeleton while fetching rules from RouterOS.
 * Displays table structure with skeleton rows.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Loading state with skeleton rows. Shown while fetching rules from MikroTik router.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: async () => {
            // Delay to show loading state
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return { data: mockRules };
          },
        },
      ],
    },
  },
};

/**
 * Drag Reorder
 *
 * Demonstrates drag-and-drop reordering functionality.
 * Shows grip handle, drag preview, and position updates.
 */
export const DragReorder: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Drag-drop reordering in action. Grab the grip handle (⋮⋮) on the left to reorder rules. Position changes are persisted to RouterOS via API.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
        {
          url: '/api/routers/:routerId/mangle/rules/move',
          method: 'post',
          response: { success: true },
        },
      ],
    },
  },
};

/**
 * Mobile View
 *
 * Responsive mobile variant with card-based layout.
 * Shows rule cards instead of table, optimized for touch.
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile card-based layout. Each rule is a card with touch-optimized 44px action buttons. Swipeable for quick actions.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules.slice(0, 5) }, // Fewer rules for mobile demo
        },
      ],
    },
  },
  decorators: [
    (Story) => {
      // Mock usePlatform to return 'mobile'
      const originalModule = require('@nasnet/ui/layouts');
      const mockedModule = {
        ...originalModule,
        usePlatform: () => 'mobile',
      };
      require.cache[require.resolve('@nasnet/ui/layouts')]!.exports = mockedModule;

      return <Story />;
    },
  ],
};

/**
 * With Disabled Rules
 *
 * Shows mix of enabled and disabled rules.
 * Disabled rules have reduced opacity and toggle is off.
 */
export const WithDisabledRules: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Table with disabled rules. Disabled rules (#6) shown with opacity-50 and toggle switch off. Can be quickly enabled with inline toggle.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
      ],
    },
  },
};

/**
 * With Unused Rules
 *
 * Highlights rules with 0 packet/byte counts.
 * Shows "Unused" badge to help identify ineffective rules.
 */
export const WithUnusedRules: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Table highlighting unused rules (0 hits). Rule #9 shows "Unused" badge to help identify rules that never match traffic.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
      ],
    },
  },
};

/**
 * Edit Rule Flow
 *
 * Shows edit dialog opened for a specific rule.
 * Demonstrates edit button → dialog → save flow.
 */
export const EditRuleFlow: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Edit rule dialog opened. Click Edit button on any rule to open editor with pre-filled data. Changes are saved back to RouterOS.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
        {
          url: '/api/routers/:routerId/mangle/rules/:ruleId',
          method: 'put',
          response: { success: true },
        },
      ],
    },
  },
};

/**
 * Delete Confirmation
 *
 * Shows Safety Pipeline confirmation dialog before deletion.
 * Dangerous action requires explicit confirmation.
 */
export const DeleteConfirmation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Delete confirmation dialog (Safety Pipeline pattern). Dangerous actions require explicit confirmation with countdown timer.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: { data: mockRules },
        },
        {
          url: '/api/routers/:routerId/mangle/rules/:ruleId',
          method: 'delete',
          response: { success: true },
        },
      ],
    },
  },
};

/**
 * Complex QoS Setup
 *
 * Real-world QoS example with VoIP prioritization.
 * Shows mark-connection → mark-packet → change-dscp flow.
 */
export const ComplexQoSSetup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Real-world VoIP QoS configuration. Rules work together: mark-connection (identify), mark-packet (tag), change-dscp (prioritize). This is a common pattern for traffic shaping.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: {
            data: mockRules.filter(
              (r) =>
                r.comment &&
                (r.comment.toLowerCase().includes('voip') ||
                  r.comment.toLowerCase().includes('gaming'))
            ),
          },
        },
      ],
    },
  },
};

/**
 * Multi-WAN Policy Routing
 *
 * Policy-based routing example with mark-routing.
 * Shows how to route different subnets through different WAN interfaces.
 */
export const MultiWANPolicyRouting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Policy-based routing for multi-WAN setup. mark-routing action assigns routing marks to steer traffic through specific WAN interfaces based on source subnet.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/mangle/rules',
          method: 'get',
          response: {
            data: mockRules.filter((r) => r.action === 'mark-routing'),
          },
        },
      ],
    },
  },
};
