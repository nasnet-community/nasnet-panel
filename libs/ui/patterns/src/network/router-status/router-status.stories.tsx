/**
 * Router Status Storybook Stories
 *
 * Comprehensive stories for the Router Status component.
 * Demonstrates all states, platform variants, and accessibility features.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */

import { useState } from 'react';

import { MockedProvider } from '@apollo/client/testing';
import type { MockedResponse } from '@apollo/client/testing';
import type { Meta, StoryObj } from '@storybook/react';

import { RouterStatus } from './router-status';
import { RouterStatusDesktop } from './router-status-desktop';
import { RouterStatusMobile } from './router-status-mobile';
import { StatusIndicator } from './status-indicator';
import { ROUTER_STATUS_CHANGED_SUBSCRIPTION } from './use-router-status-subscription';

import type { ConnectionStatus, RouterStatusData, UseRouterStatusReturn } from './types';

// ===== Mock Data =====

const createMockRouterData = (
  status: ConnectionStatus,
  overrides: Partial<RouterStatusData> = {}
): RouterStatusData => ({
  status,
  protocol: 'REST_API',
  latencyMs: 45,
  model: 'hAP ac3',
  version: '7.12.1',
  uptime: '5d 12h 34m',
  lastConnected: new Date(),
  reconnectAttempt: 0,
  maxReconnectAttempts: 5,
  ...overrides,
});

const createMockState = (
  status: ConnectionStatus,
  overrides: Partial<UseRouterStatusReturn> = {}
): UseRouterStatusReturn => {
  const data = createMockRouterData(status, overrides.data);

  return {
    data,
    loading: false,
    error: null,
    isOnline: status === 'CONNECTED',
    statusLabel:
      status === 'CONNECTED'
        ? 'Connected'
        : status === 'CONNECTING'
          ? 'Connecting...'
          : status === 'DISCONNECTED'
            ? 'Disconnected'
            : 'Error',
    lastSeenRelative: status !== 'CONNECTED' ? '30 seconds ago' : null,
    refresh: async () => console.log('Refresh clicked'),
    reconnect: async () => console.log('Reconnect clicked'),
    disconnect: async () => console.log('Disconnect clicked'),
    cancelReconnect: () => console.log('Cancel reconnect clicked'),
    ...overrides,
  };
};

// Apollo mock for subscription
const createSubscriptionMock = (
  routerId: string,
  status: ConnectionStatus
): MockedResponse => ({
  request: {
    query: ROUTER_STATUS_CHANGED_SUBSCRIPTION,
    variables: { routerId },
  },
  result: {
    data: {
      routerStatusChanged: {
        router: {
          id: routerId,
          name: 'Main Router',
          host: '192.168.1.1',
          port: 8728,
          status,
          platform: 'MIKROTIK',
          model: 'hAP ac3',
          version: '7.12.1',
          uptime: '5d 12h 34m',
          lastConnected: new Date().toISOString(),
        },
        previousStatus: 'DISCONNECTED',
        newStatus: status,
        timestamp: new Date().toISOString(),
      },
    },
  },
});

// ===== Meta =====

