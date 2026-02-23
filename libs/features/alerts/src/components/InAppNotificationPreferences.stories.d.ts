/**
 * InAppNotificationPreferences Storybook Stories
 *
 * Demonstrates all configuration states of the in-app notification preferences card:
 * - Default (enabled, all severities, 5s auto-dismiss, sound on)
 * - Notifications disabled
 * - Critical-only severity filter
 * - Never auto-dismiss
 * - Sound disabled
 * - Minimal / silent profile
 */
import { InAppNotificationPreferences } from './InAppNotificationPreferences';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InAppNotificationPreferences>;
export default meta;
type Story = StoryObj<typeof InAppNotificationPreferences>;
/**
 * Default — notifications enabled with standard defaults.
 * All sub-controls are visible: severity filter, auto-dismiss, sound.
 */
export declare const Default: Story;
/**
 * Notifications disabled — all sub-controls are hidden, help text shown instead.
 */
export declare const NotificationsDisabled: Story;
/**
 * Critical alerts only — highest urgency filter.
 */
export declare const CriticalFilter: Story;
/**
 * Never auto-dismiss — notifications remain until manually closed.
 */
export declare const NeverAutoDismiss: Story;
/**
 * Sound disabled — silent notification mode.
 */
export declare const SoundDisabled: Story;
/**
 * Minimal / silent profile — critical only, no auto-dismiss, no sound.
 * Typical for quiet-hours-aware power users.
 */
export declare const MinimalProfile: Story;
//# sourceMappingURL=InAppNotificationPreferences.stories.d.ts.map