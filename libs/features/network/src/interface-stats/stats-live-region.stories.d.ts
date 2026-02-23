/**
 * Storybook stories for StatsLiveRegion
 *
 * StatsLiveRegion is a screen-reader-only (sr-only) ARIA live region.
 * It renders no visible UI – its purpose is purely accessibility.
 *
 * These stories use a custom decorator that renders the live region alongside
 * a visible debug panel so reviewers can see what message would be announced
 * to assistive technology without using a screen reader.
 */
import { StatsLiveRegion } from './stats-live-region';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof StatsLiveRegion>;
export default meta;
type Story = StoryObj<typeof StatsLiveRegion>;
/**
 * Default happy-path announcement: interface with no errors.
 * The screen reader will announce TX/RX totals in human-readable form.
 */
export declare const Default: Story;
/**
 * Interface with TX errors detected.
 * A warning suffix is appended: "Warning: 3 errors detected."
 */
export declare const WithTxErrors: Story;
/**
 * Interface with both TX and RX errors.
 * The error count is the sum of both fields.
 */
export declare const WithBothErrors: Story;
/**
 * Exactly one error – confirms singular form "1 error detected."
 */
export declare const SingleError: Story;
/**
 * Null stats – component should render nothing (returns null).
 * The debug panel shows a placeholder message.
 */
export declare const NullStats: Story;
/**
 * Zero traffic – interface exists but has not transmitted or received anything
 * yet. Announcement mentions "0 bytes" for both directions.
 */
export declare const ZeroTraffic: Story;
//# sourceMappingURL=stats-live-region.stories.d.ts.map