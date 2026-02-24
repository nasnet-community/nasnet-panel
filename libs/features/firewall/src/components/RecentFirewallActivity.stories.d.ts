/**
 * RecentFirewallActivity Storybook Stories
 *
 * Stories for the firewall recent activity placeholder widget.
 * Demonstrates the two internal branches (logging not configured vs. no activity).
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * RecentFirewallActivity - Firewall log activity panel
 *
 * A dashboard widget that surfaces recent firewall events (blocked connections,
 * dropped packets, etc.). The component has two display modes controlled by an
 * internal `hasLogging` flag:
 *
 * - **Logging not configured** (`hasLogging = false`): Info icon with a prompt to
 *   enable firewall logging rules so events can be tracked.
 * - **No recent activity** (`hasLogging = true`): Green tick icon indicating
 *   the firewall is quiet — no blocked connections in the last hour.
 *
 * ## Features
 *
 * - **Activity header**: Clock icon + "Recent Activity" title
 * - **Logging-disabled state**: Info icon, "Logging Not Configured" message
 * - **Quiet state**: Green check icon, "No Recent Activity" message
 * - **className passthrough**: Additional styles for layout integration
 *
 * ## Notes
 *
 * The `hasLogging` flag is currently hard-coded to `false` (Phase 1). A future
 * iteration will connect this component to the router's log stream and render
 * real event rows.
 *
 * ## Usage
 *
 * ```tsx
 * import { RecentFirewallActivity } from '@nasnet/features/firewall';
 *
 * function FirewallOverview() {
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <FirewallQuickStats />
 *       <RecentFirewallActivity />
 *     </div>
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./RecentFirewallActivity").RecentFirewallActivityProps>;
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
    argTypes: {
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default
 *
 * The component in its default state (`hasLogging = false`).
 * Shows the "Logging Not Configured" prompt with an info icon.
 * This is the most common real-world state for a fresh router deployment.
 */
export declare const Default: Story;
/**
 * LoggingNotConfigured
 *
 * Explicit story for the "logging not configured" branch.
 * Mirrors the Default story but is named to make the intent clear in docs.
 */
export declare const LoggingNotConfigured: Story;
/**
 * WithClassName
 *
 * Demonstrates passing a custom className for layout integration.
 * The outer card receives `shadow-xl` and `max-w-sm` in addition to its defaults.
 */
export declare const WithClassName: Story;
/**
 * NarrowLayout
 *
 * The widget at a narrow width (220px) to verify text wrapping and icon
 * centering behave correctly in tight sidebar contexts.
 */
export declare const NarrowLayout: Story;
/**
 * DarkMode
 *
 * The widget rendered within a dark-mode context using the `dark` class wrapper.
 * Validates that dark bg/border/text classes apply correctly.
 */
export declare const DarkMode: Story;
/**
 * InDashboardGrid
 *
 * Shows the widget as it would appear inside a two-column dashboard grid
 * alongside a FirewallQuickStats placeholder. Useful for visual regression checks.
 */
export declare const InDashboardGrid: Story;
//# sourceMappingURL=RecentFirewallActivity.stories.d.ts.map