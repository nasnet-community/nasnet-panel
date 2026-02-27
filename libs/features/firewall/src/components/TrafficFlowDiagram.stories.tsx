/**
 * TrafficFlowDiagram Storybook Stories
 *
 * Stories for the SVG packet-flow visualization component.
 * Demonstrates chain highlighting, animated traffic paths, and interactive node clicking.
 *
 * @module @nasnet/features/firewall
 */

import { fn } from 'storybook/test';

import type { FirewallChain } from '@nasnet/core/types';

import { TrafficFlowDiagram } from './TrafficFlowDiagram';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * TrafficFlowDiagram - SVG visualization of packet flow through firewall chains
 *
 * Renders an interactive SVG diagram showing how packets travel through the
 * MikroTik netfilter pipeline: IN → PREROUTING → (routing decision) →
 * FORWARD → POSTROUTING → OUT, and the local process path through INPUT →
 * Local Process → OUTPUT.
 *
 * ## Features
 *
 * - **Animated dashed paths**: Moving dashes show live traffic direction
 * - **Interactive chain nodes**: Click any chain node to filter the rule table
 * - **Rule counts**: Each chain node shows its active rule count
 * - **Highlighted paths**: Active chain highlights adjacent paths in primary color
 * - **Routing decision diamond**: Non-clickable routing decision node
 * - **Local Process capsule**: Secondary-colored pill representing the router process
 * - **Responsive**: Horizontally scrollable on narrow viewports (min-width 600px)
 *
 * ## Usage
 *
 * ```tsx
 * const [activeChain, setActiveChain] = useState<FirewallChain | null>(null);
 *
 * <TrafficFlowDiagram
 *   activeChain={activeChain}
 *   onChainClick={setActiveChain}
 * />
 * ```
 */
const meta = {
  title: 'Features/Firewall/TrafficFlowDiagram',
  component: TrafficFlowDiagram,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive SVG diagram visualizing packet flow through MikroTik firewall chains. ' +
          'Animated dashed lines show traffic direction; clicking a chain node filters the rule table.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  argTypes: {
    activeChain: {
      control: 'radio',
      options: [null, 'input', 'forward', 'output', 'prerouting', 'postrouting'],
      description: 'Currently highlighted chain node and its adjacent paths',
    },
    onChainClick: {
      action: 'chainClicked',
      description: 'Callback fired when a chain node is clicked',
    },
  },
  args: {
    activeChain: null,
    onChainClick: fn(),
  },
} satisfies Meta<typeof TrafficFlowDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * Diagram with no active chain. All paths use the muted slate color.
 * Rule counts are populated from the connected router data.
 */
export const Default: Story = {
  args: {
    activeChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state: all chain nodes idle, paths shown in muted slate. ' +
          'Click any node to highlight it and its associated traffic paths.',
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
              { id: '*2', chain: 'input', action: 'drop', disabled: false, order: 1 },
              { id: '*3', chain: 'forward', action: 'accept', disabled: false, order: 2 },
              { id: '*4', chain: 'forward', action: 'drop', disabled: false, order: 3 },
              { id: '*5', chain: 'forward', action: 'reject', disabled: false, order: 4 },
              { id: '*6', chain: 'output', action: 'accept', disabled: false, order: 5 },
            ],
          },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: {
            data: [
              { id: '*n1', chain: 'srcnat', action: 'masquerade', disabled: false, order: 0 },
              { id: '*n2', chain: 'dstnat', action: 'dst-nat', disabled: false, order: 1 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * InputChainActive
 *
 * The INPUT chain node is highlighted, along with the routing → input
 * and input → local process paths rendered in primary color.
 */
export const InputChainActive: Story = {
  args: {
    activeChain: 'input' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'INPUT chain is active. The node renders with primary fill, ' +
          'and the routing-decision → INPUT and INPUT → Local Process paths glow.',
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
              { id: '*4', chain: 'forward', action: 'accept', disabled: false, order: 3 },
              { id: '*5', chain: 'output', action: 'accept', disabled: false, order: 4 },
            ],
          },
        },
        { url: '/api/routers/:routerId/firewall/nat', method: 'get', response: { data: [] } },
      ],
    },
  },
};

