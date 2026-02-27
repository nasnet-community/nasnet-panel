/**
 * Storybook stories for VPNClientsPage
 *
 * VPNClientsPage lists all outgoing VPN client connections organised by
 * protocol (WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2). Protocol tabs
 * allow filtering to a single protocol. Each client card supports
 * toggle, edit and delete actions.
 *
 * Because the component depends on multiple API hooks and Tanstack Router,
 * stories use presentational replicas that document the intended visual
 * outcome for each state.
 */

import { VPNClientsPage } from './VPNClientsPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNClientsPage> = {
  title: 'App/Pages/VPNClientsPage',
  component: VPNClientsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VPN Clients page. Displays all outgoing VPN client connections grouped by protocol ' +
          'with WireGuard peers, OpenVPN, L2TP, PPTP, SSTP and IKEv2 sections. Supports ' +
          'protocol-tab filtering, enable/disable toggle, edit and delete actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VPNClientsPage>;

// ---------------------------------------------------------------------------
// Shared types & mock data
// ---------------------------------------------------------------------------

const PROTOCOLS = ['WireGuard', 'OpenVPN', 'L2TP', 'PPTP', 'SSTP', 'IKEv2'] as const;

interface MockClient {
  id: string;
  name: string;
  protocol: string;
  connectTo: string;
  running: boolean;
  disabled: boolean;
  uptime?: string;
  rx?: number;
  tx?: number;
  comment?: string;
}

const MOCK_CLIENTS: MockClient[] = [
  {
    id: 'wg-peer-1',
    name: 'wg0-peer',
    protocol: 'WireGuard',
    connectTo: '203.0.113.10:51820',
    running: true,
    disabled: false,
    rx: 5242880,
    tx: 2621440,
  },
  {
    id: 'wg-peer-2',
    name: 'wg1-peer',
    protocol: 'WireGuard',
    connectTo: '198.51.100.5:51820',
    running: false,
    disabled: false,
    rx: 0,
    tx: 0,
    comment: 'Backup tunnel',
  },
  {
    id: 'ovpn-client-1',
    name: 'ovpn-us-east',
    protocol: 'OpenVPN',
    connectTo: 'vpn.example.com',
    running: true,
    disabled: false,
    uptime: '2d 4h 15m',
    rx: 10485760,
    tx: 3145728,
  },
  {
    id: 'l2tp-client-1',
    name: 'l2tp-office',
    protocol: 'L2TP',
    connectTo: '10.0.0.1',
    running: true,
    disabled: false,
    uptime: '6h 30m',
    rx: 1048576,
    tx: 524288,
  },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ClientCard({ client }: { client: MockClient }) {
  return (
    <div className="bg-card border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">{client.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              client.running ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}
          >
            {client.running ? 'Connected' : 'Disconnected'}
          </span>
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
            {client.protocol}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`h-6 w-10 rounded-full transition-colors ${
              !client.disabled ? 'bg-success' : 'bg-muted'
            }`}
            aria-label={`Toggle ${client.name}`}
          />
          <button className="text-muted-foreground hover:text-foreground p-1.5">✏️</button>
          <button className="text-muted-foreground hover:text-error p-1.5">🗑️</button>
        </div>
      </div>

      <p className="text-muted-foreground font-mono text-sm">{client.connectTo}</p>

      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
        {client.uptime && <span>Uptime: {client.uptime}</span>}
        {client.rx != null && <span className="text-success">↓ {formatBytes(client.rx)}</span>}
        {client.tx != null && <span className="text-primary">↑ {formatBytes(client.tx)}</span>}
        {client.comment && <span className="italic opacity-70">{client.comment}</span>}
      </div>
    </div>
  );
}

