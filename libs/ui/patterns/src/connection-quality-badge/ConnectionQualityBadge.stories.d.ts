/**
 * ConnectionQualityBadge Stories
 *
 * Demonstrates the connection quality badge across all quality levels,
 * sizes, and display configurations. Since the component reads from the
 * connection store via `useConnectionIndicator`, we use a mock presenter
 * approach so stories work without a live store.
 */
import type { Meta, StoryObj } from '@storybook/react';
type QualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
type SizeVariant = 'sm' | 'default' | 'lg';
interface MockBadgeProps {
    quality?: QualityLevel;
    latencyMs?: number | null;
    showLatency?: boolean;
    showIcon?: boolean;
    size?: SizeVariant;
    className?: string;
}
declare function MockConnectionQualityBadge({ quality, latencyMs, showLatency, showIcon, size, className, }: MockBadgeProps): import("react/jsx-runtime").JSX.Element;
declare const meta: Meta<typeof MockConnectionQualityBadge>;
export default meta;
type Story = StoryObj<typeof MockConnectionQualityBadge>;
/**
 * Excellent connection – latency below 50 ms. Full green badge with icon and latency.
 */
export declare const Excellent: Story;
/**
 * Good connection – latency in the 50–99 ms range.
 */
export declare const Good: Story;
/**
 * Moderate connection – latency in the 100–199 ms range. Rendered with amber styling.
 */
export declare const Moderate: Story;
/**
 * Poor connection – latency at or above 200 ms. Red badge with minimal signal icon.
 */
export declare const Poor: Story;
/**
 * Unknown quality – latency not yet measured (null). Shown as a muted outline badge.
 */
export declare const Unknown: Story;
/**
 * Icon-only variant – useful in space-constrained headers. Hides the latency number.
 */
export declare const IconOnly: Story;
/**
 * Label-only variant – hides both icon and latency, showing a text quality label instead.
 */
export declare const LabelOnly: Story;
/**
 * All quality levels side by side for quick visual comparison.
 */
export declare const AllQualityLevels: Story;
/**
 * Size variants – small, default, and large badges all showing the same excellent quality.
 */
export declare const SizeVariants: Story;
//# sourceMappingURL=ConnectionQualityBadge.stories.d.ts.map