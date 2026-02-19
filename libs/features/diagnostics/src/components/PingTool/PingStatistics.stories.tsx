/**
 * Storybook stories for PingStatistics
 *
 * Demonstrates all badge variants and color states of the PingStatistics
 * component, driven by different packet-loss scenarios.
 */

import { PingStatistics } from './PingStatistics';

import type { PingStatistics as PingStatisticsType } from './PingTool.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PingStatistics> = {
  title: 'Features/Diagnostics/PingStatistics',
  component: PingStatistics,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays ping test statistics using semantic HTML (dl/dt/dd) for accessibility. Color-codes packet loss severity and shows min/avg/max RTT with standard deviation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PingStatistics>;

// ─── Shared base ─────────────────────────────────────────────────────────────

const baseStats: PingStatisticsType = {
  sent: 10,
  received: 10,
  lost: 0,
  lossPercent: 0,
  minRtt: 11.82,
  avgRtt: 12.94,
  maxRtt: 14.21,
  stdDev: 0.77,
};

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Perfect — No Packet Loss
 *
 * All 10 packets received. Shows the "No Loss" success badge with green styling.
 */
export const NoLoss: Story = {
  args: {
    statistics: baseStats,
  },
};

/**
 * Partial Loss (10%)
 *
 * One packet lost out of ten. Shows the warning (amber) badge and red lost count.
 */
export const PartialLoss: Story = {
  args: {
    statistics: {
      ...baseStats,
      received: 9,
      lost: 1,
      lossPercent: 10,
      minRtt: 11.82,
      avgRtt: 13.45,
      maxRtt: 18.60,
      stdDev: 1.92,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows warning state with amber "10% Loss" badge when packet loss is between 1% and 49%.',
      },
    },
  },
};

/**
 * High Loss (60%)
 *
 * Most packets dropped. Triggers the error (red) badge variant.
 */
export const HighLoss: Story = {
  args: {
    statistics: {
      ...baseStats,
      sent: 10,
      received: 4,
      lost: 6,
      lossPercent: 60,
      minRtt: 98.10,
      avgRtt: 210.50,
      maxRtt: 380.20,
      stdDev: 98.34,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state triggered when packet loss is >= 50%. Badge reads "60% Loss" in red.',
      },
    },
  },
};

/**
 * Host Unreachable (100% Loss)
 *
 * No packets were received at all. Shows the "Host Unreachable" error badge
 * and N/A RTT values.
 */
export const HostUnreachable: Story = {
  args: {
    statistics: {
      sent: 10,
      received: 0,
      lost: 10,
      lossPercent: 100,
      minRtt: null,
      avgRtt: null,
      maxRtt: null,
      stdDev: null,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete packet loss (100%). RTT fields display "N/A" and the badge reads "Host Unreachable".',
      },
    },
  },
};

/**
 * In Progress (Partial Data)
 *
 * Ping test still running — only a few packets sent so far.
 * Demonstrates the component with a small result set mid-test.
 */
export const InProgress: Story = {
  args: {
    statistics: {
      sent: 3,
      received: 3,
      lost: 0,
      lossPercent: 0,
      minRtt: 12.10,
      avgRtt: 12.87,
      maxRtt: 13.55,
      stdDev: 0.58,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows statistics for an in-progress ping test with only 3 packets sent.',
      },
    },
  },
};

/**
 * High Latency Network
 *
 * All packets received but with very high RTT (satellite or heavily congested link).
 * No loss badge — but RTT values highlight the degraded connection quality.
 */
export const HighLatency: Story = {
  args: {
    statistics: {
      sent: 10,
      received: 10,
      lost: 0,
      lossPercent: 0,
      minRtt: 480.30,
      avgRtt: 620.80,
      maxRtt: 890.15,
      stdDev: 125.44,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'No packet loss but extremely high RTT values — typical of a satellite or highly congested link.',
      },
    },
  },
};
