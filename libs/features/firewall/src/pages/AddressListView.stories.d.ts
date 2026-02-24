/**
 * AddressListView Storybook Stories
 *
 * Interactive stories for the Address List View page domain component.
 * Demonstrates page states, CRUD operations, import/export dialogs, and empty states.
 *
 * @module @nasnet/features/firewall/pages
 */
import type { StoryObj } from '@storybook/react';
/**
 * AddressListView - Firewall address list management page
 *
 * The AddressListView page provides the main interface for managing MikroTik firewall
 * address lists with full CRUD support, bulk CSV import, and export functionality.
 *
 * ## Features
 *
 * - **View Lists**: Browse all address lists with entry counts grouped by name
 * - **Add Entries**: Create individual address list entries via a Sheet form
 * - **Bulk Import**: Import entries in CSV format via Import Dialog
 * - **Export**: Export address list entries for backup or reuse
 * - **Delete**: Remove individual entries with safety confirmation
 * - **Empty State**: Helpful guidance when no address lists exist
 * - **Loading Skeletons**: Smooth loading experience during data fetch
 * - **Error State**: Clear error display with destructive alert
 * - **Accessibility**: WCAG AAA compliant with ARIA labels and keyboard navigation
 *
 * ## Use Cases
 *
 * - Block known malicious IP ranges
 * - Whitelist trusted IPs for admin access
 * - Group IPs for firewall rule targeting
 * - Geographic blocking via CIDR ranges
 *
 * ## Usage
 *
 * ```tsx
 * import { AddressListView } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <AddressListView />;
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
 * Empty State
 *
 * No address lists configured yet. Shows an empty state card with dashed border
 * and two CTAs: Create Entry and Import. Guides users to get started.
 */
export declare const EmptyState: Story;
/**
 * With Address Lists
 *
 * Populated view showing multiple address lists with entries.
 * Demonstrates the AddressListManager with blocklists, whitelists, and geo-block groups.
 */
export declare const WithAddressLists: Story;
/**
 * Loading State
 *
 * Shows animated loading skeleton while address lists are being fetched from the router.
 */
export declare const Loading: Story;
/**
 * Error State
 *
 * Shows a destructive alert banner when the address list data cannot be fetched.
 * Includes error message from the API response.
 */
export declare const ErrorState: Story;
/**
 * Mobile View
 *
 * Mobile-optimized layout with bottom Sheet for add entry and card-based list display.
 * Demonstrates the responsive platform presenter switching at <640px.
 */
export declare const MobileView: Story;
//# sourceMappingURL=AddressListView.stories.d.ts.map