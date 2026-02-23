/**
 * NetworkTopBar Stories
 *
 * Compact sticky top bar for the Network Dashboard in the mobile/pro dark-theme layout.
 * Shows router identity (name + RouterOS version) on the left and an overflow menu
 * button on the right. A colour-coded dot communicates connection status at a glance.
 * Prop-driven — no stores or routing required.
 */


import type { SystemInfo } from '@nasnet/core/types';

import { NetworkTopBar } from './NetworkTopBar';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const fullRouterInfo: SystemInfo = {
  identity: 'MikroTik-HQ',
  model: 'RB4011iGS+5HacQ2HnD',
  routerOsVersion: '7.14.2',
  cpuArchitecture: 'arm64',
  uptime: '3d 4h 25m',
};

const minimalRouterInfo: SystemInfo = {
  identity: 'Router-01',
  model: 'hEX S',
  routerOsVersion: '',      // version intentionally blank
  cpuArchitecture: 'mipsbe',
};

const longNameRouterInfo: SystemInfo = {
  identity: 'VeryLong-RouterIdentityName-That-Tests-Layout',
  model: 'CHR',
  routerOsVersion: '7.14.2',
  cpuArchitecture: 'x86_64',
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkTopBar> = {
  title: 'App/Network/NetworkTopBar',
  component: NetworkTopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
    docs: {
      description: {
        component:
          'Compact sticky header for the Network Dashboard. ' +
          'Left side: router logo square, identity name, and status dot with label + optional version. ' +
          'Right side: overflow menu icon button. ' +
          'Four network status variants (healthy, warning, error, loading) control dot and text colours. ' +
          'A full skeleton loading state is rendered when `isLoading` is true.',
      },
    },
  },
  argTypes: {
    networkStatus: {
      control: 'select',
      options: ['healthy', 'warning', 'error', 'loading'],
      description: 'Controls the colour of the status indicator dot and label',
    },
    isLoading: {
      control: 'boolean',
      description: 'Renders a skeleton placeholder when true',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkTopBar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Healthy: Story = {
  args: {
    routerInfo: fullRouterInfo,
    networkStatus: 'healthy',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Router is fully online. Green dot + "Online" label. RouterOS version is displayed after the status.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    routerInfo: fullRouterInfo,
    networkStatus: 'warning',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Partial connectivity or degraded service. Amber dot + "Degraded" label.',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    routerInfo: fullRouterInfo,
    networkStatus: 'error',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Router is unreachable. Red dot + "Offline" label. Version still shown from last-known info.',
      },
    },
  },
};

export const Connecting: Story = {
  args: {
    routerInfo: undefined,
    networkStatus: 'loading',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Connection is being established. No router info yet — falls back to "Router". ' +
          'Slate dot + "Connecting" label, no version segment.',
      },
    },
  },
};

export const LoadingSkeleton: Story = {
  args: {
    routerInfo: undefined,
    networkStatus: 'loading',
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full skeleton / pulse animation shown while initial data is being fetched. ' +
          'All text content is replaced with placeholder blocks.',
      },
    },
  },
};

export const NoVersion: Story = {
  args: {
    routerInfo: minimalRouterInfo,
    networkStatus: 'healthy',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Router info present but version string is empty. ' +
          'The separator dot and version segment are hidden.',
      },
    },
  },
};

export const LongIdentity: Story = {
  args: {
    routerInfo: longNameRouterInfo,
    networkStatus: 'healthy',
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress-tests the layout with an unusually long router identity string to verify ' +
          'text truncation and that the menu button stays pinned to the right.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    routerInfo: fullRouterInfo,
    networkStatus: 'healthy',
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    routerInfo: fullRouterInfo,
    networkStatus: 'healthy',
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
