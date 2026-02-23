/**
 * DayOfWeekSelector Storybook Stories
 *
 * Showcases all selection states, interaction variants, and accessibility
 * characteristics of the multi-select day picker component.
 */
import { DayOfWeekSelector } from './DayOfWeekSelector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DayOfWeekSelector>;
export default meta;
type Story = StoryObj<typeof DayOfWeekSelector>;
/**
 * Weekdays only (Mon–Fri) — most common quiet-hours schedule
 */
export declare const Weekdays: Story;
/**
 * All days selected
 */
export declare const AllDays: Story;
/**
 * Weekend only (Sat + Sun)
 */
export declare const WeekendOnly: Story;
/**
 * Single day selected (minimum required by the component)
 */
export declare const SingleDay: Story;
/**
 * Disabled state — non-interactive during saves or when a parent is locked
 */
export declare const Disabled: Story;
/**
 * Custom className — demonstrates className pass-through for layout integration
 */
export declare const WithCustomClass: Story;
//# sourceMappingURL=DayOfWeekSelector.stories.d.ts.map