/**
 * DayOfWeekSelector Storybook Stories
 *
 * Showcases all selection states, interaction variants, and accessibility
 * characteristics of the multi-select day picker component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DayOfWeekSelector } from './DayOfWeekSelector';
import type { DayOfWeek } from './types';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof DayOfWeekSelector> = {
  title: 'Features/Alerts/DayOfWeekSelector',
  component: DayOfWeekSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
DayOfWeekSelector is an accessible multi-select day picker used inside the
QuietHoursConfig component to specify which days quiet hours are active.

**Behavior:**
- Days run Sunday (0) through Saturday (6)
- Each button is a toggle — selected days use the primary variant, unselected use outline
- At least one day must remain selected (toggling the last selected day is a no-op)
- Labels adapt to screen width: abbreviated 3-letter codes on ≥sm, single initial on mobile
- Each button carries \`aria-pressed\` and \`aria-label\` for full screen reader support
- Minimum 44px touch target on all screen sizes (WCAG AAA)

**Day index reference:**
| 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Sun | Mon | Tue | Wed | Thu | Fri | Sat |
      `,
      },
    },
  },
  argTypes: {
    onChange: { action: 'change' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
    value: {
      control: 'check',
      options: [0, 1, 2, 3, 4, 5, 6],
      description: 'Selected day indices (0 = Sunday … 6 = Saturday)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DayOfWeekSelector>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Weekdays only (Mon–Fri) — most common quiet-hours schedule
 */
export const Weekdays: Story = {
  args: {
    value: [1, 2, 3, 4, 5] as DayOfWeek[],
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Monday through Friday selected — the standard weeknight quiet hours schedule.',
      },
    },
  },
};

/**
 * All days selected
 */
export const AllDays: Story = {
  args: {
    value: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[],
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Every day selected — useful for daily maintenance windows.',
      },
    },
  },
};

/**
 * Weekend only (Sat + Sun)
 */
export const WeekendOnly: Story = {
  args: {
    value: [0, 6] as DayOfWeek[],
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Saturday and Sunday selected — weekend quiet hours configuration.',
      },
    },
  },
};

/**
 * Single day selected (minimum required by the component)
 */
export const SingleDay: Story = {
  args: {
    value: [3] as DayOfWeek[],
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only Wednesday selected. Attempting to deselect it will be a no-op — at least one day must remain active.',
      },
    },
  },
};

/**
 * Disabled state — non-interactive during saves or when a parent is locked
 */
export const Disabled: Story = {
  args: {
    value: [1, 2, 3, 4, 5] as DayOfWeek[],
    onChange: fn(),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'All buttons are disabled and non-interactive. The selection is visible but cannot be changed.',
      },
    },
  },
};

/**
 * Custom className — demonstrates className pass-through for layout integration
 */
export const WithCustomClass: Story = {
  args: {
    value: [1, 3, 5] as DayOfWeek[],
    onChange: fn(),
    className: 'p-4 border border-border rounded-lg bg-muted/30',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mon, Wed, Fri selected with a custom wrapper className applied — shows how to embed the component inside a card or panel.',
      },
    },
  },
};
