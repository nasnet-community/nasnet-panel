/**
 * QuietHoursConfig Storybook Stories
 *
 * Showcases all configuration states and platform variants for the quiet
 * hours notification suppression component.
 */

import { fn } from 'storybook/test';

import { QuietHoursConfig } from './QuietHoursConfig';

import type { DayOfWeek } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof QuietHoursConfig> = {
  title: 'Features/Alerts/QuietHoursConfig',
  component: QuietHoursConfig,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
QuietHoursConfig is a platform-aware component that suppresses non-critical
alert notifications during configured time windows. It auto-detects the
platform and renders the appropriate presenter:

- **Mobile (<640px):** Single-column card with 44px touch targets, enlarged text, and bottom-friendly layout
- **Tablet/Desktop (≥640px):** Two-column grid with dense controls and hover states

**Configuration fields:**
- **startTime / endTime** — HH:MM 24-hour format time range
- **timezone** — IANA timezone string (e.g. \`America/New_York\`)
- **daysOfWeek** — Array of day indices (0 = Sunday … 6 = Saturday)
- **bypassCritical** — When true, critical severity alerts bypass quiet hours

Internally uses the \`useQuietHoursConfig\` headless hook with cross-midnight
detection and duration calculation.
        `,
      },
    },
  },
  argTypes: {
    onChange: { action: 'change' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof QuietHoursConfig>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — nighttime window, Mon–Fri, bypass critical enabled
 */
export const Default: Story = {
  args: {
    value: {
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/New_York',
      bypassCritical: true,
      daysOfWeek: [1, 2, 3, 4, 5] as DayOfWeek[],
    },
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard weeknight quiet window (22:00–08:00 Eastern) with critical alerts still delivered.',
      },
    },
  },
};

/**
 * Weekend-only quiet hours — Sat + Sun all day
 */
export const WeekendOnly: Story = {
  args: {
    value: {
      startTime: '00:00',
      endTime: '23:59',
      timezone: 'Europe/Berlin',
      bypassCritical: true,
      daysOfWeek: [0, 6] as DayOfWeek[],
    },
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Quiet all weekend (Saturday and Sunday) in the Europe/Berlin timezone.',
      },
    },
  },
};

/**
 * Maintenance window — short window every day at midnight UTC
 */
export const DailyMaintenanceWindow: Story = {
  args: {
    value: {
      startTime: '02:00',
      endTime: '04:00',
      timezone: 'UTC',
      bypassCritical: false,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[],
    },
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Daily 2-hour maintenance window (02:00–04:00 UTC) every day. bypassCritical is false, so ALL alerts are suppressed — useful for automated maintenance.',
      },
    },
  },
};

/**
 * Empty/unset state — component with no initial value
 */
export const Unset: Story = {
  args: {
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Component with no initial value (undefined). The hook fills in sensible defaults (22:00–08:00, Mon–Fri, local timezone).',
      },
    },
  },
};

/**
 * Disabled — read-only during a save operation
 */
export const Disabled: Story = {
  args: {
    value: {
      startTime: '23:00',
      endTime: '07:00',
      timezone: 'Asia/Tokyo',
      bypassCritical: true,
      daysOfWeek: [1, 2, 3, 4, 5] as DayOfWeek[],
    },
    onChange: fn(),
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state — all controls are non-interactive while a parent operation is in progress.',
      },
    },
  },
};

/**
 * Mobile viewport — single-column touch-friendly layout
 */
export const Mobile: Story = {
  args: {
    value: {
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/Chicago',
      bypassCritical: true,
      daysOfWeek: [1, 2, 3, 4, 5] as DayOfWeek[],
    },
    onChange: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile presenter (<640px) with single-column layout, 44px touch targets, and bottom-sheet-style card.',
      },
    },
  },
};

/**
 * Desktop viewport — two-column grid layout
 */
export const Desktop: Story = {
  args: {
    value: {
      startTime: '20:00',
      endTime: '06:00',
      timezone: 'Europe/London',
      bypassCritical: true,
      daysOfWeek: [0, 6] as DayOfWeek[],
    },
    onChange: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'Desktop presenter (≥640px) with two-column grid — time range and timezone side by side.',
      },
    },
  },
};
