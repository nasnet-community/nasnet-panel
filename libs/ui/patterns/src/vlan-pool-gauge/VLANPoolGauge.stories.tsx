import { VLANPoolGauge } from './VLANPoolGauge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VLANPoolGauge> = {
  title: 'Patterns/VLAN/VLANPoolGauge',
  component: VLANPoolGauge,
  tags: ['autodocs'],
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
};
