/**
 * QueuedAlertBadge Storybook Stories
 *
 * Demonstrates all visual states of the quiet-hours queuing badge:
 * - Queued alert (pending delivery after quiet hours)
 * - Bypassed alert (critical severity that overrode quiet hours)
 * - Invisible when no queuing data is present
 */

import type { Meta, StoryObj } from '@storybook/react';
import { QueuedAlertBadge } from './QueuedAlertBadge';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof QueuedAlertBadge> = {
  title: 'Features/Alerts/QueuedAlertBadge',
  component: QueuedAlertBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**QueuedAlertBadge** indicates that an alert's delivery was affected by quiet hours.

Two states are represented:

| State | Trigger | Color |
|---|---|---|
| Queued | \`queuedUntil\` is set | Info (blue) |
| Bypassed | \`bypassedQuietHours\` is \`true\` | Warning (amber) |

When neither prop is provided the component renders \`null\`.
        `,
      },
    },
  },
  argTypes: {
    queuedUntil: {
      control: 'text',
      description: 'ISO 8601 timestamp for when the alert will be delivered',
    },
    bypassedQuietHours: {
      control: 'boolean',
      description: 'Whether this alert bypassed quiet hours due to CRITICAL severity',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
  },
};

export default meta;
type Story = StoryObj<typeof QueuedAlertBadge>;

// =============================================================================
// Helpers — compute timestamps relative to "now" at story render time
// =============================================================================

/** Returns an ISO timestamp N hours from now */
function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

// =============================================================================
// Stories
// =============================================================================

/**
 * Alert queued for delivery in 2 hours — typical overnight quiet-hours scenario.
 */
export const QueuedSoon: Story = {
  args: {
    queuedUntil: hoursFromNow(2),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Badge shown when an alert is held back by quiet hours and will be delivered in 2 hours.',
      },
    },
  },
};

/**
 * Alert queued with a longer delay — delivers in 8 hours (e.g., overnight window).
 */
export const QueuedOvernight: Story = {
  args: {
    queuedUntil: hoursFromNow(8),
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge for an alert queued through an 8-hour overnight quiet window.',
      },
    },
  },
};

/**
 * Alert queued for less than one hour — badge shows "soon" label.
 */
export const QueuedImminently: Story = {
  args: {
    queuedUntil: hoursFromNow(0.5),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When delivery is less than 1 hour away the badge shows a "soon" indicator instead of an hour count.',
      },
    },
  },
};

/**
 * Critical alert bypassed quiet hours — delivered immediately despite active window.
 */
export const BypassedQuietHours: Story = {
  args: {
    bypassedQuietHours: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Amber warning badge displayed when a CRITICAL severity alert overrides the quiet hours window.',
      },
    },
  },
};

/**
 * No queuing data — component renders nothing.
 */
export const NoQueueData: Story = {
  args: {
    queuedUntil: undefined,
    bypassedQuietHours: false,
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-2 p-4 border border-dashed border-muted-foreground/30 rounded-md text-sm text-muted-foreground">
        (badge renders nothing)
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When neither prop is set the component returns null — shown here with a placeholder outline.',
      },
    },
  },
};

/**
 * Both props provided — bypassedQuietHours takes precedence.
 */
export const BothProps: Story = {
  args: {
    queuedUntil: hoursFromNow(4),
    bypassedQuietHours: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When both props are provided, the bypassed state is rendered (it takes precedence over the queued state).',
      },
    },
  },
};
