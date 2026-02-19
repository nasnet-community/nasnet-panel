/**
 * TimeRangeInput Storybook Stories
 *
 * Showcases the time range picker component used in quiet hours configuration.
 * Demonstrates normal ranges, midnight-crossing warning, disabled state,
 * and edge-case time values.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { TimeRangeInput } from './TimeRangeInput';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof TimeRangeInput> = {
  title: 'Features/Alerts/QuietHoursConfig/TimeRangeInput',
  component: TimeRangeInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A start/end time picker for defining quiet hours ranges. Displays an informational warning when the selected range crosses midnight (i.e., end time is earlier than start time). Built with WCAG AAA-compliant 44px touch targets.',
      },
    },
  },
  argTypes: {
    startTime: {
      control: 'text',
      description: 'Start time in HH:MM format',
    },
    endTime: {
      control: 'text',
      description: 'End time in HH:MM format',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the inputs are disabled',
    },
    onChange: {
      description: 'Callback fired when either time value changes',
      action: 'changed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeRangeInput>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — typical night-time quiet window (10 PM to 8 AM).
 * Crosses midnight, so the warning banner is displayed.
 */
export const Default: Story = {
  args: {
    startTime: '22:00',
    endTime: '08:00',
    onChange: fn(),
    disabled: false,
  },
};

/**
 * Same-day range — quiet hours that stay within a single calendar day.
 * No midnight-crossing warning is shown.
 */
export const SameDayRange: Story = {
  args: {
    startTime: '12:00',
    endTime: '14:00',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A range that does not cross midnight — no warning banner is displayed.',
      },
    },
  },
};

/**
 * Midnight crossing — end time is before start time, triggering the warning.
 */
export const MidnightCrossing: Story = {
  args: {
    startTime: '23:30',
    endTime: '06:00',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When end time is earlier than start time the component displays a blue informational banner indicating the range spans across midnight.',
      },
    },
  },
};

/**
 * Disabled state — all inputs are read-only and visually dimmed.
 */
export const Disabled: Story = {
  args: {
    startTime: '22:00',
    endTime: '07:00',
    onChange: fn(),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state used when quiet hours are toggled off or the form is read-only.',
      },
    },
  },
};

/**
 * Exact midnight boundary — start at 00:00, end at 00:00.
 * End equals start so endMinutes === startMinutes; no crossing.
 */
export const MidnightBoundary: Story = {
  args: {
    startTime: '00:00',
    endTime: '00:00',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case where start and end times are both 00:00. Since end is not less than start no warning is shown.',
      },
    },
  },
};

/**
 * Business-hours range — typical do-not-disturb during work day.
 */
export const BusinessHours: Story = {
  args: {
    startTime: '09:00',
    endTime: '17:30',
    onChange: fn(),
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Quiet hours set to cover a standard business day — no midnight crossing.',
      },
    },
  },
};
