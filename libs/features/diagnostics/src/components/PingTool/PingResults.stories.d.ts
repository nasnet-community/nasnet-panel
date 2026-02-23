/**
 * Storybook stories for PingResults
 *
 * Demonstrates all states and variants of the PingResults component,
 * including empty state, healthy results, slow results, timeouts, and
 * large virtualized result sets.
 */
import { PingResults } from './PingResults';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PingResults>;
export default meta;
type Story = StoryObj<typeof PingResults>;
/**
 * Empty State
 *
 * Shown before a ping test has been started. Prompts the user to begin.
 */
export declare const Empty: Story;
/**
 * Healthy Results
 *
 * All pings succeed with low latency (10–30ms). Rows are rendered in green.
 */
export declare const Healthy: Story;
/**
 * Mixed Results
 *
 * Combination of healthy (green), slow >100ms (amber), critical >200ms (red),
 * and timeout (red) entries — demonstrating the color-coding logic.
 */
export declare const MixedLatency: Story;
/**
 * All Timeouts
 *
 * Every ping failed with a timeout — host unreachable scenario.
 * All rows display in destructive (red) color.
 */
export declare const AllTimeouts: Story;
/**
 * Large Dataset (100 entries)
 *
 * Demonstrates the @tanstack/react-virtual virtualized rendering with 100 results.
 * Scroll the list to verify only visible rows are rendered to the DOM.
 */
export declare const LargeDataset: Story;
/**
 * Custom Target
 *
 * Results for a hostname target instead of an IP address.
 */
export declare const HostnameTarget: Story;
//# sourceMappingURL=PingResults.stories.d.ts.map