/**
 * ForwardChainActive
 *
 * FORWARD chain highlighted — the path from routing → FORWARD → POSTROUTING
 * is rendered with the primary animated overlay.
 */
export const ForwardChainActive: Story = {
  args: {
    activeChain: 'forward' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'FORWARD chain is active. Paths from routing-decision through FORWARD ' +
          'and on to POSTROUTING highlight in primary color.',
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
              { id: '*2', chain: 'forward', action: 'accept', disabled: false, order: 1 },
              { id: '*3', chain: 'forward', action: 'accept', disabled: false, order: 2 },
              { id: '*4', chain: 'forward', action: 'drop', disabled: false, order: 3 },
              { id: '*5', chain: 'forward', action: 'drop', disabled: false, order: 4 },
              { id: '*6', chain: 'output', action: 'accept', disabled: false, order: 5 },
            ],
          },
        },
        { url: '/api/routers/:routerId/firewall/nat', method: 'get', response: { data: [] } },
      ],
    },
  },
};

/**
 * OutputChainActive
 *
 * OUTPUT chain highlighted — shows the Local Process → OUTPUT → POSTROUTING path.
 */
export const OutputChainActive: Story = {
  args: {
    activeChain: 'output' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'OUTPUT chain active. Highlights Local Process → OUTPUT → POSTROUTING paths. ' +
          'These rules govern traffic that originates from the router itself.',
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
              { id: '*2', chain: 'forward', action: 'accept', disabled: false, order: 1 },
              { id: '*3', chain: 'output', action: 'accept', disabled: false, order: 2 },
              { id: '*4', chain: 'output', action: 'accept', disabled: false, order: 3 },
            ],
          },
        },
        { url: '/api/routers/:routerId/firewall/nat', method: 'get', response: { data: [] } },
      ],
    },
  },
};

/**
 * WithNATRules
 *
 * Both filter rules and NAT rules contribute to node counts.
 * PREROUTING and POSTROUTING nodes show non-zero counters from masquerade/dst-nat.
 */
export const WithNATRules: Story = {
  args: {
    activeChain: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'NAT rules are counted alongside filter rules. PREROUTING gets 2 dst-nat rules, ' +
          'POSTROUTING gets 1 masquerade rule. Nodes with rules show a darker fill.',
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
              { id: '*2', chain: 'forward', action: 'accept', disabled: false, order: 1 },
              { id: '*3', chain: 'forward', action: 'drop', disabled: false, order: 2 },
              { id: '*4', chain: 'output', action: 'accept', disabled: false, order: 3 },
            ],
          },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: {
            data: [
              { id: '*n1', chain: 'dstnat', action: 'dst-nat', disabled: false, order: 0 },
              { id: '*n2', chain: 'dstnat', action: 'redirect', disabled: false, order: 1 },
              { id: '*n3', chain: 'srcnat', action: 'masquerade', disabled: false, order: 2 },
            ],
          },
        },
      ],
    },
  },
};

/**
 * PreroutingChainActive
 *
 * PREROUTING node highlighted — useful when inspecting NAT dst-nat rules
 * that translate destination addresses before the routing decision.
 */
export const PreroutingChainActive: Story = {
  args: {
    activeChain: 'prerouting' as FirewallChain,
  },
  parameters: {
    docs: {
      description: {
        story:
          'PREROUTING chain is active. Paths from IN → PREROUTING → routing-decision ' +
          'render with primary color. Node count reflects NAT dst-nat rules.',
      },
    },
    msw: {
      handlers: [
        {
          url: '/api/routers/:routerId/firewall/filter',
          method: 'get',
          response: {
            data: [{ id: '*1', chain: 'forward', action: 'accept', disabled: false, order: 0 }],
          },
        },
        {
          url: '/api/routers/:routerId/firewall/nat',
          method: 'get',
          response: {
            data: [
              { id: '*n1', chain: 'dstnat', action: 'dst-nat', disabled: false, order: 0 },
              { id: '*n2', chain: 'dstnat', action: 'dst-nat', disabled: false, order: 1 },
            ],
          },
        },
      ],
    },
  },
};
