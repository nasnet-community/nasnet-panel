/**
 * MangleFlowDiagram Storybook Stories
 *
 * Interactive stories for mangle flow diagram pattern component.
 * Demonstrates packet flow visualization, chain selection, and trace mode.
 *
 * @module @nasnet/ui/patterns/mangle-flow-diagram
 */

import { fn } from 'storybook/test';

import { MangleFlowDiagram } from './MangleFlowDiagram';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * MangleFlowDiagram - Visual packet flow through mangle chains
 *
 * The MangleFlowDiagram component visualizes how packets flow through the 5 mangle
 * processing chains in MikroTik RouterOS. It provides an interactive way to understand
 * packet flow and filter rules by chain.
 *
 * ## Packet Flow
 *
 * ```
 * PACKET IN → prerouting → [Routing Decision] → input/forward → output → postrouting → PACKET OUT
 * ```
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (first point, see all packets)
 * - **input**: Packets destined for the router itself
 * - **forward**: Packets passing through the router
 * - **output**: Packets originating from the router
 * - **postrouting**: After routing decision, before packet leaves (last point)
 *
 * ## Features
 *
 * - **Rule count badges**: Shows number of rules in each chain
 * - **Interactive selection**: Click chain to filter rules table
 * - **Trace mode**: Highlight chains that a packet would traverse
 * - **Responsive layout**: Horizontal on desktop, vertical on mobile
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation
 *
 * ## Use Cases
 *
 * - **Learning**: Understand MikroTik packet flow
 * - **Navigation**: Quick filter to specific chain's rules
 * - **Debugging**: Trace packet path through chains
 * - **Documentation**: Visual aid for team training
 *
 * ## Usage
 *
 * ```tsx
 * import { MangleFlowDiagram } from '@nasnet/ui/patterns/mangle-flow-diagram';
 *
 * function FirewallPage() {
 *   const [selectedChain, setSelectedChain] = useState(null);
 *
 *   return (
 *     <MangleFlowDiagram
 *       ruleCounts={{
 *         prerouting: 5,
 *         input: 2,
 *         forward: 10,
 *         output: 3,
 *         postrouting: 4,
 *       }}
 *       selectedChain={selectedChain}
 *       onChainSelect={setSelectedChain}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/MangleFlowDiagram',
  component: MangleFlowDiagram,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Visual diagram showing packet flow through mangle chains with interactive chain selection.',
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
    selectedChain: {
      control: 'select',
      options: ['prerouting', 'input', 'forward', 'output', 'postrouting'],
      description: 'Currently selected chain for filtering',
    },
    traceMode: {
      control: 'boolean',
      description: 'Enable packet trace mode (highlights matching chains)',
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode (smaller, no labels)',
    },
    onChainSelect: { action: 'chain-selected' },
  },
  args: {
    onChainSelect: fn(),
    traceMode: false,
    compact: false,
  },
} satisfies Meta<typeof MangleFlowDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty - No Rules
 *
 * Diagram with no rules configured in any chain.
 * Shows the packet flow structure without rule count badges.
 */
export const Empty: Story = {
  args: {
    ruleCounts: {
      prerouting: 0,
      input: 0,
      forward: 0,
      output: 0,
      postrouting: 0,
    },
    selectedChain: null as any,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty diagram with no rules. Useful for learning packet flow structure before adding rules.',
      },
    },
  },
};

/**
 * With Rules
 *
 * Diagram showing rule counts in each chain.
 * Badges display the number of rules per chain.
 */
export const WithRules: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
  },
  parameters: {
    docs: {
      description: {
        story: 'Diagram with rule counts. Badges show how many rules exist in each chain. Most traffic uses prerouting/forward/postrouting.',
      },
    },
  },
};

/**
 * Chain Selected
 *
 * Shows visual feedback when a chain is selected.
 * Selected chain has border highlight and "Clear Filter" button appears.
 */
export const ChainSelected: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: 'forward',
  },
  parameters: {
    docs: {
      description: {
        story: 'Forward chain selected. Chain button is highlighted and "Clear Filter" button appears. Click chain again to deselect.',
      },
    },
  },
};

/**
 * Trace Mode - Forwarded Traffic
 *
 * Trace mode shows which chains a forwarded packet traverses.
 * Highlighted chains: prerouting → forward → postrouting
 *
 * Use case: Traffic passing through the router (LAN to WAN, WAN to LAN).
 */
export const TraceModeForwarded: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
    traceMode: true,
    highlightedChains: ['prerouting', 'forward', 'postrouting'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Packet trace for forwarded traffic. Shows path: PACKET IN → prerouting → [routing] → forward → postrouting → PACKET OUT. This is the most common path for router traffic.',
      },
    },
  },
};

/**
 * Trace Mode - Local Input
 *
 * Trace mode for packets destined to the router itself.
 * Highlighted chains: prerouting → input
 *
 * Use case: SSH, web interface, DNS requests to router.
 */
export const TraceModeLocalInput: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
    traceMode: true,
    highlightedChains: ['prerouting', 'input'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Packet trace for local input (to router). Shows path: PACKET IN → prerouting → [routing] → input. Used for router services (SSH, WebFig, DNS).',
      },
    },
  },
};

/**
 * Trace Mode - Local Output
 *
 * Trace mode for packets originating from the router.
 * Highlighted chains: output → postrouting
 *
 * Use case: Router-generated traffic (NTP, DNS queries, updates).
 */
export const TraceModeLocalOutput: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
    traceMode: true,
    highlightedChains: ['output', 'postrouting'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Packet trace for local output (from router). Shows path: output → postrouting → PACKET OUT. Used for router-generated traffic (NTP, DNS resolver, updates).',
      },
    },
  },
};

/**
 * Mobile Layout
 *
 * Vertical layout optimized for mobile devices.
 * Chains stack vertically with downward arrows.
 */
export const MobileLayout: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: 'forward',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile vertical layout. Chains stack top-to-bottom with downward arrows. Optimized for narrow screens.',
      },
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
      const cacheEntry = require.cache[require.resolve('@nasnet/ui/layouts')];
      if (cacheEntry) {
        cacheEntry.exports = mockedModule;
      }

      return <Story />;
    },
  ],
};

/**
 * Desktop Layout
 *
 * Horizontal layout optimized for desktop.
 * Chains flow left-to-right with right arrows and legend.
 */
export const DesktopLayout: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop horizontal layout. Chains flow left-to-right with legend showing incoming/routing/outgoing colors.',
      },
    },
  },
};

/**
 * Heavy Traffic Distribution
 *
 * Realistic rule distribution for a production router.
 * Most rules in prerouting (marking) and forward (routing).
 */
export const HeavyTraffic: Story = {
  args: {
    ruleCounts: {
      prerouting: 25, // Heavy marking for QoS
      input: 5,       // Few rules for local services
      forward: 42,    // Most traffic forwarding rules
      output: 3,      // Minimal local output rules
      postrouting: 18, // NAT and post-routing marks
    },
    selectedChain: null as any,
  },
  parameters: {
    docs: {
      description: {
        story: 'Realistic production scenario. Most rules in prerouting (QoS marking) and forward (traffic routing). Input/output have fewer rules.',
      },
    },
  },
};

/**
 * Compact Mode
 *
 * Smaller diagram without labels.
 * Useful for dashboards or embedded views.
 */
export const CompactMode: Story = {
  args: {
    ruleCounts: {
      prerouting: 8,
      input: 3,
      forward: 15,
      output: 5,
      postrouting: 6,
    },
    selectedChain: null as any,
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode with smaller size and minimal labels. Suitable for dashboard widgets or embedded views.',
      },
    },
  },
};
