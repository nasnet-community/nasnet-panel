/**
 * BlockedIPsTable Storybook Stories
 *
 * Visual documentation and testing for blocked IPs table pattern component.
 *
 * Stories:
 * - Default (mixed dynamic and permanent)
 * - Empty state
 * - Loading state
 * - With selection (bulk operations)
 * - IPv6 addresses
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/blocked-ips-table
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import { BlockedIPsTable } from './BlockedIPsTable';
import type { StoryObj } from '@storybook/react';
/**
 * BlockedIPsTable - Display and manage blocked IP addresses
 *
 * The BlockedIPsTable component provides a comprehensive interface for viewing and managing
 * IP addresses that have been blocked by rate limiting rules. It supports bulk operations,
 * filtering, and automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Block count tracking**: Shows how many times each IP was blocked
 * - **Timeout display**: Shows when dynamic blocks will expire
 * - **Bulk operations**: Whitelist or remove multiple IPs at once
 * - **Filtering**: Filter by dynamic/permanent, list name, or search by IP
 * - **Sorting**: Sort by block count, first/last blocked time
 * - **Platform adaptive**: Mobile cards vs Desktop table
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Block Types
 *
 * - **Dynamic**: Automatically added by rules with timeout (auto-expires)
 * - **Permanent**: Manually added or no timeout (requires manual removal)
 *
 * ## Bulk Actions
 *
 * - **Whitelist**: Add selected IPs to whitelist (prevents future blocking)
 * - **Remove**: Remove selected IPs from blocklist (immediate unblock)
 *
 * ## Usage
 *
 * ```tsx
 * import { BlockedIPsTable } from '@nasnet/ui/patterns/blocked-ips-table';
 * import { useBlockedIPs } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: blockedIPs, isLoading } = useBlockedIPs(routerId);
 *
 *   return (
 *     <BlockedIPsTable
 *       blockedIPs={blockedIPs}
 *       loading={isLoading}
 *       onWhitelist={async (ips) => await addToWhitelist(ips)}
 *       onRemove={async (ips) => await removeBlocked(ips)}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: typeof BlockedIPsTable;
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
        blockedIPsTable: {
            control: "object";
            description: string;
        };
        loading: {
            control: "boolean";
            description: string;
        };
        isWhitelisting: {
            control: "boolean";
            description: string;
        };
        isRemoving: {
            control: "boolean";
            description: string;
        };
        onWhitelist: {
            action: string;
        };
        onRemove: {
            action: string;
        };
    };
    args: {
        loading: false;
        isWhitelisting: false;
        isRemoving: false;
        onWhitelist: import("storybook/test").Mock<(...args: any[]) => any>;
        onRemove: import("storybook/test").Mock<(...args: any[]) => any>;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default State - Mixed Block Types
 *
 * Shows both dynamic (with timeout) and permanent (no timeout) blocked IPs.
 * Includes IPv4 and IPv6 addresses.
 */
export declare const Default: Story;
/**
 * Empty State
 *
 * Shows empty state when no IPs are blocked.
 * Displays helpful message that protection is working.
 */
export declare const Empty: Story;
/**
 * Loading State
 *
 * Shows skeleton loading state while fetching blocked IPs.
 */
export declare const Loading: Story;
/**
 * Top Offenders
 *
 * Shows blocked IPs sorted by block count (descending).
 * Highlights most persistent attackers.
 */
export declare const TopOffenders: Story;
/**
 * With Selection for Bulk Operations
 *
 * Shows table with checkboxes for selecting multiple IPs.
 * Demonstrates bulk whitelist and remove actions.
 */
export declare const WithSelection: Story;
/**
 * Many Blocked IPs (Performance Test)
 *
 * Tests virtualization with 200+ blocked IPs.
 * Should maintain 60fps scrolling.
 */
export declare const ManyBlockedIPs: Story;
/**
 * IPv6 Addresses Only
 *
 * Shows table with only IPv6 blocked addresses.
 * Demonstrates proper IPv6 formatting.
 */
export declare const IPv6Only: Story;
/**
 * Dynamic Blocks Only
 *
 * Shows only dynamically blocked IPs (with timeout).
 * All will auto-expire after timeout period.
 */
export declare const DynamicOnly: Story;
/**
 * Permanent Blocks Only
 *
 * Shows only permanently blocked IPs (no timeout).
 * Require manual removal.
 */
export declare const PermanentOnly: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (card layout).
 * Optimized for touch: 44px targets, swipe actions, compact info.
 */
export declare const MobileView: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (dense table).
 * Optimized for keyboard: sortable columns, inline actions, keyboard shortcuts.
 */
export declare const DesktopView: Story;
/**
 * High Block Counts
 *
 * Shows IPs with very high block counts (1000+).
 * Demonstrates number formatting (K, M suffixes).
 */
export declare const HighBlockCounts: Story;
/**
 * Without Filter Bar
 *
 * Hides filter bar for cleaner layout.
 * Useful when filters aren't needed.
 */
export declare const NoFilters: Story;
/**
 * Non-Selectable (Read-Only)
 *
 * Disables row selection and bulk operations.
 * Useful for monitoring views or when actions aren't permitted.
 */
export declare const NonSelectable: Story;
/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=BlockedIPsTable.stories.d.ts.map