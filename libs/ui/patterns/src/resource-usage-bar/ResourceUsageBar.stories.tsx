/**
 * ResourceUsageBar Storybook Stories
 *
 * Comprehensive stories demonstrating all ResourceUsageBar states and variants.
 */

import { ResourceUsageBar } from './ResourceUsageBar';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ResourceUsageBar> = {
  title: 'Patterns/ResourceUsageBar',
  component: ResourceUsageBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ResourceUsageBar displays resource usage (memory, CPU, disk, etc.) with threshold-based color coding.

**Features:**
- Platform-adaptive presentation (mobile vs desktop)
- Threshold-based status colors (idle, normal, warning, critical, danger)
- WCAG AAA accessible (7:1 contrast, progressbar role)
- Icon + color indicators (not color alone)
- Customizable thresholds

**Default Thresholds:**
- 0% = idle (gray)
- <60% = normal (green)
- 60-79% = warning (amber)
- 80-94% = critical (orange)
- ≥95% = danger (red)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    used: {
      control: { type: 'number', min: 0, max: 2048, step: 16 },
      description: 'Current resource usage value',
    },
    total: {
      control: { type: 'number', min: 0, max: 2048, step: 16 },
      description: 'Maximum resource capacity',
    },
    resourceType: {
      control: 'select',
      options: ['memory', 'cpu', 'disk', 'network', 'custom'],
      description: 'Resource type (affects icon and label)',
    },
    label: {
      control: 'text',
      description: 'Custom label (overrides resourceType label)',
    },
    unit: {
      control: 'text',
      description: 'Unit of measurement',
    },
    showValues: {
      control: 'boolean',
      description: 'Show numeric values',
    },
    showPercentage: {
      control: 'boolean',
      description: 'Show percentage text',
    },
    variant: {
      control: 'select',
      options: ['mobile', 'desktop', undefined],
      description: 'Force a specific platform variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceUsageBar>;

/**
 * Idle state (0% usage)
 * Gray color indicates no resource usage
 */
export const Idle: Story = {
  args: {
    used: 0,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Normal state (<60% usage)
 * Green color indicates healthy resource usage
 */
export const Normal: Story = {
  args: {
    used: 512,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Warning state (60-79% usage)
 * Amber color indicates elevated resource usage
 */
export const Warning: Story = {
  args: {
    used: 700,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Critical state (80-94% usage)
 * Orange color indicates high resource usage
 */
export const Critical: Story = {
  args: {
    used: 900,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Danger state (≥95% usage)
 * Red color indicates resource exhaustion
 */
export const Danger: Story = {
  args: {
    used: 1000,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * CPU Resource Type
 * Shows CPU usage with percentage unit
 */
export const CPUResource: Story = {
  args: {
    used: 75,
    total: 100,
    resourceType: 'cpu',
    unit: '%',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Disk Resource Type
 * Shows disk usage in GB
 */
export const DiskResource: Story = {
  args: {
    used: 450,
    total: 500,
    resourceType: 'disk',
    unit: 'GB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Custom Label
 * Shows usage with a custom label
 */
export const CustomLabel: Story = {
  args: {
    used: 256,
    total: 512,
    label: 'Container Memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * Custom Thresholds
 * Demonstrates custom threshold configuration
 */
export const CustomThresholds: Story = {
  args: {
    used: 60,
    total: 100,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: true,
    thresholds: {
      normal: 50,
      warning: 70,
      critical: 90,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom thresholds: normal <50%, warning 50-69%, critical 70-89%, danger ≥90%',
      },
    },
  },
};

/**
 * Percentage Only
 * Shows only the percentage without numeric values
 */
export const PercentageOnly: Story = {
  args: {
    used: 768,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: false,
    showPercentage: true,
  },
};

/**
 * Values Only
 * Shows numeric values without percentage
 */
export const ValuesOnly: Story = {
  args: {
    used: 384,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    showValues: true,
    showPercentage: false,
  },
};

/**
 * Mobile Variant
 * Forces mobile presentation (vertical layout, 44px touch targets)
 */
export const MobileVariant: Story = {
  args: {
    used: 700,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    variant: 'mobile',
    showValues: true,
    showPercentage: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Desktop Variant
 * Forces desktop presentation (horizontal layout, compact)
 */
export const DesktopVariant: Story = {
  args: {
    used: 700,
    total: 1024,
    resourceType: 'memory',
    unit: 'MB',
    variant: 'desktop',
    showValues: true,
    showPercentage: true,
  },
};

/**
 * All Status States
 * Shows all threshold states side by side
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Idle (0%)</h3>
        <ResourceUsageBar
          used={0}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Normal (50%)</h3>
        <ResourceUsageBar
          used={512}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Warning (68%)</h3>
        <ResourceUsageBar
          used={700}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Critical (88%)</h3>
        <ResourceUsageBar
          used={900}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Danger (98%)</h3>
        <ResourceUsageBar
          used={1000}
          total={1024}
          resourceType="memory"
          unit="MB"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all threshold states',
      },
    },
  },
};

/**
 * Multiple Resources
 * Real-world example showing multiple resource types
 */
export const MultipleResources: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <ResourceUsageBar
        used={768}
        total={1024}
        resourceType="memory"
        unit="MB"
      />
      <ResourceUsageBar
        used={45}
        total={100}
        resourceType="cpu"
        unit="%"
      />
      <ResourceUsageBar
        used={120}
        total={500}
        resourceType="disk"
        unit="GB"
      />
      <ResourceUsageBar
        used={850}
        total={1000}
        resourceType="network"
        unit="Mbps"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world example with multiple resource types',
      },
    },
  },
};
