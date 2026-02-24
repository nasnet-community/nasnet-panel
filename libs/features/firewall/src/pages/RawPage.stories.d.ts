/**
 * RawPage Storybook Stories
 *
 * Interactive stories for RAW page domain component.
 * Demonstrates page states, chain tabs, wizards, and performance section.
 *
 * @module @nasnet/features/firewall/pages
 */
import { RawPage } from './RawPage';
import type { StoryObj } from '@storybook/react';
/**
 * RawPage - RAW firewall rules management page
 *
 * The RawPage component provides the main interface for managing RAW firewall rules
 * with chain tabs, quick action buttons, and performance explanations.
 *
 * ## Features
 *
 * - **Chain Tabs**: Switch between prerouting and output chains
 * - **Quick Actions**: Add Rule, Bogon Filter wizard
 * - **Notice Banner**: Explains RAW table purpose and use cases
 * - **Performance Section**: Collapsible explanation of RAW vs Filter
 * - **Empty State**: Helpful guidance when no rules exist
 * - **Loading Skeletons**: Smooth loading experience
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (all incoming packets)
 * - **output**: Packets originating from router
 *
 * ## Usage
 *
 * ```tsx
 * import { RawPage } from '@nasnet/features/firewall/pages';
 *
 * function MyApp() {
 *   return <RawPage />;
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: typeof RawPage;
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
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {}>) => import("react/jsx-runtime").JSX.Element)[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty Prerouting Chain
 *
 * No rules in prerouting chain - shows empty state with suggested actions.
 * Notice banner explains RAW table purpose.
 */
export declare const EmptyPrerouting: Story;
/**
 * Empty Output Chain
 *
 * No rules in output chain - shows empty state.
 */
export declare const EmptyOutput: Story;
/**
 * With Rules - Prerouting
 *
 * Prerouting chain with multiple configured rules.
 * Shows notice banner and populated table.
 */
export declare const WithRulesPrerouting: Story;
/**
 * With Rules - Output
 *
 * Output chain with configured rules.
 */
export declare const WithRulesOutput: Story;
/**
 * Loading State
 *
 * Shows loading skeletons while fetching rules from router.
 */
export declare const Loading: Story;
/**
 * Performance Section Expanded
 *
 * Shows the collapsible performance explanation section in expanded state.
 * Includes RAW vs Filter comparison and packet flow diagram.
 */
export declare const PerformanceSectionExpanded: Story;
/**
 * High Traffic Scenario
 *
 * Shows rules with high packet/byte counts typical of production routers.
 */
export declare const HighTrafficScenario: Story;
/**
 * Mobile View
 *
 * Mobile-optimized layout with bottom navigation and card-based rules.
 */
export declare const MobileView: Story;
/**
 * Tablet View
 *
 * Tablet layout with collapsible sidebar and hybrid density.
 */
export declare const TabletView: Story;
/**
 * With Disabled Rules
 *
 * Shows mix of enabled and disabled rules with appropriate styling.
 */
export declare const WithDisabledRules: Story;
/**
 * Notice Banner Variants
 *
 * Shows the info notice banner explaining RAW table purpose prominently.
 */
export declare const NoticeBannerFocus: Story;
//# sourceMappingURL=RawPage.stories.d.ts.map