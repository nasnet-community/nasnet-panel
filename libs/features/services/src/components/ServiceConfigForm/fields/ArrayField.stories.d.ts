/**
 * ArrayField Stories
 *
 * Storybook stories for the ArrayField component which provides
 * a tag-style multi-value input for TEXT_ARRAY type config fields.
 */
import { ArrayField } from './ArrayField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ArrayField>;
export default meta;
type Story = StoryObj<typeof ArrayField>;
/**
 * Empty field with no pre-existing values.
 * Type a value and press Enter or click the + button to add an item.
 */
export declare const Default: Story;
/**
 * Field pre-populated with several DNS server addresses.
 */
export declare const WithExistingValues: Story;
/**
 * Field with an IP address regex pattern validator.
 * Only valid IPv4 addresses are accepted.
 */
export declare const WithPatternValidation: Story;
/**
 * Disabled state — no items can be added or removed.
 */
export declare const Disabled: Story;
/**
 * Interactive controlled example with live state management.
 * Demonstrates the full add/remove cycle.
 */
export declare const Interactive: Story;
/**
 * Field with many existing items to demonstrate badge wrapping.
 */
export declare const ManyItems: Story;
//# sourceMappingURL=ArrayField.stories.d.ts.map