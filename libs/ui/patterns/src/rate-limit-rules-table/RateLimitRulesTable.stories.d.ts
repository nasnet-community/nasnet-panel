/**
 * RateLimitRulesTable Storybook Stories
 *
 * Visual documentation and testing for rate limit rules table pattern component.
 *
 * Stories:
 * - Default (mixed rule types)
 * - Empty state
 * - Loading state
 * - Drop rules only
 * - Tarpit rules
 * - Add-to-list rules
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/rate-limit-rules-table
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { StoryObj } from '@storybook/react';
/**
 * RateLimitRulesTable - Display and manage rate limiting firewall rules
 *
 * The RateLimitRulesTable component provides a sortable, filterable table for managing
 * connection rate limiting rules. It supports drag-and-drop reordering and automatically
 * adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Sortable rows**: Drag-and-drop to reorder rules (position matters!)
 * - **Rule actions**: Drop, Tarpit, Add-to-List with visual indicators
 * - **Real-time stats**: Packet/byte counters for each rule
 * - **Bulk operations**: Toggle, duplicate, delete multiple rules
 * - **Platform adaptive**: Mobile cards vs Desktop table
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Rule Actions
 *
 * - **Drop**: Immediately drops excess connections (red indicator)
 * - **Tarpit**: Slows down attackers with delayed responses (yellow indicator)
 * - **Add-to-List**: Adds offenders to address list with timeout (blue indicator)
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitRulesTable } from '@nasnet/ui/patterns/rate-limit-rules-table';
 * import { useRateLimitRules } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: rules, isLoading } = useRateLimitRules(routerId);
 *
 *   return (
 *     <RateLimitRulesTable
 *       rules={rules}
 *       loading={isLoading}
 *       onToggle={async (id) => await toggleRule(id)}
 *       onEdit={(rule) => openEditor(rule)}
 *       onDelete={async (id) => await deleteRule(id)}
 *       onReorder={async (newOrder) => await updateOrder(newOrder)}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./types").RateLimitRulesTableProps>;
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
        actionFilter: {
            control: "text";
            description: string;
        };
        statusFilter: {
            control: "select";
            options: string[];
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
    args: {
        actionFilter: undefined;
        statusFilter: "all";
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default State - Mixed Rule Types
 *
 * Shows all three rate limiting actions: drop, tarpit, and add-to-list.
 * Includes disabled rule to demonstrate toggle functionality.
 */
export declare const Default: Story;
/**
 * Empty State
 *
 * Shows empty state when no rate limit rules exist.
 * Prompts user to create their first rule.
 */
export declare const Empty: Story;
/**
 * Loading State
 *
 * Shows skeleton loading state while fetching rules from router.
 */
export declare const Loading: Story;
/**
 * Drop Rules Only
 *
 * Demonstrates drop action rules (immediately blocks excess connections).
 * Most aggressive protection mode.
 */
export declare const DropRulesOnly: Story;
/**
 * Tarpit Rules
 *
 * Demonstrates tarpit action (slows down attackers instead of dropping).
 * More subtle defense mechanism.
 */
export declare const TarpitRules: Story;
/**
 * Add-to-List Rules
 *
 * Demonstrates add-to-list action (adds offenders to blocklist).
 * Dynamic blocking with automatic timeout.
 */
export declare const AddToListRules: Story;
/**
 * With Active Filters
 *
 * Shows table with filter bar expanded.
 * Filter by action type, enabled/disabled status, or search by IP.
 */
export declare const WithFilters: Story;
/**
 * Many Rules (Performance Test)
 *
 * Tests virtualization with 100+ rules.
 * Should maintain 60fps scrolling.
 */
export declare const ManyRules: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (card layout).
 * Optimized for touch: 44px targets, swipe actions, bottom sheets.
 */
export declare const MobileView: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (dense table).
 * Optimized for keyboard: sortable columns, inline editing, context menus.
 */
export declare const DesktopView: Story;
/**
 * With High Traffic Counters
 *
 * Shows rules with high packet/byte counts.
 * Demonstrates counter formatting (K, M, G suffixes).
 */
export declare const WithHighTraffic: Story;
/**
 * Non-Sortable Table
 *
 * Disables drag-and-drop reordering.
 * Useful for read-only views or when order is managed externally.
 */
export declare const NonSortable: Story;
/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=RateLimitRulesTable.stories.d.ts.map