/**
 * Storybook stories for StatsCounter
 *
 * StatsCounter is a purely presentational component that accepts a string
 * value, a label, and an optional unit type, then formats and renders the
 * value with a subtle opacity animation when it changes.
 *
 * The three unit modes are:
 * - bytes   → formatted as KB / MB / GB / TB (BigInt-aware)
 * - packets → formatted with thousand-separator commas
 * - count   → formatted with thousand-separator commas
 */

import { StatsCounter } from './stats-counter';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StatsCounter> = {
  title: 'Features/Network/InterfaceStats/StatsCounter',
  component: StatsCounter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**StatsCounter** renders a single labelled statistic value.

It is designed for use inside the Interface Statistics Panel where multiple
counters (TX bytes, RX bytes, TX packets, RX packets, errors) are displayed
side-by-side in a grid.

### Formatting rules

| \`unit\` | Input example | Rendered output |
|---------|--------------|-----------------|
| \`bytes\` (default) | \`"1234567890"\` | \`1.15 GB\` |
| \`bytes\` | \`"0"\` | \`0 B\` |
| \`packets\` | \`"42000"\` | \`42,000\` |
| \`count\` | \`"9876543"\` | \`9,876,543\` |

### Animation
When \`value\` changes the displayed number briefly drops to **70% opacity**
for 50 ms then transitions back – giving the user a visual cue that the
counter has updated.
        `,
      },
    },
  },
  argTypes: {
    unit: {
      control: 'select',
      options: ['bytes', 'packets', 'count'],
    },
    value: { control: 'text' },
    label: { control: 'text' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof StatsCounter>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default – bytes unit formatting. Shows a realistic multi-gigabyte TX total
 * as would appear in a long-running WAN interface panel.
 */
export const Default: Story = {
  args: {
    value: '5368709120',
    label: 'TX Bytes',
    unit: 'bytes',
  },
};

/**
 * Zero bytes – the empty / initial state before any traffic has been counted.
 */
export const ZeroBytes: Story = {
  args: {
    value: '0',
    label: 'RX Bytes',
    unit: 'bytes',
  },
};

/**
 * Small kilobyte-range value – ensures the KB unit tier is exercised.
 */
export const KilobyteRange: Story = {
  args: {
    value: '65536',
    label: 'TX Bytes',
    unit: 'bytes',
  },
};

/**
 * Packet counter – large number formatted with thousand separators.
 */
export const PacketCount: Story = {
  args: {
    value: '9876543',
    label: 'TX Packets',
    unit: 'packets',
  },
};

/**
 * Error count using the \`count\` unit – displayed with commas but semantically
 * distinct from packet counters.
 */
export const ErrorCount: Story = {
  args: {
    value: '142',
    label: 'TX Errors',
    unit: 'count',
  },
};

/**
 * Zero errors – the happy-path state where an interface has no errors.
 * The parent panel typically colours this in muted-foreground.
 */
export const ZeroErrors: Story = {
  args: {
    value: '0',
    label: 'RX Errors',
    unit: 'count',
  },
};

/**
 * A grid of four counters laid out side-by-side, mirroring how they appear
 * inside the real InterfaceStatsPanel component.
 */
export const StatsGrid: Story = {
  render: () => (
    <div className="gap-component-lg bg-card p-component-lg grid grid-cols-2 rounded-md border shadow-sm">
      <StatsCounter
        value="5368709120"
        label="TX Bytes"
        unit="bytes"
      />
      <StatsCounter
        value="10737418240"
        label="RX Bytes"
        unit="bytes"
      />
      <StatsCounter
        value="3145728"
        label="TX Packets"
        unit="packets"
      />
      <StatsCounter
        value="6291456"
        label="RX Packets"
        unit="packets"
      />
    </div>
  ),
  args: {},
};
