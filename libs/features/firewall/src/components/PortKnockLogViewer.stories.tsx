/**
 * Port Knock Log Viewer Stories
 * Displays port knock attempt log with filtering and pagination
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { PortKnockLogViewer } from './PortKnockLogViewer';

// Mock log attempt data
const mockAttempts = [
  {
    id: '1',
    sequenceId: 'seq-1',
    sequenceName: 'ssh-protection',
    sourceIP: '203.0.113.45',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'success',
    portsHit: [1234, 5678],
    protectedPort: 22,
    progress: { current: 2, total: 2 },
  },
  {
    id: '2',
    sequenceId: 'seq-2',
    sequenceName: 'web-server',
    sourceIP: '198.51.100.32',
    timestamp: '2024-01-15T10:25:00Z',
    status: 'failed',
    portsHit: [7000, 1111],
    protectedPort: 443,
    progress: { current: 2, total: 3 },
  },
  {
    id: '3',
    sequenceId: 'seq-1',
    sequenceName: 'ssh-protection',
    sourceIP: '192.0.2.100',
    timestamp: '2024-01-15T10:20:00Z',
    status: 'partial',
    portsHit: [1234],
    protectedPort: 22,
    progress: { current: 1, total: 2 },
  },
  {
    id: '4',
    sequenceId: 'seq-3',
    sequenceName: 'rdp-access',
    sourceIP: '203.0.113.45',
    timestamp: '2024-01-15T10:15:00Z',
    status: 'success',
    portsHit: [4000, 5000, 6000, 7000],
    protectedPort: 3389,
    progress: { current: 4, total: 4 },
  },
  {
    id: '5',
    sequenceId: 'seq-2',
    sequenceName: 'web-server',
    sourceIP: '198.51.100.50',
    timestamp: '2024-01-15T10:10:00Z',
    status: 'failed',
    portsHit: [7000],
    protectedPort: 443,
    progress: { current: 1, total: 3 },
  },
  {
    id: '6',
    sequenceId: 'seq-1',
    sequenceName: 'ssh-protection',
    sourceIP: '192.0.2.150',
    timestamp: '2024-01-15T10:05:00Z',
    status: 'success',
    portsHit: [1234, 5678],
    protectedPort: 22,
    progress: { current: 2, total: 2 },
  },
  {
    id: '7',
    sequenceId: 'seq-2',
    sequenceName: 'web-server',
    sourceIP: '203.0.113.75',
    timestamp: '2024-01-15T10:00:00Z',
    status: 'partial',
    portsHit: [7000, 8000],
    protectedPort: 443,
    progress: { current: 2, total: 3 },
  },
  {
    id: '8',
    sequenceId: 'seq-1',
    sequenceName: 'ssh-protection',
    sourceIP: '198.51.100.99',
    timestamp: '2024-01-15T09:55:00Z',
    status: 'failed',
    portsHit: [1234, 9999],
    protectedPort: 22,
    progress: { current: 2, total: 2 },
  },
];

// Apollo mock for log query
const mocks = [
  {
    request: {
      query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_LOG,
      variables: { routerId: 'router-1', filters: {} },
    },
    result: {
      data: {
        portKnockLog: {
          edges: mockAttempts.map((attempt) => ({
            cursor: attempt.id,
            node: attempt,
          })),
          pageInfo: {
            hasNextPage: true,
            endCursor: '8',
          },
          totalCount: mockAttempts.length,
        },
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_LOG,
      variables: { routerId: 'router-1', filters: {} },
    },
    result: {
      data: {
        portKnockLog: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
          totalCount: 0,
        },
      },
    },
  },
];

function StoryWrapper({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

const meta: Meta<typeof PortKnockLogViewer> = {
  title: 'Features/Firewall/PortKnockLogViewer',
  component: PortKnockLogViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays port knock attempt log with infinite scroll, filtering, and export functionality.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <StoryWrapper>
          <Story />
        </StoryWrapper>
      </MockedProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PortKnockLogViewer>;

/**
 * Default state with knock attempts
 */
export const Default: Story = {
  args: {},
};

/**
 * Empty state - No knock attempts
 */
export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <StoryWrapper>
          <Story />
        </StoryWrapper>
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <StoryWrapper>
          <Story />
        </StoryWrapper>
      </MockedProvider>
    ),
  ],
};

/**
 * Filtered by status (Success only)
 */
export const FilteredBySuccess: Story = {
  args: {},
  decorators: [
    (Story) => {
      const filteredMocks = [
        {
          request: {
            query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_LOG,
            variables: { routerId: 'router-1', filters: { status: 'success' } },
          },
          result: {
            data: {
              portKnockLog: {
                edges: mockAttempts
                  .filter((a) => a.status === 'success')
                  .map((attempt) => ({
                    cursor: attempt.id,
                    node: attempt,
                  })),
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
                totalCount: mockAttempts.filter((a) => a.status === 'success').length,
              },
            },
          },
        },
      ];
      return (
        <MockedProvider mocks={filteredMocks} addTypename={false}>
          <StoryWrapper>
            <Story />
          </StoryWrapper>
        </MockedProvider>
      );
    },
  ],
};

/**
 * Filtered by IP address
 */
export const FilteredByIP: Story = {
  args: {},
  decorators: [
    (Story) => {
      const filteredMocks = [
        {
          request: {
            query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_LOG,
            variables: { routerId: 'router-1', filters: { sourceIP: '203.0.113.45' } },
          },
          result: {
            data: {
              portKnockLog: {
                edges: mockAttempts
                  .filter((a) => a.sourceIP === '203.0.113.45')
                  .map((attempt) => ({
                    cursor: attempt.id,
                    node: attempt,
                  })),
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
                totalCount: mockAttempts.filter((a) => a.sourceIP === '203.0.113.45').length,
              },
            },
          },
        },
      ];
      return (
        <MockedProvider mocks={filteredMocks} addTypename={false}>
          <StoryWrapper>
            <Story />
          </StoryWrapper>
        </MockedProvider>
      );
    },
  ],
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
