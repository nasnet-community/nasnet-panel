/**
 * FormSection Storybook Stories
 *
 * Comprehensive stories demonstrating all FormSection variants and use cases.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';

import { Input, Label, cn } from '@nasnet/ui/primitives';

import { FormSection } from './FormSection';
import { FormSectionErrors } from './FormSectionErrors';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FormSection> = {
  title: 'Patterns/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## FormSection

A consistent form section wrapper that provides uniform structure, validation display, and collapsibility across all forms.

### Features
- Section title with optional help integration
- Error summary display at section level
- Collapsible behavior with smooth animations
- State persistence via localStorage
- Platform-responsive design (mobile/desktop)
- Full WCAG AAA accessibility compliance

### Usage Contexts
- **Setup Wizard**: "Network Settings", "DNS Configuration", "Security Options"
- **VPN Configuration**: "Connection Details", "Authentication", "Advanced Options"
- **Firewall Rules**: "Source", "Destination", "Action" sections
- **Network Interface**: "General", "IP Configuration", "DHCP Settings"
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Section title displayed in header',
    },
    description: {
      control: 'text',
      description: 'Optional description text below title',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether section can be collapsed',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Initial expanded state when collapsible',
    },
    errors: {
      control: 'object',
      description: 'Array of error messages for this section',
    },
    helpId: {
      control: 'text',
      description: 'Help content ID for integration with Help System',
    },
    asFieldset: {
      control: 'boolean',
      description: 'Whether to use fieldset/legend semantic HTML',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormSection>;

// Mock form field component for examples
function MockFormField({
  label,
  placeholder,
  error,
}: {
  label: string;
  placeholder?: string;
  error?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        className={cn(error && 'border-error focus-visible:ring-error')}
      />
    </div>
  );
}

/**
 * Basic non-collapsible section with title and description.
 * Uses fieldset/legend for proper form semantics.
 */
export const Basic: Story = {
  args: {
    title: 'Network Settings',
    description: 'Configure your network connection settings',
    collapsible: false,
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="IP Address"
        placeholder="192.168.1.1"
      />
      <MockFormField
        label="Subnet Mask"
        placeholder="255.255.255.0"
      />
      <MockFormField
        label="Gateway"
        placeholder="192.168.1.254"
      />
    </FormSection>
  ),
};

/**
 * Collapsible section starting in collapsed state.
 * Uses section/aria-labelledby for proper accessibility.
 */
export const CollapsibleCollapsed: Story = {
  args: {
    title: 'Advanced Options',
    description: 'Optional advanced configuration',
    collapsible: true,
    defaultOpen: false,
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="MTU"
        placeholder="1500"
      />
      <MockFormField
        label="DNS Server 1"
        placeholder="8.8.8.8"
      />
      <MockFormField
        label="DNS Server 2"
        placeholder="8.8.4.4"
      />
    </FormSection>
  ),
};

/**
 * Collapsible section starting in expanded state.
 */
export const CollapsibleExpanded: Story = {
  args: {
    title: 'Security Settings',
    description: 'Configure security options for your connection',
    collapsible: true,
    defaultOpen: true,
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Username"
        placeholder="admin"
      />
      <MockFormField
        label="Password"
        placeholder="••••••••"
      />
      <MockFormField
        label="Pre-shared Key"
        placeholder="Enter PSK"
      />
    </FormSection>
  ),
};

/**
 * Section with description text.
 */
export const WithDescription: Story = {
  args: {
    title: 'DNS Configuration',
    description:
      "Configure DNS servers for name resolution. You can use your ISP's DNS servers or public DNS services like Google (8.8.8.8) or Cloudflare (1.1.1.1).",
    collapsible: false,
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Primary DNS"
        placeholder="8.8.8.8"
      />
      <MockFormField
        label="Secondary DNS"
        placeholder="8.8.4.4"
      />
    </FormSection>
  ),
};

/**
 * Section displaying validation errors.
 * Error summary appears above form fields.
 */
export const WithErrors: Story = {
  args: {
    title: 'IP Configuration',
    description: 'Configure IP address settings',
    collapsible: false,
    errors: [
      'IP address is invalid - must be in format X.X.X.X',
      'Subnet mask is required',
      'Gateway must be in the same subnet as the IP address',
    ],
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="IP Address"
        placeholder="192.168.1.1"
        error
      />
      <MockFormField
        label="Subnet Mask"
        placeholder="255.255.255.0"
        error
      />
      <MockFormField
        label="Gateway"
        placeholder="192.168.1.254"
        error
      />
    </FormSection>
  ),
};

/**
 * Section with help icon integration.
 * In production, this integrates with the Help System (NAS-4A.12).
 */
export const WithHelpIntegration: Story = {
  args: {
    title: 'DHCP Settings',
    description: 'Configure DHCP server options',
    collapsible: false,
    helpId: 'dhcp-settings',
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Pool Start"
        placeholder="192.168.1.100"
      />
      <MockFormField
        label="Pool End"
        placeholder="192.168.1.200"
      />
      <MockFormField
        label="Lease Time"
        placeholder="1d"
      />
    </FormSection>
  ),
};

