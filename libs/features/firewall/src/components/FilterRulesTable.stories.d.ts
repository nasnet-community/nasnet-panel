/**
 * FilterRulesTable Storybook Stories
 *
 * Interactive stories for the platform-aware filter rules table component.
 * Demonstrates the Headless + Platform Presenters pattern and responsive behavior.
 *
 * FilterRulesTable is a thin wrapper that delegates to:
 * - FilterRulesTableDesktop: Dense table with drag-drop reordering
 * - FilterRulesTableMobile: Card-based touch-friendly layout
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * FilterRulesTable - Platform-aware filter rules management component
 *
 * This component automatically detects the user's platform (mobile/desktop)
 * and renders the most appropriate presenter for the context.
 *
 * ## Platform Behavior
 *
 * - **Desktop (>=640px):** Dense sortable table with drag-drop reordering,
 *   inline enable/disable toggle, and icon-only CRUD action buttons.
 * - **Mobile (<640px):** Touch-optimized card layout with 44px minimum touch
 *   targets, full-width edit button, and icon-only duplicate/delete buttons.
 *
 * ## Features
 *
 * - **Drag-drop reordering** (Desktop only): Grip handle on left side
 * - **Inline toggle**: Switch to enable/disable rules without opening editor
 * - **Counter visualization**: Packets and bytes hit counts per rule
 * - **Disabled rules styling**: Reduced opacity (opacity-50) for disabled rules
 * - **Unused rules indicator**: Highlight rules with 0 packet hits
 * - **Action badges**: Color-coded badges — accept (green), drop (red),
 *   reject (red), log (blue), jump (yellow), passthrough (default)
 * - **Chain filter**: Optional `chain` prop to scope display to one chain
 *
 * ## Chain Values
 *
 * - `input` — Traffic destined for the router itself
 * - `forward` — Traffic passing through the router
 * - `output` — Traffic originating from the router
 *
 * ## Usage
 *
 * ```tsx
 * import { FilterRulesTable } from '@nasnet/features/firewall';
 *
 * // Show all filter rules
 * <FilterRulesTable />
 *
 * // Show only input chain rules
 * <FilterRulesTable chain="input" />
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./FilterRulesTable").FilterRulesTableProps>;
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        className?: string | undefined;
        chain?: string | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
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
        chain: {
            control: "select";
            options: (string | undefined)[];
            description: string;
            table: {
                type: {
                    summary: string;
                };
                defaultValue: {
                    summary: string;
                };
            };
        };
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default (All Chains)
 *
 * Shows all filter rules from all chains.
 * The component connects to the router API via React Query.
 * In Storybook without a live router, it will show the loading then empty state.
 */
export declare const Default: Story;
/**
 * Input Chain
 *
 * Filtered to show only the INPUT chain — rules that govern traffic
 * destined for the router itself (e.g., management access, ping, SSH).
 */
export declare const InputChain: Story;
/**
 * Forward Chain
 *
 * Filtered to show only the FORWARD chain — rules that govern traffic
 * passing through the router between networks.
 */
export declare const ForwardChain: Story;
/**
 * Output Chain
 *
 * Filtered to show only the OUTPUT chain — rules for traffic that
 * originates from the router itself.
 */
export declare const OutputChain: Story;
/**
 * Mobile Viewport
 *
 * Same component rendered inside a mobile viewport.
 * Platform detection switches to FilterRulesTableMobile (card layout).
 */
export declare const MobileViewport: Story;
/**
 * Mobile Input Chain
 *
 * Mobile variant scoped to the input chain — demonstrates that the
 * chain prop is forwarded correctly through the platform wrapper.
 */
export declare const MobileInputChain: Story;
/**
 * With Custom ClassName
 *
 * Demonstrates className forwarding for layout control within a panel.
 */
export declare const WithCustomClassName: Story;
//# sourceMappingURL=FilterRulesTable.stories.d.ts.map