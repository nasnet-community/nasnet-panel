/**
 * SessionExpiringDialog Storybook Stories
 * Session timeout warnings with countdown and extension options
 */

import { fn } from 'storybook/test';
import { SessionExpiringDialog, useSessionExpiring } from './SessionExpiringDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SessionExpiringDialog> = {
  title: 'Patterns/Common/SessionExpiringDialog',
  component: SessionExpiringDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Modal dialog warning users of upcoming session expiration with countdown timer and options to extend or logout.',
      },
    },
    layout: 'padded',
  },
  args: {
    warningThreshold: 300,
    autoLogout: true,
    onExtendSession: fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
    onSessionExpired: fn(),
  },
  argTypes: {
    warningThreshold: {
      control: { type: 'number', min: 60, max: 600, step: 60 },
      description: 'Time in seconds before expiry to show warning',
    },
    autoLogout: {
      control: 'boolean',
      description: 'Auto-logout when countdown reaches zero',
    },
    onExtendSession: {
      action: 'onExtendSession',
      description: 'Callback when user extends session',
    },
    onSessionExpired: {
      action: 'onSessionExpired',
      description: 'Callback when session expires or user logs out',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionExpiringDialog>;

/**
 * Default state - 5 minutes remaining (normal)
 */
export const Default: Story = {
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * 2 minutes remaining (urgent state - amber)
 */
export const Urgent: Story = {
  args: {
    warningThreshold: 120,
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * 30 seconds remaining (critical state - red with pulse)
 */
export const Critical: Story = {
  args: {
    warningThreshold: 30,
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * Without extend session option
 */
export const NoExtendOption: Story = {
  args: {
    // Don't provide onExtendSession callback
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * Custom warning threshold (1 minute)
 */
export const CustomThreshold: Story = {
  args: {
    warningThreshold: 60,
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * Manual presenter override - mobile layout
 */
export const MobileLayout: Story = {
  args: {
    warningThreshold: 120,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * Manual presenter override - desktop layout
 */
export const DesktopLayout: Story = {
  args: {
    warningThreshold: 120,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: (args) => <SessionExpiringDialog {...args} />,
};

/**
 * Hook usage example
 */
export const HookUsage: Story = {
  render: () => {
    function HookExample() {
      const { timeRemaining, isExpiring, isExpired } = useSessionExpiring(300);

      return (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          <div>
            <p className="text-sm font-medium">Time Remaining:</p>
            <p className="text-lg font-mono font-bold">
              {timeRemaining !== null ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">Status:</p>
            <p className="text-sm text-muted-foreground">
              {isExpired ? 'Expired' : isExpiring ? 'Expiring' : 'Active'}
            </p>
          </div>
        </div>
      );
    }

    return <HookExample />;
  },
};
