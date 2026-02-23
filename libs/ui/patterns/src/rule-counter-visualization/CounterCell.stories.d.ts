/**
 * CounterCell Storybook Stories
 * Visual testing for counter visualization component
 */
import { CounterCell } from './CounterCell';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CounterCell>;
export default meta;
type Story = StoryObj<typeof CounterCell>;
/**
 * Zero Traffic - Unused Rule
 * Rule that has never matched any traffic
 */
export declare const ZeroTraffic: Story;
/**
 * Low Traffic
 * Rule with minimal traffic (< 10% of max)
 */
export declare const LowTraffic: Story;
/**
 * Moderate Traffic
 * Rule with moderate traffic (10-50% of max)
 */
export declare const ModerateTraffic: Story;
/**
 * High Traffic
 * Rule with high traffic (50-80% of max)
 */
export declare const HighTraffic: Story;
/**
 * Maximum Traffic
 * Rule at or near maximum traffic (> 80%)
 */
export declare const MaxTraffic: Story;
/**
 * Without Rate Display
 * Counter without rate calculation (polling disabled)
 */
export declare const WithoutRate: Story;
/**
 * Without Progress Bar
 * Counter without relative progress bar
 */
export declare const WithoutBar: Story;
/**
 * Minimal Display
 * Counter with only basic stats (no rate, no bar)
 */
export declare const MinimalDisplay: Story;
/**
 * Desktop Presenter - Horizontal Layout
 * Direct usage of desktop presenter
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile Presenter - Vertical Stack
 * Direct usage of mobile presenter
 */
export declare const MobilePresenter: Story;
/**
 * Loading State
 * Counter with skeleton/loading placeholders
 */
export declare const Loading: Story;
/**
 * Comparison Grid - Multiple Rules
 * Grid showing multiple rules for comparison
 */
export declare const ComparisonGrid: Story;
//# sourceMappingURL=CounterCell.stories.d.ts.map