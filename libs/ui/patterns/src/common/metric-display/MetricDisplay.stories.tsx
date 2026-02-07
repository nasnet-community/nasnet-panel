/**
 * MetricDisplay Stories
 *
 * Storybook stories for the MetricDisplay pattern component.
 */

import { Cpu, HardDrive, Wifi, Activity, Thermometer, Zap } from 'lucide-react';

import { MetricDisplay } from './MetricDisplay';
import { MetricDisplayDesktop } from './MetricDisplay.Desktop';
import { MetricDisplayMobile } from './MetricDisplay.Mobile';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MetricDisplay> = {
  title: 'Patterns/Common/MetricDisplay',
  component: MetricDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A metric display component for showing KPIs, statistics, and measurements. Implements the Headless + Platform Presenter pattern (ADR-018).',
      },
    },
  },
  argTypes: {
    label: {
      description: 'Metric label/title',
      control: 'text',
    },
    value: {
      description: 'Current metric value',
      control: 'text',
    },
    unit: {
      description: 'Optional unit (e.g., MB, %, ms)',
      control: 'text',
    },
    trend: {
      description: 'Trend direction',
      control: 'select',
      options: ['up', 'down', 'stable', undefined],
    },
    trendValue: {
      description: 'Trend value text',
      control: 'text',
    },
    variant: {
      description: 'Semantic color variant',
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
    size: {
      description: 'Size variant',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      description: 'Loading state',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MetricDisplay>;

/**
 * Default metric display
 */
export const Default: Story = {
  args: {
    label: 'CPU Usage',
    value: 45,
    unit: '%',
  },
};

/**
 * With icon and trend indicator
 */
export const WithIconAndTrend: Story = {
  args: {
    label: 'Memory Usage',
    value: 2.4,
    unit: 'GB',
    icon: HardDrive,
    trend: 'up',
    trendValue: '+256 MB',
    variant: 'warning',
  },
};

/**
 * Success variant for healthy metrics
 */
export const SuccessVariant: Story = {
  args: {
    label: 'Network Uptime',
    value: 99.9,
    unit: '%',
    icon: Wifi,
    variant: 'success',
    trend: 'stable',
    trendValue: '0%',
    description: 'Last 30 days',
  },
};

/**
 * Error variant for critical metrics
 */
export const ErrorVariant: Story = {
  args: {
    label: 'Temperature',
    value: 92,
    unit: '°C',
    icon: Thermometer,
    variant: 'error',
    trend: 'up',
    trendValue: '+12°C',
    description: 'Critical threshold exceeded',
  },
};

/**
 * Interactive metric that navigates on click
 */
export const Interactive: Story = {
  args: {
    label: 'Active Connections',
    value: 127,
    icon: Activity,
    variant: 'info',
    onClick: () => alert('Navigating to connections page'),
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    label: 'Bandwidth',
    value: 0,
    isLoading: true,
  },
};

/**
 * Small size variant
 */
export const SmallSize: Story = {
  args: {
    label: 'Packets',
    value: '1.2M',
    size: 'sm',
    icon: Zap,
  },
};

/**
 * Large size variant for hero metrics
 */
export const LargeSize: Story = {
  args: {
    label: 'Total Data',
    value: 847,
    unit: 'GB',
    size: 'lg',
    icon: HardDrive,
    trend: 'up',
    trendValue: '+23 GB today',
  },
};

/**
 * Mobile presenter directly
 */
export const MobilePresenter: Story = {
  render: (args) => <MetricDisplayMobile {...args} />,
  args: {
    label: 'CPU Usage',
    value: 78,
    unit: '%',
    icon: Cpu,
    variant: 'warning',
    trend: 'up',
    trendValue: '+5%',
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Desktop presenter directly
 */
export const DesktopPresenter: Story = {
  render: (args) => <MetricDisplayDesktop {...args} />,
  args: {
    label: 'Memory',
    value: 3.2,
    unit: 'GB',
    icon: HardDrive,
    variant: 'default',
    description: 'Available: 8 GB total',
  },
};

/**
 * Grid of metrics
 */
export const MetricsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricDisplay label="CPU" value={45} unit="%" icon={Cpu} variant="default" />
      <MetricDisplay
        label="Memory"
        value={2.4}
        unit="GB"
        icon={HardDrive}
        variant="warning"
        trend="up"
        trendValue="+10%"
      />
      <MetricDisplay
        label="Network"
        value={125}
        unit="Mbps"
        icon={Wifi}
        variant="success"
      />
      <MetricDisplay
        label="Temp"
        value={68}
        unit="°C"
        icon={Thermometer}
        variant="default"
        trend="down"
        trendValue="-3°C"
      />
    </div>
  ),
};
