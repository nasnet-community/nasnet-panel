/**
 * Storybook stories for LeaseDetailPanel
 *
 * Expandable detail panel for a DHCP lease, used inside table row
 * expansions (desktop) or bottom sheets (mobile).
 */
import { LeaseDetailPanel } from './LeaseDetailPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LeaseDetailPanel>;
export default meta;
type Story = StoryObj<typeof LeaseDetailPanel>;
/**
 * Dynamic bound lease with all fields populated, including client ID.
 * Both "Make Static" and "Delete" action buttons are visible.
 */
export declare const DynamicBoundLease: Story;
/**
 * Static lease — the "Make Static" action button is hidden because
 * this lease is already static (dynamic: false).
 */
export declare const StaticLease: Story;
/**
 * Lease in "Waiting" state with no hostname and no last-seen timestamp.
 * Fallback text ("Unknown" / "Never") is displayed for missing fields.
 */
export declare const WaitingLeaseNoHostname: Story;
/**
 * A blocked lease. The Status section renders a "Stopped" badge
 * alongside the primary status badge.
 */
export declare const BlockedLease: Story;
/**
 * Read-only panel — no action callbacks provided.
 * The Quick Actions section shows no buttons.
 */
export declare const ReadOnly: Story;
/**
 * Delete-only panel — only "Delete" callback is provided.
 * The "Make Static" button is absent.
 */
export declare const DeleteOnly: Story;
//# sourceMappingURL=LeaseDetailPanel.stories.d.ts.map