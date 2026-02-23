/**
 * TextField Stories
 *
 * Storybook stories for the TextField component — a thin wrapper around
 * the Input primitive that handles sensitive field autocomplete suppression.
 * Used for TEXT, EMAIL, URL, IP_ADDRESS, and FILE_PATH config field types.
 */
import { TextField } from './TextField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof TextField>;
/**
 * Default plain text field with a descriptive placeholder.
 */
export declare const Default: Story;
/**
 * Field pre-filled with a value — represents an existing config entry.
 */
export declare const WithValue: Story;
/**
 * Sensitive field with autocomplete disabled.
 * Used for API keys, tokens, or other secret values.
 */
export declare const Sensitive: Story;
/**
 * Email type field for email-type service config entries.
 */
export declare const EmailType: Story;
/**
 * URL type field for webhook or remote endpoint configuration.
 */
export declare const URLType: Story;
/**
 * Disabled state — field is read-only in the UI, value cannot be changed.
 */
export declare const Disabled: Story;
//# sourceMappingURL=TextField.stories.d.ts.map