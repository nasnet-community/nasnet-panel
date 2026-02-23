/**
 * Storybook stories for CopyButton component
 * @see NAS-4.23 - Implement Clipboard Integration
 */
import { CopyButton } from './CopyButton';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof CopyButton>;
export default meta;
type Story = StoryObj<typeof CopyButton>;
/**
 * Default inline variant - icon only button
 */
export declare const Inline: Story;
/**
 * Button variant - includes "Copy" text
 */
export declare const WithText: Story;
/**
 * With toast notifications
 */
export declare const WithToast: Story;
/**
 * Disabled state
 */
export declare const Disabled: Story;
/**
 * Custom tooltip text
 */
export declare const CustomTooltip: Story;
/**
 * Without tooltip
 */
export declare const WithoutTooltip: Story;
/**
 * In context - IP address display
 */
export declare const InContextIP: Story;
/**
 * In context - Public key display
 */
export declare const InContextPublicKey: Story;
/**
 * With callbacks
 */
export declare const WithCallbacks: Story;
//# sourceMappingURL=CopyButton.stories.d.ts.map