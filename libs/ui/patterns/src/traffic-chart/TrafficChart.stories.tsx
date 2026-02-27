/**
 * TrafficChart Stories
 *
 * Storybook stories for the TrafficChart pattern component.
 * Demonstrates default placeholder data, custom datasets, loading state,
 * and different chart heights representing various dashboard card sizes.
 */

import { useEffect, useState } from 'react';

import { TrafficChart } from './TrafficChart';

import type { TrafficDataPoint } from './TrafficChart';
import type { Meta, StoryObj } from '@storybook/react';

// ─── Mock data sets ───────────────────────────────────────────────────────────

/** Steady, low-traffic baseline — quiet router */
const quietTrafficData: TrafficDataPoint[] = [
  { time: '-1h', download: 8, upload: 2 },
  { time: '-50m', download: 12, upload: 3 },
  { time: '-40m', download: 9, upload: 2 },
  { time: '-30m', download: 15, upload: 4 },
  { time: '-20m', download: 11, upload: 3 },
  { time: '-10m', download: 13, upload: 3 },
  { time: 'now', download: 10, upload: 2 },
];

/** Heavy download burst — e.g., large file transfer or streaming */
const heavyDownloadData: TrafficDataPoint[] = [
  { time: '-1h', download: 22, upload: 5 },
  { time: '-50m', download: 45, upload: 6 },
  { time: '-40m', download: 380, upload: 8 },
  { time: '-30m', download: 720, upload: 10 },
  { time: '-20m', download: 850, upload: 12 },
  { time: '-10m', download: 940, upload: 11 },
  { time: 'now', download: 875, upload: 9 },
];

/** Symmetrical upload/download — typical for server or VPN endpoint */
const symmetricalData: TrafficDataPoint[] = [
  { time: '-1h', download: 120, upload: 115 },
  { time: '-50m', download: 135, upload: 128 },
  { time: '-40m', download: 118, upload: 120 },
  { time: '-30m', download: 142, upload: 138 },
  { time: '-20m', download: 128, upload: 125 },
  { time: '-10m', download: 155, upload: 148 },
  { time: 'now', download: 140, upload: 132 },
];

/** Gigabit saturation — enterprise / high-throughput router */
const gigabitData: TrafficDataPoint[] = [
  { time: '-1h', download: 650, upload: 220 },
  { time: '-50m', download: 820, upload: 340 },
  { time: '-40m', download: 960, upload: 410 },
  { time: '-30m', download: 1020, upload: 390 },
  { time: '-20m', download: 985, upload: 430 },
  { time: '-10m', download: 1100, upload: 460 },
  { time: 'now', download: 1050, upload: 440 },
];

/** Single data point — edge case with one sample */
const _singlePointData: TrafficDataPoint[] = [{ time: 'now', download: 55, upload: 18 }];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof TrafficChart> = {
  title: 'Patterns/DataDisplay/TrafficChart',
  component: TrafficChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
SVG line chart component for visualising download and upload bandwidth over time.

Built without a charting library dependency — uses hand-crafted SVG paths and gradients
to stay within the <3MB frontend bundle budget.

**Features:**
- Cyan download line / Purple upload line with area fill gradients
- Dashed grid lines at 25%, 50%, 75% of max value
- Data-point circles at each sample
- Current speed summary above the chart
- "Sample data" indicator when no real data is available (\`showPlaceholder\`)
- Fully responsive via \`viewBox\` / \`preserveAspectRatio="none"\`

## Usage

\`\`\`tsx
import { TrafficChart } from '@nasnet/ui/patterns';

<TrafficChart
  data={trafficHistory}
  title="WAN Traffic"
  height={120}
/>
\`\`\`
      `,
      },
    },
  },
  argTypes: {
    title: {
      description: 'Card title shown in the header.',
      control: 'text',
    },
    height: {
      description: 'Chart SVG height in pixels.',
      control: { type: 'range', min: 60, max: 300, step: 10 },
    },
    isLoading: {
      description: 'Show loading state (currently a no-op placeholder for future skeleton UI).',
      control: 'boolean',
    },
    showPlaceholder: {
      description:
        'When true and no `data` is provided, render built-in placeholder data with a "Sample data" badge.',
      control: 'boolean',
    },
    className: {
      description: 'Additional CSS classes on the wrapping Card.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrafficChart>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default render with built-in placeholder data.
 * Includes the "Sample data" badge to communicate the data is not live.
 */
export const Default: Story = {
  args: {
    title: 'Network Traffic',
    showPlaceholder: true,
    height: 120,
  },
};

/**
 * Quiet router: very low bandwidth — single-digit Mb/s values.
 */
export const QuietTraffic: Story = {
  args: {
    title: 'Quiet Router',
    data: quietTrafficData,
    height: 120,
  },
};

/**
 * Heavy download burst: download peaks at ~940 Mb/s.
 * Demonstrates the chart's Y-axis auto-scaling behaviour.
 */
export const HeavyDownloadBurst: Story = {
  args: {
    title: 'File Transfer in Progress',
    data: heavyDownloadData,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Download traffic peaks at nearly 1 Gb/s. Upload remains near baseline. Y-axis auto-scales to fit.',
      },
    },
  },
};

