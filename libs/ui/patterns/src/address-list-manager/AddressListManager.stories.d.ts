/**
 * AddressListManager Storybook Stories
 *
 * Comprehensive Storybook documentation for the AddressListManager pattern component.
 * Demonstrates all variants, states, and platform presenters (Mobile, Tablet, Desktop).
 *
 * Features:
 * - Empty state with helpful messaging
 * - Loaded with few lists
 * - Expanded list with entries visible
 * - Lists with dynamic entries (added by firewall actions)
 * - Large list with 10,000+ entries (virtualization demo)
 * - Loading skeleton states
 * - Error states with actionable messaging
 * - All three platform presenters (Mobile, Tablet, Desktop)
 * - Accessibility testing with axe-core
 * - Interactive play functions for user interactions
 *
 * @see NAS-7.3: Implement Address Lists
 * @see Docs/design/ux-design/6-component-library.md
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md section 17 (Storybook)
 */
import { AddressListManager } from './AddressListManager';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddressListManager>;
export default meta;
type Story = StoryObj<typeof AddressListManager>;
/**
 * Story 1: Empty State - Default (Desktop)
 * Shows the component when no address lists exist.
 * Displays helpful empty state messaging with suggested action.
 */
export declare const Empty: Story;
/**
 * Story 1b: Empty State - Mobile
 * Mobile viewport showing empty state on small screen.
 */
export declare const EmptyMobile: Story;
/**
 * Story 1c: Empty State - Tablet
 * Tablet viewport showing empty state on medium screen.
 */
export declare const EmptyTablet: Story;
/**
 * Story 2: Loaded State - Desktop
 * Shows a few address lists with various configurations.
 * Demonstrates typical use case with multiple lists of different sizes.
 */
export declare const Loaded: Story;
/**
 * Story 2b: Loaded State - Mobile
 * Mobile viewport showing loaded state with card list.
 */
export declare const LoadedMobile: Story;
/**
 * Story 2c: Loaded State - Tablet
 * Tablet viewport showing loaded state with master-detail layout.
 */
export declare const LoadedTablet: Story;
/**
 * Story 3: Expanded List - Desktop
 * Shows a list expanded with its entries visible inline.
 * Demonstrates the expanded row detail view with entries.
 */
export declare const ExpandedList: Story;
/**
 * Story 4: Lists with Dynamic Entries
 * Shows lists that include dynamic entries (added by firewall actions)
 */
export declare const WithDynamicEntries: Story;
/**
 * Story 5: Large List (Virtualization Demo)
 * Shows a list with 10,000+ entries to demonstrate virtualization
 */
export declare const LargeList: Story;
/**
 * Story 6: Loading State - Desktop
 * Shows the loading skeleton while data is being fetched.
 */
export declare const Loading: Story;
/**
 * Story 6b: Loading State - Mobile
 * Loading skeleton on mobile viewport.
 */
export declare const LoadingMobile: Story;
/**
 * Story 7: Error State - Desktop
 * Shows error handling with professional error messaging.
 */
export declare const ErrorState: Story;
/**
 * Story 7b: Error State - Mobile
 * Error state on mobile viewport.
 */
export declare const ErrorMobile: Story;
/**
 * Story 8: With Referencing Rules
 * Shows lists with high rule reference counts
 */
export declare const WithReferencingRules: Story;
/**
 * Story 9: Mixed Entry Types
 * Shows lists with IPs, CIDR notation, and IP ranges
 */
export declare const MixedEntryTypes: Story;
/**
 * Story 10: Virtualization Disabled
 * Shows large list WITHOUT virtualization (performance comparison)
 */
export declare const VirtualizationDisabled: Story;
//# sourceMappingURL=AddressListManager.stories.d.ts.map