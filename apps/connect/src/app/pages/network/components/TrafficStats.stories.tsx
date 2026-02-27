/**
 * Storybook stories for TrafficStats component
 * Covers: default/compact/detailed variants, clean traffic, traffic with errors, traffic with drops, combined issues
 */

import { type TrafficStatistics } from '@nasnet/core/types';

import { TrafficStats } from './TrafficStats';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TrafficStats> = {
  title: 'App/Network/TrafficStats',
  component: TrafficStats,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Visualises network interface traffic statistics (bytes, packets, errors, drops). Supports three display variants: default (bar chart + packet counts), compact (single-line summary), and detailed (full grid with drops).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Controls layout density',
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrafficStats>;

// --- Shared mock data ---

const cleanStats: TrafficStatistics = {
  interfaceId: 'ether1',
  rxBytes: 1_572_864_000, // ~1.5 GB
  txBytes: 314_572_800, // ~300 MB
  rxPackets: 2_450_000,
  txPackets: 890_000,
  rxErrors: 0,
  txErrors: 0,
  rxDrops: 0,
  txDrops: 0,
};

const statsWithErrors: TrafficStatistics = {
  interfaceId: 'ether2',
  rxBytes: 524_288_000, // ~500 MB
  txBytes: 209_715_200, // ~200 MB
  rxPackets: 1_200_000,
  txPackets: 450_000,
  rxErrors: 37,
  txErrors: 12,
  rxDrops: 0,
  txDrops: 0,
};

const statsWithDrops: TrafficStatistics = {
  interfaceId: 'bridge1',
  rxBytes: 104_857_600, // ~100 MB
  txBytes: 52_428_800, // ~50 MB
  rxPackets: 600_000,
  txPackets: 200_000,
  rxErrors: 0,
  txErrors: 0,
  rxDrops: 128,
  txDrops: 64,
};

const statsWithAllIssues: TrafficStatistics = {
  interfaceId: 'vlan10',
  rxBytes: 10_485_760, // ~10 MB
  txBytes: 5_242_880, // ~5 MB
  rxPackets: 85_000,
  txPackets: 22_000,
  rxErrors: 8,
  txErrors: 3,
  rxDrops: 512,
  txDrops: 256,
};

const lowTrafficStats: TrafficStatistics = {
  interfaceId: 'loopback',
  rxBytes: 4096,
  txBytes: 4096,
  rxPackets: 12,
  txPackets: 12,
  rxErrors: 0,
  txErrors: 0,
  rxDrops: 0,
  txDrops: 0,
};

// --- Stories ---

export const Default: Story = {
  args: {
    stats: cleanStats,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default variant shows download and upload bars with byte totals and packet counts. Clean interface — no issues alert.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    stats: cleanStats,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact single-line summary: RX bytes (green), TX bytes (purple). Used in collapsed interface cards.',
      },
    },
  },
};

export const Detailed: Story = {
  args: {
    stats: cleanStats,
    variant: 'detailed',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Detailed variant adds a 2×2 grid below the bars showing RX/TX packet counts and drop counts.',
      },
    },
  },
};

export const WithErrors: Story = {
  args: {
    stats: statsWithErrors,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When rxErrors or txErrors are non-zero the issues alert banner appears and individual error counts appear beneath each bar.',
      },
    },
  },
};

export const WithDrops: Story = {
  args: {
    stats: statsWithDrops,
    variant: 'detailed',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When rxDrops or txDrops are non-zero the issues alert banner appears. The detailed grid highlights non-zero drop cells in destructive colour.',
      },
    },
  },
};

export const AllIssues: Story = {
  args: {
    stats: statsWithAllIssues,
    variant: 'detailed',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Combines errors and drops to verify the issues alert correctly aggregates both into a single summary message.',
      },
    },
  },
};

export const CompactWithIssues: Story = {
  args: {
    stats: statsWithAllIssues,
    variant: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact variant shows an amber AlertTriangle icon when any errors or drops are present, without expanding the layout.',
      },
    },
  },
};

export const LowTraffic: Story = {
  args: {
    stats: lowTrafficStats,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: very low byte and packet counts (e.g. loopback interface) to verify formatBytes renders small values correctly.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    stats: cleanStats,
    variant: 'default',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    stats: cleanStats,
    variant: 'default',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