function ProtocolTabs({ active }: { active: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {['All', ...PROTOCOLS].map((p) => (
        <button
          key={p}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            p === active ?
              'bg-primary text-primary-foreground'
            : 'bg-card border-border text-foreground hover:bg-accent/50 border'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function EmptyProtocolSection({ protocol }: { protocol: string }) {
  return (
    <div className="bg-muted/30 rounded-xl py-8 text-center">
      <h3 className="text-foreground mb-2 text-lg font-semibold">
        No {protocol} clients configured
      </h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Get started by adding your first {protocol} client connection
      </p>
      <button className="bg-primary text-primary-foreground mx-auto flex min-h-[44px] items-center gap-2 rounded-md px-4 py-2 text-sm">
        + Add {protocol} Client
      </button>
    </div>
  );
}

function PageHeader({ isLoading = false }: { isLoading?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <button className="border-border min-h-[44px] rounded-md border p-2 text-sm">← Back</button>
        <div>
          <h1 className="text-foreground mb-1 text-2xl font-bold sm:text-3xl">VPN Clients</h1>
          <p className="text-muted-foreground text-sm">
            Configure and manage outgoing VPN connections
          </p>
        </div>
      </div>
      <button
        disabled={isLoading}
        className="border-border flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-sm disabled:opacity-50"
        aria-label="Refresh"
      >
        Refresh
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * All-tab showing clients across WireGuard, OpenVPN and L2TP protocols.
 */
export const AllProtocols: Story = {
  name: 'All protocols – loaded',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader />
          <ProtocolTabs active="All" />

          {/* WireGuard section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-base font-semibold">WireGuard</h2>
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">2</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'WireGuard').map((c) => (
                <ClientCard
                  key={c.id}
                  client={c}
                />
              ))}
            </div>
          </div>

          {/* OpenVPN section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-base font-semibold">OpenVPN</h2>
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'OpenVPN').map((c) => (
                <ClientCard
                  key={c.id}
                  client={c}
                />
              ))}
            </div>
          </div>

          {/* L2TP section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-base font-semibold">L2TP</h2>
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'L2TP').map((c) => (
                <ClientCard
                  key={c.id}
                  client={c}
                />
              ))}
            </div>
          </div>

          {/* PPTP / SSTP / IKEv2 – empty */}
          {['PPTP', 'SSTP', 'IKEv2'].map((p) => (
            <div
              key={p}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-foreground text-base font-semibold">{p}</h2>
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">0</span>
              </div>
              <EmptyProtocolSection protocol={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All-tab view showing WireGuard (2 peers), OpenVPN (1 client) and L2TP (1 client) ' +
          'with empty sections for PPTP, SSTP and IKEv2.',
      },
    },
  },
};

/**
 * WireGuard protocol tab filtered view.
 */
export const WireGuardTab: Story = {
  name: 'WireGuard tab selected',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader />
          <ProtocolTabs active="WireGuard" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-base font-semibold">WireGuard</h2>
              <span className="bg-muted rounded-full px-2 py-0.5 text-xs">2</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'WireGuard').map((c) => (
                <ClientCard
                  key={c.id}
                  client={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'WireGuard tab is active. Shows only the two WireGuard peer cards ' +
          '(one connected, one disconnected).',
      },
    },
  },
};

/**
 * Completely empty – no clients configured on any protocol.
 */
export const EmptyAllProtocols: Story = {
  name: 'Empty – no clients',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader />
          <ProtocolTabs active="All" />
          {PROTOCOLS.map((p) => (
            <div
              key={p}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-foreground text-base font-semibold">{p}</h2>
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">0</span>
              </div>
              <EmptyProtocolSection protocol={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'No client connections configured on any protocol. Every section shows an empty state ' +
          'with an "Add Client" CTA.',
      },
    },
  },
};

/**
 * Loading skeleton state while queries are in-flight.
 */
export const Loading: Story = {
  name: 'Loading state',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <PageHeader isLoading />
          <div
            className="space-y-4"
            role="status"
            aria-label="Loading VPN clients"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-muted h-32 w-full animate-pulse rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Four skeleton cards are shown while all six protocol queries are in-flight. ' +
          'Protocol tabs are not yet rendered.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
