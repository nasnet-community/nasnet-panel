/**
 * Storybook stories for LeaseCard
 *
 * Mobile-optimized card for DHCP lease display with swipe gestures,
 * expandable detail sheet, and "New" badge indicator.
 */
import { LeaseCard } from './LeaseCard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LeaseCard>;
export default meta;
type Story = StoryObj<typeof LeaseCard>;
/**
 * A standard dynamic lease for a known device.
 * Displays IP, hostname, MAC, and "Bound" status with an expand chevron.
 */
export declare const DynamicBoundLease: Story;
/**
 * A static (pinned) lease. The "Make Static" swipe/action is hidden
 * because this lease is already static (dynamic: false).
 */
export declare const StaticLease: Story;
/**
 * A brand-new lease with the pulsing "New" badge.
 * Useful for highlighting recently detected clients on the network.
 */
export declare const NewLeaseBadge: Story;
/**
 * A lease with no hostname set by the client.
 * The hostname row shows "Unknown" as a fallback.
 */
export declare const UnknownHostname: Story;
/**
 * A blocked lease. The device is denied network access.
 * Status shows as "Blocked" in the status badge.
 */
export declare const BlockedDevice: Story;
/**
 * Read-only card — no action callbacks provided.
 * The bottom sheet will still show device details but
 * "Make Static" and "Delete" buttons are hidden.
 */
export declare const ReadOnly: Story;
//# sourceMappingURL=LeaseCard.stories.d.ts.map