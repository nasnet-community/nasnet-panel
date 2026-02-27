/**
 * AlertBadge Storybook Stories
 *
 * Demonstrates the header notification count badge with various alert counts
 * and states, using MockedProvider to simulate GraphQL data.
 */

import { gql } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';

import { AlertBadge } from './AlertBadge';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// GraphQL mock query (matches the internal GET_ALERTS query in useAlerts hook)
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

// =============================================================================
// Mock helpers
// =============================================================================

function createAlertsMock(totalCount: number, deviceId?: string) {
  return [
    {
      request: {
        query: GET_ALERTS,
        variables: {
          deviceId,
          severity: undefined,
          acknowledged: false,
          limit: 0,
          offset: 0,
        },
      },
      result: {
        data: {
          alerts: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalCount,
          },
        },
      },
    },
  ];
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertBadge> = {
  title: 'Features/Alerts/AlertBadge',
  component: AlertBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**AlertBadge** displays a count of unacknowledged alerts in a compact badge format.

- Fetches live count via GraphQL subscription
- Returns \`null\` when count is 0 (renders nothing)
- Displays \`99+\` when count exceeds 99
- Accessible: uses \`aria-label\` with exact count
- Styled with \`bg-destructive\` for immediate visual urgency
        `,
      },
    },
  },
  argTypes: {
    deviceId: {
      control: 'text',
      description: 'Optional device ID to scope alert count to a single router',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for custom positioning/sizing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertBadge>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Single unacknowledged alert — minimal count.
 */
export const SingleAlert: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(1)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows a badge with count "1" when there is a single unacknowledged alert.',
      },
    },
  },
};

/**
 * Multiple alerts — typical operational state with several active alerts.
 */
export const MultipleAlerts: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(7)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Badge showing count of 7 unacknowledged alerts — a common fleet scenario.',
      },
    },
  },
};

/**
 * High alert count — badge truncates to "99+" beyond 99 items.
 */
export const OverflowCount: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(142)}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'When total count exceeds 99 the badge displays "99+" to prevent layout overflow.',
      },
    },
  },
};

/**
 * Zero alerts — badge renders nothing (null).
 * The story wrapper shows a placeholder to confirm it is invisible.
 */
export const ZeroAlerts: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(0)}
        addTypename={false}
      >
        <div className="gap-component-sm p-component-md border-muted-foreground/30 text-muted-foreground relative inline-flex items-center rounded-md border border-dashed text-sm">
          Bell icon (badge renders nothing here)
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When there are no unacknowledged alerts the component returns null and renders nothing.',
      },
    },
  },
};

/**
 * Scoped to a specific device — filters the alert count by router ID.
 */
export const DeviceScoped: Story = {
  args: {
    deviceId: 'router-abc-123',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(3, 'router-abc-123')}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Badge scoped to a specific device ID, showing only alerts for that router.',
      },
    },
  },
};

/**
 * Custom className — badge positioned inside a mock header icon.
 */
export const InsideHeaderIcon: Story = {
  args: {
    className: 'absolute -top-1 -right-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={createAlertsMock(5)}
        addTypename={false}
      >
        <div className="border-border bg-muted relative inline-flex h-10 w-10 items-center justify-center rounded-md border">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-foreground h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Badge overlaid on a bell icon using absolute positioning — typical header usage pattern.',
      },
    },
  },
};
