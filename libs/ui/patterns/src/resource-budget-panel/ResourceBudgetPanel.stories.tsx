/**
 * ResourceBudgetPanel Storybook Stories
 *
 * Comprehensive stories demonstrating all ResourceBudgetPanel states and scenarios.
 */

import type { Meta, StoryObj } from '@storybook/react';

import { ResourceBudgetPanel } from './ResourceBudgetPanel';
import type { ServiceInstanceResource, SystemResourceTotals } from './types';

const meta: Meta<typeof ResourceBudgetPanel> = {
  title: 'Patterns/ResourceBudgetPanel',
  component: ResourceBudgetPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ResourceBudgetPanel displays system-wide and per-instance resource budgets.

**Features:**
- System totals overview with usage bar and instance counts
- Per-instance breakdown with sortable columns
- Threshold-based status indicators
- Mobile: Card-based layout with collapsible details
- Desktop: Dense data table with inline usage bars
- WCAG AAA accessible

**Use Cases:**
- Resource monitoring dashboard
- Service instance management
- Pre-flight resource checking
- Capacity planning
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showSystemTotals: {
      control: 'boolean',
      description: 'Whether to show system totals section',
    },
    enableSorting: {
      control: 'boolean',
      description: 'Whether to enable column sorting',
    },
    showOnlyRunning: {
      control: 'boolean',
      description: 'Whether to show only running instances',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether data is currently loading',
    },
    variant: {
      control: 'select',
      options: ['mobile', 'desktop', undefined],
      description: 'Force a specific platform variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceBudgetPanel>;

// ===== Mock Data =====

const emptySystemTotals: SystemResourceTotals = {
  totalMemoryUsed: 0,
  totalMemoryAvailable: 1024,
  runningInstances: 0,
  stoppedInstances: 0,
};

const fewInstancesData: ServiceInstanceResource[] = [
  {
    id: '1',
    name: 'Tor',
    memoryUsed: 64,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 15,
  },
  {
    id: '2',
    name: 'Xray-core',
    memoryUsed: 96,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 28,
  },
  {
    id: '3',
    name: 'AdGuard Home',
    memoryUsed: 80,
    memoryLimit: 100,
    status: 'stopped',
  },
];

const fewInstancesSystemTotals: SystemResourceTotals = {
  totalMemoryUsed: 160,
  totalMemoryAvailable: 1024,
  runningInstances: 2,
  stoppedInstances: 1,
};

const manyInstancesData: ServiceInstanceResource[] = [
  {
    id: '1',
    name: 'Xray-core',
    memoryUsed: 128,
    memoryLimit: 256,
    status: 'running',
    cpuUsage: 35,
  },
  {
    id: '2',
    name: 'Tor',
    memoryUsed: 96,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 22,
  },
  {
    id: '3',
    name: 'sing-box',
    memoryUsed: 112,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 40,
  },
  {
    id: '4',
    name: 'AdGuard Home',
    memoryUsed: 80,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 18,
  },
  {
    id: '5',
    name: 'MTProxy',
    memoryUsed: 48,
    memoryLimit: 64,
    status: 'running',
    cpuUsage: 12,
  },
  {
    id: '6',
    name: 'Psiphon',
    memoryUsed: 32,
    memoryLimit: 64,
    status: 'stopped',
  },
  {
    id: '7',
    name: 'Shadowsocks',
    memoryUsed: 24,
    memoryLimit: 64,
    status: 'stopped',
  },
  {
    id: '8',
    name: 'V2Ray',
    memoryUsed: 64,
    memoryLimit: 128,
    status: 'pending',
  },
];

const manyInstancesSystemTotals: SystemResourceTotals = {
  totalMemoryUsed: 584,
  totalMemoryAvailable: 1024,
  runningInstances: 5,
  stoppedInstances: 2,
};

const mixedStatusData: ServiceInstanceResource[] = [
  {
    id: '1',
    name: 'Critical Service',
    memoryUsed: 122,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 95,
  },
  {
    id: '2',
    name: 'Warning Service',
    memoryUsed: 90,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 65,
  },
  {
    id: '3',
    name: 'Normal Service',
    memoryUsed: 64,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 25,
  },
  {
    id: '4',
    name: 'Idle Service',
    memoryUsed: 2,
    memoryLimit: 128,
    status: 'running',
    cpuUsage: 1,
  },
  {
    id: '5',
    name: 'Error Service',
    memoryUsed: 0,
    memoryLimit: 128,
    status: 'error',
  },
];

const mixedStatusSystemTotals: SystemResourceTotals = {
  totalMemoryUsed: 278,
  totalMemoryAvailable: 512,
  runningInstances: 4,
  stoppedInstances: 1,
};

// ===== Stories =====

/**
 * Empty State
 * No service instances
 */
export const Empty: Story = {
  args: {
    instances: [],
    systemTotals: emptySystemTotals,
    showSystemTotals: true,
  },
};

/**
 * Few Services
 * Typical usage with a few service instances
 */
export const FewServices: Story = {
  args: {
    instances: fewInstancesData,
    systemTotals: fewInstancesSystemTotals,
    showSystemTotals: true,
    enableSorting: true,
  },
};

/**
 * Many Services
 * Shows scrollable list with many instances
 */
export const ManyServices: Story = {
  args: {
    instances: manyInstancesData,
    systemTotals: manyInstancesSystemTotals,
    showSystemTotals: true,
    enableSorting: true,
  },
};

/**
 * Mixed Status
 * Shows all threshold statuses (idle, normal, warning, critical, danger, error)
 */
export const MixedStatus: Story = {
  args: {
    instances: mixedStatusData,
    systemTotals: mixedStatusSystemTotals,
    showSystemTotals: true,
    enableSorting: true,
  },
};

/**
 * Show Only Running
 * Filters to show only running instances
 */
export const ShowOnlyRunning: Story = {
  args: {
    instances: manyInstancesData,
    systemTotals: manyInstancesSystemTotals,
    showSystemTotals: true,
    showOnlyRunning: true,
  },
};

/**
 * Hide System Totals
 * Shows only the instance table without system overview
 */
export const HideSystemTotals: Story = {
  args: {
    instances: fewInstancesData,
    systemTotals: fewInstancesSystemTotals,
    showSystemTotals: false,
  },
};

/**
 * Loading State
 * Shows loading message while data is being fetched
 */
export const Loading: Story = {
  args: {
    instances: [],
    systemTotals: emptySystemTotals,
    isLoading: true,
  },
};

/**
 * Custom Empty Message
 * Shows custom empty state message
 */
export const CustomEmptyMessage: Story = {
  args: {
    instances: [],
    systemTotals: emptySystemTotals,
    emptyMessage: 'No services are currently deployed',
  },
};

/**
 * Mobile Variant
 * Forces mobile presentation (card-based layout)
 */
export const MobileVariant: Story = {
  args: {
    instances: fewInstancesData,
    systemTotals: fewInstancesSystemTotals,
    variant: 'mobile',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Desktop Variant
 * Forces desktop presentation (table layout)
 */
export const DesktopVariant: Story = {
  args: {
    instances: fewInstancesData,
    systemTotals: fewInstancesSystemTotals,
    variant: 'desktop',
  },
};

/**
 * Interactive Example
 * Shows instance click handler
 */
export const Interactive: Story = {
  args: {
    instances: fewInstancesData,
    systemTotals: fewInstancesSystemTotals,
    onInstanceClick: (instance) => {
      alert(`Clicked: ${instance.name}`);
    },
  },
};

/**
 * High Memory Usage
 * System approaching capacity
 */
export const HighMemoryUsage: Story = {
  args: {
    instances: [
      {
        id: '1',
        name: 'Heavy Service A',
        memoryUsed: 256,
        memoryLimit: 300,
        status: 'running',
        cpuUsage: 75,
      },
      {
        id: '2',
        name: 'Heavy Service B',
        memoryUsed: 220,
        memoryLimit: 256,
        status: 'running',
        cpuUsage: 68,
      },
      {
        id: '3',
        name: 'Heavy Service C',
        memoryUsed: 200,
        memoryLimit: 256,
        status: 'running',
        cpuUsage: 82,
      },
    ],
    systemTotals: {
      totalMemoryUsed: 676,
      totalMemoryAvailable: 768,
      runningInstances: 3,
      stoppedInstances: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'System at 88% memory usage (critical threshold)',
      },
    },
  },
};
