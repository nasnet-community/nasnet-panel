/**
 * ResourceGauges Storybook Stories
 * Visual documentation and testing for resource utilization display
 * Story 5.2: Real-Time Resource Utilization Display
 */

import { useState } from 'react';

import { MockedProvider } from '@apollo/client/testing';

import { CircularGauge } from './CircularGauge';
import { CPUBreakdownModal } from './CPUBreakdownModal';
import { ResourceGauges } from './ResourceGauges';
import { GET_RESOURCE_METRICS } from './useResourceMetrics';

import type { Meta, StoryObj } from '@storybook/react';


// Mock data for various states
const healthyMetrics = {
  cpu: { usage: 35, cores: 4, perCore: [30, 35, 40, 35], frequency: 880 },
  memory: { used: 134217728, total: 268435456, percentage: 50 },
  storage: { used: 4194304, total: 16777216, percentage: 25 },
  temperature: 50,
  timestamp: new Date().toISOString(),
};

const warningMetrics = {
  cpu: { usage: 75, cores: 4, perCore: [70, 75, 80, 75], frequency: 880 },
  memory: { used: 226492416, total: 268435456, percentage: 85 },
  storage: { used: 15099494, total: 16777216, percentage: 90 },
  temperature: 65,
  timestamp: new Date().toISOString(),
};

const criticalMetrics = {
  cpu: { usage: 95, cores: 4, perCore: [93, 95, 97, 95], frequency: 880 },
  memory: { used: 255066522, total: 268435456, percentage: 95 },
  storage: { used: 16104546, total: 16777216, percentage: 96 },
  temperature: 78,
  timestamp: new Date().toISOString(),
};

const noTemperatureMetrics = {
  ...healthyMetrics,
  temperature: null,
};

const meta = {
  title: 'Dashboard/ResourceGauges',
  component: ResourceGauges,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResourceGauges>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story 1: Default (Healthy) State
export const Default: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => {
      const mocks = [
        {
          request: {
            query: GET_RESOURCE_METRICS,
            variables: { deviceId: 'router-1' },
          },
          result: {
            data: {
              device: {
                resourceMetrics: healthyMetrics,
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

// Story 2: Warning State (AC 5.2.3)
export const WarningState: Story = {
  args: {
    deviceId: 'router-2',
  },
  decorators: [
    (Story) => {
      const mocks = [
        {
          request: {
            query: GET_RESOURCE_METRICS,
            variables: { deviceId: 'router-2' },
          },
          result: {
            data: {
              device: {
                resourceMetrics: warningMetrics,
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

// Story 3: Critical State (AC 5.2.3)
export const CriticalState: Story = {
  args: {
    deviceId: 'router-3',
  },
  decorators: [
    (Story) => {
      const mocks = [
        {
          request: {
            query: GET_RESOURCE_METRICS,
            variables: { deviceId: 'router-3' },
          },
          result: {
            data: {
              device: {
                resourceMetrics: criticalMetrics,
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

// Story 4: Missing Temperature (AC 5.2.5)
export const NoTemperature: Story = {
  args: {
    deviceId: 'router-4',
  },
  decorators: [
    (Story) => {
      const mocks = [
        {
          request: {
            query: GET_RESOURCE_METRICS,
            variables: { deviceId: 'router-4' },
          },
          result: {
            data: {
              device: {
                resourceMetrics: noTemperatureMetrics,
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

// Story 5: Loading State
export const Loading: Story = {
  args: {
    deviceId: 'router-5',
  },
  decorators: [
    (Story) => {
      const mocks = [
        {
          request: {
            query: GET_RESOURCE_METRICS,
            variables: { deviceId: 'router-5' },
          },
          delay: 10000, // Simulate slow loading
          result: {
            data: {
              device: {
                resourceMetrics: healthyMetrics,
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};

// Story 6: CPU Breakdown Modal (AC 5.2.4)
export const CPUBreakdownInteractive: Story = {
  args: {
    deviceId: 'test-device',
  },
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="p-component-xl">
        <p className="text-sm text-muted-foreground mb-4">
          Click the CPU gauge to see per-core breakdown
        </p>
        <CircularGauge
          value={75}
          label="CPU"
          sublabel="4 cores @ 880MHz"
          thresholds={{ warning: 70, critical: 90 }}
          size="md"
          onClick={() => setOpen(true)}
        />
        <CPUBreakdownModal
          open={open}
          onOpenChange={setOpen}
          perCoreUsage={[70, 75, 80, 75]}
          overallUsage={75}
          frequency={880}
        />
      </div>
    );
  },
};

// Individual Gauge Stories
// Note: Gauge stories are secondary, primary stories are for ResourceGauges component above
