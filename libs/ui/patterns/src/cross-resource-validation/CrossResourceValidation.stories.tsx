/**
 * Cross-Resource Validation Stories
 *
 * Storybook stories for ConflictCard and ConflictList components.
 */

import { ConflictCard } from './ConflictCard';
import { ConflictList } from './ConflictList';

import type { Meta, StoryObj } from '@storybook/react';
import type { ResourceConflict } from './types';

// ===== ConflictCard Stories =====

const cardMeta: Meta<typeof ConflictCard> = {
  title: 'Patterns/Forms/ConflictCard',
  component: ConflictCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a single cross-resource validation conflict with affected resources and resolution options.',
      },
    },
  },
};

export default cardMeta;
type CardStory = StoryObj<typeof ConflictCard>;

const ipCollisionConflict: ResourceConflict = {
  id: '1',
  type: 'ip_collision',
  severity: 'error',
  title: 'IP Address Collision',
  description: 'Two interfaces have the same IP address assigned',
  conflictValue: '192.168.1.1',
  resources: [
    { type: 'interface', id: 'ether1', name: 'ether1', path: '/interface/ether1', value: '192.168.1.1/24' },
    { type: 'interface', id: 'bridge1', name: 'bridge1', path: '/interface/bridge1', value: '192.168.1.1/24' },
  ],
  resolutions: [
    {
      id: 'change-bridge',
      label: 'Change Bridge IP',
      description: 'Assign a different IP address to bridge1',
      recommended: true,
      action: 'change_ip_bridge1',
    },
    {
      id: 'remove-ether',
      label: 'Remove Ether1 IP',
      description: 'Remove the IP address from ether1',
      action: 'remove_ip_ether1',
    },
  ],
  helpUrl: 'https://docs.example.com/ip-collision',
};

const portConflict: ResourceConflict = {
  id: '2',
  type: 'port_conflict',
  severity: 'warning',
  title: 'Port Conflict',
  description: 'The specified port is already in use by another service',
  conflictValue: '8080',
  resources: [
    { type: 'web-proxy', id: 'proxy1', name: 'Web Proxy', value: 'port 8080' },
    { type: 'service', id: 'api', name: 'API Server (new)', value: 'port 8080' },
  ],
  resolutions: [
    {
      id: 'change-port',
      label: 'Use Different Port',
      description: 'Configure the new service to use port 8081',
      recommended: true,
      action: 'change_port',
    },
  ],
};

const duplicateMacConflict: ResourceConflict = {
  id: '3',
  type: 'duplicate_mac',
  severity: 'error',
  title: 'Duplicate MAC Address',
  description: 'The same MAC address is used by multiple virtual interfaces',
  conflictValue: '00:11:22:33:44:55',
  resources: [
    { type: 'veth', id: 'veth1', name: 'veth1', value: '00:11:22:33:44:55' },
    { type: 'veth', id: 'veth2', name: 'veth2', value: '00:11:22:33:44:55' },
  ],
  resolutions: [
    {
      id: 'regenerate',
      label: 'Regenerate MAC',
      description: 'Generate a new random MAC for veth2',
      recommended: true,
      action: 'regenerate_mac',
    },
    {
      id: 'delete',
      label: 'Delete veth2',
      description: 'Remove the duplicate virtual interface',
      destructive: true,
      action: 'delete_veth2',
    },
  ],
};

/**
 * IP collision conflict - collapsed
 */
export const IPCollisionCollapsed: CardStory = {
  args: {
    conflict: ipCollisionConflict,
    isExpanded: false,
  },
};

/**
 * IP collision conflict - expanded with details
 */
export const IPCollisionExpanded: CardStory = {
  args: {
    conflict: ipCollisionConflict,
    isExpanded: true,
  },
};

/**
 * Port conflict - warning severity
 */
export const PortConflict: CardStory = {
  args: {
    conflict: portConflict,
    isExpanded: true,
  },
};

/**
 * Duplicate MAC - with destructive resolution
 */
export const DuplicateMAC: CardStory = {
  args: {
    conflict: duplicateMacConflict,
    isExpanded: true,
  },
};

// ===== ConflictList Stories =====

const listMeta: Meta<typeof ConflictList> = {
  title: 'Patterns/Forms/ConflictList',
  component: ConflictList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a list of cross-resource validation conflicts with filtering and summary.',
      },
    },
  },
};

/**
 * List with multiple conflicts
 */
export const MultipleConflicts: StoryObj<typeof ConflictList> = {
  render: () => (
    <ConflictList
      conflicts={[ipCollisionConflict, portConflict, duplicateMacConflict]}
      showSummary
      onSelectResolution={(conflictId, resolutionId) =>
        console.log('Resolution selected:', conflictId, resolutionId)
      }
    />
  ),
};

/**
 * Empty state - no conflicts
 */
export const NoConflicts: StoryObj<typeof ConflictList> = {
  render: () => <ConflictList conflicts={[]} showSummary />,
};

/**
 * Only errors (filtered)
 */
export const OnlyErrors: StoryObj<typeof ConflictList> = {
  render: () => (
    <ConflictList
      conflicts={[ipCollisionConflict, portConflict, duplicateMacConflict]}
      severityFilter={['error']}
      showSummary
    />
  ),
};

/**
 * Custom title
 */
export const CustomTitle: StoryObj<typeof ConflictList> = {
  render: () => (
    <ConflictList
      conflicts={[ipCollisionConflict]}
      title="Configuration Conflicts"
      showSummary
    />
  ),
};

/**
 * Without summary header
 */
export const WithoutSummary: StoryObj<typeof ConflictList> = {
  render: () => (
    <ConflictList
      conflicts={[ipCollisionConflict, portConflict]}
      showSummary={false}
    />
  ),
};

/**
 * Interactive - with resolution handler
 */
export const Interactive: StoryObj<typeof ConflictList> = {
  render: () => (
    <ConflictList
      conflicts={[ipCollisionConflict]}
      showSummary
      onSelectResolution={(conflictId, resolutionId) =>
        alert(`Applying resolution ${resolutionId} for conflict ${conflictId}`)
      }
    />
  ),
};
