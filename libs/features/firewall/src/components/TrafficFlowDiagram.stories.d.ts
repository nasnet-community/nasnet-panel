/**
 * TrafficFlowDiagram Storybook Stories
 *
 * Stories for the SVG packet-flow visualization component.
 * Demonstrates chain highlighting, animated traffic paths, and interactive node clicking.
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
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
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./TrafficFlowDiagram").TrafficFlowDiagramProps>;
    tags: string[];
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    argTypes: {
        activeChain: {
            control: "radio";
            options: (string | null)[];
            description: string;
        };
        onChainClick: {
            action: string;
            description: string;
        };
    };
    args: {
        activeChain: null;
        onChainClick: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * Diagram with no active chain. All paths use the muted slate color.
 * Rule counts are populated from the connected router data.
 */
export declare const Default: Story;
/**
 * InputChainActive
 *
 * The INPUT chain node is highlighted, along with the routing → input
 * and input → local process paths rendered in primary color.
 */
export declare const InputChainActive: Story;
/**
 * ForwardChainActive
 *
 * FORWARD chain highlighted — the path from routing → FORWARD → POSTROUTING
 * is rendered with the primary animated overlay.
 */
export declare const ForwardChainActive: Story;
/**
 * OutputChainActive
 *
 * OUTPUT chain highlighted — shows the Local Process → OUTPUT → POSTROUTING path.
 */
export declare const OutputChainActive: Story;
/**
 * WithNATRules
 *
 * Both filter rules and NAT rules contribute to node counts.
 * PREROUTING and POSTROUTING nodes show non-zero counters from masquerade/dst-nat.
 */
export declare const WithNATRules: Story;
/**
 * PreroutingChainActive
 *
 * PREROUTING node highlighted — useful when inspecting NAT dst-nat rules
 * that translate destination addresses before the routing decision.
 */
export declare const PreroutingChainActive: Story;
//# sourceMappingURL=TrafficFlowDiagram.stories.d.ts.map