/**
 * Example with nested form fields showing real-world usage.
 */
export const NestedFormFields: Story = {
  args: {
    title: 'WireGuard Interface',
    description: 'Configure WireGuard VPN interface',
    collapsible: true,
    defaultOpen: true,
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Interface Name"
        placeholder="wg0"
      />
      <MockFormField
        label="Private Key"
        placeholder="Generated automatically"
      />
      <MockFormField
        label="Listen Port"
        placeholder="51820"
      />
      <MockFormField
        label="Address"
        placeholder="10.0.0.1/24"
      />
    </FormSection>
  ),
};

/**
 * Multiple sections in a form layout.
 * Shows how sections group related fields.
 */
export const MultipleSections: Story = {
  render: () => (
    <div className="space-y-6">
      <FormSection
        title="General Settings"
        description="Basic interface configuration"
      >
        <MockFormField
          label="Interface Name"
          placeholder="eth0"
        />
        <MockFormField
          label="MAC Address"
          placeholder="00:00:00:00:00:00"
        />
      </FormSection>

      <FormSection
        title="IP Configuration"
        description="IPv4 address settings"
        errors={['IP address is invalid']}
      >
        <MockFormField
          label="IP Address"
          placeholder="192.168.1.1"
          error
        />
        <MockFormField
          label="Subnet Mask"
          placeholder="255.255.255.0"
        />
      </FormSection>

      <FormSection
        title="Advanced Options"
        description="Optional advanced settings"
        collapsible
        defaultOpen={false}
      >
        <MockFormField
          label="MTU"
          placeholder="1500"
        />
        <MockFormField
          label="VLAN ID"
          placeholder="Optional"
        />
      </FormSection>
    </div>
  ),
};

/**
 * Dark theme variant.
 * Switch to dark theme using the toolbar to see this in action.
 */
export const DarkTheme: Story = {
  args: {
    title: 'Firewall Rules',
    description: 'Configure firewall rule settings',
    collapsible: true,
    defaultOpen: true,
    errors: ['Source address is required'],
  },
  render: (args) => (
    <div className="dark">
      <FormSection {...args}>
        <MockFormField
          label="Source Address"
          placeholder="0.0.0.0/0"
          error
        />
        <MockFormField
          label="Destination Address"
          placeholder="any"
        />
        <MockFormField
          label="Action"
          placeholder="accept"
        />
      </FormSection>
    </div>
  ),
  globals: {
    backgrounds: {
      value: 'dark',
    },
  },
};

/**
 * Mobile viewport demonstration.
 * Shows responsive design with 44px minimum tap targets.
 */
export const MobileViewport: Story = {
  args: {
    title: 'WiFi Settings',
    description: 'Configure wireless network',
    collapsible: true,
    defaultOpen: true,
    helpId: 'wifi-settings',
  },

  parameters: {
    platform: 'mobile',
  },

  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Network Name (SSID)"
        placeholder="MyNetwork"
      />
      <MockFormField
        label="Password"
        placeholder="••••••••"
      />
      <MockFormField
        label="Security Mode"
        placeholder="WPA2"
      />
    </FormSection>
  ),

  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false,
    },
  },
};

/**
 * FormSectionErrors standalone component.
 * Shows the error summary component in isolation.
 */
export const ErrorsOnly: StoryObj<typeof FormSectionErrors> = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Single Error</h3>
      <FormSectionErrors errors={['IP address is invalid']} />

      <h3 className="mt-6 text-lg font-semibold">Multiple Errors</h3>
      <FormSectionErrors
        errors={[
          'IP address is invalid',
          'Subnet mask is required',
          'Gateway must be in the same subnet',
        ]}
      />

      <h3 className="mt-6 text-lg font-semibold">No Errors (renders nothing)</h3>
      <div className="rounded bg-slate-100 p-4 dark:bg-slate-800">
        <FormSectionErrors errors={[]} />
        <p className="text-sm text-slate-500">(Nothing renders above)</p>
      </div>
    </div>
  ),
};

/**
 * Accessibility test story.
 * Use with the a11y addon to verify WCAG compliance.
 */
export const AccessibilityTest: Story = {
  args: {
    title: 'Accessibility Test Section',
    description: 'This section tests all accessibility features',
    collapsible: true,
    defaultOpen: true,
    errors: ['Test error for accessibility'],
    helpId: 'a11y-test',
  },
  parameters: {
    a11y: {
      // Strict WCAG AAA testing
      config: {
        rules: [
          { id: 'color-contrast-enhanced', enabled: true },
          { id: 'focus-order-semantics', enabled: true },
        ],
      },
    },
  },
  render: (args) => (
    <FormSection {...args}>
      <MockFormField
        label="Test Field 1"
        placeholder="Focus here"
      />
      <MockFormField
        label="Test Field 2"
        placeholder="Tab to here"
      />
    </FormSection>
  ),
};
