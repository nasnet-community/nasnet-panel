/**
 * SeverityBadge Storybook Stories
 *
 * Stories for the severity badge component demonstrating all severity levels
 * and both read-only and dismissible variants.
 */
import { SeverityBadge } from './SeverityBadge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SeverityBadge>;
export default meta;
type Story = StoryObj<typeof SeverityBadge>;
/**
 * Debug severity (lowest) - gray, muted appearance
 */
export declare const Debug: Story;
/**
 * Info severity - blue, informational
 */
export declare const Info: Story;
/**
 * Warning severity - amber, attention needed
 */
export declare const Warning: Story;
/**
 * Error severity - red, error occurred
 */
export declare const Error: Story;
/**
 * Critical severity (highest) - red + bold + ring
 */
export declare const Critical: Story;
/**
 * Read-only badge (for log entries) - no dismiss button
 */
export declare const ReadOnly: Story;
/**
 * Dismissible badge (for filters) - with X button
 */
export declare const Dismissible: Story;
/**
 * All severity levels for comparison
 */
export declare const AllSeverities: Story;
/**
 * Filter chips with dismiss buttons
 */
export declare const FilterChips: Story;
/**
 * Badge in realistic log entry context
 */
export declare const InContext: Story;
//# sourceMappingURL=SeverityBadge.stories.d.ts.map