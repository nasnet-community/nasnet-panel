/**
 * NtfyChannelForm Storybook Stories
 * NAS-18.X: Ntfy.sh notification channel with Platform Presenters
 *
 * Showcases all prop variants, server presets, authentication states,
 * priority presets, and platform-specific layouts for the ntfy.sh channel form.
 */
import { NtfyChannelForm } from './NtfyChannelForm';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NtfyChannelForm>;
export default meta;
type Story = StoryObj<typeof NtfyChannelForm>;
/**
 * Default empty state — new ntfy.sh channel (public server)
 */
export declare const Default: Story;
/**
 * Pre-filled using the public ntfy.sh server with tags and default priority
 */
export declare const PublicServerWithTags: Story;
/**
 * Self-hosted ntfy server with authentication
 */
export declare const SelfHostedWithAuth: Story;
/**
 * High-priority configuration for critical router events
 */
export declare const HighPriorityCritical: Story;
/**
 * Disabled state — channel temporarily turned off
 */
export declare const DisabledChannel: Story;
/**
 * Mobile viewport — touch-optimized single-column layout
 */
export declare const Mobile: Story;
/**
 * Desktop viewport — two-column dense layout
 */
export declare const Desktop: Story;
//# sourceMappingURL=NtfyChannelForm.stories.d.ts.map