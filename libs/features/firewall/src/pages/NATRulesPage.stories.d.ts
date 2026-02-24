/**
 * NATRulesPage Storybook Stories
 *
 * Interactive stories for the NAT Rules page domain component.
 * Demonstrates chain tabs, quick action buttons, and empty/loading/populated states.
 *
 * @module @nasnet/features/firewall/pages
 */
import type { StoryObj } from '@storybook/react';
/**
 * NATRulesPage - NAT firewall rules management page
 *
 * The NATRulesPage provides the main interface for managing MikroTik Network Address
 * Translation (NAT) rules with chain-based tab filtering and quick action wizards.
 *
 * ## Features
 *
 * - **Chain Tabs**: Switch between All / Source NAT (srcnat) / Destination NAT (dstnat)
 * - **Quick Masquerade**: One-click masquerade rule creation via dialog wizard
 * - **Port Forward Wizard**: Step-by-step port forwarding configuration wizard
 * - **Add NAT Rule**: Full rule builder with all NAT parameters (NATRuleBuilder)
 * - **Edit Rules**: Inline edit with pre-filled rule data
 * - **Toggle Disable**: Enable/disable rules without opening editor
 * - **Delete Rules**: Safety Pipeline confirmation before deletion
 * - **Responsive Layout**: Desktop DataTable vs Mobile Card list
 * - **Empty States**: Chain-specific empty states with contextual CTAs
 * - **Loading Skeletons**: Smooth loading during fetch
 * - **Accessibility**: WCAG AAA compliant keyboard navigation
 *
 * ## NAT Chains
 *
 * - **srcnat** (Source NAT): Masquerade, SNAT — hide internal IPs behind WAN IP
 * - **dstnat** (Destination NAT): Port forwarding, DNAT — expose internal services
 *
 * ## Usage
 *
 * ```tsx
 * import { NATRulesPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <NATRulesPage />;
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
 * No NAT rules configured. Shows the "All" tab empty state with three CTAs:
 * Quick Masquerade, Port Forward Wizard, and Add NAT Rule.
 */
export declare const EmptyAllChains: Story;
/**
 * Empty State - Source NAT Chain
 *
 * No srcnat rules configured. Shows contextual empty state with masquerade CTA.
 */
export declare const EmptySourceNAT: Story;
/**
 * With NAT Rules - All Chains
 *
 * Populated view showing both srcnat and dstnat rules in the "All" tab.
 * Demonstrates rule cards with action badges, interface matchers, and address translation.
 */
export declare const WithRulesAllChains: Story;
/**
 * Loading State
 *
 * Shows animated skeleton rows while NAT rules are being fetched from the router.
 */
export declare const Loading: Story;
/**
 * Mobile View
 *
 * Mobile layout (<640px) with card-based rule display instead of DataTable.
 * Header action buttons collapse; Masquerade and Port Forward shown as small buttons below header.
 */
export declare const MobileView: Story;
//# sourceMappingURL=NATRulesPage.stories.d.ts.map