/**
 * Storybook stories for TracerouteHopsList
 *
 * Covers: empty state, running (discovering), completed with excellent/
 * acceptable/poor latency hops, timeouts, and packet loss.
 */

import { TracerouteHopsList } from './TracerouteHopsList';

import type { TracerouteHop } from './TracerouteTool.types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

function makeProbe(probeNumber: number, latencyMs: number | null): {
  probeNumber: number;
  latencyMs: number | null;
  success: boolean;
  icmpCode?: string | null;
} {
  return {
    probeNumber,
    latencyMs,
    success: latencyMs !== null,
    icmpCode: null,
  };
}

function makeHop(
  hopNumber: number,
  address: string | null,
  latencies: Array<number | null>,
  options: Partial<TracerouteHop> = {}
): TracerouteHop {
  const successfulLatencies = latencies.filter((l): l is number => l !== null);
  const avgLatencyMs =
    successfulLatencies.length > 0
      ? successfulLatencies.reduce((a, b) => a + b, 0) / successfulLatencies.length
      : null;

  const lostProbes = latencies.filter((l) => l === null).length;
  const packetLoss = (lostProbes / latencies.length) * 100;

  return {
    hopNumber,
    address: address ?? undefined,
    hostname: options.hostname ?? undefined,
    avgLatencyMs: avgLatencyMs ?? undefined,
    packetLoss,
    status: address === null ? 'TIMEOUT' : 'SUCCESS',
    probes: latencies.map((l, i) => makeProbe(i + 1, l)),
    ...options,
  } as TracerouteHop;
}

// A realistic 10-hop path to 8.8.8.8
const realisticHops: TracerouteHop[] = [
  makeHop(1, '192.168.1.1', [0.4, 0.5, 0.4], { hostname: 'router.local' }),
  makeHop(2, '10.0.0.1', [3.2, 2.9, 3.1]),
  makeHop(3, '72.14.232.1', [8.7, 9.1, 8.9]),
  makeHop(4, '108.170.246.65', [11.2, 10.9, 11.5]),
  makeHop(5, '172.253.71.3', [12.4, 12.8, 12.1], { hostname: 'lga34s33-in-f3.1e100.net' }),
  makeHop(6, '8.8.8.8', [13.0, 12.9, 13.1], { hostname: 'dns.google' }),
];

const highLatencyHops: TracerouteHop[] = [
  makeHop(1, '192.168.1.1', [1.0, 1.1, 0.9], { hostname: 'router.local' }),
  makeHop(2, '203.0.113.1', [75.3, 80.1, 72.9]),   // yellow — acceptable
  makeHop(3, '198.51.100.1', [180.5, 195.2, 172.8]), // red — poor
  makeHop(4, '8.8.8.8', [210.1, 225.4, 198.7], { hostname: 'dns.google' }),
];

const withTimeoutsHops: TracerouteHop[] = [
  makeHop(1, '192.168.1.1', [0.8, 0.7, 0.9], { hostname: 'router.local' }),
  makeHop(2, null, [null, null, null]),               // full timeout
  makeHop(3, null, [null, null, null]),               // full timeout
  makeHop(4, '203.0.113.50', [22.1, 21.8, 22.3]),
  makeHop(5, '8.8.8.8', [24.5, 24.1, 24.9], { hostname: 'dns.google' }),
];

const withPacketLossHops: TracerouteHop[] = [
  makeHop(1, '192.168.1.1', [0.5, 0.6, 0.5]),
  makeHop(2, '10.0.0.1', [5.0, null, 4.8]),          // 33% loss
  makeHop(3, '72.14.232.1', [null, null, 15.3]),      // 67% loss
  makeHop(4, '8.8.8.8', [18.1, 17.9, 18.5], { hostname: 'dns.google' }),
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TracerouteHopsList> = {
  title: 'Features/Diagnostics/TracerouteHopsList',
  component: TracerouteHopsList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Scrollable list of traceroute hops with latency colour-coding: ' +
          'green (<50 ms), yellow (50–150 ms), red (>150 ms), and gray for timeouts. ' +
          'Shows individual probe latencies and packet-loss percentage per hop.',
      },
    },
  },
  argTypes: {
    isRunning: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TracerouteHopsList>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty State',
  args: {
    hops: [],
    isRunning: false,
  },
  parameters: {
    docs: { description: { story: 'No hops yet — renders the "No hops discovered yet" message.' } },
  },
};

export const Discovering: Story = {
  name: 'Discovering — Running',
  args: {
    hops: realisticHops.slice(0, 3),
    isRunning: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three hops found so far; a dashed "Discovering hop 4…" placeholder is appended at the bottom.',
      },
    },
  },
};

export const Completed: Story = {
  name: 'Completed — Excellent Latency',
  args: {
    hops: realisticHops,
    isRunning: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A completed 6-hop trace to 8.8.8.8 — all hops under 50 ms (green).',
      },
    },
  },
};

export const HighLatency: Story = {
  name: 'High Latency Hops',
  args: {
    hops: highLatencyHops,
    isRunning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hops with varying latency: yellow (50–150 ms) and red (>150 ms) colour coding applied.',
      },
    },
  },
};

export const WithTimeouts: Story = {
  name: 'With Timeout Hops',
  args: {
    hops: withTimeoutsHops,
    isRunning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hops 2 and 3 did not respond — displayed as "* * * (no response)" with an AlertCircle icon.',
      },
    },
  },
};

export const WithPacketLoss: Story = {
  name: 'With Packet Loss',
  args: {
    hops: withPacketLossHops,
    isRunning: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Some probes within a hop timed out, triggering the packet-loss percentage indicator.',
      },
    },
  },
};
