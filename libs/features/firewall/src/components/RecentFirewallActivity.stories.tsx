/**
 * RecentFirewallActivity Storybook Stories
 *
 * Stories for the firewall recent activity placeholder widget.
 * Demonstrates the two internal branches (logging not configured vs. no activity).
 *
 * @module @nasnet/features/firewall
 */

import { RecentFirewallActivity } from './RecentFirewallActivity';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * RecentFirewallActivity - Firewall log activity panel
 *
 * A dashboard widget that surfaces recent firewall events (blocked connections,
 * dropped packets, etc.). The component has two display modes controlled by an
 * internal `hasLogging` flag:
 *
 * - **Logging not configured** (`hasLogging = false`): Info icon with a prompt to
 *   enable firewall logging rules so events can be tracked.
 * - **No recent activity** (`hasLogging = true`): Green tick icon indicating
 *   the firewall is quiet — no blocked connections in the last hour.
 *
 * ## Features
 *
 * - **Activity header**: Clock icon + "Recent Activity" title
 * - **Logging-disabled state**: Info icon, "Logging Not Configured" message
 * - **Quiet state**: Green check icon, "No Recent Activity" message
 * - **className passthrough**: Additional styles for layout integration
 *
 * ## Notes
 *
 * The `hasLogging` flag is currently hard-coded to `false` (Phase 1). A future
 * iteration will connect this component to the router's log stream and render
 * real event rows.
 *
 * ## Usage
 *
 * ```tsx
 * import { RecentFirewallActivity } from '@nasnet/features/firewall';
 *
 * function FirewallOverview() {
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <FirewallQuickStats />
 *       <RecentFirewallActivity />
 *     </div>
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Features/Firewall/RecentFirewallActivity',
  component: RecentFirewallActivity,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dashboard widget showing recent firewall log events. ' +
          'Currently displays either a "logging not configured" prompt or a ' +
          '"no recent activity" confirmation depending on the logging state.',
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the outer card container',
    },
  },
} satisfies Meta<typeof RecentFirewallActivity>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * The component in its default state (`hasLogging = false`).
 * Shows the "Logging Not Configured" prompt with an info icon.
 * This is the most common real-world state for a fresh router deployment.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Default state when firewall logging has not been enabled. ' +
          'Displays an Info icon and instructs the user to enable logging rules.',
      },
    },
  },
};

/**
 * LoggingNotConfigured
 *
 * Explicit story for the "logging not configured" branch.
 * Mirrors the Default story but is named to make the intent clear in docs.
 */
export const LoggingNotConfigured: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Logging branch: `hasLogging = false`. The info icon and "Logging Not Configured" ' +
          'message guide the user to add logging rules to their firewall filter chain.',
      },
    },
  },
};

/**
 * WithClassName
 *
 * Demonstrates passing a custom className for layout integration.
 * The outer card receives `shadow-xl` and `max-w-sm` in addition to its defaults.
 */
export const WithClassName: Story = {
  args: {
    className: 'shadow-xl max-w-sm',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Custom className applied to the card container. Useful for embedding the widget ' +
          'inside a dashboard grid with explicit sizing and shadow overrides.',
      },
    },
  },
};

/**
 * NarrowLayout
 *
 * The widget at a narrow width (220px) to verify text wrapping and icon
 * centering behave correctly in tight sidebar contexts.
 */
export const NarrowLayout: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Narrow 224px container. Verifies the icon, text, and padding remain ' +
          'legible and correctly centred in tight sidebar or panel contexts.',
      },
    },
  },
};

/**
 * DarkMode
 *
 * The widget rendered within a dark-mode context using the `dark` class wrapper.
 * Validates that dark bg/border/text classes apply correctly.
 */
export const DarkMode: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="dark w-72 rounded-xl bg-slate-950 p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Dark mode preview. The card uses `dark:bg-slate-900` and ' +
          '`dark:border-slate-800` classes to adapt to dark themes.',
      },
    },
  },
};

/**
 * InDashboardGrid
 *
 * Shows the widget as it would appear inside a two-column dashboard grid
 * alongside a FirewallQuickStats placeholder. Useful for visual regression checks.
 */
export const InDashboardGrid: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="grid w-[600px] grid-cols-2 gap-4">
        {/* Sibling placeholder */}
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          FirewallQuickStats
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          'Widget placed inside a 2-column dashboard grid next to a FirewallQuickStats placeholder. ' +
          'Verifies height, spacing, and border consistency between sibling cards.',
      },
    },
  },
};
