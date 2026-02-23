import { VLANPoolGauge } from './VLANPoolGauge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VLANPoolGauge> = {
  title: 'Patterns/VLAN/VLANPoolGauge',
  component: VLANPoolGauge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Circular progress indicator for VLAN pool utilization with color-coded feedback. Green (<70%), Amber (70-90%), Red (>90%). Automatically adapts to platform: larger on mobile, compact on desktop.',
      },
    },
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 1, max: 4094 },
      description: 'Total number of VLANs in pool',
    },
    allocated: {
      control: { type: 'number', min: 0, max: 4094 },
      description: 'Number of allocated VLANs',
    },
    shouldWarn: {
      control: 'boolean',
      description: 'Whether to show warning indicator (>80% utilization)',
    },
    className: {
      control: 'text',
      description: 'Optional additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VLANPoolGauge>;

/**
 * Low utilization (<70%) - Green indicator
 */
export const LowUtilization: Story = {
  args: {
    total: 1000,
    allocated: 450,
    shouldWarn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Green indicator showing healthy VLAN pool utilization at 45%.',
      },
    },
  },
};

/**
 * Medium utilization (70-90%) - Amber indicator
 */
export const MediumUtilization: Story = {
  args: {
    total: 1000,
    allocated: 750,
    shouldWarn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Amber indicator showing moderate VLAN pool utilization at 75%.',
      },
    },
  },
};

/**
 * High utilization (>90%) - Red indicator
 */
export const HighUtilization: Story = {
  args: {
    total: 1000,
    allocated: 920,
    shouldWarn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Red indicator showing critical VLAN pool utilization at 92%.',
      },
    },
  },
};

/**
 * Critical with warning (>80% utilization)
 */
export const CriticalWithWarning: Story = {
  args: {
    total: 1000,
    allocated: 850,
    shouldWarn: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Amber indicator at 85% with warning flag for proactive notification.',
      },
    },
  },
};

/**
 * Near full capacity
 */
export const NearFull: Story = {
  args: {
    total: 1000,
    allocated: 985,
    shouldWarn: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical red indicator at 98.5% with warning flag — immediate action needed.',
      },
    },
  },
};

/**
 * Empty pool
 */
export const Empty: Story = {
  args: {
    total: 1000,
    allocated: 0,
    shouldWarn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Green indicator showing no allocated VLANs.',
      },
    },
  },
};

/**
 * Small pool
 */
export const SmallPool: Story = {
  args: {
    total: 100,
    allocated: 75,
    shouldWarn: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Smaller pool example at 75% utilization.',
      },
    },
  },
};
