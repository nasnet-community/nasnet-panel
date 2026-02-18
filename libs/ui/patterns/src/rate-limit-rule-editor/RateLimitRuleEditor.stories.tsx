/**
 * RateLimitRuleEditor Storybook Stories
 *
 * Interactive stories for rate limit rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/rate-limit-rule-editor
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { fn } from '@storybook/test';

import { RateLimitRuleEditor } from './RateLimitRuleEditor';
import {
  mockDropRule,
  mockTarpitRule,
  mockAddToListRule,
  emptyRuleInput,
} from '../__test-utils__/rate-limit-fixtures';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * RateLimitRuleEditor - Rate limiting rule creation and editing dialog
 *
 * The RateLimitRuleEditor component provides a comprehensive form for creating and editing
 * connection rate limiting firewall rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live validation**: Real-time feedback for invalid inputs
 * - **Address list suggestions**: Autocomplete for existing address lists
 * - **Time window presets**: Quick selection for per-second, per-minute, per-hour
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **drop**: Immediately drops excess connections (most aggressive)
 * - **tarpit**: Slows down attackers with delayed responses (subtle defense)
 * - **add-to-list**: Adds offenders to address list with timeout (dynamic blocking)
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitRuleEditor } from '@nasnet/ui/patterns/rate-limit-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <RateLimitRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createRateLimitRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Patterns/Firewall/Rate Limiting/RateLimitRuleEditor',
  component: RateLimitRuleEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Rate limit rule creation and editing dialog with action-specific fields and live validation.',
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
    routerId: {
      control: 'text',
      description: 'Router ID for fetching address lists',
    },
    open: {
      control: 'boolean',
      description: 'Is editor dialog open',
    },
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Editor mode (create new rule or edit existing)',
    },
    isSaving: {
      control: 'boolean',
      description: 'Is save operation in progress',
    },
    isDeleting: {
      control: 'boolean',
      description: 'Is delete operation in progress (edit mode only)',
    },
    onClose: { action: 'closed' },
    onSave: { action: 'saved' },
    onDelete: { action: 'deleted' },
  },
  args: {
    routerId: 'router-123',
    open: true,
    onClose: fn(),
    onSave: fn(),
    isSaving: false,
    mode: 'create',
    addressLists: ['lan_networks', 'wan_networks', 'vpn_clients', 'rate-limited', 'ddos-attackers'],
  },
} satisfies Meta<typeof RateLimitRuleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story: Create Drop Rule
// =============================================================================

/**
 * Create Drop Rule
 *
 * Create a new drop action rule that immediately blocks excess connections.
 * Most aggressive rate limiting strategy.
 */
export const CreateDrop: Story = {
  args: {
    mode: 'create',
    initialRule: {
      ...emptyRuleInput,
      action: 'drop',
      connectionLimit: 100,
      timeWindow: 'per-minute',
      comment: 'Basic rate limit protection',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create a drop rule. Immediately blocks connections exceeding the limit. Simple and effective.',
      },
    },
  },
};

// =============================================================================
// Story: Create Tarpit Rule
// =============================================================================

/**
 * Create Tarpit Rule
 *
 * Create a tarpit rule that slows down attackers instead of blocking.
 * More subtle defense mechanism.
 */
export const CreateTarpit: Story = {
  args: {
    mode: 'create',
    initialRule: {
      ...emptyRuleInput,
      action: 'tarpit',
      srcAddress: '192.168.1.0/24',
      connectionLimit: 50,
      timeWindow: 'per-second',
      comment: 'Tarpit suspicious subnet',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create a tarpit rule. Slows down attackers with delayed responses. Good for protecting against brute force.',
      },
    },
  },
};

// =============================================================================
// Story: Create Add-to-List Rule
// =============================================================================

/**
 * Create Add-to-List Rule
 *
 * Create a rule that adds rate limit violators to an address list.
 * Dynamic blocking with automatic timeout.
 */
export const CreateAddToList: Story = {
  args: {
    mode: 'create',
    initialRule: {
      ...emptyRuleInput,
      action: 'add-to-list',
      addressList: 'rate-limited',
      addressListTimeout: '1h',
      connectionLimit: 200,
      timeWindow: 'per-hour',
      comment: 'Block rate limit violators',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create an add-to-list rule. Automatically adds offenders to blocklist with timeout. Most flexible strategy.',
      },
    },
  },
};

// =============================================================================
// Story: Edit Existing Rule
// =============================================================================

/**
 * Edit Existing Rule
 *
 * Edit mode with pre-populated form data.
 * Shows delete button and rule statistics.
 */
