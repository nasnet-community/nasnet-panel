/**
 * PasswordField Stories
 *
 * Storybook stories for the PasswordField component — a password input with
 * show/hide toggle for revealing the password value.
 * Used for PASSWORD type service config fields.
 */
import { PasswordField } from './PasswordField';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PasswordField>;
export default meta;
type Story = StoryObj<typeof PasswordField>;
/**
 * Default password field with standard appearance.
 */
export declare const Default: Story;
/**
 * Password field with a pre-filled value.
 * Demonstrates how the value is hidden by default.
 */
export declare const WithValue: Story;
/**
 * API key field (using password field for sensitive data protection).
 * Shows how password field can be repurposed for API keys and tokens.
 */
export declare const APIKeyField: Story;
/**
 * Disabled state — the password value is locked and cannot be changed.
 */
export declare const Disabled: Story;
/**
 * Error state — field validation failed and should show an error message.
 */
export declare const WithError: Story;
/**
 * Empty field ready for new password input.
 */
export declare const Empty: Story;
//# sourceMappingURL=PasswordField.stories.d.ts.map