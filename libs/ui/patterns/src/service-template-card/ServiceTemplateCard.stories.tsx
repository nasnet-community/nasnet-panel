/**
 * ServiceTemplateCard Storybook Stories
 *
 * Interactive documentation and visual testing for ServiceTemplateCard pattern.
 */

import { ServiceTemplateCard } from './ServiceTemplateCard';

import type { ServiceTemplate, TemplateAction } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ServiceTemplateCard> = {
  title: 'Patterns/ServiceTemplateCard',
  component: ServiceTemplateCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ServiceTemplateCard>;

// Mock actions
const createActions = (scope: 'built-in' | 'custom' | 'shared'): TemplateAction[] => {
  const baseActions: TemplateAction[] = [
    {
      id: 'install',
      label: 'Install',
      onClick: () => console.log('Install clicked'),
      variant: 'default',
    },
  ];

  if (scope === 'custom' || scope === 'shared') {
    baseActions.push(
      {
        id: 'export',
        label: 'Export',
        onClick: () => console.log('Export clicked'),
        variant: 'outline',
      },
      {
        id: 'delete',
        label: 'Delete',
        onClick: () => console.log('Delete clicked'),
        variant: 'destructive',
      }
    );
  }

  return baseActions;
};

// Mock templates
const privacyStackTemplate: ServiceTemplate = {
  id: '1',
  name: 'Privacy Stack',
  description: 'Complete privacy setup with Tor, Psiphon, and DNS filtering',
  category: 'privacy',
  scope: 'built-in',
  icon: '🔒',
  verified: true,
  metadata: {
    serviceCount: 3,
    variableCount: 5,
    version: '1.0.0',
    sizeEstimate: 8.5,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  tags: ['privacy', 'tor', 'dns'],
};

const proxyChainTemplate: ServiceTemplate = {
  id: '2',
  name: 'Proxy Chain',
  description: 'Multi-hop proxy configuration for enhanced anonymity',
  category: 'proxy',
  scope: 'custom',
  icon: '🔗',
  verified: false,
  metadata: {
    serviceCount: 4,
    variableCount: 12,
    version: '2.1.3',
    sizeEstimate: 15.2,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
  tags: ['proxy', 'advanced'],
};

const adBlockTemplate: ServiceTemplate = {
  id: '3',
  name: 'Network-Wide Ad Blocking',
  description: 'AdGuard Home with curated blocklists for all devices',
  category: 'dns',
  scope: 'shared',
  icon: '🚫',
  verified: true,
  metadata: {
    serviceCount: 1,
    variableCount: 3,
    version: '1.5.0',
    sizeEstimate: 5.8,
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    author: 'NetworkAdmin',
    downloads: 2450,
    rating: 4.8,
  },
  tags: ['dns', 'adblock'],
};

const enterpriseSecurityTemplate: ServiceTemplate = {
  id: '4',
  name: 'Enterprise Security Bundle',
  description:
    'Comprehensive security template with monitoring, IDS, and threat detection for business networks',
  category: 'security',
  scope: 'shared',
  icon: '🛡️',
  verified: true,
  metadata: {
    serviceCount: 7,
    variableCount: 25,
    version: '3.0.0',
    sizeEstimate: 42.0,
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    author: 'SecOps Team',
    downloads: 15600,
    rating: 4.9,
  },
  tags: ['security', 'enterprise', 'monitoring'],
};

const minimalTemplate: ServiceTemplate = {
  id: '5',
  name: 'Simple Tor Bridge',
  description: 'Single Tor service with default configuration',
  category: 'privacy',
  scope: 'built-in',
  icon: '🌐',
  verified: true,
  metadata: {
    serviceCount: 1,
    variableCount: 0,
    version: '1.0.0',
    sizeEstimate: 3.2,
  },
  tags: ['tor', 'simple'],
};

// Stories
export const Default: Story = {
  args: {
    template: privacyStackTemplate,
    actions: createActions('built-in'),
    showMetadata: true,
  },
};

export const BuiltInTemplate: Story = {
  args: {
    template: privacyStackTemplate,
    actions: createActions('built-in'),
    showMetadata: true,
  },
};

export const CustomTemplate: Story = {
  args: {
    template: proxyChainTemplate,
    actions: createActions('custom'),
    showMetadata: true,
  },
};

export const SharedTemplate: Story = {
  args: {
    template: adBlockTemplate,
    actions: createActions('shared'),
    showMetadata: true,
  },
};

export const ManyServices: Story = {
  args: {
    template: enterpriseSecurityTemplate,
    actions: createActions('shared'),
    showMetadata: true,
  },
};

export const MinimalNoVariables: Story = {
  args: {
    template: minimalTemplate,
    actions: createActions('built-in'),
    showMetadata: true,
  },
};

export const LoadingState: Story = {
  args: {
    template: privacyStackTemplate,
    actions: [
      {
        id: 'install',
        label: 'Installing',
        onClick: () => console.log('Installing...'),
        variant: 'default',
        loading: true,
      },
    ],
    showMetadata: true,
  },
};

export const DisabledActions: Story = {
  args: {
    template: privacyStackTemplate,
    actions: [
      {
        id: 'install',
        label: 'Install',
        onClick: () => console.log('Install clicked'),
        variant: 'default',
        disabled: true,
      },
    ],
    showMetadata: true,
  },
};

export const WithoutMetadata: Story = {
  args: {
    template: privacyStackTemplate,
    actions: createActions('built-in'),
    showMetadata: false,
  },
};

export const WithClickHandler: Story = {
  args: {
    template: privacyStackTemplate,
    actions: createActions('built-in'),
    onClick: () => console.log('Card clicked'),
    showMetadata: true,
  },
};