export const EditExisting: Story = {
  args: {
    mode: 'edit',
    onDelete: fn(),
    initialRule: {
      ...mockDropRule,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit an existing rule. Form is pre-populated with current values. Delete button is available.',
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
 * Shows form validation feedback for invalid inputs.
 * Connection limit too low, invalid IP address format.
 */
export const WithErrors: Story = {
  args: {
    mode: 'create',
    initialRule: {
      action: 'drop',
      connectionLimit: 0, // Invalid: must be > 0
      timeWindow: 'per-minute',
      srcAddress: '192.168.1.999', // Invalid IP
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form with validation errors. Invalid connection limit and IP address show inline error messages. Save button is disabled.',
      },
    },
  },
};

// =============================================================================
// Story: With Whitelist Exclusion
// =============================================================================

/**
 * With Whitelist Exclusion
 *
 * Shows rule with negated address list (exclude whitelist from rate limiting).
 * Uses "!" prefix to negate match.
 */
export const WithWhitelist: Story = {
  args: {
    mode: 'create',
    initialRule: {
      action: 'add-to-list',
      srcAddressList: '!rate-limit-whitelist', // Negate (exclude this list)
      addressList: 'ddos-attackers',
      addressListTimeout: '1d',
      connectionLimit: 150,
      timeWindow: 'per-minute',
      comment: 'DDoS protection with whitelist bypass',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Rule with whitelist exclusion. Source address list prefixed with "!" to exclude trusted IPs.',
      },
    },
  },
};

// =============================================================================
// Story: Very Strict (Per-Second)
// =============================================================================

/**
 * Very Strict Rate Limit
 *
 * Per-second time window for very aggressive rate limiting.
 * Useful for preventing rapid-fire attacks.
 */
export const VeryStrict: Story = {
  args: {
    mode: 'create',
    initialRule: {
      action: 'drop',
      connectionLimit: 10,
      timeWindow: 'per-second',
      comment: 'Very strict rate limit for critical endpoints',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Very strict per-second rate limit. Only 10 connections allowed per second.',
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
 * Forces mobile presenter (Sheet instead of Dialog).
 * Card-based form sections, 44px touch targets, bottom action buttons.
 */
export const MobileVariant: Story = {
  args: {
    mode: 'create',
    initialRule: {
      ...emptyRuleInput,
      action: 'add-to-list',
      addressList: 'rate-limited',
      addressListTimeout: '6h',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile presenter with Sheet UI. Optimized for touch: 44px targets, card sections, bottom buttons.',
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
 * Forces desktop presenter (Dialog).
 * Inline form layout, grouped fields, keyboard shortcuts.
 */
export const DesktopVariant: Story = {
  args: {
    mode: 'create',
    initialRule: {
      action: 'tarpit',
      srcAddress: '203.0.113.0/24',
      connectionLimit: 25,
      timeWindow: 'per-second',
      comment: 'Tarpit known attacker subnet',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Desktop presenter with Dialog UI. Optimized for keyboard: inline layout, shortcuts.',
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
 * Shows loading state when save operation is in progress.
 * Save button is disabled and shows loading spinner.
 */
export const SavingState: Story = {
  args: {
    mode: 'create',
    isSaving: true,
    initialRule: {
      ...emptyRuleInput,
      action: 'drop',
    },
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
// Story: Deleting State
// =============================================================================

/**
 * Deleting State
 *
 * Shows loading state when delete operation is in progress.
 * Delete button is disabled and shows loading spinner.
 */
export const DeletingState: Story = {
  args: {
    mode: 'edit',
    isDeleting: true,
    onDelete: fn(),
    initialRule: {
      ...mockTarpitRule,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Delete operation in progress. Delete button shows loading state and is disabled.',
      },
    },
  },
};

// =============================================================================
// Story: Empty Form (Default Create)
// =============================================================================

/**
 * Empty Form
 *
 * Default state when creating a new rule.
 * All fields are empty with sensible defaults.
 */
export const EmptyForm: Story = {
  args: {
    mode: 'create',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty form for creating a new rule. Shows default values and helpful placeholders.',
      },
    },
  },
};

// =============================================================================
// Story: Complex Rule
// =============================================================================

/**
 * Complex Rule with Multiple Matchers
 *
 * Shows a rule with many matchers configured.
 * Demonstrates comprehensive matching capabilities.
 */
export const ComplexRule: Story = {
  args: {
    mode: 'create',
    initialRule: {
      action: 'add-to-list',
      addressList: 'suspicious-ips',
      addressListTimeout: '12h',
      connectionLimit: 100,
      timeWindow: 'per-minute',
      srcAddress: '0.0.0.0/0',
      dstAddress: '192.168.1.1',
      protocol: 'tcp',
      dstPort: '22,23,3389',
      connectionState: ['new'],
      comment: 'Block brute force attacks on admin ports',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complex rule with multiple matchers. Demonstrates advanced filtering for specific attack patterns.',
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
    mode: 'create',
    initialRule: {
      ...emptyRuleInput,
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
