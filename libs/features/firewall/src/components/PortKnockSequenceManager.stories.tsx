/**
 * Port Knock Sequence Manager Stories
 * Manages the list of port knock sequences with CRUD operations
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { PortKnockSequenceManager } from './PortKnockSequenceManager';

// Mock sequence data
const mockSequences = [
  {
    id: '1',
    name: 'ssh-protection',
    knockPorts: [
      { port: 1234, protocol: 'tcp', order: 1 },
      { port: 5678, protocol: 'tcp', order: 2 },
    ],
    protectedPort: 22,
    protectedProtocol: 'tcp',
    accessTimeout: '1h',
    knockTimeout: '10s',
    enabled: true,
    routerId: 'router-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    recentAccessCount: 5,
    generatedRuleIds: ['rule-1', 'rule-2', 'rule-3'],
  },
  {
    id: '2',
    name: 'web-server',
    knockPorts: [
      { port: 7000, protocol: 'tcp', order: 1 },
      { port: 8000, protocol: 'tcp', order: 2 },
      { port: 9000, protocol: 'tcp', order: 3 },
    ],
    protectedPort: 443,
    protectedProtocol: 'tcp',
    accessTimeout: '2h',
    knockTimeout: '15s',
    enabled: true,
    routerId: 'router-1',
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    recentAccessCount: 12,
    generatedRuleIds: ['rule-4', 'rule-5', 'rule-6', 'rule-7'],
  },
  {
    id: '3',
    name: 'rdp-access',
    knockPorts: [
      { port: 4000, protocol: 'tcp', order: 1 },
      { port: 5000, protocol: 'tcp', order: 2 },
      { port: 6000, protocol: 'tcp', order: 3 },
      { port: 7000, protocol: 'tcp', order: 4 },
    ],
    protectedPort: 3389,
    protectedProtocol: 'tcp',
    accessTimeout: '30m',
    knockTimeout: '5s',
    enabled: false,
    routerId: 'router-1',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    recentAccessCount: 0,
    generatedRuleIds: ['rule-8', 'rule-9'],
  },
];

// Apollo mock for sequences query
const mocks = [
  {
    request: {
      query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_SEQUENCES,
      variables: { routerId: 'router-1' },
    },
    result: {
      data: {
        portKnockSequences: mockSequences,
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: require('@nasnet/api-client/queries').GET_PORT_KNOCK_SEQUENCES,
      variables: { routerId: 'router-1' },
    },
    result: {
      data: {
        portKnockSequences: [],
      },
    },
  },
];

function StoryWrapper({ children }: { children: React.ReactNode }) {
  // Mock connection store
  return <div className="p-4">{children}</div>;
}

const meta: Meta<typeof PortKnockSequenceManager> = {
  title: 'Features/Firewall/PortKnockSequenceManager',
  component: PortKnockSequenceManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Manages port knock sequences with platform-aware rendering (Desktop table, Mobile cards).',
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
  argTypes: {
    onEdit: {
      description: 'Callback when edit button is clicked',
      action: 'onEdit',
    },
    onCreate: {
      description: 'Callback when create button is clicked',
      action: 'onCreate',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PortKnockSequenceManager>;

/**
 * Default state with multiple sequences
 */
export const Default: Story = {
  args: {},
};

/**
 * Empty state - No sequences configured
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

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    onEdit: (id: string) => console.log('Edit sequence:', id),
    onCreate: () => console.log('Create new sequence'),
  },
};
