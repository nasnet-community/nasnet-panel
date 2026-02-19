import type { Meta, StoryObj } from '@storybook/react';
import type { Router } from '@nasnet/core/types';
import { RouterList } from './RouterList';

const meta: Meta<typeof RouterList> = {
  title: 'Features/RouterDiscovery/RouterList',
  component: RouterList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders a sorted collection of RouterCard items. Online routers bubble to the top, followed by most-recently-connected, then alphabetically by name/IP. Shows an online/offline status summary in the header. Renders a customisable empty state when no routers are present.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RouterList>;

// ─── Shared mock data ─────────────────────────────────────────────────────────

const routers: Router[] = [
  {
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
  },
  {
    id: 'router-002',
    ipAddress: '192.168.88.2',
    name: 'Branch Office',
    model: 'hEX S',
    routerOsVersion: '7.14',
    macAddress: 'DC:2C:6E:11:22:33',
    connectionStatus: 'offline',
    discoveryMethod: 'scan',
    lastConnected: new Date('2026-02-15T14:20:00Z'),
    createdAt: new Date('2025-11-05T09:00:00Z'),
  },
  {
    id: 'router-003',
    ipAddress: '10.0.0.1',
    name: 'Warehouse AP',
    connectionStatus: 'unknown',
    discoveryMethod: 'manual',
    createdAt: new Date('2026-02-10T07:00:00Z'),
  },
  {
    id: 'router-004',
    ipAddress: '192.168.1.1',
    name: 'Home Lab',
    model: 'RB760iGS',
    routerOsVersion: '6.49.15',
    macAddress: 'B8:69:F4:44:55:66',
    connectionStatus: 'connecting',
    discoveryMethod: 'manual',
    createdAt: new Date('2026-02-18T20:00:00Z'),
  },
  {
    id: 'router-005',
    ipAddress: '192.168.88.5',
    name: 'Dev Router',
    model: 'CHR',
    routerOsVersion: '7.16',
    connectionStatus: 'offline',
    discoveryMethod: 'scan',
    lastConnected: new Date('2026-02-01T10:00:00Z'),
    createdAt: new Date('2025-12-01T10:00:00Z'),
  },
];

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Mixed fleet — online, offline, unknown, and connecting routers.
 * Sorted with online first.
 */
export const Default: Story = {
  args: {
    routers,
    selectedRouterId: null,
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
};

/**
 * One router pre-selected — highlighted with blue border.
 */
export const WithSelection: Story = {
  args: {
    routers,
    selectedRouterId: 'router-001',
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The router with id "router-001" (Core Router) starts pre-selected. Click any other card to move the selection.',
      },
    },
  },
};

/**
 * Single router — verifies header pluralisation ("1 Router") and no status
 * summary pills when only one type is present.
 */
export const SingleRouter: Story = {
  args: {
    routers: [routers[0]],
    selectedRouterId: null,
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story: 'A list with a single online router. Verifies "1 Router" singular header copy.',
      },
    },
  },
};

/**
 * All-online fleet — only green status pills shown in the summary.
 */
export const AllOnline: Story = {
  args: {
    routers: routers
      .slice(0, 3)
      .map((r) => ({ ...r, connectionStatus: 'online' as const })),
    selectedRouterId: null,
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story: 'All routers are online. Only the green "Online" count appears in the header summary.',
      },
    },
  },
};

/**
 * Empty list with default empty state — shown when no routers have been
 * discovered or added yet.
 */
export const Empty: Story = {
  args: {
    routers: [],
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
    onConnect: (r) => console.log('connect:', r.ipAddress),
    onRemove: (r) => console.log('remove:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders the built-in empty state with an icon and instructions to scan or manually add a router.',
      },
    },
  },
};

/**
 * Empty list with a custom empty state component.
 */
export const EmptyCustomState: Story = {
  args: {
    routers: [],
    emptyState: (
      <div className="py-12 text-center space-y-3">
        <p className="text-lg font-semibold text-foreground">Your fleet is empty</p>
        <p className="text-sm text-muted-foreground">
          Run a network scan or add routers manually to begin managing your MikroTik devices.
        </p>
        <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          Start Discovery
        </button>
      </div>
    ),
    onRouterSelect: (r) => console.log('selected:', r.ipAddress),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The emptyState prop accepts any ReactNode, allowing full customisation of the empty placeholder.',
      },
    },
  },
};
