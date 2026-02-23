/**
 * Storybook stories for TimeRangeSelector
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * TimeRangeSelector is a controlled dropdown backed by shadcn/ui Select.
 * All stories are fully interactive with no async data requirements.
 */

import { useState } from 'react';

import { fn } from 'storybook/test';

import { TimeRangeSelector, timeRangePresetToInput, type TimeRangePreset } from './time-range-selector';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TimeRangeSelector> = {
  title: 'Features/Network/InterfaceStats/TimeRangeSelector',
  component: TimeRangeSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Dropdown selector for common historical time range presets used with bandwidth charts.

Provides five presets: **Last hour**, **Last 6 hours**, **Last 24 hours**, **Last 7 days**, **Last 30 days**.

The component is fully controlled — the parent supplies \`value\` and reacts to \`onChange\`.
The companion \`timeRangePresetToInput()\` utility converts a preset string into the
\`StatsTimeRangeInput\` (ISO 8601 start/end) expected by \`BandwidthChart\`.

\`\`\`tsx
const [range, setRange] = useState<TimeRangePreset>('24h');
const timeRange = timeRangePresetToInput(range);  // { start, end }
<TimeRangeSelector value={range} onChange={setRange} />
<BandwidthChart timeRange={timeRange} ... />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['1h', '6h', '24h', '7d', '30d'] satisfies TimeRangePreset[],
      description: 'Currently selected preset',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes forwarded to the SelectTrigger',
    },
  },
  args: {
    value: '24h',
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TimeRangeSelector>;

/**
 * Default controlled story — 24 h selected, onChange logged to the
 * Storybook Actions panel.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default state: Last 24 hours selected. onChange is wired to the Storybook Actions panel.',
      },
    },
  },
};

/**
 * Shortest window — last 1 hour selected.
 */
export const OneHour: Story = {
  name: 'Last 1 hour selected',
  args: { value: '1h' },
  parameters: {
    docs: {
      description: {
        story: 'Last hour preset: high-resolution view for recent traffic spikes.',
      },
    },
  },
};

/**
 * Six-hour window — good for observing traffic patterns across a work shift.
 */
export const SixHours: Story = {
  name: 'Last 6 hours selected',
  args: { value: '6h' },
  parameters: {
    docs: {
      description: {
        story: 'Six-hour preset: useful for monitoring traffic during a business shift.',
      },
    },
  },
};

/**
 * Weekly view — last 7 days at daily granularity.
 */
export const SevenDays: Story = {
  name: 'Last 7 days selected',
  args: { value: '7d' },
  parameters: {
    docs: {
      description: {
        story: 'Weekly preset: identifies usage trends across the full business week.',
      },
    },
  },
};

/**
 * Monthly view — last 30 days for capacity planning.
 */
export const ThirtyDays: Story = {
  name: 'Last 30 days selected',
  args: { value: '30d' },
  parameters: {
    docs: {
      description: {
        story: 'Monthly preset: exposes long-term usage trends for capacity planning reports.',
      },
    },
  },
};

/**
 * Fully interactive story with local state.  Selecting an option updates the
 * displayed value and shows the resulting ISO 8601 time range so reviewers can
 * verify the controlled flow and the timeRangePresetToInput utility end-to-end.
 */
export const Interactive: Story = {
  name: 'Interactive (stateful)',
  render: (args) => {
    const [value, setValue] = useState<TimeRangePreset>('24h');
    const timeRange = timeRangePresetToInput(value);
    return (
      <div className="flex flex-col gap-3 min-w-[260px]">
        <TimeRangeSelector
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next);
            args.onChange(next);
          }}
        />
        <div className="rounded-md border bg-muted/50 p-3 text-xs font-mono space-y-1">
          <div>Selected: <strong>{value}</strong></div>
          <div>Start: {timeRange.start}</div>
          <div>End:&nbsp;&nbsp;&nbsp;{timeRange.end}</div>
        </div>
      </div>
    );
  },
  args: {
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stateful story showing both the controlled dropdown and the ISO 8601 ' +
          'time range produced by timeRangePresetToInput(). Switch presets to verify ' +
          'the utility output.',
      },
    },
  },
};
