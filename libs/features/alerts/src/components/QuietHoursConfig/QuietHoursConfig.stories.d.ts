/**
 * QuietHoursConfig Storybook Stories
 *
 * Showcases all configuration states and platform variants for the quiet
 * hours notification suppression component.
 */
import { QuietHoursConfig } from './QuietHoursConfig';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof QuietHoursConfig>;
export default meta;
type Story = StoryObj<typeof QuietHoursConfig>;
/**
 * Default — nighttime window, Mon–Fri, bypass critical enabled
 */
export declare const Default: Story;
/**
 * Weekend-only quiet hours — Sat + Sun all day
 */
export declare const WeekendOnly: Story;
/**
 * Maintenance window — short window every day at midnight UTC
 */
export declare const DailyMaintenanceWindow: Story;
/**
 * Empty/unset state — component with no initial value
 */
export declare const Unset: Story;
/**
 * Disabled — read-only during a save operation
 */
export declare const Disabled: Story;
/**
 * Mobile viewport — single-column touch-friendly layout
 */
export declare const Mobile: Story;
/**
 * Desktop viewport — two-column grid layout
 */
export declare const Desktop: Story;
//# sourceMappingURL=QuietHoursConfig.stories.d.ts.map