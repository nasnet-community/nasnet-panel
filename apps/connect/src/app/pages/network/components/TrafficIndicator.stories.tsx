/**
 * TrafficIndicator Stories
 *
 * Inline traffic visualisation showing cumulative RX/TX byte totals with optional
 * live per-second rates. Two layout modes: standard (progress bars) and compact (one-liner).
 * Prop-driven — no stores or routing required.
 */

import { TrafficIndicator } from './TrafficIndicator';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof TrafficIndicator> = {
  title: 'App/Network/TrafficIndicator',
  component: TrafficIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact inline traffic visualiser for a single network interface. ' +
          'Standard mode renders two rows (RX in green, TX in purple) each with a thin progress bar ' +
          'and optional live rate. ' +
          'Compact mode collapses both into a single icon-prefixed line for use inside table cells or cards. ' +
          '`showLabels` adds "RX" / "TX" text labels next to the direction icons.',
      },
    },
  },
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'Collapses to a single-line icon+byte display when true',
    },
    showLabels: {
      control: 'boolean',
      description: 'Show "RX" / "TX" text labels next to direction icons (standard mode only)',
    },
    txBytes: { control: 'number' },
    rxBytes: { control: 'number' },
    txRate: { control: 'number' },
    rxRate: { control: 'number' },
    className: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TrafficIndicator>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    rxBytes: 1_073_741_824,  // 1 GiB
    txBytes: 268_435_456,    // 256 MiB
    compact: false,
    showLabels: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard two-row layout without live rates. RX and TX progress bars fill the full width ' +
          'since there is no relative maximum — the bar always renders at 100% as a colour accent.',
      },
    },
  },
};

export const WithLiveRates: Story = {
  args: {
    rxBytes: 1_073_741_824,  // 1 GiB cumulative
    txBytes: 268_435_456,    // 256 MiB cumulative
    rxRate: 5_242_880,       // 5 MiB/s live
    txRate: 1_048_576,       // 1 MiB/s live
    compact: false,
    showLabels: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard mode with live per-second rates shown in coloured text beneath each cumulative total. ' +
          'RX rate in emerald, TX rate in purple.',
      },
    },
  },
};

export const WithLabels: Story = {
  args: {
    rxBytes: 536_870_912,    // 512 MiB
    txBytes: 134_217_728,    // 128 MiB
    rxRate: 2_097_152,       // 2 MiB/s
    txRate: 524_288,         // 512 KiB/s
    compact: false,
    showLabels: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '"RX" and "TX" text labels appear next to the arrow icons. ' +
          'Useful when the component is displayed standalone rather than inside a labelled table.',
      },
    },
  },
};

export const Compact: Story = {
  args: {
    rxBytes: 314_572_800,    // ~300 MB
    txBytes: 52_428_800,     // ~50 MB
    compact: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact mode: both directions collapsed into a single line with arrow icons and byte totals. ' +
          'Intended for use inside interface list rows or narrow cards.',
      },
    },
  },
};

export const HighTraffic: Story = {
  args: {
    rxBytes: 10_737_418_240, // 10 GiB
    txBytes: 5_368_709_120,  // 5 GiB
    rxRate: 104_857_600,     // 100 MiB/s
    txRate: 52_428_800,      // 50 MiB/s
    compact: false,
    showLabels: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Heavy traffic scenario — verifies `formatBytes` renders GiB values correctly and ' +
          'that high rates do not overflow or misalign the layout.',
      },
    },
  },
};

export const LowTraffic: Story = {
  args: {
    rxBytes: 4096,
    txBytes: 2048,
    rxRate: 128,
    txRate: 64,
    compact: false,
    showLabels: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Near-zero traffic (e.g. loopback or idle interface). ' +
          'Checks that very small byte values display correctly without rounding to "0 B".',
      },
    },
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
