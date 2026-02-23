/**
 * Storybook stories for LeaseCard
 *
 * Mobile-optimized card for DHCP lease display with swipe gestures,
 * expandable detail sheet, and "New" badge indicator.
 */

import { fn } from 'storybook/test';

import { LeaseCard } from './LeaseCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LeaseCard> = {
  title: 'Features/Network/DHCP/LeaseCard',
  component: LeaseCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mobile-optimized card for displaying DHCP lease information. ' +
          'Supports swipe gestures (right to make static, left to delete), ' +
          'tap-to-expand bottom sheet, and a "New" pulse badge for recently discovered leases.',
      },
    },
  },
  args: {
    onMakeStatic: fn(),
    onDelete: fn(),
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof LeaseCard>;

// ─── Shared mock leases ───────────────────────────────────────────────────────

const dynamicBoundLease = {
  id: 'lease-001',
  address: '192.168.88.101',
  macAddress: 'dc:a6:32:1b:4c:8f',
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

const unknownHostnameLease = {
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

const offeredLease = {
  id: 'lease-005',
  address: '192.168.88.175',
  macAddress: 'a4:c3:f0:78:2d:99',
  hostname: 'android-phone',
  status: 'offered' as const,
  expiresAfter: '59m50s',
  lastSeen: new Date('2026-02-19T10:14:00Z'),
  server: 'dhcp2',
  dynamic: true,
  blocked: false,
};

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * A standard dynamic lease for a known device.
 * Displays IP, hostname, MAC, and "Bound" status with an expand chevron.
 */
export const DynamicBoundLease: Story = {
  args: {
    lease: dynamicBoundLease,
    isNew: false,
  },
};

/**
 * A static (pinned) lease. The "Make Static" swipe/action is hidden
 * because this lease is already static (dynamic: false).
 */
export const StaticLease: Story = {
  args: {
    lease: staticLease,
    isNew: false,
  },
};

/**
 * A brand-new lease with the pulsing "New" badge.
 * Useful for highlighting recently detected clients on the network.
 */
export const NewLeaseBadge: Story = {
  args: {
    lease: offeredLease,
    isNew: true,
  },
};

/**
 * A lease with no hostname set by the client.
 * The hostname row shows "Unknown" as a fallback.
 */
export const UnknownHostname: Story = {
  args: {
    lease: unknownHostnameLease,
    isNew: false,
  },
};

/**
 * A blocked lease. The device is denied network access.
 * Status shows as "Blocked" in the status badge.
 */
export const BlockedDevice: Story = {
  args: {
    lease: blockedLease,
    isNew: false,
  },
};

/**
 * Read-only card — no action callbacks provided.
 * The bottom sheet will still show device details but
 * "Make Static" and "Delete" buttons are hidden.
 */
export const ReadOnly: Story = {
  args: {
    lease: dynamicBoundLease,
    isNew: false,
    onMakeStatic: undefined,
    onDelete: undefined,
  },
};
