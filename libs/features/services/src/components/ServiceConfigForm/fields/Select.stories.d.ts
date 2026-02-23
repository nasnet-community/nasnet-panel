/**
 * Select Field Stories
 *
 * Storybook stories for the Select component which provides
 * a dropdown for single-choice selection in service config forms.
 */
import { Select } from './Select';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof Select>;
/**
 * Basic select with no initial value.
 * Click to open dropdown and choose an option.
 */
export declare const Default: Story;
/**
 * Select with a pre-selected value.
 */
export declare const WithValue: Story;
/**
 * Select with string array options (auto-converted to label).
 */
export declare const StringOptions: Story;
/**
 * Disabled state — cannot select values.
 */
export declare const Disabled: Story;
/**
 * Many options to show scrolling behavior.
 */
export declare const ManyOptions: Story;
/**
 * Interactive controlled example.
 * Demonstrates value changes and display updates.
 */
export declare const Interactive: Story;
//# sourceMappingURL=Select.stories.d.ts.map