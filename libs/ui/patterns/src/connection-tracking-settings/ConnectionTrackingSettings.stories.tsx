/**
 * Storybook Stories for ConnectionTrackingSettings
 *
 * Visual documentation and testing for ConnectionTrackingSettings pattern component.
 *
 * Stories:
 * - Default state
 * - Modified state
 * - With errors (validation)
 * - Saving state (loading)
 * - Disabled tracking
 * - Mobile vs Desktop presenters
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 */

import { ConnectionTrackingSettings, useConnectionTrackingSettings } from './index';
import { DEFAULT_SETTINGS } from './types';

import type { ConnectionTrackingSettings as SettingsType } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// Mock data for different states
const mockDefaultSettings = DEFAULT_SETTINGS;
const mockModifiedSettings: SettingsType = {
  ...DEFAULT_SETTINGS,
  tcpEstablishedTimeout: 43200, // 12 hours
  tcpTimeWaitTimeout: 30, // 30s
  maxEntries: 65536,
};
const mockDisabledSettings: SettingsType = {
  ...DEFAULT_SETTINGS,
  enabled: false,
};

// Wrapper component to use the hook
function ConnectionTrackingSettingsWrapper({
  initialSettings,
  onSubmit,
  loading,
}: {
  initialSettings?: SettingsType;
  onSubmit?: (settings: SettingsType) => Promise<void>;
  loading?: boolean;
}) {
  const settingsHook = useConnectionTrackingSettings({
    initialSettings,
    onSubmit:
      onSubmit ||
      (async (settings) => {
        console.log('Submit settings:', settings);
        // Simulate async save
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
    onReset: () => console.log('Reset to defaults'),
  });

  return (
    <ConnectionTrackingSettings
      settingsHook={settingsHook}
      loading={loading}
    />
  );
}

const meta: Meta<typeof ConnectionTrackingSettingsWrapper> = {
  title: 'Patterns/Common/ConnectionTrackingSettings',
  component: ConnectionTrackingSettingsWrapper,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Connection tracking settings form for configuring firewall connection tracking behavior, timeouts, and limits. Uses Dangerous level (orange) safety confirmation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initialSettings: {
      description: 'Initial connection tracking settings',
      control: { type: 'object' },
    },
    onSubmit: {
      description: 'Callback when settings are submitted',
      action: 'submitSettings',
    },
    loading: {
      description: 'Loading state while fetching settings',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionTrackingSettingsWrapper>;

// =============================================================================
// Story: Default State
// =============================================================================

export const Default: Story = {
  args: {
    initialSettings: mockDefaultSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save settings:', settings);
      alert(
        `Settings saved:\n- Max Entries: ${settings.maxEntries}\n- TCP Established: ${settings.tcpEstablishedTimeout}s`
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default connection tracking settings. Enabled with standard timeout values (1 day TCP established, 10s UDP, etc.).',
      },
    },
  },
};

// =============================================================================
// Story: Loading State
// =============================================================================

export const Loading: Story = {
  args: {
    initialSettings: mockDefaultSettings,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton while fetching settings from router.',
      },
    },
  },
};

// =============================================================================
// Story: Modified State
// =============================================================================

export const Modified: Story = {
  args: {
    initialSettings: mockModifiedSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save modified settings:', settings);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Modified settings showing custom timeout values (12h TCP established, 30s TIME-WAIT) and increased max entries (65536).',
      },
    },
  },
};

// =============================================================================
// Story: Disabled Tracking
// =============================================================================

export const DisabledTracking: Story = {
  args: {
    initialSettings: mockDisabledSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save disabled tracking:', settings);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Connection tracking disabled. Warning shown that firewall features may be limited. Requires Dangerous confirmation to save.',
      },
    },
  },
};

// =============================================================================
// Story: High Max Entries
// =============================================================================

export const HighMaxEntries: Story = {
  args: {
    initialSettings: {
      ...mockDefaultSettings,
      maxEntries: 10000000, // Maximum allowed
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Max entries set to maximum value (10,000,000). Shows warning badge when approaching system capacity.',
      },
    },
  },
};

// =============================================================================
// Story: Short Timeouts (Aggressive)
// =============================================================================

export const ShortTimeouts: Story = {
  args: {
    initialSettings: {
      ...mockDefaultSettings,
      tcpEstablishedTimeout: 3600, // 1 hour (short for established)
      tcpTimeWaitTimeout: 5, // 5s (very short)
      udpTimeout: 5, // 5s (very short)
      icmpTimeout: 3, // 3s (very short)
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aggressive timeout settings for high-traffic networks. Shorter timeouts reduce memory usage but may break long-lived connections.',
      },
    },
  },
};

// =============================================================================
// Story: Mobile Presenter
// =============================================================================

export const MobileView: Story = {
  args: {
    initialSettings: mockDefaultSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save settings (mobile):', settings);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile collapsible accordion layout (<640px). Timeout sections grouped in expandable panels. 44px touch targets.',
      },
    },
  },
};

// =============================================================================
// Story: Desktop Presenter
// =============================================================================

export const DesktopView: Story = {
  args: {
    initialSettings: mockDefaultSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save settings (desktop):', settings);
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop grouped sections layout (>1024px). All timeout fields visible in organized sections (General, TCP Timeouts, Other Protocols).',
      },
    },
  },
};

// =============================================================================
// Story: Loose Tracking Enabled
// =============================================================================

export const LooseTrackingEnabled: Story = {
  args: {
    initialSettings: {
      ...mockDefaultSettings,
      looseTracking: true,
    },
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Loose tracking enabled. Allows connection tracking when packets arrive out of order. Reduces false positives at the cost of slightly reduced security.',
      },
    },
  },
};

// =============================================================================
// Story: Accessibility Test
// =============================================================================

export const AccessibilityTest: Story = {
  args: {
    initialSettings: mockDefaultSettings,
    loading: false,
    onSubmit: async (settings: SettingsType) => {
      console.log('Save settings:', settings);
    },
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'form-field-multiple-labels',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Accessibility validation. Check Storybook a11y addon for zero violations. All form fields have proper labels and WCAG AAA contrast (7:1).',
      },
    },
  },
};
