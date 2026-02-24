/**
 * RawRulesTable Storybook Stories
 *
 * Interactive stories for RAW rules table domain component.
 * Demonstrates table states, drag-drop reordering, and platform variants.
 *
 * @module @nasnet/features/firewall/components
 */
import type { StoryObj } from '@storybook/react';
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
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./RawRulesTable").RawRulesTableProps>;
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
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        className?: string | undefined;
        chain?: string | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
    argTypes: {
        chain: {
            control: "radio";
            options: (string | undefined)[];
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
    args: {
        chain: string;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty State
 *
 * No rules configured yet - shows helpful empty state with suggested actions.
 */
export declare const Empty: Story;
/**
 * With Rules - Prerouting Chain
 *
 * Multiple RAW rules in prerouting chain with various actions (drop, notrack, accept).
 * Demonstrates counter visualization and enabled/disabled states.
 */
export declare const WithRules: Story;
/**
 * With Rules - Output Chain
 *
 * RAW rules in output chain (packets originating from router).
 */
export declare const OutputChain: Story;
/**
 * Loading State
 *
 * Skeleton loading while fetching rules from router.
 */
export declare const Loading: Story;
/**
 * With Disabled Rules
 *
 * Shows how disabled rules appear with opacity-50 and muted styling.
 */
export declare const WithDisabledRules: Story;
/**
 * High Traffic Rules
 *
 * Rules with high packet/byte counts to demonstrate counter visualization.
 */
export declare const HighTrafficRules: Story;
/**
 * Mobile View
 *
 * Card-based layout optimized for mobile devices with touch-friendly controls.
 */
export declare const MobileView: Story;
/**
 * Tablet View
 *
 * Hybrid layout for tablet devices (640-1024px).
 */
export declare const TabletView: Story;
/**
 * With Unused Rules
 *
 * Rules with zero packet matches showing "No matches" badge.
 */
export declare const WithUnusedRules: Story;
//# sourceMappingURL=RawRulesTable.stories.d.ts.map