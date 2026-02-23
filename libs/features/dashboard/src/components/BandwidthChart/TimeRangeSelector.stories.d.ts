/**
 * Storybook stories for TimeRangeSelector
 * Accessible segmented control for selecting bandwidth chart time range
 */
import { TimeRangeSelector } from './TimeRangeSelector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TimeRangeSelector>;
export default meta;
type Story = StoryObj<typeof TimeRangeSelector>;
/**
 * Default — 5-minute real-time view selected.
 */
export declare const Default: Story;
/**
 * One-hour view selected.
 */
export declare const OneHourSelected: Story;
/**
 * Twenty-four-hour view selected.
 */
export declare const TwentyFourHoursSelected: Story;
/**
 * Interactive — state is controlled inside the story so clicking actually changes the selection.
 */
export declare const Interactive: Story;
/**
 * Keyboard navigation demo — render instructions alongside the component.
 */
export declare const KeyboardNavigation: Story;
//# sourceMappingURL=TimeRangeSelector.stories.d.ts.map