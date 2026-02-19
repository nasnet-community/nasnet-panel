/**
 * Storybook stories for LeaseDetailPanel
 *
 * Expandable detail panel for a DHCP lease, used inside table row
 * expansions (desktop) or bottom sheets (mobile).
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { LeaseDetailPanel } from './LeaseDetailPanel';

const meta: Meta<typeof LeaseDetailPanel> = {
  title: 'Features/Network/DHCP/LeaseDetailPanel',
  component: LeaseDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Expandable detail panel for a DHCP lease entry. Renders three labelled ' +
          'sections — Device Information, Assignment Details, and Timing Information — ' +
          'plus quick-action buttons (Make Static, Delete). Used inside table row ' +
          'expansions on desktop and bottom sheets on mobile.',
      },
    },
  },
  args: {
    onMakeStatic: fn(),
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LeaseDetailPanel>;

// ─── Shared mock leases ───────────────────────────────────────────────────────

const dynamicBoundLease = {
  id: 'lease-001',
  address: '192.168.88.101',
  macAddress: 'dc:a6:32:1b:4c:8f',
  clientId: '01:dc:a6:32:1b:4c:8f',
  hostname: 'reza-macbook',
  status: 'bound' as const,
  expiresAfter: '22h30m',
  lastSeen: new Date('2026-02-19T10:00:00Z'),
  server: 'dhcp1',
  dynamic: true,
  blocked: false,
};

const staticLease = {
  id: 'lease-002',
  address: '192.168.88.10',
  macAddress: 'b8:27:eb:45:3c:12',
  hostname: 'pi-hole',
  status: 'bound' as const,
  expiresAfter: undefined,
  lastSeen: new Date('2026-02-19T09:55:00Z'),
  server: 'dhcp1',
  dynamic: false,
  blocked: false,
};

const waitingLease = {
  id: 'lease-003',
  address: '192.168.88.250',
  macAddress: '4c:5e:0c:90:ab:21',
  hostname: undefined,
  status: 'waiting' as const,
  expiresAfter: '5m12s',
  lastSeen: undefined,
  server: 'dhcp1',
  dynamic: true,
  blocked: false,
};

const blockedLease = {
  id: 'lease-004',
  address: '192.168.88.200',
  macAddress: '00:11:22:33:44:55',
  hostname: 'unknown-device',
  status: 'bound' as const,
  expiresAfter: '11h45m',
  lastSeen: new Date('2026-02-19T08:00:00Z'),
  server: 'dhcp1',
  dynamic: true,
  blocked: true,
};

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Dynamic bound lease with all fields populated, including client ID.
 * Both "Make Static" and "Delete" action buttons are visible.
 */
export const DynamicBoundLease: Story = {
  args: {
    lease: dynamicBoundLease,
  },
};

/**
 * Static lease — the "Make Static" action button is hidden because
 * this lease is already static (dynamic: false).
 */
export const StaticLease: Story = {
  args: {
    lease: staticLease,
  },
};

/**
 * Lease in "Waiting" state with no hostname and no last-seen timestamp.
 * Fallback text ("Unknown" / "Never") is displayed for missing fields.
 */
export const WaitingLeaseNoHostname: Story = {
  args: {
    lease: waitingLease,
  },
};

/**
 * A blocked lease. The Status section renders a "Stopped" badge
 * alongside the primary status badge.
 */
export const BlockedLease: Story = {
  args: {
    lease: blockedLease,
  },
};

/**
 * Read-only panel — no action callbacks provided.
 * The Quick Actions section shows no buttons.
 */
export const ReadOnly: Story = {
  args: {
    lease: dynamicBoundLease,
    onMakeStatic: undefined,
    onDelete: undefined,
  },
};

/**
 * Delete-only panel — only "Delete" callback is provided.
 * The "Make Static" button is absent.
 */
export const DeleteOnly: Story = {
  args: {
    lease: dynamicBoundLease,
    onMakeStatic: undefined,
    onDelete: fn(),
  },
};
