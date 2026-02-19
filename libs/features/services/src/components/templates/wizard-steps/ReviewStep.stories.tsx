/**
 * Storybook stories for ReviewStep
 *
 * Second step of the template installation wizard.
 * Shows services list, configuration variable values, estimated resource usage,
 * and a prerequisite warning card.
 */

import type { Meta, StoryObj } from '@storybook/react';

import { ReviewStep } from './ReviewStep';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const baseTemplate: ServiceTemplate = {
  id: 'tpl-review-001',
  name: 'Tor Hidden Service',
  description: 'Route traffic through the Tor anonymity network.',
  version: '1.2.0',
  author: 'NasNet Team',
  category: 'PRIVACY',
  scope: 'SINGLE',
  isBuiltIn: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-06-01T12:00:00Z',
  services: [
    {
      name: 'tor-daemon',
      serviceType: 'tor',
      memoryLimitMB: 64,
      dependsOn: null,
      portMappings: null,
      requiresBridge: false,
      vlanID: null,
      cpuShares: 256,
      configOverrides: null,
    },
  ],
  configVariables: [
    {
      name: 'TOR_NAME',
      label: 'Instance Name',
      description: 'Human-readable name for this Tor instance',
      type: 'STRING',
      required: true,
      default: 'tor-1',
      enumValues: null,
      minValue: null,
      maxValue: null,
      validationPattern: null,
    },
  ],
  estimatedResources: {
    totalMemoryMB: 64,
    diskSpaceMB: 20,
    networkPorts: 2,
    totalCPUShares: 256,
    vlansRequired: 1,
  },
  prerequisites: null,
  tags: ['privacy', 'tor'],
  suggestedRouting: null,
  examples: null,
  documentation: null,
  routerID: null,
};

const chainTemplate: ServiceTemplate = {
  id: 'tpl-review-002',
  name: 'Xray + Tor Chain',
  description: 'Chain Xray traffic through Tor for maximum anonymity.',
  version: '2.0.1',
  author: 'Security Team',
  category: 'ANTI_CENSORSHIP',
  scope: 'CHAIN',
  isBuiltIn: true,
  createdAt: '2024-03-10T08:00:00Z',
  updatedAt: '2024-07-20T09:00:00Z',
  services: [
    {
      name: 'xray-core',
      serviceType: 'xray-core',
      memoryLimitMB: 128,
      dependsOn: null,
      portMappings: null,
      requiresBridge: true,
      vlanID: null,
      cpuShares: 512,
      configOverrides: null,
    },
    {
      name: 'tor-proxy',
      serviceType: 'tor',
      memoryLimitMB: 64,
      dependsOn: ['xray-core'],
      portMappings: null,
      requiresBridge: false,
      vlanID: null,
      cpuShares: 256,
      configOverrides: null,
    },
  ],
  configVariables: [
    {
      name: 'XRAY_UUID',
      label: 'Xray UUID',
      description: 'UUID for Xray VLESS/VMess configuration',
      type: 'STRING',
      required: true,
      default: null,
      enumValues: null,
      minValue: null,
      maxValue: null,
      validationPattern: null,
    },
    {
      name: 'XRAY_PORT',
      label: 'Xray Listen Port',
      description: 'Port Xray listens on',
      type: 'NUMBER',
      required: false,
      default: 1080,
      enumValues: null,
      minValue: 1024,
      maxValue: 65535,
      validationPattern: null,
    },
    {
      name: 'ENABLE_OBFS',
      label: 'Enable Obfuscation',
      description: 'Enable traffic obfuscation',
      type: 'BOOLEAN',
      required: false,
      default: true,
      enumValues: null,
      minValue: null,
      maxValue: null,
      validationPattern: null,
    },
  ],
  estimatedResources: {
    totalMemoryMB: 192,
    diskSpaceMB: 85,
    networkPorts: 4,
    totalCPUShares: 768,
    vlansRequired: 2,
  },
  prerequisites: [
    'At least 256 MB RAM available',
    'Firewall port 1080 must be open',
    'RouterOS 7.x or later',
  ],
  tags: ['anti-censorship', 'vpn'],
  suggestedRouting: null,
  examples: null,
  documentation: null,
  routerID: null,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ReviewStep> = {
  title: 'Features/Services/Templates/WizardSteps/ReviewStep',
  component: ReviewStep,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Step 2 of the TemplateInstallWizard. Displays a read-only summary of services to install, ' +
          'the current variable values, estimated resource consumption, and any prerequisites that must be met.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReviewStep>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Single service template with one configured variable.
 * Minimal resource estimate, no prerequisites.
 */
export const SingleService: Story = {
  name: 'Single Service, One Variable',
  args: {
    template: baseTemplate,
    variables: {
      TOR_NAME: 'my-tor-node',
    },
  },
};

/**
 * Multi-service chained template with multiple variable values,
 * including a boolean "Enabled" value and a numeric port.
 */
export const MultiServiceWithVariables: Story = {
  name: 'Multi-Service With Variables',
  args: {
    template: chainTemplate,
    variables: {
      XRAY_UUID: '550e8400-e29b-41d4-a716-446655440000',
      XRAY_PORT: 1080,
      ENABLE_OBFS: true,
    },
  },
};

/**
 * Template with prerequisites warning card visible.
 * The prerequisites section should display with a warning-colored card.
 */
export const WithPrerequisites: Story = {
  name: 'With Prerequisites Warning',
  args: {
    template: chainTemplate,
    variables: {
      XRAY_UUID: 'abcdef-1234-5678-uuid',
      XRAY_PORT: 443,
      ENABLE_OBFS: false,
    },
  },
};

/**
 * Empty variables — the configuration card should be hidden entirely
 * since there are no variable values to display.
 */
export const NoVariables: Story = {
  name: 'No Variable Values',
  args: {
    template: {
      ...baseTemplate,
      configVariables: [],
      prerequisites: null,
    },
    variables: {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no variables are set (e.g. template has no configVariables), ' +
          'the Configuration section is omitted and only Services and Resources are shown.',
      },
    },
  },
};

/**
 * Template without resource estimates — the Estimated Resources card
 * should not appear at all.
 */
export const NoResourceEstimate: Story = {
  name: 'No Resource Estimate',
  args: {
    template: {
      ...baseTemplate,
      estimatedResources: undefined,
      prerequisites: null,
    },
    variables: {
      TOR_NAME: 'tor-no-estimate',
    },
  },
};

/**
 * Full scenario: two services, three variables (string, number, boolean),
 * resource estimate, and prerequisite warnings all visible together.
 */
export const FullReview: Story = {
  name: 'Full Review (All Sections)',
  args: {
    template: chainTemplate,
    variables: {
      XRAY_UUID: 'd4c5b6a7-e8f9-0123-4567-89abcdef0123',
      XRAY_PORT: 8443,
      ENABLE_OBFS: true,
    },
  },
};
