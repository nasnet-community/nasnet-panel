/**
 * Storybook stories for CircularGauge
 * SVG-based circular progress indicator with threshold-based coloring
 *
 * AC 5.2.3: Colors change based on configurable thresholds
 */

import { CircularGauge } from './CircularGauge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CircularGauge> = {
  title: 'Features/Dashboard/CircularGauge',
  component: CircularGauge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'SVG-based circular progress gauge with semantic threshold coloring (green/amber/red). ' +
          'Supports three sizes (sm/md/lg), optional click interaction, and full WCAG AAA accessibility ' +
          'via ARIA meter role. Color transitions at configurable warning (default 70%) and critical (default 90%) thresholds.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current value (0-100)',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Gauge diameter: sm=80px, md=120px, lg=160px',
    },
    label: {
      control: 'text',
      description: 'Primary label displayed below the gauge',
    },
    sublabel: {
      control: 'text',
      description: 'Optional secondary label (e.g. core count or capacity)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CircularGauge>;

/**
 * Normal / healthy state — value is below the warning threshold.
 * The progress ring renders in semantic green.
 */
export const Healthy: Story = {
  args: {
    value: 42,
    label: 'CPU',
    sublabel: '4 cores',
    thresholds: { warning: 70, critical: 90 },
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Value below the warning threshold. Ring renders in success green.',
      },
    },
  },
};

/**
 * Warning state — value is between the warning and critical thresholds.
 * The progress ring renders in semantic amber.
 */
export const Warning: Story = {
  args: {
    value: 78,
    label: 'Memory',
    sublabel: '200 MB / 256 MB',
    thresholds: { warning: 70, critical: 90 },
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Value between warning and critical thresholds. Ring renders in warning amber.',
      },
    },
  },
};

/**
 * Critical state — value exceeds the critical threshold.
 * The progress ring renders in semantic red and should prompt immediate action.
 */
export const Critical: Story = {
  args: {
    value: 95,
    label: 'Storage',
    sublabel: '15.2 MB / 16 MB',
    thresholds: { warning: 70, critical: 90 },
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Value above the critical threshold. Ring renders in error red.',
      },
    },
  },
};

/**
 * All three supported sizes side by side for comparison.
 * sm = 80px, md = 120px, lg = 160px diameter.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-component-xl">
      <CircularGauge value={55} label="Small" size="sm" thresholds={{ warning: 70, critical: 90 }} />
      <CircularGauge value={55} label="Medium" size="md" thresholds={{ warning: 70, critical: 90 }} />
      <CircularGauge value={55} label="Large" size="lg" thresholds={{ warning: 70, critical: 90 }} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compares all three size variants (sm / md / lg) at the same value.',
      },
    },
  },
};

/**
 * Clickable gauge — renders as a <button> element with hover and focus styles.
 * Used for the CPU core breakdown interaction (AC 5.2.4).
 */
export const Clickable: Story = {
  args: {
    value: 67,
    label: 'CPU',
    sublabel: 'Click for details',
    size: 'md',
    thresholds: { warning: 70, critical: 90 },
    onClick: () => alert('Gauge clicked — open CPU breakdown modal'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When an onClick handler is provided the gauge renders as a focusable button with hover opacity and a 3px focus ring.',
      },
    },
  },
};

/**
 * Edge cases — 0% (empty) and 100% (full capacity).
 */
export const EdgeCases: Story = {
  render: () => (
    <div className="flex items-end gap-component-xl">
      <CircularGauge value={0} label="Idle" sublabel="0%" size="md" thresholds={{ warning: 70, critical: 90 }} />
      <CircularGauge
        value={100}
        label="Full"
        sublabel="100%"
        size="md"
        thresholds={{ warning: 70, critical: 90 }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Boundary values: 0% (completely empty ring) and 100% (completely filled ring at critical color).',
      },
    },
  },
};
