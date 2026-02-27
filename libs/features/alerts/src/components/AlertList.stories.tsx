/**
 * AlertList Storybook Stories
 *
 * Covers all render states of the AlertList component:
 * active alerts, acknowledged alerts, loading, error, empty, and paginated.
 */

import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';

import { AlertList } from './AlertList';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Shared GraphQL fragments — must match queries in useAlerts hook
// =============================================================================

const GET_ALERTS = gql`
  query GetAlerts(
    $deviceId: ID
    $severity: AlertSeverity
    $acknowledged: Boolean
    $limit: Int
    $offset: Int
  ) {
    alerts(
      deviceId: $deviceId
      severity: $severity
      acknowledged: $acknowledged
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          ruleId
          eventType
          severity
          title
          message
          data
          deviceId
          triggeredAt
          acknowledgedAt
          acknowledgedBy
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const _ALERT_EVENTS_SUBSCRIPTION = gql`
  subscription AlertEvents($deviceId: ID) {
    alertEvents(deviceId: $deviceId) {
      alert {
        id
        ruleId
        eventType
        severity
        title
        message
        data
        deviceId
        triggeredAt
        acknowledgedAt
        acknowledgedBy
      }
      action
    }
  }
`;

const _ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($alertId: ID!) {
    acknowledgeAlert(alertId: $alertId) {
      alert {
        id
        acknowledgedAt
        acknowledgedBy
      }
      errors {
        code
        message
      }
    }
  }
`;

// =============================================================================
// Inline mock alert data
// =============================================================================

const baseAlertNode = {
  ruleId: 'rule-001',
  eventType: 'device.cpu.high',
  deviceId: 'router-main',
  acknowledgedAt: null as string | null,
  acknowledgedBy: null as string | null,
  data: null as Record<string, any> | null,
};

