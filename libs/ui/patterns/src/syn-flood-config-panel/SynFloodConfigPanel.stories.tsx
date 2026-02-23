/**
 * SynFloodConfigPanel Storybook Stories
 *
 * Interactive stories for SYN flood protection configuration panel.
 * Demonstrates presets, actions, and platform variants.
 *
 * @module @nasnet/ui/patterns/syn-flood-config-panel
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { fn } from 'storybook/test';
import { useForm } from 'react-hook-form';

import { SynFloodConfigPanel } from './SynFloodConfigPanel';
import {
  mockSynFloodDrop,
  mockSynFloodTarpit,
  mockSynFloodDisabled,
  mockSynFloodStrict,
} from '../__test-utils__/rate-limit-fixtures';
import { useSynFloodConfigPanel } from './use-syn-flood-config-panel';

import type { Meta, StoryObj } from '@storybook/react';
import type { UseSynFloodConfigPanelReturn } from './use-syn-flood-config-panel';
import type { SynFloodFormValues } from './types';

/**
 * Helper to create a UseSynFloodConfigPanelReturn mock
 */
function createMockConfigHook(config: typeof mockSynFloodDrop): UseSynFloodConfigPanelReturn {
  const form = useForm<SynFloodFormValues>({
    defaultValues: {
      enabled: config.isEnabled,
      synLimit: String(config.synLimit),
      burst: String(config.burst),
      action: config.action,
    },
  });

  return {
    form,
    isDirty: false,
    isSubmitting: false,
    handleSubmit: fn(),
    handleReset: fn(),
    formToConfig: (values) => ({
      isEnabled: values.enabled,
      synLimit: parseInt(values.synLimit, 10),
      burst: parseInt(values.burst, 10),
      action: values.action,
    }),
    configToForm: (cfg) => ({
      enabled: cfg.isEnabled,
      synLimit: String(cfg.synLimit),
      burst: String(cfg.burst),
      action: cfg.action,
    }),
    isLowSynLimit: fn(),
  };
}

/**
 * SynFloodConfigPanel - SYN flood protection configuration
 *
 * The SynFloodConfigPanel component provides an intuitive interface for configuring
 * SYN flood protection on MikroTik routers. It includes preset configurations and
 * automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **Preset configurations**: Quick setup for common scenarios (Normal, Strict, Paranoid)
 * - **Action types**: Drop or Tarpit excess SYN packets
 * - **Live validation**: Real-time feedback for invalid limits
 * - **Burst handling**: Configure burst allowance for legitimate traffic spikes
 * - **Toggle protection**: Easy enable/disable without losing configuration
 * - **Platform adaptive**: Desktop card vs mobile panel
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Protection Actions
 *
 * - **Drop**: Immediately drops excess SYN packets (faster, more aggressive)
 * - **Tarpit**: Delays responses to slow down attackers (subtler, uses more CPU)
 *
 * ## Presets
 *
 * - **Normal**: 100 SYN/sec, burst 5 - Balanced protection for most scenarios
 * - **Strict**: 50 SYN/sec, burst 5 - Aggressive protection for high-risk environments
 * - **Paranoid**: 25 SYN/sec, burst 3 - Maximum protection, may block legitimate spikes
 *
 * ## Usage
 *
 * ```tsx
 * import { SynFloodConfigPanel } from '@nasnet/ui/patterns/syn-flood-config-panel';
 *
 * function MyComponent() {
 *   const { data: config, isLoading } = useSynFloodConfig(routerId);
 *
 *   return (
 *     <SynFloodConfigPanel
 *       config={config}
 *       loading={isLoading}
 *       onUpdate={async (newConfig) => {
 *         await updateSynFloodConfig({ routerId, config: newConfig });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/Rate Limiting/SynFloodConfigPanel',
  component: SynFloodConfigPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'SYN flood protection configuration panel with presets, action types, and live validation.',
      },
    },
    // Enable accessibility testing
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
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    configHook: {
      control: 'object',
      description: 'Config hook return value',
    },
    loading: {
      control: 'boolean',
      description: 'Is panel loading',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    loading: false,
  },
} satisfies Meta<typeof SynFloodConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story: Disabled
// =============================================================================

/**
 * Disabled State
 *
 * SYN flood protection is disabled.
 * Shows toggle to enable and helpful explanation.
 */
export const Disabled: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDisabled),
  },
  parameters: {
    docs: {
      description: {
        story:
          'SYN flood protection disabled. Shows explanation of what SYN floods are and why protection is recommended.',
      },
    },
  },
};

// =============================================================================
// Story: Enabled with Drop Action
// =============================================================================

