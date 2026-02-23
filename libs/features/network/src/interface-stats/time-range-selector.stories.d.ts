/**
 * Storybook stories for TimeRangeSelector
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * TimeRangeSelector is a controlled dropdown backed by shadcn/ui Select.
 * All stories are fully interactive with no async data requirements.
 */
import { TimeRangeSelector } from './time-range-selector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TimeRangeSelector>;
export default meta;
type Story = StoryObj<typeof TimeRangeSelector>;
/**
 * Default controlled story — 24 h selected, onChange logged to the
 * Storybook Actions panel.
 */
export declare const Default: Story;
/**
 * Shortest window — last 1 hour selected.
 */
export declare const OneHour: Story;
/**
 * Six-hour window — good for observing traffic patterns across a work shift.
 */
export declare const SixHours: Story;
/**
 * Weekly view — last 7 days at daily granularity.
 */
export declare const SevenDays: Story;
/**
 * Monthly view — last 30 days for capacity planning.
 */
export declare const ThirtyDays: Story;
/**
 * Fully interactive story with local state.  Selecting an option updates the
 * displayed value and shows the resulting ISO 8601 time range so reviewers can
 * verify the controlled flow and the timeRangePresetToInput utility end-to-end.
 */
export declare const Interactive: Story;
//# sourceMappingURL=time-range-selector.stories.d.ts.map