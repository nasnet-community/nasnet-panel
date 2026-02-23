/**
 * EmptyState Stories
 *
 * Storybook stories for the EmptyState pattern component.
 * Demonstrates different icon, action, and content variants used
 * throughout the app when lists or pages have no data to show.
 */
import { EmptyState } from './EmptyState';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof EmptyState>;
/**
 * Default empty state with a primary action button.
 * Represents the most common usage — VPN interfaces not yet configured.
 */
export declare const Default: Story;
/**
 * Empty state without an action button.
 * Used when there is no user action possible — e.g., logs with no entries yet.
 */
export declare const WithoutAction: Story;
/**
 * Empty state for a WiFi / wireless interfaces page.
 * Uses the outline button variant to indicate a secondary-priority action.
 */
export declare const WirelessEmpty: Story;
/**
 * Empty state for services / feature marketplace.
 * Uses the default button variant.
 */
export declare const ServicesEmpty: Story;
/**
 * Empty state for an alert/notification rules page.
 */
export declare const AlertsEmpty: Story;
/**
 * Empty state shown when a search returns no results.
 * Demonstrates usage within a search context without an action.
 */
export declare const NoSearchResults: Story;
/**
 * Empty state for a DHCP leases page with no active leases.
 * Demonstrates a database-context icon.
 */
export declare const DHCPEmpty: Story;
//# sourceMappingURL=EmptyState.stories.d.ts.map