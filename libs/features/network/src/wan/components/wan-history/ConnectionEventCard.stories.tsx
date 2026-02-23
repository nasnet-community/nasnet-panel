/**
 * Storybook stories for ConnectionEventCard and ConnectionEventCardCompact.
 *
 * Covers all five event types (CONNECTED, DISCONNECTED, AUTH_FAILED, IP_CHANGED,
 * RECONNECTING) plus edge-case stories (no optional fields, long reason text).
 */

import {
  ConnectionEventCard,
  ConnectionEventCardCompact,
} from './ConnectionEventCard';

import type { ConnectionEventData } from '../../types/wan.types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const baseTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago

const connectedEvent: ConnectionEventData = {
  id: 'evt-001',
  wanInterfaceId: 'ether1-wan',
  eventType: 'CONNECTED',
  timestamp: baseTimestamp,
  publicIP: '203.0.113.42',
  gateway: '203.0.113.1',
};

const disconnectedEvent: ConnectionEventData = {
  id: 'evt-002',
  wanInterfaceId: 'ether1-wan',
  eventType: 'DISCONNECTED',
  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  reason: 'Physical link down (carrier lost)',
  duration: 3600, // 1 hour uptime before disconnection
};

const authFailedEvent: ConnectionEventData = {
  id: 'evt-003',
  wanInterfaceId: 'pppoe-isp',
  eventType: 'AUTH_FAILED',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  reason: 'PAP/CHAP authentication rejected by peer: invalid credentials',
};

const ipChangedEvent: ConnectionEventData = {
  id: 'evt-004',
  wanInterfaceId: 'ether1-wan',
  eventType: 'IP_CHANGED',
  timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  publicIP: '198.51.100.88',
  gateway: '198.51.100.1',
  reason: 'DHCP lease renewed with new address',
};

const reconnectingEvent: ConnectionEventData = {
  id: 'evt-005',
  wanInterfaceId: 'lte1',
  eventType: 'RECONNECTING',
  timestamp: new Date(Date.now() - 90 * 1000).toISOString(),
  reason: 'Lost signal; retrying connection (attempt 3 of 5)',
};

const unknownEvent: ConnectionEventData = {
  id: 'evt-006',
  wanInterfaceId: 'ether2',
  eventType: 'HEALTH_CHECK_FAILED',
  timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  reason: 'Ping target 8.8.8.8 unreachable (3 consecutive failures)',
};

// ---------------------------------------------------------------------------
// Meta – ConnectionEventCard (full/desktop view)
// ---------------------------------------------------------------------------

const meta: Meta<typeof ConnectionEventCard> = {
  title: 'Features/Network/WAN/ConnectionEventCard',
  component: ConnectionEventCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Timeline event card for individual WAN connection events. Renders an icon, ' +
          'badge, relative timestamp, and optional IP/gateway/duration/reason details. ' +
          'Use `ConnectionEventCardCompact` for mobile/narrow views.',
      },
    },
  },
  argTypes: {
    showInterface: {
      control: 'boolean',
      description: 'Whether to display the WAN interface name next to the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionEventCard>;

// ---------------------------------------------------------------------------
// Stories – ConnectionEventCard
// ---------------------------------------------------------------------------

export const Connected: Story = {
  name: 'Connected',
  args: {
    event: connectedEvent,
    showInterface: true,
  },
};

export const Disconnected: Story = {
  name: 'Disconnected',
  args: {
    event: disconnectedEvent,
    showInterface: true,
  },
};

export const AuthFailed: Story = {
  name: 'Auth Failed',
  args: {
    event: authFailedEvent,
    showInterface: true,
  },
};

export const IpChanged: Story = {
  name: 'IP Changed',
  args: {
    event: ipChangedEvent,
    showInterface: true,
  },
};

export const Reconnecting: Story = {
  name: 'Reconnecting',
  args: {
    event: reconnectingEvent,
    showInterface: true,
  },
};

export const UnknownEventType: Story = {
  name: 'Unknown Event Type',
  args: {
    event: unknownEvent,
    showInterface: false,
  },
};

export const MinimalData: Story = {
  name: 'Minimal Data (no IP / gateway / duration)',
  args: {
    event: {
      id: 'evt-minimal',
      wanInterfaceId: 'ether1-wan',
      eventType: 'CONNECTED',
      timestamp: new Date(Date.now() - 60 * 1000).toISOString(),
    },
    showInterface: true,
  },
};

// ---------------------------------------------------------------------------
// Stories – ConnectionEventCardCompact (mobile variant)
// ---------------------------------------------------------------------------

export const CompactConnected: Story = {
  name: 'Compact – Connected',
  render: (args) => <ConnectionEventCardCompact {...args} />,
  args: {
    event: connectedEvent,
    showInterface: true,
  },
};

export const CompactDisconnected: Story = {
  name: 'Compact – Disconnected',
  render: (args) => <ConnectionEventCardCompact {...args} />,
  args: {
    event: disconnectedEvent,
    showInterface: true,
  },
};

export const CompactAuthFailed: Story = {
  name: 'Compact – Auth Failed',
  render: (args) => <ConnectionEventCardCompact {...args} />,
  args: {
    event: authFailedEvent,
    showInterface: true,
  },
};
