/**
 * Stories for LogFilters component
 * Multi-select filters for log topics and severities
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import type { LogSeverity, LogTopic } from '@nasnet/core/types';
import { LogFilters } from './LogFilters';

// ---------------------------------------------------------------------------
// Stateful wrapper so filter interactions are visible in Storybook
// ---------------------------------------------------------------------------

interface StatefulLogFiltersProps {
  initialTopics?: LogTopic[];
  initialSeverities?: LogSeverity[];
}

function StatefulLogFilters({
  initialTopics = [],
  initialSeverities = [],
}: StatefulLogFiltersProps) {
  const [topics, setTopics] = React.useState<LogTopic[]>(initialTopics);
  const [severities, setSeverities] = React.useState<LogSeverity[]>(initialSeverities);

  return (
    <div className="p-4 max-w-2xl">
      <LogFilters
        topics={topics}
        onTopicsChange={setTopics}
        severities={severities}
        onSeveritiesChange={setSeverities}
      />
      <p className="mt-4 text-xs text-slate-500">
        Active topics: [{topics.join(', ') || 'none'}] | Active severities: [
        {severities.join(', ') || 'none'}]
      </p>
    </div>
  );
}

const meta = {
  title: 'Patterns/Common/LogFilters',
  component: LogFilters,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multi-select filter panel for log topics and severity levels. Renders two dropdown menus with checkbox lists and dismissible badge chips for active selections. Uses AND logic between topics and severities.',
      },
    },
  },
  argTypes: {
    topics: {
      description: 'Currently selected log topics',
      control: { type: 'object' },
    },
    onTopicsChange: {
      action: 'topics changed',
    },
    severities: {
      description: 'Currently selected log severity levels',
      control: { type: 'object' },
    },
    onSeveritiesChange: {
      action: 'severities changed',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
} satisfies Meta<typeof LogFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default – No Filters Active',
  render: () => <StatefulLogFilters />,
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Both filter dropdowns start empty. Click the buttons to open the dropdown and toggle selections.',
      },
    },
  },
};

export const Mobile: Story = {
  name: 'Mobile (<640px)',
  render: () => <StatefulLogFilters />,
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  name: 'Tablet (640-1024px)',
  render: () => <StatefulLogFilters />,
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const Desktop: Story = {
  name: 'Desktop (>1024px)',
  render: () => <StatefulLogFilters />,
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const WithTopicsSelected: Story = {
  name: 'With Topics Pre-selected',
  render: () => (
    <StatefulLogFilters initialTopics={['firewall', 'vpn', 'dhcp']} />
  ),
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the badge strip below the dropdowns when topics are pre-selected. Each badge has an × button to dismiss it individually.',
      },
    },
  },
};

export const WithSeveritiesSelected: Story = {
  name: 'With Severities Pre-selected',
  render: () => (
    <StatefulLogFilters initialSeverities={['error', 'critical']} />
  ),
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Only severity filters are active, showing error and critical severity badges.',
      },
    },
  },
};

export const BothFiltersActive: Story = {
  name: 'Both Topics and Severities Active',
  render: () => (
    <StatefulLogFilters
      initialTopics={['firewall', 'wireless']}
      initialSeverities={['warning', 'error']}
    />
  ),
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'When both filter types are active a "Clear filters" ghost button appears next to the dropdowns. Clicking it resets all selections at once.',
      },
    },
  },
};

export const AllTopicsSelected: Story = {
  name: 'All Topics Selected',
  render: () => (
    <StatefulLogFilters
      initialTopics={[
        'system',
        'firewall',
        'wireless',
        'dhcp',
        'dns',
        'ppp',
        'vpn',
        'interface',
        'route',
        'script',
        'critical',
        'info',
        'warning',
        'error',
      ]}
    />
  ),
  args: {
    topics: [],
    onTopicsChange: () => {},
    severities: [],
    onSeveritiesChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress-test showing all 14 topics selected simultaneously. The badge count indicator on the button shows the number, and the badge strip wraps onto multiple lines.',
      },
    },
  },
};
