import { fn } from 'storybook/test';

import { StopDependentsDialog } from './StopDependentsDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StopDependentsDialog> = {
  title: 'Features/Services/StopDependentsDialog',
  component: StopDependentsDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Warning dialog shown when stopping a service that has dependent services. ' +
          'Presents two stop modes: gracefully stopping dependents first (recommended) ' +
          'or force-stopping immediately (danger). Displays all affected services with ' +
          'their current status and dependency type (Required vs Optional).',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof StopDependentsDialog>;

const singleDependent = [
  {
    id: 'dep-1',
    dependencyType: 'REQUIRES' as const,
    autoStart: true,
    healthTimeoutSeconds: 30,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    fromInstance: {
      id: 'adguard-1',
      instanceName: 'AdGuard Home',
      featureID: 'adguard-home',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [3000],
    } as any,
    toInstance: {
      id: 'tor-1',
      instanceName: 'Tor Gateway',
      featureID: 'tor',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [9050],
    } as any,
  },
];

const multipleDependents = [
  {
    id: 'dep-1',
    dependencyType: 'REQUIRES' as const,
    autoStart: true,
    healthTimeoutSeconds: 30,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    fromInstance: {
      id: 'adguard-1',
      instanceName: 'AdGuard Home',
      featureID: 'adguard-home',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [3000],
    } as any,
    toInstance: {
      id: 'singbox-1',
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [8080],
    } as any,
  },
  {
    id: 'dep-2',
    dependencyType: 'OPTIONAL' as const,
    autoStart: false,
    healthTimeoutSeconds: 20,
    createdAt: '2024-03-01T10:05:00Z',
    updatedAt: '2024-03-01T10:05:00Z',
    fromInstance: {
      id: 'xray-1',
      instanceName: 'Xray Proxy',
      featureID: 'xray-core',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:05:00Z',
      updatedAt: '2024-03-01T10:05:00Z',
      ports: [1080],
    } as any,
    toInstance: {
      id: 'singbox-1',
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [8080],
    } as any,
  },
  {
    id: 'dep-3',
    dependencyType: 'REQUIRES' as const,
    autoStart: true,
    healthTimeoutSeconds: 45,
    createdAt: '2024-03-01T10:10:00Z',
    updatedAt: '2024-03-01T10:10:00Z',
    fromInstance: {
      id: 'mtproxy-1',
      instanceName: 'MTProxy',
      featureID: 'mtproxy',
      status: 'stopped' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:10:00Z',
      updatedAt: '2024-03-01T10:10:00Z',
      ports: [3128],
    } as any,
    toInstance: {
      id: 'singbox-1',
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running' as const,
      routerID: 'router-1',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      ports: [8080],
    } as any,
  },
];

/**
 * Default view with a single required dependent service.
 */
export const SingleDependent: Story = {
  args: {
    instanceName: 'Tor Gateway',
    featureId: 'tor',
    dependents: singleDependent,
  },
};

/**
 * Multiple dependent services with mixed Required and Optional types.
 */
export const MultipleDependents: Story = {
  args: {
    instanceName: 'Sing-box VPN',
    featureId: 'sing-box',
    dependents: multipleDependents,
  },
};

/**
 * Loading state while the stop action is being processed.
 */
export const Loading: Story = {
  args: {
    instanceName: 'Tor Gateway',
    featureId: 'tor',
    dependents: singleDependent,
    isLoading: true,
  },
};

/**
 * Only optional dependents — less critical than required ones.
 */
export const OnlyOptionalDependents: Story = {
  args: {
    instanceName: 'Psiphon Gateway',
    featureId: 'psiphon',
    dependents: [
      {
        id: 'dep-opt-1',
        dependencyType: 'OPTIONAL' as const,
        autoStart: false,
        healthTimeoutSeconds: 15,
        createdAt: '2024-03-01T10:15:00Z',
        updatedAt: '2024-03-01T10:15:00Z',
        fromInstance: {
          id: 'traffic-monitor-1',
          instanceName: 'Traffic Monitor',
          featureID: 'traffic-monitor',
          status: 'running' as const,
          routerID: 'router-1',
          createdAt: '2024-03-01T10:15:00Z',
          updatedAt: '2024-03-01T10:15:00Z',
          ports: [5000],
        } as any,
        toInstance: {
          id: 'psiphon-1',
          instanceName: 'Psiphon Gateway',
          featureID: 'psiphon',
          status: 'running' as const,
          routerID: 'router-1',
          createdAt: '2024-03-01T10:00:00Z',
          updatedAt: '2024-03-01T10:00:00Z',
          ports: [1088],
        } as any,
      },
      {
        id: 'dep-opt-2',
        dependencyType: 'OPTIONAL' as const,
        autoStart: false,
        healthTimeoutSeconds: 10,
        createdAt: '2024-03-01T10:20:00Z',
        updatedAt: '2024-03-01T10:20:00Z',
        fromInstance: {
          id: 'log-agg-1',
          instanceName: 'Log Aggregator',
          featureID: 'log-aggregator',
          status: 'running' as const,
          routerID: 'router-1',
          createdAt: '2024-03-01T10:20:00Z',
          updatedAt: '2024-03-01T10:20:00Z',
          ports: [5601],
        } as any,
        toInstance: {
          id: 'psiphon-1',
          instanceName: 'Psiphon Gateway',
          featureID: 'psiphon',
          status: 'running' as const,
          routerID: 'router-1',
          createdAt: '2024-03-01T10:00:00Z',
          updatedAt: '2024-03-01T10:00:00Z',
          ports: [1088],
        } as any,
      },
    ],
  },
};

/**
 * Closed state — dialog is not visible.
 */
export const Closed: Story = {
  args: {
    open: false,
    instanceName: 'Tor Gateway',
    featureId: 'tor',
    dependents: singleDependent,
  },
};
