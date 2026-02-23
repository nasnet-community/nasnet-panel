/**
 * Storybook stories for BandwidthDataTable
 * Accessible screen-reader alternative to the BandwidthChart canvas
 */
import { BandwidthDataTable } from './BandwidthDataTable';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BandwidthDataTable>;
export default meta;
type Story = StoryObj<typeof BandwidthDataTable>;
/**
 * Default — 5-minute real-time data (150 points, trimmed to 50 displayed).
 */
export declare const Default: Story;
/**
 * One-hour view with 1-minute averaged data.
 */
export declare const OneHour: Story;
/**
 * Twenty-four-hour view with 5-minute averaged data.
 */
export declare const TwentyFourHours: Story;
/**
 * High-traffic scenario — TX and RX rates near router capacity.
 */
export declare const HighTraffic: Story;
/**
 * Empty state — no data points available.
 */
export declare const Empty: Story;
/**
 * Single row — exactly one data point.
 */
export declare const SingleRow: Story;
//# sourceMappingURL=BandwidthDataTable.stories.d.ts.map