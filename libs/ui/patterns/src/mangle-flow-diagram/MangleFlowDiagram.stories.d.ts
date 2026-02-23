/**
 * MangleFlowDiagram Storybook Stories
 *
 * Interactive stories for mangle flow diagram pattern component.
 * Demonstrates packet flow visualization, chain selection, and trace mode.
 *
 * @module @nasnet/ui/patterns/mangle-flow-diagram
 */
import type { StoryObj } from '@storybook/react';
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
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./MangleFlowDiagram").MangleFlowDiagramProps>;
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
    tags: string[];
    argTypes: {
        selectedChain: {
            control: "select";
            options: string[];
            description: string;
        };
        traceMode: {
            control: "boolean";
            description: string;
        };
        compact: {
            control: "boolean";
            description: string;
        };
        onChainSelect: {
            action: string;
        };
    };
    args: {
        onChainSelect: import("storybook/test").Mock<(...args: any[]) => any>;
        traceMode: false;
        compact: false;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty - No Rules
 *
 * Diagram with no rules configured in any chain.
 * Shows the packet flow structure without rule count badges.
 */
export declare const Empty: Story;
/**
 * With Rules
 *
 * Diagram showing rule counts in each chain.
 * Badges display the number of rules per chain.
 */
export declare const WithRules: Story;
/**
 * Chain Selected
 *
 * Shows visual feedback when a chain is selected.
 * Selected chain has border highlight and "Clear Filter" button appears.
 */
export declare const ChainSelected: Story;
/**
 * Trace Mode - Forwarded Traffic
 *
 * Trace mode shows which chains a forwarded packet traverses.
 * Highlighted chains: prerouting → forward → postrouting
 *
 * Use case: Traffic passing through the router (LAN to WAN, WAN to LAN).
 */
export declare const TraceModeForwarded: Story;
/**
 * Trace Mode - Local Input
 *
 * Trace mode for packets destined to the router itself.
 * Highlighted chains: prerouting → input
 *
 * Use case: SSH, web interface, DNS requests to router.
 */
export declare const TraceModeLocalInput: Story;
/**
 * Trace Mode - Local Output
 *
 * Trace mode for packets originating from the router.
 * Highlighted chains: output → postrouting
 *
 * Use case: Router-generated traffic (NTP, DNS queries, updates).
 */
export declare const TraceModeLocalOutput: Story;
/**
 * Mobile Layout
 *
 * Vertical layout optimized for mobile devices.
 * Chains stack vertically with downward arrows.
 */
export declare const MobileLayout: Story;
/**
 * Desktop Layout
 *
 * Horizontal layout optimized for desktop.
 * Chains flow left-to-right with right arrows and legend.
 */
export declare const DesktopLayout: Story;
/**
 * Heavy Traffic Distribution
 *
 * Realistic rule distribution for a production router.
 * Most rules in prerouting (marking) and forward (routing).
 */
export declare const HeavyTraffic: Story;
/**
 * Compact Mode
 *
 * Smaller diagram without labels.
 * Useful for dashboards or embedded views.
 */
export declare const CompactMode: Story;
//# sourceMappingURL=MangleFlowDiagram.stories.d.ts.map