const meta: Meta<typeof RouterStatus> = {
  title: 'Patterns/Network/RouterStatus',
  component: RouterStatus,
  tags: ['autodocs'],
  decorators: [
    (StoryComponent) => (
      <MockedProvider
        mocks={[createSubscriptionMock('router-1', 'CONNECTED')]}
        addTypename={false}
      >
        <div className="p-4 max-w-md">
          <StoryComponent />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Router Status component displays real-time router connection status.

## Features
- Real-time GraphQL subscription updates
- Platform-adaptive UI (mobile badge vs desktop card)
- Reconnection progress tracking
- Action menu (Refresh, Reconnect, Disconnect)
- ARIA live region for status announcements
- Full keyboard navigation support

## Architecture
Follows the Headless + Platform Presenter pattern (ADR-018):
- \`useRouterStatus\` - Headless hook with all logic
- \`RouterStatusDesktop\` - Desktop card presenter
- \`RouterStatusMobile\` - Mobile badge + sheet presenter
- \`RouterStatus\` - Auto-detecting wrapper
        `,
      },
    },
  },
  argTypes: {
    routerId: {
      description: 'Router ID to subscribe to',
      control: 'text',
    },
    compact: {
      description: 'Force compact badge mode',
      control: 'boolean',
    },
    presenter: {
      description: 'Override platform detection',
      control: 'select',
      options: [undefined, 'mobile', 'desktop'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RouterStatus>;

// ===== Stories =====

/**
 * Connected state showing full details
 */
export const Connected: Story = {
  args: {
    routerId: 'router-1',
  },
  render: () => {
    const state = createMockState('CONNECTED');
    return <RouterStatusDesktop state={state} />;
  },
};

/**
 * Disconnected state with last seen timestamp
 */
export const Disconnected: Story = {
  render: () => {
    const state = createMockState('DISCONNECTED', {
      data: createMockRouterData('DISCONNECTED', {
        lastConnected: new Date(Date.now() - 30000),
        protocol: null,
        latencyMs: null,
      }),
      lastSeenRelative: '30 seconds ago',
    });
    return <RouterStatusDesktop state={state} />;
  },
};

/**
 * Reconnecting state with attempt counter
 */
export const Reconnecting: Story = {
  render: () => {
    const state = createMockState('CONNECTING', {
      data: createMockRouterData('CONNECTING', {
        reconnectAttempt: 2,
        protocol: null,
        latencyMs: null,
      }),
    });
    return <RouterStatusDesktop state={state} />;
  },
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  render: () => {
    const state = createMockState('ERROR', {
      error: new Error('Connection timeout'),
      data: createMockRouterData('ERROR', {
        protocol: null,
        latencyMs: null,
      }),
    });
    return <RouterStatusDesktop state={state} />;
  },
};

/**
 * Mobile compact badge view
 */
export const MobileCompact: Story = {
  render: () => {
    const state = createMockState('CONNECTED');
    return <RouterStatusMobile state={state} />;
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Mobile disconnected badge
 */
export const MobileDisconnected: Story = {
  render: () => {
    const state = createMockState('DISCONNECTED', {
      data: createMockRouterData('DISCONNECTED', {
        lastConnected: new Date(Date.now() - 60000),
      }),
      lastSeenRelative: '1 minute ago',
    });
    return <RouterStatusMobile state={state} />;
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Mobile reconnecting badge
 */
export const MobileReconnecting: Story = {
  render: () => {
    const state = createMockState('CONNECTING', {
      data: createMockRouterData('CONNECTING', {
        reconnectAttempt: 3,
      }),
    });
    return <RouterStatusMobile state={state} />;
  },
  globals: {
    viewport: {
      value: 'mobile1',
      isRotated: false
    }
  },
};

/**
 * Dark mode variant (desktop)
 */
export const DarkMode: Story = {
  decorators: [
    (StoryComponent) => (
      <div className="dark bg-gray-900 p-4 rounded-lg">
        <StoryComponent />
      </div>
    ),
  ],
  render: () => {
    const state = createMockState('CONNECTED');
    return <RouterStatusDesktop state={state} />;
  },
  globals: {
    backgrounds: {
      value: "dark"
    }
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => {
    const state: UseRouterStatusReturn = {
      ...createMockState('DISCONNECTED'),
      loading: true,
    };
    return <RouterStatusDesktop state={state} />;
  },
};

/**
 * Status Indicator sizes
 */
export const StatusIndicatorSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="CONNECTED" size="sm" />
        <span className="text-xs">Small (12px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="CONNECTED" size="md" />
        <span className="text-xs">Medium (16px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="CONNECTED" size="lg" />
        <span className="text-xs">Large (24px)</span>
      </div>
    </div>
  ),
};

/**
 * Status Indicator all states
 */
export const StatusIndicatorStates: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="CONNECTED" size="lg" />
        <span className="text-xs">Connected</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="CONNECTING" size="lg" />
        <span className="text-xs">Connecting</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="DISCONNECTED" size="lg" />
        <span className="text-xs">Disconnected</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <StatusIndicator status="ERROR" size="lg" />
        <span className="text-xs">Error</span>
      </div>
    </div>
  ),
};

/**
 * Interactive demo with status changes
 */
export const Interactive: Story = {
  render: function InteractiveDemo() {
    const [status, setStatus] = useState<ConnectionStatus>('CONNECTED');

    const state = createMockState(status, {
      data: createMockRouterData(status, {
        reconnectAttempt: status === 'CONNECTING' ? 2 : 0,
      }),
      lastSeenRelative: status !== 'CONNECTED' ? '30 seconds ago' : null,
    });

    return (
      <div className="space-y-4">
        {/* Status selector */}
        <div className="flex gap-2">
          {(['CONNECTED', 'CONNECTING', 'DISCONNECTED', 'ERROR'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded text-sm ${
                status === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Component */}
        <RouterStatusDesktop state={state} />
      </div>
    );
  },
};

/**
 * Accessibility demo with visible ARIA announcements
 */
export const Accessibility: Story = {
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
  render: function AccessibilityDemo() {
    const [status, setStatus] = useState<ConnectionStatus>('CONNECTED');
    const [announcement, setAnnouncement] = useState<string | null>(null);

    const state = createMockState(status);

    const handleStatusChange = () => {
      const nextStatus =
        status === 'CONNECTED'
          ? 'DISCONNECTED'
          : status === 'DISCONNECTED'
            ? 'CONNECTING'
            : status === 'CONNECTING'
              ? 'ERROR'
              : 'CONNECTED';

      setStatus(nextStatus);
      setAnnouncement(
        `Router status changed to ${nextStatus === 'CONNECTED' ? 'Connected' : nextStatus === 'CONNECTING' ? 'Connecting' : nextStatus === 'DISCONNECTED' ? 'Disconnected' : 'Error'}`
      );

      // Clear announcement after 3 seconds
      setTimeout(() => setAnnouncement(null), 3000);
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the button to cycle through status changes and see ARIA live announcements.
        </p>

        <button
          onClick={handleStatusChange}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Change Status
        </button>

        <RouterStatusDesktop state={state} />

        {/* Visible ARIA announcement (for demo purposes) */}
        {announcement && (
          <div
            className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
            aria-hidden="true"
          >
            <strong>Screen reader would announce:</strong> {announcement}
          </div>
        )}
      </div>
    );
  },
};
