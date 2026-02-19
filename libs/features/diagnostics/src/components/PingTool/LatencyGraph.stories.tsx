/**
 * Storybook stories for LatencyGraph
 *
 * Demonstrates all display states of the Recharts-based latency visualizer:
 * empty state, healthy low-latency, spike detection, timeouts producing
 * line gaps, and crossing the warning/critical threshold reference lines.
 */

import { LatencyGraph } from './LatencyGraph';

import type { PingResult } from './PingTool.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LatencyGraph> = {
  title: 'Features/Diagnostics/LatencyGraph',
  component: LatencyGraph,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Recharts line chart that visualizes ping RTT over time. Reference lines mark the 100ms (slow) and 200ms (critical) thresholds. Null time values produce visible gaps in the line, indicating timeouts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LatencyGraph>;

// ─── Factory helper ───────────────────────────────────────────────────────────

function makeResult(seq: number, time: number | null, target = '8.8.8.8'): PingResult {
  return {
    seq,
    time,
    target,
    bytes: time !== null ? 56 : null,
    ttl: time !== null ? 52 : null,
    source: null,
    error: time === null ? 'timeout' : null,
    timestamp: new Date('2024-01-15T10:30:00Z'),
  };
}

// ─── Datasets ─────────────────────────────────────────────────────────────────

const healthyResults: PingResult[] = Array.from({ length: 20 }, (_, i) =>
  makeResult(i + 1, 10 + Math.sin(i * 0.5) * 5 + 2) // 7–17 ms sinusoidal
);

const withTimeouts: PingResult[] = [
  ...Array.from({ length: 5 }, (_, i) => makeResult(i + 1, 12 + i)),
  makeResult(6, null),
  makeResult(7, null),
  ...Array.from({ length: 5 }, (_, i) => makeResult(i + 8, 14 + i)),
  makeResult(13, null),
  ...Array.from({ length: 4 }, (_, i) => makeResult(i + 14, 11 + i * 2)),
];

const crossingThresholds: PingResult[] = [
  makeResult(1, 30),
  makeResult(2, 55),
  makeResult(3, 80),
  makeResult(4, 115), // crosses 100ms warning
  makeResult(5, 145),
  makeResult(6, 210), // crosses 200ms critical
  makeResult(7, 280),
  makeResult(8, 180),
  makeResult(9, 110),
  makeResult(10, 60),
  makeResult(11, 25),
  makeResult(12, 18),
];

const highLatencyResults: PingResult[] = Array.from({ length: 15 }, (_, i) =>
  makeResult(i + 1, 400 + Math.random() * 300) // 400–700 ms satellite-level
);

const singleResult: PingResult[] = [makeResult(1, 14.7)];

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Empty State
 *
 * No data yet. Shows the placeholder message prompting the user to start a test.
 */
export const Empty: Story = {
  args: {
    results: [],
  },
};

/**
 * Healthy Connection
 *
 * Twenty sequential pings all well below the 100ms warning threshold.
 * The Y-axis is clamped to [0, 250] and the line remains in the safe zone.
 */
export const Healthy: Story = {
  args: {
    results: healthyResults,
  },
};

/**
 * With Timeouts (Line Gaps)
 *
 * Timeouts (null time values) produce visible gaps in the line chart.
 * This distinguishes a failed ping from a low-latency one.
 */
export const WithTimeouts: Story = {
  args: {
    results: withTimeouts,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Gaps in the line correspond to sequences where time === null (timeout). connectNulls=false is what produces those gaps.',
      },
    },
  },
};

/**
 * Crossing Thresholds
 *
 * Latency rises through the warning (100ms) and critical (200ms) reference lines,
 * then recovers — demonstrating both threshold markers in a realistic scenario.
 */
export const CrossingThresholds: Story = {
  args: {
    results: crossingThresholds,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The chart shows the line crossing both the dashed warning (100ms) and critical (200ms) reference lines before recovering.',
      },
    },
  },
};

/**
 * High Latency (Satellite Link)
 *
 * All pings complete but at 400–700ms — well above both thresholds.
 * The Y-axis auto-scales to accommodate the extreme values.
 */
export const HighLatency: Story = {
  args: {
    results: highLatencyResults,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Y-axis scales up to accommodate extreme RTT values. Both reference lines appear near the bottom of the chart.',
      },
    },
  },
};

/**
 * Single Data Point
 *
 * Edge case: only one ping result. The chart renders a single dot
 * rather than a connected line.
 */
export const SinglePoint: Story = {
  args: {
    results: singleResult,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case with a single result. The line degrades to a single dot.',
      },
    },
  },
};
