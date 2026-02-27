/**
 * Storybook stories for LogEntryItem
 *
 * Renders a single RouterOS system log entry with severity icon,
 * topic badge, timestamp, and message text.
 * Story NAS-5.6: Recent Logs with Filtering.
 */

import type { LogEntry } from '@nasnet/core/types';

import { LogEntryItem } from './LogEntryItem';

import type { LogEntryItemProps } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock log entries
// ---------------------------------------------------------------------------

const BASE_TIME = new Date('2025-11-10T14:35:22.000Z');

const debugEntry: LogEntry = {
  id: 'log-001',
  timestamp: BASE_TIME,
  topic: 'system',
  severity: 'debug',
  message: 'Configuration file read successfully from flash storage.',
};

const infoEntry: LogEntry = {
  id: 'log-002',
  timestamp: new Date(BASE_TIME.getTime() - 30_000),
  topic: 'dhcp',
  severity: 'info',
  message: 'DHCP lease granted: 192.168.1.42 to AA:BB:CC:DD:EE:FF (hostname: laptop-reza)',
};

const warningEntry: LogEntry = {
  id: 'log-003',
  timestamp: new Date(BASE_TIME.getTime() - 90_000),
  topic: 'wireless',
  severity: 'warning',
  message:
    'Signal strength degraded on wlan1: -78 dBm (threshold -75 dBm). Consider repositioning AP.',
};

const errorEntry: LogEntry = {
  id: 'log-004',
  timestamp: new Date(BASE_TIME.getTime() - 180_000),
  topic: 'firewall',
  severity: 'error',
  message: 'Connection attempt from 203.0.113.45:4444 dropped by forward chain rule #12.',
};

const criticalEntry: LogEntry = {
  id: 'log-005',
  timestamp: new Date(BASE_TIME.getTime() - 300_000),
  topic: 'system',
  severity: 'critical',
  message: 'Out of memory: process "firewall" killed. Router may become unresponsive.',
};

const longMessageEntry: LogEntry = {
  id: 'log-006',
  timestamp: new Date(BASE_TIME.getTime() - 60_000),
  topic: 'vpn',
  severity: 'info',
  message:
    'WireGuard peer 10.10.0.2 (peer-id: XyZ123AbC456) handshake completed successfully. ' +
    'Negotiated cipher: ChaCha20-Poly1305, keepalive: 25s, endpoint: 198.51.100.22:51820, ' +
    'allowed-ips: 0.0.0.0/0, ::/0.',
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof LogEntryItem> = {
  title: 'Features/Dashboard/RecentLogs/LogEntryItem',
  component: LogEntryItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a single RouterOS system log entry. ' +
          'Renders a severity-coloured icon (debug/info = muted, warning = amber, ' +
          'error = red, critical = pulsing red), a topic badge, a relative timestamp, ' +
          'and the message text. ' +
          'Supports compact mode (single-line clamp) for mobile and a highlight ' +
          'animation for newly arrived entries.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LogEntryItem>;

// ---------------------------------------------------------------------------
// Stories — severity variants
// ---------------------------------------------------------------------------

/** Debug-level entry — icon and topic badge use muted/secondary colour. */
export const DebugSeverity: Story = {
  args: {
    entry: debugEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};

/** Info-level entry — standard DHCP lease notification. */
export const InfoSeverity: Story = {
  args: {
    entry: infoEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};

/** Warning-level entry — amber icon colour, wireless signal degradation. */
export const WarningSeverity: Story = {
  args: {
    entry: warningEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};

/** Error-level entry — red icon, firewall drop event. */
export const ErrorSeverity: Story = {
  args: {
    entry: errorEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};

/** Critical-level entry — pulsing red icon, OOM kill event. */
export const CriticalSeverity: Story = {
  args: {
    entry: criticalEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};

// ---------------------------------------------------------------------------
// Stories — behaviour variants
// ---------------------------------------------------------------------------

/** New entry highlight — applies animate-highlight + primary/5 background. */
export const NewEntry: Story = {
  args: {
    entry: infoEntry,
    isNew: true,
    compact: false,
  } satisfies LogEntryItemProps,
};

/** Compact mode — message is clamped to a single line (used on mobile). */
export const CompactMode: Story = {
  args: {
    entry: longMessageEntry,
    isNew: false,
    compact: true,
  } satisfies LogEntryItemProps,
};

/** Full message with no clamping — shows the complete long VPN message. */
export const LongMessage: Story = {
  args: {
    entry: longMessageEntry,
    isNew: false,
    compact: false,
  } satisfies LogEntryItemProps,
};
