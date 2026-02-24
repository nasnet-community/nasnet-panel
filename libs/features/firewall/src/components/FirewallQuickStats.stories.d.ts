/**
 * FirewallQuickStats Storybook Stories
 *
 * Stories for the compact firewall rule distribution summary component.
 * Demonstrates chain distribution bars, action breakdown, and various data states.
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * FirewallQuickStats - Compact summary of firewall chain and action distribution
 *
 * Displays a quick-glance breakdown of firewall rules organized by chain
 * (input, forward, output) and action type (accept, drop, reject).
 *
 * ## Features
 *
 * - **Chain distribution bars**: Proportional bars showing rule count per chain
 * - **Color-coded chains**: input=blue, forward=purple, output=amber
 * - **Action breakdown**: Stacked bar and legend for accept/drop/reject counts
 * - **Loading skeleton**: Animated placeholder while fetching
 * - **Empty state**: Friendly message when no rules are configured
 *
 * ## Usage
 *
 * ```tsx
 * import { FirewallQuickStats } from '@nasnet/features/firewall';
 *
 * function FirewallSidebar() {
 *   return (
 *     <aside>
 *       <FirewallQuickStats />
 *     </aside>
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").MemoExoticComponent<({ className }: import("./FirewallQuickStats").FirewallQuickStatsProps) => import("react/jsx-runtime").JSX.Element>;
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
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        className?: string | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * Component as rendered within the firewall overview panel.
 * Data is fetched from the connected router via the Apollo/React Query hooks.
 */
export declare const Default: Story;
/**
 * WithClassName
 *
 * Shows how the className prop applies additional Tailwind classes for
 * layout integration within parent containers.
 */
export declare const WithClassName: Story;
/**
 * HeavyInputChain
 *
 * Scenario where the input chain has significantly more rules than forward/output.
 * Demonstrates how bars scale proportionally to the highest chain count.
 */
export declare const HeavyInputChain: Story;
/**
 * AllDropRules
 *
 * All active rules use the drop action, which fills the action bar entirely in red.
 * Useful for verifying the action legend renders correctly in a single-color scenario.
 */
export declare const AllDropRules: Story;
/**
 * LoadingState
 *
 * Skeleton animation displayed while the hook is fetching data.
 * Three skeleton rows replace the chain bars until data resolves.
 */
export declare const LoadingState: Story;
/**
 * EmptyState
 *
 * No firewall rules have been configured on this router.
 * Displays a friendly message prompting the user to add rules.
 */
export declare const EmptyState: Story;
//# sourceMappingURL=FirewallQuickStats.stories.d.ts.map