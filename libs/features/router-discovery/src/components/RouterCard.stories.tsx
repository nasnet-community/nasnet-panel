import type { Router } from '@nasnet/core/types';

import { RouterCard } from './RouterCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterCard> = {
  title: 'Features/RouterDiscovery/RouterCard',
  component: RouterCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a single router as an interactive card. Shows the router name or IP, connection status badge, model, RouterOS version, MAC address, discovery method, last-connected timestamp, and Connect/Remove action buttons. Supports selected/unselected visual states and all four connection statuses (online, offline, unknown, connecting).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RouterCard>;

// ─── Shared mock routers ──────────────────────────────────────────────────────

const onlineRouter: Router = {
  id: 'router-001',
  ipAddress: '192.168.88.1',
  name: 'Core Router',
  model: 'RB5009UPr+S+IN',
  routerOsVersion: '7.16.2',
  macAddress: '2C:C8:1B:AA:BB:CC',
  connectionStatus: 'online',
  discoveryMethod: 'scan',
  lastConnected: new Date('2026-02-19T08:30:00Z'),
  createdAt: new Date('2026-01-10T12:00:00Z'),
};

const offlineRouter: Router = {
  id: 'router-002',
  ipAddress: '192.168.88.2',
  name: 'Branch Router',
  model: 'hEX S',
  routerOsVersion: '7.14',
  macAddress: 'DC:2C:6E:11:22:33',
  connectionStatus: 'offline',
  discoveryMethod: 'scan',
  lastConnected: new Date('2026-02-15T14:20:00Z'),
  createdAt: new Date('2025-11-05T09:00:00Z'),
};

const unknownRouter: Router = {
  id: 'router-003',
  ipAddress: '10.0.0.1',
  name: 'Office Gateway',
  connectionStatus: 'unknown',
  discoveryMethod: 'manual',
  createdAt: new Date('2026-02-19T07:00:00Z'),
};

const connectingRouter: Router = {
  id: 'router-004',
  ipAddress: '192.168.1.1',
  name: 'Home Lab',
  model: 'RB760iGS',
  routerOsVersion: '6.49.15',
  connectionStatus: 'connecting',
  discoveryMethod: 'manual',
  createdAt: new Date('2026-02-18T20:00:00Z'),
};

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * A fully connected router discovered by auto-scan.
 */
export const Online: Story = {
  args: {
    router: onlineRouter,
    isSelected: false,
    onClick: (r) => console.log('clicked:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
};

/**
 * Router that was previously connected but is now unreachable.
 * The Connect button is visible since the status is not "online".
 */
export const Offline: Story = {
  args: {
    router: offlineRouter,
    isSelected: false,
    onClick: (r) => console.log('clicked:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
};

/**
 * Manually-added router that has never been connected — status is "unknown".
 * No model or RouterOS version data is available yet.
 */
export const UnknownStatus: Story = {
  args: {
    router: unknownRouter,
    isSelected: false,
    onClick: (r) => console.log('clicked:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Manually-added router with no prior connection. Optional fields (model, RouterOS version, MAC) are omitted to demonstrate the minimal layout.',
      },
    },
  },
};

/**
 * Authentication handshake in progress — "Connecting…" badge.
 */
export const Connecting: Story = {
  args: {
    router: connectingRouter,
    isSelected: false,
    onClick: (r) => console.log('clicked:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
};

/**
 * Selected state — the card has a blue border and tinted background.
 */
export const Selected: Story = {
  args: {
    router: onlineRouter,
    isSelected: true,
    onClick: (r) => console.log('clicked:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When isSelected is true, the card border turns blue and the background is tinted, indicating the active selection in RouterList.',
      },
    },
  },
};

/**
 * Read-only view — no Connect or Remove callbacks provided.
 * Action buttons are hidden.
 */
export const ReadOnly: Story = {
  args: {
    router: onlineRouter,
    isSelected: false,
    onClick: (r) => console.log('clicked:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onConnect and onRemove are omitted the action buttons are not rendered, useful for purely informational displays.',
      },
    },
  },
};
