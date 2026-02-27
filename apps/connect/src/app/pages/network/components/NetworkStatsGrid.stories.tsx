/**
 * NetworkStatsGrid Stories
 *
 * Three-column grid showing CPU %, RAM %, and uptime derived from a SystemResource object.
 * Color-codes each metric via calculateStatus thresholds (healthy → warning → critical).
 * Prop-driven — no stores or routing required.
 */

import type { SystemResource } from '@nasnet/core/types';

import { NetworkStatsGrid } from './NetworkStatsGrid';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock SystemResource objects
// ---------------------------------------------------------------------------

const healthyResource: SystemResource = {
  uptime: '3d4h25m12s',
  cpuLoad: 12,
  freeMemory: 90_000_000,
  totalMemory: 128_000_000,
  freeHddSpace: 500_000_000,
  totalHddSpace: 1_000_000_000,
  architecture: 'arm64',
  boardName: 'RB4011iGS+5HacQ2HnD',
  version: '7.14.2',
  platform: 'MikroTik',
};

const warningResource: SystemResource = {
  ...healthyResource,
  cpuLoad: 72,
  freeMemory: 30_000_000,
  totalMemory: 128_000_000,
  uptime: '14d2h5m30s',
};

const criticalResource: SystemResource = {
  ...healthyResource,
  cpuLoad: 95,
  freeMemory: 5_000_000,
  totalMemory: 128_000_000,
  uptime: '0d0h3m55s',
};

const longUptimeResource: SystemResource = {
  ...healthyResource,
  uptime: '120d14h59m59s',
  cpuLoad: 8,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkStatsGrid> = {
  title: 'App/Network/NetworkStatsGrid',
  component: NetworkStatsGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Compact three-column grid rendered inside the Network Dashboard card. ' +
          'Displays CPU load percentage (cyan, amber, or red depending on severity), ' +
          'RAM usage percentage (purple, amber, or red), and formatted uptime (always emerald). ' +
          'Accepts an optional `SystemResource` object — shows "--" placeholders when absent.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkStatsGrid>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const HealthySystem: Story = {
  args: {
    resourceData: healthyResource,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CPU at 12% and RAM at ~30% — all metrics within healthy thresholds (cyan / purple).',
      },
    },
  },
};

export const WarningThresholds: Story = {
  args: {
    resourceData: warningResource,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'CPU at 72% and RAM at ~77% — both metrics cross the warning threshold and render in amber.',
      },
    },
  },
};

export const CriticalLoad: Story = {
  args: {
    resourceData: criticalResource,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'CPU at 95% and RAM at ~96% — both in the critical range and shown in red.',
      },
    },
  },
};

export const LongUptime: Story = {
  args: {
    resourceData: longUptimeResource,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Router with 120 days of uptime. Verifies that parseRouterOSUptime formats long durations correctly.',
      },
    },
  },
};

export const NoData: Story = {
  args: {
    resourceData: undefined,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'No resource data available. All three cells display "--" placeholder values.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton pulse state displayed while system resource data is being fetched.',
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
