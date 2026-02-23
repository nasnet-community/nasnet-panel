/**
 * Storybook stories for CircularGauge
 * SVG-based circular progress indicator with threshold-based coloring
 *
 * AC 5.2.3: Colors change based on configurable thresholds
 */
import { CircularGauge } from './CircularGauge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CircularGauge>;
export default meta;
type Story = StoryObj<typeof CircularGauge>;
/**
 * Normal / healthy state — value is below the warning threshold.
 * The progress ring renders in semantic green.
 */
export declare const Healthy: Story;
/**
 * Warning state — value is between the warning and critical thresholds.
 * The progress ring renders in semantic amber.
 */
export declare const Warning: Story;
/**
 * Critical state — value exceeds the critical threshold.
 * The progress ring renders in semantic red and should prompt immediate action.
 */
export declare const Critical: Story;
/**
 * All three supported sizes side by side for comparison.
 * sm = 80px, md = 120px, lg = 160px diameter.
 */
export declare const AllSizes: Story;
/**
 * Clickable gauge — renders as a <button> element with hover and focus styles.
 * Used for the CPU core breakdown interaction (AC 5.2.4).
 */
export declare const Clickable: Story;
/**
 * Edge cases — 0% (empty) and 100% (full capacity).
 */
export declare const EdgeCases: Story;
//# sourceMappingURL=CircularGauge.stories.d.ts.map