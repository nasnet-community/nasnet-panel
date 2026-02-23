import type { Meta, StoryObj } from '@storybook/react';
import { LogDetailPanel } from './LogDetailPanel';

const meta = {
  title: 'Patterns/Common/LogDetailPanel',
  component: LogDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Side panel/modal showing full details of a log entry. Displays timestamp, topic, severity, full message, related entries, and actions to copy entry or link.',
      },
    },
  },
  argTypes: {
    entry: {
      description: 'The log entry to display (null when closed)',
      control: { type: 'object' },
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the detail panel is visible',
    },
    onClose: {
      action: 'close clicked',
    },
    relatedEntries: {
      description: 'Related log entries from same topic for context',
      control: { type: 'object' },
    },
    onPrevious: {
      action: 'previous clicked',
    },
    onNext: {
      action: 'next clicked',
    },
    hasPrevious: {
      control: 'boolean',
      description: 'Whether there is a previous entry to navigate to',
    },
    hasNext: {
      control: 'boolean',
      description: 'Whether there is a next entry to navigate to',
    },
  },
} satisfies Meta<typeof LogDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const selectedEntry = {
  id: 'log-001',
  timestamp: new Date('2025-03-15T10:34:22Z'),
  topic: 'firewall' as const,
  severity: 'warning' as const,
  message:
    'forward: in:ether1 out:bridge src-mac 00:0c:29:ab:cd:ef, proto TCP (SYN), 192.168.88.1:54321->8.8.8.8:443, len 60',
};

const relatedEntries = [
  {
    id: 'log-002',
    timestamp: new Date('2025-03-15T10:35:01Z'),
    topic: 'firewall' as const,
    severity: 'warning' as const,
    message: 'forward: same connection attempt from 192.168.88.1 on ether1',
  },
  {
    id: 'log-003',
    timestamp: new Date('2025-03-15T10:36:22Z'),
    topic: 'firewall' as const,
    severity: 'info' as const,
    message: 'connection timeout after 60 seconds',
  },
];

export const Open: Story = {
  args: {
    entry: selectedEntry,
    isOpen: true,
    relatedEntries,
    onClose: () => {},
    onPrevious: () => {},
    onNext: () => {},
    hasPrevious: true,
    hasNext: true,
  },
};

export const Closed: Story = {
  args: {
    entry: null,
    isOpen: false,
    onClose: () => {},
  },
};

export const NoRelatedEntries: Story = {
  args: {
    entry: selectedEntry,
    isOpen: true,
    relatedEntries: [],
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'When there are no related entries, the "Related Entries" section is hidden.',
      },
    },
  },
};

export const WithNavigationDisabled: Story = {
  args: {
    entry: selectedEntry,
    isOpen: true,
    relatedEntries,
    onClose: () => {},
    onPrevious: () => {},
    onNext: () => {},
    hasPrevious: false,
    hasNext: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navigation buttons are disabled when at the first/last entry. Set hasPrevious/hasNext to false to show this state.',
      },
    },
  },
};

export const CriticalEntry: Story = {
  args: {
    entry: {
      id: 'log-critical',
      timestamp: new Date('2025-03-15T10:45:00Z'),
      topic: 'system' as const,
      severity: 'critical' as const,
      message: 'System rebooted unexpectedly – possible hardware failure detected on ether2',
    },
    isOpen: true,
    relatedEntries: [
      {
        id: 'log-pre-1',
        timestamp: new Date('2025-03-15T10:44:00Z'),
        topic: 'system' as const,
        severity: 'error' as const,
        message: 'Interface ether2 went down unexpectedly',
      },
      {
        id: 'log-pre-2',
        timestamp: new Date('2025-03-15T10:43:00Z'),
        topic: 'system' as const,
        severity: 'warning' as const,
        message: 'High CPU usage detected – possible infinite loop',
      },
    ],
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows related entries that led up to a critical event, providing context for troubleshooting.',
      },
    },
  },
};
