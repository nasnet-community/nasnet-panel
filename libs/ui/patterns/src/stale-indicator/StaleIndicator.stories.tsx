import { fn } from '@storybook/test';

import { StaleIndicator } from './StaleIndicator';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof StaleIndicator> = {
  title: 'Patterns/StaleIndicator',
  component: StaleIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a warning badge when data is being served from cache — either because the app is offline or the backend is unreachable. Shows a relative timestamp ("5m ago"), an optional inline refresh button, and three size variants. Renders nothing when `isStale` is false.',
      },
    },
  },
  argTypes: {
    isStale: {
      control: 'boolean',
      description: 'Controls visibility — the component is hidden when false',
    },
    isOffline: {
      control: 'boolean',
      description: 'Switches the icon to WifiOff and hides the refresh button',
    },
    isRefreshing: {
      control: 'boolean',
      description: 'Spins the refresh icon and disables the button while in-flight',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size (affects padding, icon, and font size)',
    },
    message: {
      control: 'text',
      description: 'Override the default message string',
    },
    lastUpdated: {
      control: 'date',
      description: 'Timestamp used to compute the relative "last updated" text',
    },
    onRefresh: {
      description: 'Callback fired when the refresh button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaleIndicator>;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** 5 minutes ago */
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
/** 2 hours ago */
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
/** 3 days ago */
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

// ─── Stories ──────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    isStale: true,
    lastUpdated: fiveMinutesAgo,
    isOffline: false,
    isRefreshing: false,
    size: 'md',
    onRefresh: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default stale indicator with a Clock icon, relative timestamp, and a refresh button.',
      },
    },
  },
};

export const Offline: Story = {
  args: {
    isStale: true,
    lastUpdated: twoHoursAgo,
    isOffline: true,
    isRefreshing: false,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Offline mode: the icon switches to WifiOff and the refresh button is hidden (you cannot refresh without a connection).',
      },
    },
  },
};

export const Refreshing: Story = {
  args: {
    isStale: true,
    lastUpdated: fiveMinutesAgo,
    isOffline: false,
    isRefreshing: true,
    size: 'md',
    onRefresh: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'While a refresh is in-flight the spinner animates and the button is disabled.',
      },
    },
  },
};

export const CustomMessage: Story = {
  args: {
    isStale: true,
    lastUpdated: threeDaysAgo,
    isOffline: false,
    isRefreshing: false,
    size: 'md',
    message: 'Showing cached configuration',
    onRefresh: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Override the default message with a domain-specific string (e.g. from a page that knows the data type).',
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <StaleIndicator isStale size="sm" lastUpdated={fiveMinutesAgo} onRefresh={fn()} />
      <StaleIndicator isStale size="md" lastUpdated={fiveMinutesAgo} onRefresh={fn()} />
      <StaleIndicator isStale size="lg" lastUpdated={fiveMinutesAgo} onRefresh={fn()} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All three size variants — sm, md, and lg — scaled proportionally.',
      },
    },
  },
};

export const FreshDataHidden: Story = {
  args: {
    isStale: false,
    lastUpdated: new Date(),
  },
  parameters: {
    docs: {
      description: {
        story: 'When `isStale` is false the component returns null and renders nothing. This story demonstrates the absent output.',
      },
    },
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-[420px] rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">DHCP Leases</h3>
        <StaleIndicator
          isStale
          size="sm"
          lastUpdated={fiveMinutesAgo}
          onRefresh={fn()}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Showing 24 leases — data may have changed since last sync.
      </p>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world placement: a sm StaleIndicator badge inline with a page heading inside a card.',
      },
    },
  },
};
