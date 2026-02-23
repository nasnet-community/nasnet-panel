/**
 * RouteList Storybook Stories
 * NAS-6.5: Task 9.6 - Static Route Management
 *
 * Demonstrates the RouteList component in various states and platform configurations.
 */
import { RouteListDesktop } from './RouteListDesktop';
import { RouteListMobile } from './RouteListMobile';
import type { Meta, StoryObj } from '@storybook/react';
declare const metaDesktop: Meta<typeof RouteListDesktop>;
export default metaDesktop;
type StoryDesktop = StoryObj<typeof RouteListDesktop>;
/**
 * Default state with multiple routes covering all RouteType values.
 * Shows default route (0.0.0.0/0), connected routes, static routes, BGP/OSPF routes, and disabled routes.
 */
export declare const Default: StoryDesktop;
/**
 * Loading state with skeleton UI while fetching routes from router.
 */
export declare const Loading: StoryDesktop;
/**
 * Empty state when no routes are configured on the router.
 * Shows empty message encouraging user to add their first route.
 */
export declare const Empty: StoryDesktop;
/**
 * Error state when route query fails (connection refused, timeout, etc.).
 * Displays error alert with retry capability.
 */
export declare const Error: StoryDesktop;
/**
 * Filtered by routing table (VPN table only).
 * Demonstrates table-based filtering for policy routing setups.
 */
export declare const FilteredByTable: StoryDesktop;
/**
 * Filtered by route type (STATIC only).
 * Shows only user-configured static routes, excluding connected/dynamic routes.
 */
export declare const FilteredByType: StoryDesktop;
/**
 * Performance test with 75 generated routes.
 * Demonstrates DataTable handling of larger datasets.
 */
export declare const ManyRoutes: StoryDesktop;
type StoryMobile = StoryObj<typeof RouteListMobile>;
/**
 * Mobile default state with card-based layout.
 * Each route displayed as a full-width card with touch-optimized actions.
 */
export declare const MobileDefault: StoryMobile;
/**
 * Mobile loading state with spinner.
 */
export declare const MobileLoading: StoryMobile;
/**
 * Mobile empty state with centered empty message.
 */
export declare const MobileEmpty: StoryMobile;
/**
 * Mobile error state with alert banner.
 */
export declare const MobileError: StoryMobile;
/**
 * Mobile view with small dataset (easier to review on small screens).
 */
export declare const MobileFewRoutes: StoryMobile;
/**
 * Mobile view with longer scrollable list.
 */
export declare const MobileLongList: StoryMobile;
//# sourceMappingURL=RouteList.stories.d.ts.map