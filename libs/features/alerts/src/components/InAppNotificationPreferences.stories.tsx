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

import { useEffect } from 'react';

import { fn } from 'storybook/test';

import { useAlertNotificationStore } from '@nasnet/state/stores';
import type { NotificationSettings } from '@nasnet/state/stores';

import { InAppNotificationPreferences } from './InAppNotificationPreferences';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Store initializer decorator
// Resets the Zustand store to a known settings state before each story renders.
// =============================================================================

function withStoreSettings(settings: Partial<NotificationSettings>) {
  return function StoreInitializer(Story: React.ComponentType) {
    useEffect(() => {
      useAlertNotificationStore.getState().updateSettings({
        enabled: true,
        soundEnabled: true,
        severityFilter: 'ALL',
        autoDismissTiming: 5000,
        ...settings,
      });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <Story />;
  };
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof InAppNotificationPreferences> = {
  title: 'Features/Alerts/InAppNotificationPreferences',
  component: InAppNotificationPreferences,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**InAppNotificationPreferences** provides a self-contained settings card for configuring
how in-app alert notifications are displayed.

**Settings:**
| Setting | Options |
|---|---|
| Enable notifications | Toggle on/off |
| Severity filter | All / Critical / Warning+ / Info+ |
| Auto-dismiss timing | Never / 3s / 5s / 10s / 30s |
| Notification sound | Toggle on/off |

All changes are **auto-saved** to the Zustand alert notification store — there is no submit button.
When notifications are disabled, the severity/timing/sound controls are hidden and a help text
banner is shown instead.
        `,
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class names applied to the root Card element',
    },
    onSettingsChange: {
      action: 'onSettingsChange',
      description: 'Optional callback invoked on every settings change',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InAppNotificationPreferences>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — notifications enabled with standard defaults.
 * All sub-controls are visible: severity filter, auto-dismiss, sound.
 */
export const Default: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: true,
      soundEnabled: true,
      severityFilter: 'ALL',
      autoDismissTiming: 5000,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Default settings state: notifications on, all severities, 5-second auto-dismiss, sound enabled.',
      },
    },
  },
};

/**
 * Notifications disabled — all sub-controls are hidden, help text shown instead.
 */
export const NotificationsDisabled: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: false,
      soundEnabled: true,
      severityFilter: 'ALL',
      autoDismissTiming: 5000,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When notifications are disabled the severity, timing, and sound controls are hidden. A help banner explains how to re-enable.',
      },
    },
  },
};

/**
 * Critical alerts only — highest urgency filter.
 */
export const CriticalFilter: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: true,
      soundEnabled: true,
      severityFilter: 'CRITICAL',
      autoDismissTiming: 10000,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Severity filter set to "Critical Only" — only CRITICAL alerts generate in-app notifications.',
      },
    },
  },
};

/**
 * Never auto-dismiss — notifications remain until manually closed.
 */
export const NeverAutoDismiss: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: true,
      soundEnabled: false,
      severityFilter: 'ALL',
      autoDismissTiming: 0,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Auto-dismiss set to "Never" — the help text reads "Notifications remain visible until manually dismissed".',
      },
    },
  },
};

/**
 * Sound disabled — silent notification mode.
 */
export const SoundDisabled: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: true,
      soundEnabled: false,
      severityFilter: 'ALL',
      autoDismissTiming: 5000,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Sound is toggled off — the VolumeX icon replaces Volume2 and the switch is unchecked.',
      },
    },
  },
};

/**
 * Minimal / silent profile — critical only, no auto-dismiss, no sound.
 * Typical for quiet-hours-aware power users.
 */
export const MinimalProfile: Story = {
  args: {
    onSettingsChange: fn(),
  },
  decorators: [
    withStoreSettings({
      enabled: true,
      soundEnabled: false,
      severityFilter: 'CRITICAL',
      autoDismissTiming: 0,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Minimal/silent profile: only critical alerts, no sound, notifications stay until manually dismissed.',
      },
    },
  },
};
