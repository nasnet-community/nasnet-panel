/**
 * SeverityBadge Storybook Stories
 *
 * Stories for the severity badge component demonstrating all severity levels
 * and both read-only and dismissible variants.
 */

import { SeverityBadge } from './SeverityBadge';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SeverityBadge> = {
  title: 'Patterns/SeverityBadge',
  component: SeverityBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Color-coded severity badge for log entries and filter badges. Supports both read-only (status display) and dismissible (filter) variants. Meets WCAG AA contrast requirements.',
      },
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['debug', 'info', 'warning', 'error', 'critical'],
      description: 'Log severity level',
    },
    onRemove: {
      description: 'Callback when badge is dismissed (shows X button if provided)',
      action: 'removed',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SeverityBadge>;

// ─── Individual Severity Levels ────────────────────────────────────────────

/**
 * Debug severity (lowest) - gray, muted appearance
 */
export const Debug: Story = {
  args: {
    severity: 'debug',
  },
  parameters: {
    docs: {
      description: {
        story: 'Debug level - lowest severity, muted gray appearance.',
      },
    },
  },
};

/**
 * Info severity - blue, informational
 */
export const Info: Story = {
  args: {
    severity: 'info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Informational message - blue color indicates neutral information.',
      },
    },
  },
};

/**
 * Warning severity - amber, attention needed
 */
export const Warning: Story = {
  args: {
    severity: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning level - amber color signals that attention may be required.',
      },
    },
  },
};

/**
 * Error severity - red, error occurred
 */
export const Error: Story = {
  args: {
    severity: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error level - red color indicates an error has occurred.',
      },
    },
  },
};

/**
 * Critical severity (highest) - red + bold + ring
 */
export const Critical: Story = {
  args: {
    severity: 'critical',
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical level - highest severity, red + bold + ring emphasizes urgency.',
      },
    },
  },
};

// ─── Variants ─────────────────────────────────────────────────────────────

/**
 * Read-only badge (for log entries) - no dismiss button
 */
export const ReadOnly: Story = {
  args: {
    severity: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only badge variant used in log entry displays. No dismiss button.',
      },
    },
  },
};

/**
 * Dismissible badge (for filters) - with X button
 */
export const Dismissible: Story = {
  args: {
    severity: 'error',
    onRemove: () => console.log('Badge dismissed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dismissible badge variant used in filter chips. Shows X button to remove filter.',
      },
    },
  },
};

// ─── All Severities ───────────────────────────────────────────────────────

/**
 * All severity levels for comparison
 */
export const AllSeverities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <SeverityBadge severity="debug" />
      <SeverityBadge severity="info" />
      <SeverityBadge severity="warning" />
      <SeverityBadge severity="error" />
      <SeverityBadge severity="critical" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All five severity levels side-by-side for visual comparison.',
      },
    },
  },
};

// ─── Filter Chips ─────────────────────────────────────────────────────────

/**
 * Filter chips with dismiss buttons
 */
export const FilterChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SeverityBadge
        severity="info"
        onRemove={() => {}}
      />
      <SeverityBadge
        severity="warning"
        onRemove={() => {}}
      />
      <SeverityBadge
        severity="error"
        onRemove={() => {}}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Filter chips used in log filtering UI. Each badge can be dismissed by clicking the X button.',
      },
    },
  },
};

// ─── In-Context: Log Entry ────────────────────────────────────────────────

/**
 * Badge in realistic log entry context
 */
export const InContext: Story = {
  render: () => (
    <div className="bg-card border-border max-w-md rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <SeverityBadge severity="error" />
            <span className="text-foreground text-sm font-medium">Database connection failed</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Failed to connect to primary database. Attempting failover to replica.
          </p>
        </div>
        <span className="text-muted-foreground whitespace-nowrap text-xs">14:23:45</span>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world example: severity badge as part of a log entry display.',
      },
    },
  },
};
