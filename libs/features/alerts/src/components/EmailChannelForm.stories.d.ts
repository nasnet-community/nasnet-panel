/**
 * EmailChannelForm Storybook Stories
 * NAS-18.3: Email notification configuration with Platform Presenters
 *
 * Showcases all prop variants, pre-filled states, and interaction scenarios
 * for the email channel configuration form.
 */
import { EmailChannelForm } from './EmailChannelForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof EmailChannelForm>;
export default meta;
type Story = StoryObj<typeof EmailChannelForm>;
/**
 * Default empty state — new email channel configuration
 */
export declare const Default: Story;
/**
 * Pre-filled with a Gmail SMTP configuration
 */
export declare const PrefilledGmail: Story;
/**
 * Pre-filled with an Office 365 / SMTPS configuration on port 465
 */
export declare const PrefilledOffice365: Story;
/**
 * Self-hosted SMTP with TLS verification disabled (internal server)
 */
export declare const SelfHostedInsecure: Story;
/**
 * Disabled form — read-only when another operation is in progress
 */
export declare const Disabled: Story;
/**
 * Mobile viewport — touch-optimized single-column layout
 */
export declare const Mobile: Story;
/**
 * Desktop viewport — two-column dense layout
 */
export declare const Desktop: Story;
//# sourceMappingURL=EmailChannelForm.stories.d.ts.map