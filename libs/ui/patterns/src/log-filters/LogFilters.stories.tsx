/**
 * Stories for LogFilters component
 * Multi-select filters for log topics and severities
 */

import * as React from 'react';


import type { LogSeverity, LogTopic } from '@nasnet/core/types';

import { LogFilters } from './LogFilters';

import type { Meta, StoryObj } from '@storybook/react';

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

const meta: Meta<typeof LogFilters> = {
  title: 'Patterns/LogFilters',
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
};

export default meta;
type Story = StoryObj<typeof LogFilters>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default – No Filters Active',
  render: () => <StatefulLogFilters />,
  parameters: {
    docs: {
      description: {
        story: 'Both filter dropdowns start empty. Click the buttons to open the dropdown and toggle selections.',
      },
    },
  },
};

export const WithTopicsSelected: Story = {
  name: 'With Topics Pre-selected',
  render: () => (
    <StatefulLogFilters initialTopics={['firewall', 'vpn', 'dhcp']} />
  ),
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
  parameters: {
    docs: {
      description: {
        story:
          'Stress-test showing all 14 topics selected simultaneously. The badge count indicator on the button shows the number, and the badge strip wraps onto multiple lines.',
      },
    },
  },
};
