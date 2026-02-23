/**
 * TrafficChart Stories
 *
 * Storybook stories for the TrafficChart pattern component.
 * Demonstrates default placeholder data, custom datasets, loading state,
 * and different chart heights representing various dashboard card sizes.
 */
import { TrafficChart } from './TrafficChart';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TrafficChart>;
export default meta;
type Story = StoryObj<typeof TrafficChart>;
/**
 * Default render with built-in placeholder data.
 * Includes the "Sample data" badge to communicate the data is not live.
 */
export declare const Default: Story;
/**
 * Quiet router: very low bandwidth — single-digit Mb/s values.
 */
export declare const QuietTraffic: Story;
/**
 * Heavy download burst: download peaks at ~940 Mb/s.
 * Demonstrates the chart's Y-axis auto-scaling behaviour.
 */
export declare const HeavyDownloadBurst: Story;
/**
 * Symmetrical traffic: upload and download are roughly equal.
 * Typical for a VPN endpoint or server hosting uploads.
 */
export declare const SymmetricalTraffic: Story;
/**
 * Gigabit link saturation: sustained multi-Gb/s throughput.
 * Bandwidth values exceed 1000 Mb/s so the formatter switches to "Gb/s".
 */
export declare const GigabitSaturation: Story;
/**
 * Tall chart: increased height for prominent hero placement.
 */
export declare const TallChart: Story;
/**
 * No data, placeholder disabled: empty chart body.
 */
export declare const EmptyNoPlaceholder: Story;
/**
 * Live simulation: generates a new data point every 2 seconds.
 */
export declare const LiveSimulation: Story;
//# sourceMappingURL=TrafficChart.stories.d.ts.map