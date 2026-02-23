/**
 * MultiSelect Field Stories
 *
 * Storybook stories for the MultiSelect component which provides
 * a popover dropdown with checkboxes for multiple selection in service config forms.
 */
import { MultiSelect } from './MultiSelect';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MultiSelect>;
export default meta;
type Story = StoryObj<typeof MultiSelect>;
/**
 * Empty multi-select with no initial selections.
 * Click to open dropdown and check multiple options.
 */
export declare const Default: Story;
/**
 * Multi-select with some pre-selected values.
 */
export declare const WithValues: Story;
/**
 * Multi-select with string array options.
 */
export declare const StringOptions: Story;
/**
 * Disabled state — cannot select or deselect values.
 */
export declare const Disabled: Story;
/**
 * Many options to show scrolling in the dropdown.
 */
export declare const ManyOptions: Story;
/**
 * All options selected.
 */
export declare const AllSelected: Story;
/**
 * Interactive controlled example.
 * Demonstrates adding/removing selections with real-time display.
 */
export declare const Interactive: Story;
//# sourceMappingURL=MultiSelect.stories.d.ts.map