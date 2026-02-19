import { ResourceGauge } from './ResourceGauge';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof ResourceGauge> = {
  title: 'Patterns/ResourceGauge',
  component: ResourceGauge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A circular SVG gauge for displaying resource utilisation (CPU, Memory, Disk, etc.) with animated fill, a centred percentage label, and colour-coded status (healthy / warning / critical). Includes loading skeleton and optional subtitle.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['healthy', 'warning', 'critical'],
    },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    isLoading: { control: 'boolean' },
    label: { control: 'text' },
    subtitle: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceGauge>;

export const Default: Story = {
  args: {
    label: 'CPU',
    value: 34,
    status: 'healthy',
  },
};

export const HealthyMemory: Story = {
  args: {
    label: 'Memory',
    value: 48,
    status: 'healthy',
    subtitle: '24 MB / 50 MB',
  },
  parameters: {
    docs: {
      description: {
        story: 'Memory gauge in healthy range with a subtitle showing raw usage values.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    label: 'CPU',
    value: 72,
    status: 'warning',
    subtitle: 'High load',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning state (amber) triggered when utilisation is elevated but not yet critical.',
      },
    },
  },
};

export const Critical: Story = {
  args: {
    label: 'Disk',
    value: 94,
    status: 'critical',
    subtitle: '940 MB / 1 GB',
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical state (red) alerts the operator that the resource is near exhaustion.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    label: 'CPU',
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Skeleton placeholder rendered while resource data is being fetched.',
      },
    },
  },
};

export const TrioLayout: Story = {
  render: () => (
    <div className="flex gap-4">
      <ResourceGauge label="CPU" value={34} status="healthy" subtitle="4 cores" />
      <ResourceGauge label="Memory" value={72} status="warning" subtitle="36 MB / 50 MB" />
      <ResourceGauge label="Disk" value={91} status="critical" subtitle="910 MB / 1 GB" />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Typical dashboard trio showing CPU (healthy), Memory (warning), and Disk (critical) side-by-side as they appear on the router health summary card.',
      },
    },
  },
};
