/**
 * Storybook stories for PollingIntervalSelector
 *
 * Covers the full-form (with label) and inline variants,
 * plus a decorator that stubs out the Zustand store so
 * stories work without a real localStorage environment.
 */
import { PollingIntervalSelector } from './polling-interval-selector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PollingIntervalSelector>;
export default meta;
type Story = StoryObj<typeof PollingIntervalSelector>;
/**
 * Default full layout with an "Update Interval" label, a 200 px wide select,
 * and a helper text line below it. This is the primary use-case inside a
 * settings panel or preferences dialog.
 */
export declare const Default: Story;
/**
 * Inline mode renders only the SelectTrigger with no surrounding label or
 * helper text. Ideal for embedding in page toolbars or card headers alongside
 * other controls.
 */
export declare const Inline: Story;
/**
 * Inline selector with a custom className to constrain its width – shows how
 * callers can style the trigger when placed inside a flex toolbar.
 */
export declare const InlineNarrow: Story;
/**
 * Full layout with an extra className applied to the outer wrapper, e.g. to
 * add top margin when placed below another settings group.
 */
export declare const WithCustomClass: Story;
/**
 * Inline selector embedded inside a realistic toolbar context.
 * Demonstrates how the component composes with sibling controls.
 */
export declare const InsideToolbar: Story;
//# sourceMappingURL=polling-interval-selector.stories.d.ts.map