/**
 * Enabled - Drop Action
 *
 * SYN flood protection enabled with drop action.
 * Normal protection level (100 SYN/sec).
 */
export const EnabledDrop: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
  },
  parameters: {
    docs: {
      description: {
        story:
          'SYN flood protection enabled with drop action. Drops excess SYN packets immediately.',
      },
    },
  },
};

// =============================================================================
// Story: Enabled with Tarpit Action
// =============================================================================

/**
 * Enabled - Tarpit Action
 *
 * SYN flood protection enabled with tarpit action.
 * More subtle defense that slows down attackers.
 */
export const EnabledTarpit: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodTarpit),
  },
  parameters: {
    docs: {
      description: {
        story:
          'SYN flood protection enabled with tarpit action. Slows down attackers instead of dropping.',
      },
    },
  },
};

// =============================================================================
// Story: Strict Protection
// =============================================================================

/**
 * Strict Protection Preset
 *
 * Strict preset applied (50 SYN/sec, burst 5).
 * Aggressive protection for high-risk environments.
 */
export const StrictProtection: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodStrict),
  },
  parameters: {
    docs: {
      description: {
        story: 'Strict protection preset. Only allows 50 SYN/sec with small burst allowance.',
      },
    },
  },
};

// =============================================================================
// Story: With Presets
// =============================================================================

/**
 * With Preset Buttons
 *
 * Shows preset configuration buttons for quick setup.
 * Normal, Strict, and Paranoid presets available.
 */
export const WithPresets: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Panel with preset buttons. Click to quickly apply Normal, Strict, or Paranoid configurations.',
      },
    },
  },
};

// =============================================================================
// Story: Custom Configuration
// =============================================================================

/**
 * Custom Configuration
 *
 * User has configured custom SYN limit and burst values.
 * Not matching any preset.
 */
export const CustomConfig: Story = {
  args: {
    configHook: createMockConfigHook({
      isEnabled: true,
      synLimit: 75,
      burst: 8,
      action: 'drop',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom configuration with non-preset values. Shows current settings clearly.',
      },
    },
  },
};

// =============================================================================
// Story: Loading State
// =============================================================================

/**
 * Loading State
 *
 * Shows skeleton loading state while fetching configuration.
 */
export const Loading: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDisabled),
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while fetching SYN flood configuration from router.',
      },
    },
  },
};

// =============================================================================
// Story: Saving State
// =============================================================================

/**
 * Saving State
 *
 * Shows saving state when update is in progress.
 * Save button disabled with loading spinner.
 */
export const Saving: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
  },
  parameters: {
    docs: {
      description: {
        story: 'Save operation in progress. Button shows loading state and is disabled.',
      },
    },
  },
};

// =============================================================================
// Story: Mobile Variant
// =============================================================================

/**
 * Mobile Variant
 *
 * Forces mobile presenter (stacked layout).
 * Optimized for touch: 44px targets, vertical sections.
 */
export const MobileView: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile layout (<640px). Vertical stacked sections with 44px touch targets and bottom buttons.',
      },
    },
  },
};

// =============================================================================
// Story: Desktop Variant
// =============================================================================

/**
 * Desktop Variant
 *
 * Forces desktop presenter (card layout).
 * Optimized for keyboard: inline fields, grouped sections.
 */
export const DesktopView: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodTarpit),
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop layout (>1024px). Card-based sections with inline fields and shortcuts.',
      },
    },
  },
};

// =============================================================================
// Story: With Validation Errors
// =============================================================================

/**
 * With Validation Errors
 *
 * Shows form validation for invalid inputs.
 * SYN limit too low (< 1) and burst too high.
 */
export const WithErrors: Story = {
  args: {
    configHook: createMockConfigHook({
      isEnabled: true,
      synLimit: 0, // Invalid: must be > 0
      burst: 1000, // Invalid: unreasonably high
      action: 'drop',
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form with validation errors. Invalid SYN limit and burst show inline error messages.',
      },
    },
  },
};

// =============================================================================
// Story: No Presets
// =============================================================================

/**
 * Without Preset Buttons
 *
 * Hides preset configuration buttons.
 * Useful for compact layouts or when presets aren't desired.
 */
export const NoPresets: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel without preset buttons. Manual configuration only.',
      },
    },
  },
};

// =============================================================================
// Story: Accessibility Test
// =============================================================================

/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export const AccessibilityTest: Story = {
  args: {
    configHook: createMockConfigHook(mockSynFloodDrop),
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
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story:
          'Accessibility validation. All inputs have labels, 7:1 contrast ratio, keyboard navigable.',
      },
    },
  },
};
