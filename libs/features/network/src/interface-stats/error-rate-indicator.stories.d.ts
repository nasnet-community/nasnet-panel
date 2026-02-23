/**
 * Storybook stories for ErrorRateIndicator
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * ErrorRateIndicator is a pure presentational component: it takes a numeric
 * error rate, trend direction, and optional threshold and renders the
 * appropriate colour-coded status with a trend icon.  No async data is
 * required, so all stories can render fully without a mock layer.
 */
import { ErrorRateIndicator } from './error-rate-indicator';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ErrorRateIndicator>;
export default meta;
type Story = StoryObj<typeof ErrorRateIndicator>;
/**
 * Healthy – error rate is well below the threshold.
 * Displayed in green with a stable (dash) trend icon.
 */
export declare const Healthy: Story;
/**
 * Warning – error rate is above threshold/2 but not yet over the threshold.
 * Displayed in amber/yellow with an upward trend icon.
 */
export declare const Warning: Story;
/**
 * Error – rate exceeds the threshold.
 * Displayed in red with an upward trend icon.
 */
export declare const ErrorState: Story;
/**
 * Recovering – rate was high but is now trending down; still above threshold.
 * Displayed in red with a downward trend icon signalling active improvement.
 */
export declare const Recovering: Story;
/**
 * Custom threshold – useful for high-reliability links where even 0.01%
 * errors should trigger a warning.
 */
export declare const StrictThreshold: Story;
/**
 * Zero errors – perfect interface health, ideal baseline display.
 */
export declare const ZeroErrors: Story;
//# sourceMappingURL=error-rate-indicator.stories.d.ts.map