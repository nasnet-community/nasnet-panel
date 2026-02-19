/**
 * Storybook stories for TimeRangeSelector
 * Accessible segmented control for selecting bandwidth chart time range
 */

import { useState } from 'react';

import { TimeRangeSelector } from './TimeRangeSelector';

import type { TimeRange } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TimeRangeSelector> = {
  title: 'Features/Dashboard/TimeRangeSelector',
  component: TimeRangeSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Segmented control (radiogroup) that selects the time range displayed in the BandwidthChart. ' +
          'Three options: 5 min (real-time, 2-second intervals), 1 hour (1-minute averages), ' +
          '24 hours (5-minute averages). WCAG AAA compliant: 44px touch targets, roving tabindex ' +
          'keyboard navigation (Arrow/Home/End keys), and 3px focus ring.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['5m', '1h', '24h'] satisfies TimeRange[],
      description: 'Currently selected time range',
    },
    onChange: { action: 'onChange' },
  },
};

export default meta;
type Story = StoryObj<typeof TimeRangeSelector>;

/**
 * Default — 5-minute real-time view selected.
 */
export const Default: Story = {
  args: {
    value: '5m',
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '5-minute option selected (default for the BandwidthChart). Shows live 2-second data.',
      },
    },
  },
};

/**
 * One-hour view selected.
 */
export const OneHourSelected: Story = {
  args: {
    value: '1h',
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '1-hour option selected. Chart switches to 1-minute averaged data.',
      },
    },
  },
};

/**
 * Twenty-four-hour view selected.
 */
export const TwentyFourHoursSelected: Story = {
  args: {
    value: '24h',
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '24-hour option selected. Chart uses 5-minute averaged data to cover the full day.',
      },
    },
  },
};

/**
 * Interactive — state is controlled inside the story so clicking actually changes the selection.
 */
export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<TimeRange>('5m');
    return (
      <div className="flex flex-col items-center gap-4">
        <TimeRangeSelector {...args} value={selected} onChange={setSelected} />
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-medium">{selected}</span>
        </p>
      </div>
    );
  },
  args: {
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive story. Click buttons or use Arrow/Home/End keys to change the selection. ' +
          'The selected value label below updates to confirm the change.',
      },
    },
  },
};

/**
 * Keyboard navigation demo — render instructions alongside the component.
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const [selected, setSelected] = useState<TimeRange>('5m');
    return (
      <div className="flex flex-col items-center gap-6 p-4">
        <TimeRangeSelector value={selected} onChange={setSelected} />
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Tab into the group, then use ArrowRight / ArrowLeft to move between options</li>
          <li>Home jumps to "5 min", End jumps to "24 hours"</li>
          <li>Each button has a 44px minimum height for touch targets</li>
        </ul>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates roving-tabindex keyboard navigation. Focus the component with Tab, ' +
          'then navigate with Arrow keys, Home, and End.',
      },
    },
  },
};
