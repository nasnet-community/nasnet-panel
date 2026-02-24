/**
 * ManglePage Storybook Stories
 *
 * Interactive stories for the Mangle page domain component.
 * Demonstrates chain tabs, flow diagram, rule editor, and various data states.
 *
 * @module @nasnet/features/firewall/pages
 */
import type { StoryObj } from '@storybook/react';
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
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<object>;
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
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, object>) => import("react/jsx-runtime").JSX.Element)[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty State - All Chains
 *
 * No mangle rules configured across any chain. Shows the generic empty state
 * on the "All" tab with a single "Add Mangle Rule" CTA.
 */
export declare const EmptyAllChains: Story;
/**
 * Empty State - Specific Chain
 *
 * The prerouting chain has no rules. Shows a chain-specific empty state
 * that names the chain in the message, guiding users to the right context.
 */
export declare const EmptyPreroutingChain: Story;
/**
 * With QoS Mangle Rules
 *
 * Real-world QoS configuration showing mark-connection, mark-packet, and change-dscp
 * rules across prerouting and forward chains. Classic VoIP prioritization setup.
 */
export declare const WithQoSRules: Story;
/**
 * Loading State
 *
 * Animated skeleton rows while mangle rules are being fetched from the router.
 */
export declare const Loading: Story;
/**
 * Mobile View
 *
 * Mobile layout (<640px) with scrollable chain tabs and card-based rule display.
 * "View Flow" and "Add Rule" buttons in the header; sheet opens from the bottom.
 */
export declare const MobileView: Story;
//# sourceMappingURL=ManglePage.stories.d.ts.map