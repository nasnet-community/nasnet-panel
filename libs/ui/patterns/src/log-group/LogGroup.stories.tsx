import type { Meta, StoryObj } from '@storybook/react';

import { LogGroup, LogGroupList } from './LogGroup';
import type { LogGroupData } from './LogGroup';

const meta = {
  title: 'Patterns/Common/LogGroup',
  component: LogGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a collapsible group of related log entries with summary header showing time range, severity level, topic, and entry count. Single entries are rendered directly without grouping.',
      },
    },
  },
  argTypes: {
    group: {
      description: 'Log group data with id, time range, entries, topic, and severity',
      control: { type: 'object' },
    },
    searchTerm: {
      control: 'text',
      description: 'Search term to highlight in entry messages',
    },
    isBookmarked: {
      description: 'Function to check if an entry is bookmarked',
    },
    onEntryClick: {
      action: 'entry clicked',
    },
    onToggleBookmark: {
      action: 'bookmark toggled',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
} satisfies Meta<typeof LogGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const groupWithMultipleEntries: LogGroupData = {
  id: 'group-001',
  startTime: new Date('2025-03-15T10:30:00Z'),
  endTime: new Date('2025-03-15T10:45:00Z'),
  primaryTopic: 'firewall',
  severityLevel: 'warning',
  entries: [
    {
      id: 'log-001',
      timestamp: new Date('2025-03-15T10:30:00Z'),
      topic: 'firewall',
      severity: 'warning',
      message: 'forward: in:ether1 out:bridge blocked (rate limit)',
    },
    {
      id: 'log-002',
      timestamp: new Date('2025-03-15T10:32:15Z'),
      topic: 'firewall',
      severity: 'warning',
      message: 'forward: in:ether1 out:bridge blocked (rate limit)',
    },
    {
      id: 'log-003',
      timestamp: new Date('2025-03-15T10:45:00Z'),
      topic: 'firewall',
      severity: 'info',
      message: 'connection rate limit cleared',
    },
  ],
};

const singleEntryGroup: LogGroupData = {
  id: 'group-002',
  startTime: new Date('2025-03-15T10:50:00Z'),
  endTime: new Date('2025-03-15T10:50:00Z'),
  primaryTopic: 'dhcp',
  severityLevel: 'info',
  entries: [
    {
      id: 'log-004',
      timestamp: new Date('2025-03-15T10:50:00Z'),
      topic: 'dhcp',
      severity: 'info',
      message: 'assigned 192.168.88.105 to 00:11:22:33:44:66',
    },
  ],
};

const criticalGroup: LogGroupData = {
  id: 'group-critical',
  startTime: new Date('2025-03-15T11:00:00Z'),
  endTime: new Date('2025-03-15T11:05:00Z'),
  primaryTopic: 'system',
  severityLevel: 'critical',
  entries: [
    {
      id: 'log-crit-1',
      timestamp: new Date('2025-03-15T11:00:00Z'),
      topic: 'system',
      severity: 'warning',
      message: 'High CPU usage detected (85%)',
    },
    {
      id: 'log-crit-2',
      timestamp: new Date('2025-03-15T11:02:00Z'),
      topic: 'system',
      severity: 'error',
      message: 'Memory pressure increasing – services may be affected',
    },
    {
      id: 'log-crit-3',
      timestamp: new Date('2025-03-15T11:05:00Z'),
      topic: 'system',
      severity: 'critical',
      message: 'System rebooted unexpectedly',
    },
  ],
};

export const Default: Story = {
  args: {
    group: groupWithMultipleEntries,
    onEntryClick: () => {},
    isBookmarked: () => false,
  },
};

export const Expanded: Story = {
  args: {
    group: groupWithMultipleEntries,
    onEntryClick: () => {},
    isBookmarked: () => false,
  },
  play: async ({ canvasElement }) => {
    // Note: In a real Storybook story, you'd use userEvent to click the button
    // This is a placeholder to show the expanded state visually
  },
  parameters: {
    docs: {
      description: {
        story: 'The group can be clicked to expand and show all entries.',
      },
    },
  },
};

export const SingleEntry: Story = {
  args: {
    group: singleEntryGroup,
    onEntryClick: () => {},
    isBookmarked: () => false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a group contains only a single entry, it is rendered directly as a LogEntry without the grouping header.',
      },
    },
  },
};

export const CriticalSeverity: Story = {
  args: {
    group: criticalGroup,
    onEntryClick: () => {},
    isBookmarked: (id) => id === 'log-crit-3',
    onToggleBookmark: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows a critical group with escalating severity entries. The header prominently displays the critical severity level.',
      },
    },
  },
};

export const WithSearch: Story = {
  args: {
    group: groupWithMultipleEntries,
    searchTerm: 'rate limit',
    onEntryClick: () => {},
    isBookmarked: () => false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Search term is highlighted in matching entries when provided.',
      },
    },
  },
};

// Story for LogGroupList
const meta2 = {
  title: 'Patterns/Common/LogGroupList',
  component: LogGroupList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Renders a vertically-stacked list of LogGroup components.',
      },
    },
  },
} satisfies Meta<typeof LogGroupList>;

export const ListDefault: StoryObj<typeof meta2> = {
  render: (args) => <LogGroupList {...args} />,
  args: {
    groups: [groupWithMultipleEntries, singleEntryGroup, criticalGroup],
    onEntryClick: () => {},
    isBookmarked: () => false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A list of multiple log groups displayed with consistent spacing and borders between groups.',
      },
    },
  },
};
