import type { Meta, StoryObj } from '@storybook/react';
import type { LogEntry } from '@nasnet/core/types';
import { LogControls } from './LogControls';
import type { LogControlsProps } from './LogControls';

const meta = {
  title: 'Patterns/Common/LogControls',
  component: LogControls,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Provides pause/resume and export functionality for live log streams. Allows users to pause log updates, see when they were paused, and export logs in CSV or JSON format.',
      },
    },
  },
  argTypes: {
    isPaused: {
      control: 'boolean',
      description: 'Whether auto-refresh is currently paused',
    },
    onPauseToggle: {
      action: 'pause toggled',
    },
    lastUpdated: {
      description: 'Last update timestamp (shown when paused)',
      control: { type: 'date' },
    },
    logs: {
      description: 'Array of log entries to export',
      control: { type: 'object' },
    },
    routerIp: {
      control: 'text',
      description: 'Router IP address for export filename',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
} satisfies Meta<typeof LogControls>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2025-03-15T10:34:22Z'),
    topic: 'firewall',
    severity: 'warning',
    message: 'Connection dropped from 192.168.1.100',
  },
  {
    id: '2',
    timestamp: new Date('2025-03-15T10:35:01Z'),
    topic: 'dhcp',
    severity: 'info',
    message: 'assigned 192.168.88.100 to 00:11:22:33:44:55',
  },
  {
    id: '3',
    timestamp: new Date('2025-03-15T10:36:55Z'),
    topic: 'system',
    severity: 'critical',
    message: 'System rebooted unexpectedly',
  },
];

export const Default: Story = {
  args: {
    isPaused: false,
    onPauseToggle: () => {},
    logs: mockLogs,
    routerIp: '192.168.1.1',
  },
};

export const Paused: Story = {
  args: {
    isPaused: true,
    onPauseToggle: () => {},
    lastUpdated: new Date('2025-03-15T10:40:00Z'),
    logs: mockLogs,
    routerIp: '192.168.1.1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When paused, displays the pause timestamp and shows "Resume" button. The Export button is always available if logs are present.',
      },
    },
  },
};

export const NoLogs: Story = {
  args: {
    isPaused: false,
    onPauseToggle: () => {},
    logs: [],
    routerIp: '192.168.1.1',
  },
  parameters: {
    docs: {
      description: {
        story: 'The Export button is disabled when there are no logs to export.',
      },
    },
  },
};

export const ManyLogs: Story = {
  args: {
    isPaused: false,
    onPauseToggle: () => {},
    logs: Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      timestamp: new Date(Date.now() - i * 1000),
      topic: ['firewall', 'dhcp', 'system', 'dns'][i % 4] as any,
      severity: ['debug', 'info', 'warning', 'error', 'critical'][i % 5] as any,
      message: `Log message ${i + 1}`,
    })),
    routerIp: '192.168.1.1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates controls with a large number of logs ready for export.',
      },
    },
  },
};