/**
 * Symmetrical traffic: upload and download are roughly equal.
 * Typical for a VPN endpoint or server hosting uploads.
 */
export const SymmetricalTraffic: Story = {
  args: {
    title: 'VPN Endpoint Traffic',
    data: symmetricalData,
    height: 120,
  },
};

/**
 * Gigabit link saturation: sustained multi-Gb/s throughput.
 * Bandwidth values exceed 1000 Mb/s so the formatter switches to "Gb/s".
 */
export const GigabitSaturation: Story = {
  args: {
    title: 'Core Switch — Gb/s Link',
    data: gigabitData,
    height: 140,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Values exceed 1000 Mb/s so the `formatBandwidth` helper renders them as Gb/s (e.g. "1.1 Gb/s").',
      },
    },
  },
};

/**
 * Tall chart: increased height for prominent hero placement.
 */
export const TallChart: Story = {
  args: {
    title: 'WAN Bandwidth — 24 h View',
    data: symmetricalData,
    height: 220,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Increasing `height` gives the chart more vertical resolution — suitable for a dashboard hero section.',
      },
    },
  },
};

/**
 * No data, placeholder disabled: empty chart body.
 */
export const EmptyNoPlaceholder: Story = {
  args: {
    title: 'WAN Traffic',
    data: [],
    showPlaceholder: false,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `data` is an empty array and `showPlaceholder` is false, the chart renders with no lines or data points.',
      },
    },
  },
};

/**
 * Live simulation: generates a new data point every 2 seconds.
 */
export const LiveSimulation: Story = {
  render: () => {
    function LiveDemo() {
      const [data, setData] = useState<TrafficDataPoint[]>([
        { time: '-6s', download: 60, upload: 20 },
        { time: '-4s', download: 72, upload: 25 },
        { time: '-2s', download: 65, upload: 22 },
        { time: 'now', download: 68, upload: 23 },
      ]);

      useEffect(() => {
        const id = setInterval(() => {
          setData((prev) => {
            const now = Date.now();
            const newPoint: TrafficDataPoint = {
              time: new Date(now).toLocaleTimeString('en', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              download: 40 + Math.random() * 60,
              upload: 10 + Math.random() * 40,
            };
            // Keep last 8 points
            const next = [...prev.slice(-7), newPoint];
            return next;
          });
        }, 2000);

        return () => clearInterval(id);
      }, []);

      return (
        <div className="w-[480px]">
          <p className="text-muted-foreground mb-2 text-xs">
            New data point added every 2 seconds — simulates live router telemetry.
          </p>
          <TrafficChart
            title="Live WAN Throughput"
            data={data}
            showPlaceholder={false}
            height={140}
          />
        </div>
      );
    }

    return <LiveDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a live streaming data source. A random data point is appended every 2 seconds and the oldest is dropped, keeping a sliding window of 8 samples.',
      },
    },
  },
};