const mockAlerts = [
  {
    node: {
      ...baseAlertNode,
      id: 'alert-001',
      severity: 'CRITICAL' as const,
      title: 'CPU Usage Critical',
      message: 'CPU usage has exceeded 95% for more than 5 minutes.',
      triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    cursor: 'cursor-001',
  },
  {
    node: {
      ...baseAlertNode,
      id: 'alert-002',
      ruleId: 'rule-002',
      eventType: 'vpn.tunnel.down',
      severity: 'WARNING' as const,
      title: 'VPN Tunnel Disconnected',
      message: 'WireGuard tunnel wg0 has been down for 2 minutes.',
      triggeredAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    cursor: 'cursor-002',
  },
  {
    node: {
      ...baseAlertNode,
      id: 'alert-003',
      ruleId: 'rule-003',
      eventType: 'interface.down',
      severity: 'INFO' as const,
      title: 'Interface ether2 Down',
      message: 'Ethernet interface ether2 has lost link.',
      triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    cursor: 'cursor-003',
  },
];

const acknowledgedAlerts = [
  {
    node: {
      ...baseAlertNode,
      id: 'alert-ack-001',
      severity: 'WARNING' as const,
      title: 'Memory Usage High',
      message: 'Memory utilization reached 82%.',
      triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      acknowledgedBy: 'admin',
    },
    cursor: 'cursor-ack-001',
  },
  {
    node: {
      ...baseAlertNode,
      id: 'alert-ack-002',
      severity: 'INFO' as const,
      title: 'DHCP Lease Pool Low',
      message: 'DHCP pool has fewer than 10 addresses remaining.',
      triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      acknowledgedBy: 'admin',
    },
    cursor: 'cursor-ack-002',
  },
];

const queuedAlerts = [
  {
    node: {
      ...baseAlertNode,
      id: 'alert-queued-001',
      severity: 'WARNING' as const,
      title: 'Backup Failed',
      message: 'Scheduled backup to USB storage failed — device not mounted.',
      triggeredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      data: { queuedUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() },
    },
    cursor: 'cursor-q-001',
  },
  {
    node: {
      ...baseAlertNode,
      id: 'alert-queued-002',
      severity: 'CRITICAL' as const,
      title: 'Firewall Attack Detected',
      message: 'Port scan detected from 203.0.113.45 — rule triggered.',
      triggeredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      data: { shouldBypassQuietHours: true },
    },
    cursor: 'cursor-q-002',
  },
];

// =============================================================================
// Mock factory
// =============================================================================

function buildMocks(
  alerts: typeof mockAlerts,
  options: {
    deviceId?: string;
    severity?: string;
    acknowledged?: boolean;
    limit?: number;
    totalCount?: number;
    hasNextPage?: boolean;
    delay?: number;
  } = {}
) {
  const {
    deviceId,
    severity,
    acknowledged = false,
    limit = 50,
    totalCount,
    hasNextPage = false,
    delay = 100,
  } = options;

  return [
    {
      request: {
        query: GET_ALERTS,
        variables: {
          deviceId,
          severity,
          acknowledged,
          limit,
          offset: 0,
        },
      },
      result: {
        data: {
          alerts: {
            edges: alerts,
            pageInfo: {
              hasNextPage,
              hasPreviousPage: false,
              startCursor: alerts[0]?.cursor ?? null,
              endCursor: alerts[alerts.length - 1]?.cursor ?? null,
            },
            totalCount: totalCount ?? alerts.length,
          },
        },
      },
      delay,
    },
  ];
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertList> = {
  title: 'Features/Alerts/AlertList',
  component: AlertList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**AlertList** displays a filterable, real-time list of alerts with severity color coding.

**Features:**
- Color-coded left border per severity (Critical / Warning / Info)
- Severity badge inline with alert title
- One-click acknowledge button with loading state
- QueuedAlertBadge for quiet-hours status
- Real-time updates via GraphQL subscription
- Pagination support with "Load more" link
- Loading skeleton, error, and empty states
        `,
      },
    },
  },
  argTypes: {
    severity: {
      control: 'select',
      options: [undefined, 'CRITICAL', 'WARNING', 'INFO'],
    },
    shouldShowAcknowledged: {
      control: 'boolean',
    },
    limit: {
      control: { type: 'number', min: 1, max: 100 },
    },
    deviceId: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertList>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — mixed severity unacknowledged alerts.
 */
export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks(mockAlerts)}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Default view showing three unacknowledged alerts across all severities.',
      },
    },
  },
};

/**
 * With Queued Alerts — alerts carrying quiet-hours metadata badges.
 */
export const WithQueuedAlerts: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks(queuedAlerts)}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows QueuedAlertBadge for an alert held in the quiet-hours queue and one that bypassed quiet hours due to CRITICAL severity.',
      },
    },
  },
};

/**
 * Acknowledged — historical view with greyed-out acknowledged entries.
 */
export const Acknowledged: Story = {
  args: {
    shouldShowAcknowledged: true,
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks(acknowledgedAlerts, { acknowledged: true })}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Acknowledged alerts rendered at reduced opacity with acknowledgment metadata (who + when).',
      },
    },
  },
};

/**
 * Filtered by Critical severity only.
 */
export const CriticalOnly: Story = {
  args: {
    severity: 'CRITICAL',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks([mockAlerts[0]], { severity: 'CRITICAL' })}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'List filtered to CRITICAL severity alerts only.',
      },
    },
  },
};

/**
 * Empty — no alerts match the current filters.
 */
export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks([])}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Empty state shown when no alerts are active — "All caught up" messaging.',
      },
    },
  },
};

/**
 * Loading — network request in flight.
 */
export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={buildMocks(mockAlerts, { delay: 10_000 })}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Spinner loading state while the GraphQL query is in flight.',
      },
    },
  },
};

/**
 * Error — GraphQL query failed.
 */
export const ErrorState: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERTS,
              variables: {
                deviceId: undefined,
                severity: undefined,
                acknowledged: false,
                limit: 50,
                offset: 0,
              },
            },
            error: new Error('Network error: Unable to reach the backend service'),
          },
        ]}
        addTypename={false}
      >
        <div className="max-w-2xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error banner displayed when the alerts query fails.',
      },
    },
  },
};
