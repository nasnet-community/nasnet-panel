/**
 * Storybook stories for BandwidthChart
 * Demonstrates all component states and variations
 */
import { BandwidthChart } from './BandwidthChart';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof BandwidthChart>;
export default meta;
type Story = StoryObj<typeof BandwidthChart>;
/**
 * Default story - 5-minute real-time view with live data simulation
 */
export declare const Default: Story;
/**
 * One-hour view with 1-minute aggregation
 */
export declare const OneHour: Story;
/**
 * 24-hour view with 5-minute aggregation
 */
export declare const TwentyFourHours: Story;
/**
 * Interface-filtered view (specific interface selected)
 */
export declare const InterfaceFiltered: Story;
/**
 * Loading state with skeleton
 */
export declare const Loading: Story;
/**
 * Error state with retry button
 */
export declare const ErrorState: Story;
/**
 * Empty state (no data available)
 */
export declare const Empty: Story;
/**
 * Mobile view (compact layout)
 */
export declare const Mobile: Story;
/**
 * High traffic scenario (near capacity)
 */
export declare const HighTraffic: Story;
/**
 * Reduced motion mode (animations disabled)
 */
export declare const ReducedMotion: Story;
//# sourceMappingURL=BandwidthChart.stories.d.ts.map