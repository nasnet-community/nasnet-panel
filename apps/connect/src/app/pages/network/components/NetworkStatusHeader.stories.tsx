/**
 * Storybook stories for NetworkStatusHeader
 * Card-heavy header showing router identity, status badge, and a 4-cell resource grid
 * (CPU / Memory / Uptime / Interfaces).
 */

import type { SystemInfo, SystemResource } from '@nasnet/core/types';

import { NetworkStatusHeader } from './NetworkStatusHeader';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data helpers
// ---------------------------------------------------------------------------

const ROUTER_INFO: SystemInfo = {
  identity: 'MikroTik-HQ',
  model: 'RB4011iGS+5HacQ2HnD',
  routerOsVersion: '7.14.2',
  cpuArchitecture: 'arm64',
};

const RESOURCE_HEALTHY: SystemResource = {
  uptime: '3d4h25m12s',
  cpuLoad: 18,
  freeMemory: 682_393_600, // ~651 MB free out of ~1 GB
  totalMemory: 1_073_741_824, // 1 GB
  freeHddSpace: 50_331_648,
  totalHddSpace: 134_217_728,
  architecture: 'arm64',
  boardName: 'RB4011iGS+5HacQ2HnD',
  version: '7.14.2',
  platform: 'MikroTik',
};

const RESOURCE_WARNING: SystemResource = {
  ...RESOURCE_HEALTHY,
  cpuLoad: 62,
  freeMemory: 322_961_408, // ~35% free → 65% used
  totalMemory: 536_870_912, // 512 MB
  uptime: '12h30m45s',
};

const RESOURCE_CRITICAL: SystemResource = {
  ...RESOURCE_HEALTHY,
  cpuLoad: 91,
  freeMemory: 52_428_800, // ~10% free → 90% used
  totalMemory: 536_870_912, // 512 MB
  uptime: '2m15s',
};

const meta: Meta<typeof NetworkStatusHeader> = {
  title: 'App/Network/NetworkStatusHeader',
  component: NetworkStatusHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Top-of-page status card for the Network dashboard. ' +
          'Displays the router identity and RouterOS version alongside a colour-coded online/offline ' +
          'status indicator, and a 4-cell resource grid showing CPU load, memory usage, uptime, ' +
          'and active interface count. ' +
          'Supports four network statuses (healthy / warning / error / loading) and renders ' +
          'an animated skeleton while data is being fetched.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    networkStatus: {
      control: 'select',
      options: ['healthy', 'warning', 'error', 'loading'],
      description: 'Overall network health derived from interface and resource data.',
    },
    activeCount: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Number of currently running/link-up interfaces.',
    },
    totalCount: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Total number of configured interfaces.',
    },
    isLoading: {
      control: 'boolean',
      description: 'When true, renders an animated skeleton instead of live data.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkStatusHeader>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Healthy: Story = {
  name: 'Healthy — All Systems Normal',
  args: {
    routerInfo: ROUTER_INFO,
    resourceData: RESOURCE_HEALTHY,
    networkStatus: 'healthy',
    activeCount: 6,
    totalCount: 8,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Nominal state: CPU at 18%, memory at ~37%, router online for 3 days. ' +
          'The status dot pulses green and the interface counter reads 6/8.',
      },
    },
  },
};

export const Warning: Story = {
  name: 'Warning — Elevated Resource Usage',
  args: {
    routerInfo: ROUTER_INFO,
    resourceData: RESOURCE_WARNING,
    networkStatus: 'warning',
    activeCount: 4,
    totalCount: 8,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Degraded state: CPU at 62% and memory at 65% push the bars into amber. ' +
          'The status badge reads "Degraded" without the pulse animation.',
      },
    },
  },
};

export const Error: Story = {
  name: 'Error — Router Offline',
  args: {
    routerInfo: ROUTER_INFO,
    resourceData: RESOURCE_CRITICAL,
    networkStatus: 'error',
    activeCount: 1,
    totalCount: 8,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Offline state: CPU at 91% and memory at 90% render red bars. ' +
          'The status badge shows "Offline" in red. Only 1 of 8 interfaces is active.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading — Skeleton State',
  args: {
    networkStatus: 'loading',
    activeCount: 0,
    totalCount: 0,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While router data is being fetched the component renders an animated pulse skeleton ' +
          'with placeholder rectangles for the title, subtitle, and each of the four resource cells.',
      },
    },
  },
};

export const NoRouterInfo: Story = {
  name: 'No Router Info (resourceData only)',
  args: {
    resourceData: RESOURCE_HEALTHY,
    networkStatus: 'healthy',
    activeCount: 3,
    totalCount: 5,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `routerInfo` is undefined the identity falls back to "Router" and the model badge ' +
          'is hidden. The resource grid still renders correctly from `resourceData` alone.',
      },
    },
  },
};

export const NoResourceData: Story = {
  name: 'No Resource Data (routerInfo only)',
  args: {
    routerInfo: ROUTER_INFO,
    networkStatus: 'healthy',
    activeCount: 5,
    totalCount: 8,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `resourceData` is undefined the CPU and memory cells show "--" / "0%" ' +
          'and the uptime cell shows "--". The interface counter still renders from the passed counts.',
      },
    },
  },
};

export const MinimalRouter: Story = {
  name: 'Minimal Router (hAP lite)',
  args: {
    routerInfo: {
      identity: 'hap-lite-01',
      model: 'RB941-2nD',
      routerOsVersion: '6.49.15',
      cpuArchitecture: 'mipsbe',
    },
    resourceData: {
      uptime: '45d2h10m',
      cpuLoad: 5,
      freeMemory: 18_874_368, // 18 MB free out of 32 MB
      totalMemory: 33_554_432, // 32 MB
      freeHddSpace: 2_097_152,
      totalHddSpace: 16_777_216,
      architecture: 'mipsbe',
      boardName: 'RB941-2nD',
      version: '6.49.15',
      platform: 'MikroTik',
    },
    networkStatus: 'healthy',
    activeCount: 4,
    totalCount: 4,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A low-end MikroTik hAP lite router with only 32 MB RAM. Memory bar sits at ~44% — ' +
          'still healthy but much closer to the warning threshold than a high-end device.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
