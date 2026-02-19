/**
 * Storybook stories for CPUBreakdownModal
 * Accessible modal dialog showing per-core CPU usage as horizontal bars
 *
 * AC 5.2.4: Click CPU gauge to see breakdown of usage per core
 */

import { CPUBreakdownModal } from './CPUBreakdownModal';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CPUBreakdownModal> = {
  title: 'Features/Dashboard/CPUBreakdownModal',
  component: CPUBreakdownModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal dialog that displays per-core CPU usage as colour-coded horizontal bars. ' +
          'Triggered by clicking the CPU CircularGauge. Each core bar uses the same semantic ' +
          'thresholds as the gauge: green (<70%), amber (70-89%), red (≥90%). ' +
          'Fully keyboard-accessible with focus trap and ESC-to-close.',
      },
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls dialog open/closed state',
    },
    overallUsage: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Overall CPU usage percentage displayed in the summary header',
    },
    frequency: {
      control: { type: 'number' },
      description: 'CPU frequency in MHz. When provided it is shown as GHz in the summary.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CPUBreakdownModal>;

/**
 * Default open state — healthy 4-core router running at moderate load.
 */
export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 42,
    perCoreUsage: [38, 45, 40, 43],
    frequency: 880,
  },
  parameters: {
    docs: {
      description: {
        story: 'Four-core router at healthy load. All bars render in success green.',
      },
    },
  },
};

/**
 * Warning state — several cores above 70% but none critical.
 */
export const Warning: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 75,
    perCoreUsage: [70, 78, 75, 77],
    frequency: 880,
  },
  parameters: {
    docs: {
      description: {
        story: 'Cores between 70-89%. Bars render in warning amber.',
      },
    },
  },
};

/**
 * Critical state — cores at or near maximum load.
 */
export const Critical: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 94,
    perCoreUsage: [93, 95, 97, 91],
    frequency: 880,
  },
  parameters: {
    docs: {
      description: {
        story: 'Cores ≥90% render in error red. Router may need load-shedding.',
      },
    },
  },
};

/**
 * Mixed state — demonstrates per-core colour differentiation when cores vary.
 */
export const MixedLoad: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 68,
    perCoreUsage: [30, 72, 91, 45],
    frequency: 1200,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Core 1 is healthy (green), Core 2 is in warning (amber), Core 3 is critical (red), Core 4 is healthy (green). ' +
          'Illustrates per-core colour-coding when load is uneven.',
      },
    },
  },
};

/**
 * Single-core router — common on entry-level MikroTik hardware.
 */
export const SingleCore: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 58,
    perCoreUsage: [58],
    frequency: 650,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single-core device — header label reads "1 core" and only one bar is shown.',
      },
    },
  },
};

/**
 * No frequency — when the router does not expose CPU clock information.
 */
export const NoFrequency: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    overallUsage: 35,
    perCoreUsage: [32, 36, 38, 34],
  },
  parameters: {
    docs: {
      description: {
        story: 'frequency prop omitted. The GHz label in the summary header is hidden.',
      },
    },
  },
};
