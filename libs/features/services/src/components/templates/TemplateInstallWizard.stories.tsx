/**
 * Storybook stories for TemplateInstallWizard
 *
 * Platform wrapper that routes to Mobile or Desktop presenter.
 * Supports a multi-step installation flow: Variables → Review → Installing → Routing.
 */

import { fn } from 'storybook/test';

import type { ServiceTemplate } from '@nasnet/api-client/generated';

import { TemplateInstallWizard } from './TemplateInstallWizard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockTemplateMinimal: ServiceTemplate = {
  id: 'tpl-001',
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
      cpuShares: null,
      configOverrides: null,
    },
  ],
  configVariables: [
    {
      name: 'TOR_NAME',
      label: 'Instance Name',
      description: 'Human-readable name for this Tor instance',
      type: 'STRING' as const,
      required: true,
      default: 'tor-1' as any,
      enumValues: null,
      minValue: null,
      maxValue: null,
      validationPattern: '^[a-z0-9-]+$',
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
  tags: ['privacy', 'anonymity'],
  suggestedRouting: null,
  examples: null,
  documentation: null,
  routerID: null,
};

const mockTemplateMultiService: ServiceTemplate = {
  id: 'tpl-002',
  name: 'Xray + Tor Chain',
  description: 'Chain Xray traffic through Tor for maximum anonymity. Requires both services.',
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
      portMappings: [{ internal: 1080, external: 1080, protocol: 'TCP' }],
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
      type: 'STRING' as const,
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
      description: 'Port Xray listens on for incoming connections',
      type: 'NUMBER' as const,
      required: false,
      default: 1080 as any,
      enumValues: null,
      minValue: 1024,
      maxValue: 65535,
      validationPattern: null,
    },
    {
      name: 'ENABLE_OBFS',
      label: 'Enable Obfuscation',
      description: 'Enable traffic obfuscation to bypass DPI inspection',
      type: 'BOOLEAN' as const,
      required: false,
      default: true as any,
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
  tags: ['anti-censorship', 'vpn', 'xray', 'tor'],
  suggestedRouting: null,
  examples: null,
  documentation: null,
  routerID: null,
};

const mockTemplateWithPrereqs: ServiceTemplate = {
  ...mockTemplateMinimal,
  id: 'tpl-003',
  name: 'AdGuard Home',
  description: 'Network-wide ad and tracker blocking via DNS filtering.',
  category: 'SECURITY',
  prerequisites: [
    'Router must have at least 128 MB free RAM',
    'DNS port 53 must not be in use by another service',
    'External DNS resolver must be reachable',
  ],
  estimatedResources: {
    totalMemoryMB: 96,
    diskSpaceMB: 150,
    networkPorts: 3,
    totalCPUShares: 512,
    vlansRequired: 0,
  },
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TemplateInstallWizard> = {
  title: 'Features/Services/Templates/TemplateInstallWizard',
  component: TemplateInstallWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-step template installation wizard that adapts to Mobile and Desktop platforms. ' +
          'Steps: (1) Configure variables, (2) Review configuration, (3) Install progress, (4) Optional routing setup. ' +
          'Uses XState for state machine-driven navigation.',
      },
    },
  },
  args: {
    routerId: 'router-main-01',
    open: true,
    onClose: fn(),
    onComplete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TemplateInstallWizard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default wizard open with a simple single-service template.
 * Shows the Variables step (Step 1) as the initial state.
 */
export const DefaultOpen: Story = {
  name: 'Default (Open)',
  args: {
    template: mockTemplateMinimal,
  },
};

/**
 * Wizard with a multi-service chained template (Xray + Tor).
 * Demonstrates multiple services with dependencies and prerequisites.
 */
export const MultiServiceChain: Story = {
  name: 'Multi-Service Chain Template',
  args: {
    template: mockTemplateMultiService,
  },
};

/**
 * Wizard displaying a template that has prerequisites listed.
 * Ensures the prerequisites warning card is visible during Review step.
 */
export const WithPrerequisites: Story = {
  name: 'Template With Prerequisites',
  args: {
    template: mockTemplateWithPrereqs,
  },
};

/**
 * Wizard in closed state. Useful for testing the closed/hidden rendering.
 */
export const Closed: Story = {
  name: 'Closed State',
  args: {
    template: mockTemplateMinimal,
    open: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Wizard in closed state — dialog is hidden but component is mounted.',
      },
    },
  },
};

/**
 * A large enterprise template with many config variables to test
 * scrollable content areas and long variable lists.
 */
export const LargeTemplate: Story = {
  name: 'Large Template (Many Variables)',
  args: {
    template: {
      ...mockTemplateMultiService,
      id: 'tpl-004',
      name: 'Psiphon Pro Suite',
      description: 'Full Psiphon censorship circumvention suite with SSH, meek, and obfuscated tunnels.',
      scope: 'MULTIPLE',
      services: [
        ...mockTemplateMultiService.services,
        {
          name: 'psiphon-core',
          serviceType: 'psiphon',
          memoryLimitMB: 96,
          dependsOn: ['xray-core'],
          portMappings: null,
          requiresBridge: false,
          vlanID: null,
          cpuShares: 256,
          configOverrides: null,
        },
      ],
      configVariables: [
        ...mockTemplateMultiService.configVariables,
        {
          name: 'SSH_HOST',
          label: 'SSH Relay Host',
          description: 'Hostname of the SSH relay server',
          type: 'STRING' as const,
          required: true,
          default: null,
          enumValues: null,
          minValue: null,
          maxValue: null,
          validationPattern: null,
        },
        {
          name: 'SSH_PORT',
          label: 'SSH Relay Port',
          description: 'Port of the SSH relay server',
          type: 'NUMBER' as const,
          required: false,
          default: 22 as any,
          enumValues: null,
          minValue: 1,
          maxValue: 65535,
          validationPattern: null,
        },
        {
          name: 'TUNNEL_PROTOCOL',
          label: 'Tunnel Protocol',
          description: 'Primary tunneling protocol to use',
          type: 'ENUM' as const,
          required: true,
          default: 'MEEK' as any,
          enumValues: [{ value: 'MEEK' }, { value: 'OBFUSCATED_SSH' }, { value: 'UNFRONTED_MEEK' }] as any,
          minValue: null,
          maxValue: null,
          validationPattern: null,
        },
      ],
      estimatedResources: {
        totalMemoryMB: 288,
        diskSpaceMB: 240,
        networkPorts: 8,
        totalCPUShares: 1024,
        vlansRequired: 3,
      },
    },
  },
};

/**
 * Wizard without an onComplete callback — useful for testing flows
 * where the parent page doesn't need to react to completion.
 */
export const NoCompletionCallback: Story = {
  name: 'No Completion Callback',
  args: {
    template: mockTemplateMinimal,
    onComplete: fn(),
  },
};
