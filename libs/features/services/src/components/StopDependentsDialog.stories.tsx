import type { Meta, StoryObj } from '@storybook/react';
import { StopDependentsDialog } from './StopDependentsDialog';

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
    onOpenChange: () => {},
    onConfirm: () => {},
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof StopDependentsDialog>;

const singleDependent = [
  {
    id: 'dep-1',
    dependencyType: 'REQUIRES' as const,
    fromInstance: {
      instanceName: 'AdGuard Home',
      featureID: 'adguard-home',
      status: 'running',
    },
    toInstance: {
      instanceName: 'Tor Gateway',
      featureID: 'tor',
      status: 'running',
    },
  },
];

const multipleDependents = [
  {
    id: 'dep-1',
    dependencyType: 'REQUIRES' as const,
    fromInstance: {
      instanceName: 'AdGuard Home',
      featureID: 'adguard-home',
      status: 'running',
    },
    toInstance: {
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running',
    },
  },
  {
    id: 'dep-2',
    dependencyType: 'OPTIONAL' as const,
    fromInstance: {
      instanceName: 'Xray Proxy',
      featureID: 'xray-core',
      status: 'running',
    },
    toInstance: {
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running',
    },
  },
  {
    id: 'dep-3',
    dependencyType: 'REQUIRES' as const,
    fromInstance: {
      instanceName: 'MTProxy',
      featureID: 'mtproxy',
      status: 'stopped',
    },
    toInstance: {
      instanceName: 'Sing-box VPN',
      featureID: 'sing-box',
      status: 'running',
    },
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
        fromInstance: {
          instanceName: 'Traffic Monitor',
          featureID: 'traffic-monitor',
          status: 'running',
        },
        toInstance: {
          instanceName: 'Psiphon Gateway',
          featureID: 'psiphon',
          status: 'running',
        },
      },
      {
        id: 'dep-opt-2',
        dependencyType: 'OPTIONAL' as const,
        fromInstance: {
          instanceName: 'Log Aggregator',
          featureID: 'log-aggregator',
          status: 'running',
        },
        toInstance: {
          instanceName: 'Psiphon Gateway',
          featureID: 'psiphon',
          status: 'running',
        },
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
