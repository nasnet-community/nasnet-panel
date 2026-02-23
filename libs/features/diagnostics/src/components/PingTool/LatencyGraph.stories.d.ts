/**
 * Storybook stories for LatencyGraph
 *
 * Demonstrates all display states of the Recharts-based latency visualizer:
 * empty state, healthy low-latency, spike detection, timeouts producing
 * line gaps, and crossing the warning/critical threshold reference lines.
 */
import { LatencyGraph } from './LatencyGraph';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LatencyGraph>;
export default meta;
type Story = StoryObj<typeof LatencyGraph>;
/**
 * Empty State
 *
 * No data yet. Shows the placeholder message prompting the user to start a test.
 */
export declare const Empty: Story;
/**
 * Healthy Connection
 *
 * Twenty sequential pings all well below the 100ms warning threshold.
 * The Y-axis is clamped to [0, 250] and the line remains in the safe zone.
 */
export declare const Healthy: Story;
/**
 * With Timeouts (Line Gaps)
 *
 * Timeouts (null time values) produce visible gaps in the line chart.
 * This distinguishes a failed ping from a low-latency one.
 */
export declare const WithTimeouts: Story;
/**
 * Crossing Thresholds
 *
 * Latency rises through the warning (100ms) and critical (200ms) reference lines,
 * then recovers — demonstrating both threshold markers in a realistic scenario.
 */
export declare const CrossingThresholds: Story;
/**
 * High Latency (Satellite Link)
 *
 * All pings complete but at 400–700ms — well above both thresholds.
 * The Y-axis auto-scales to accommodate the extreme values.
 */
export declare const HighLatency: Story;
/**
 * Single Data Point
 *
 * Edge case: only one ping result. The chart renders a single dot
 * rather than a connected line.
 */
export declare const SinglePoint: Story;
//# sourceMappingURL=LatencyGraph.stories.d.ts.map