/**
 * WebhookConfigForm Storybook Stories
 * NAS-18.4: Webhook notification configuration with Platform Presenters
 *
 * Showcases create/edit modes, authentication variants, template presets,
 * and platform-specific layouts for the webhook configuration form.
 */
import { WebhookConfigForm } from './WebhookConfigForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WebhookConfigForm>;
export default meta;
type Story = StoryObj<typeof WebhookConfigForm>;
/**
 * Create mode — empty form for a new webhook
 */
export declare const CreateMode: Story;
/**
 * Edit mode — pre-filled with an existing Slack webhook
 */
export declare const EditModeSlack: Story;
/**
 * Edit mode — webhook using Bearer Token authentication
 */
export declare const EditModeBearerAuth: Story;
/**
 * Edit mode — webhook using Basic authentication
 */
export declare const EditModeBasicAuth: Story;
/**
 * Mobile viewport — touch-optimized layout
 */
export declare const Mobile: Story;
/**
 * Desktop viewport — two-column dense layout
 */
export declare const Desktop: Story;
//# sourceMappingURL=WebhookConfigForm.stories.d.ts.map