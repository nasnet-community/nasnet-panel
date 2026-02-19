/**
 * Storybook stories for PingResults
 *
 * Demonstrates all states and variants of the PingResults component,
 * including empty state, healthy results, slow results, timeouts, and
 * large virtualized result sets.
 */

import { PingResults } from './PingResults';

import type { PingResult } from './PingTool.types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PingResults> = {
  title: 'Features/Diagnostics/PingResults',
  component: PingResults,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Virtualized streaming results list for ping diagnostics. Displays color-coded ping results with auto-scroll and supports hundreds of entries via @tanstack/react-virtual.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PingResults>;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function makeResult(overrides: Partial<PingResult> & { seq: number }): PingResult {
  return {
    bytes: 56,
    ttl: 52,
    time: 12.5,
    target: '8.8.8.8',
    source: null,
    error: null,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    ...overrides,
  };
}

// ─── Healthy results (green, low latency) ────────────────────────────────────

const healthyResults: PingResult[] = Array.from({ length: 10 }, (_, i) =>
  makeResult({
    seq: i + 1,
    time: 10 + Math.random() * 20, // 10–30 ms
    bytes: 56,
    ttl: 52,
    target: '8.8.8.8',
  })
);

// ─── Mixed results (healthy + slow + timeout) ────────────────────────────────

const mixedResults: PingResult[] = [
  makeResult({ seq: 1, time: 14.2 }),
  makeResult({ seq: 2, time: 11.8 }),
  makeResult({ seq: 3, time: 120.3 }), // slow → amber
  makeResult({ seq: 4, time: null, error: 'timeout' }),
  makeResult({ seq: 5, time: 13.0 }),
  makeResult({ seq: 6, time: 245.7 }), // critical → red
  makeResult({ seq: 7, time: null, error: 'timeout' }),
  makeResult({ seq: 8, time: 16.1 }),
];

// ─── All-timeout results ──────────────────────────────────────────────────────

const allTimeoutResults: PingResult[] = Array.from({ length: 8 }, (_, i) =>
  makeResult({ seq: i + 1, time: null, error: 'timeout', bytes: null, ttl: null })
);

// ─── Large dataset (100 entries) for virtualization demo ─────────────────────

const largeResults: PingResult[] = Array.from({ length: 100 }, (_, i) => {
  const seq = i + 1;
  if (seq % 10 === 0) return makeResult({ seq, time: null, error: 'timeout', bytes: null, ttl: null });
  if (seq % 7 === 0) return makeResult({ seq, time: 150 + Math.random() * 80 }); // slow
  return makeResult({ seq, time: 8 + Math.random() * 25 });
});

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Empty State
 *
 * Shown before a ping test has been started. Prompts the user to begin.
 */
export const Empty: Story = {
  args: {
    results: [],
  },
};

/**
 * Healthy Results
 *
 * All pings succeed with low latency (10–30ms). Rows are rendered in green.
 */
export const Healthy: Story = {
  args: {
    results: healthyResults,
  },
};

/**
 * Mixed Results
 *
 * Combination of healthy (green), slow >100ms (amber), critical >200ms (red),
 * and timeout (red) entries — demonstrating the color-coding logic.
 */
export const MixedLatency: Story = {
  args: {
    results: mixedResults,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows all three color states in a single list: green (<100ms), amber (100–200ms), and red (>200ms or timeout).',
      },
    },
  },
};

/**
 * All Timeouts
 *
 * Every ping failed with a timeout — host unreachable scenario.
 * All rows display in destructive (red) color.
 */
export const AllTimeouts: Story = {
  args: {
    results: allTimeoutResults,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a completely unreachable host. Every row shows "timeout" in red.',
      },
    },
  },
};

/**
 * Large Dataset (100 entries)
 *
 * Demonstrates the @tanstack/react-virtual virtualized rendering with 100 results.
 * Scroll the list to verify only visible rows are rendered to the DOM.
 */
export const LargeDataset: Story = {
  args: {
    results: largeResults,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Virtualized list with 100 ping results. Only the visible subset is rendered to the DOM at any time, keeping performance consistent.',
      },
    },
  },
};

/**
 * Custom Target
 *
 * Results for a hostname target instead of an IP address.
 */
export const HostnameTarget: Story = {
  args: {
    results: Array.from({ length: 5 }, (_, i) =>
      makeResult({ seq: i + 1, target: 'cloudflare.com', time: 22 + i * 3 })
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Results when pinging a hostname rather than a bare IP address.',
      },
    },
  },
};
