/**
 * TimeRangeInput Storybook Stories
 *
 * Showcases the time range picker component used in quiet hours configuration.
 * Demonstrates normal ranges, midnight-crossing warning, disabled state,
 * and edge-case time values.
 */
import { TimeRangeInput } from './TimeRangeInput';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TimeRangeInput>;
export default meta;
type Story = StoryObj<typeof TimeRangeInput>;
/**
 * Default — typical night-time quiet window (10 PM to 8 AM).
 * Crosses midnight, so the warning banner is displayed.
 */
export declare const Default: Story;
/**
 * Same-day range — quiet hours that stay within a single calendar day.
 * No midnight-crossing warning is shown.
 */
export declare const SameDayRange: Story;
/**
 * Midnight crossing — end time is before start time, triggering the warning.
 */
export declare const MidnightCrossing: Story;
/**
 * Disabled state — all inputs are read-only and visually dimmed.
 */
export declare const Disabled: Story;
/**
 * Exact midnight boundary — start at 00:00, end at 00:00.
 * End equals start so endMinutes === startMinutes; no crossing.
 */
export declare const MidnightBoundary: Story;
/**
 * Business-hours range — typical do-not-disturb during work day.
 */
export declare const BusinessHours: Story;
//# sourceMappingURL=TimeRangeInput.stories.d.ts.map