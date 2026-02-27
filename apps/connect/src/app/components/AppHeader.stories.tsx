/**
 * AppHeader Stories
 *
 * AppHeader relies on Zustand stores (connection, alert-notification) and
 * TanStack Router's `useNavigate`. Each story uses a thin wrapper that pre-seeds
 * the stores so the component renders without a live router or backend.
 */

import { useEffect } from 'react';

import { useConnectionStore, useAlertNotificationStore } from '@nasnet/state/stores';

import { AppHeader } from './AppHeader';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Story helpers: seed stores before rendering
// ---------------------------------------------------------------------------

type SeedProps = {
  connectionState: 'connected' | 'reconnecting' | 'disconnected';
  routerIp?: string;
  unreadCount?: number;
};

function SeedStores({ connectionState, routerIp = '', unreadCount = 0 }: SeedProps) {
  useEffect(() => {
    // Seed connection store
    const _connStore = useConnectionStore.getState() as {
      setState?: (s: object) => void;
    };
    // zustand stores expose setState via the store itself
    useConnectionStore.setState({ state: connectionState, currentRouterIp: routerIp });

    // Seed notification store
    const notifStore = useAlertNotificationStore.getState();
    notifStore.clearAll();
    for (let i = 0; i < unreadCount; i++) {
      notifStore.addNotification({
        alertId: `alert-${i}`,
        title: `Alert #${i + 1}`,
        message: `This is a sample notification message for alert ${i + 1}.`,
        severity:
          i % 3 === 0 ? 'CRITICAL'
          : i % 3 === 1 ? 'WARNING'
          : 'INFO',
      });
    }
  }, [connectionState, routerIp, unreadCount]);

  return null;
}

/** Wrapper that provides store context, then renders AppHeader inside a header bar */
function AppHeaderStory(props: SeedProps) {
  return (
    <div style={{ width: '375px' }}>
      <SeedStores {...props} />
      <div className="bg-background border-border h-16 border-b">
        <AppHeader />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AppHeaderStory> = {
  title: 'App/AppHeader',
  component: AppHeaderStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Application header used across the mobile shell. Displays the brand logo, ' +
          'current connection status (connected / reconnecting / disconnected), ' +
          'a theme toggle, notification bell with unread badge, and a contextual more-options button. ' +
          'When connected, it shows the active router IP address; otherwise "NasNetConnect".',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppHeaderStory>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Connected: Story = {
  args: {
    connectionState: 'connected',
    routerIp: '192.168.88.1',
    unreadCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Header with an active router connection. The router IP is shown as the display name and the status indicator is green.',
      },
    },
  },
};

export const ConnectedWithNotifications: Story = {
  args: {
    connectionState: 'connected',
    routerIp: '192.168.88.1',
    unreadCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Connected state with 5 unread notifications — the bell shows a numeric badge.',
      },
    },
  },
};

export const Reconnecting: Story = {
  args: {
    connectionState: 'reconnecting',
    routerIp: '',
    unreadCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Transitional state while the app re-establishes a lost connection. The amber dot pulses.',
      },
    },
  },
};

export const Disconnected: Story = {
  args: {
    connectionState: 'disconnected',
    routerIp: '',
    unreadCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully offline state. The display name falls back to "NasNetConnect" and the status dot is red.',
      },
    },
  },
};

export const DisconnectedWithManyNotifications: Story = {
  args: {
    connectionState: 'disconnected',
    routerIp: '',
    unreadCount: 12,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disconnected with a large number of unread notifications, verifying badge overflow display.',
      },
    },
  },
};

/**
 * Mobile viewport story – verifies the header adapts to narrow screens.
 */
export const Mobile: Story = {
  args: {
    connectionState: 'connected',
    routerIp: '192.168.88.1',
    unreadCount: 3,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'AppHeader rendered on a mobile viewport (375px). Logo, connection status, and notification bell are properly spaced for touch interaction.',
      },
    },
  },
};

/**
 * Desktop viewport story – verifies the header layout optimized for larger screens.
 */
export const Desktop: Story = {
  args: {
    connectionState: 'connected',
    routerIp: '192.168.88.1',
    unreadCount: 0,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'AppHeader rendered on a desktop viewport (1280px+). Full-width layout with spacious controls and clear visual hierarchy.',
      },
    },
  },
};
