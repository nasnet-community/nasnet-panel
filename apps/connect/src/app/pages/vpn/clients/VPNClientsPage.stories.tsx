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
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{client.name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              client.running
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {client.running ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            {client.protocol}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`w-10 h-6 rounded-full transition-colors ${
              !client.disabled ? 'bg-success' : 'bg-muted'
            }`}
            aria-label={`Toggle ${client.name}`}
          />
          <button className="p-1.5 text-muted-foreground hover:text-foreground">✏️</button>
          <button className="p-1.5 text-muted-foreground hover:text-error">🗑️</button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground font-mono">{client.connectTo}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
    <div className="flex flex-wrap gap-2 mb-6">
      {['All', ...PROTOCOLS].map((p) => (
        <button
          key={p}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            p === active
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-accent/50'
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
    <div className="text-center py-8 bg-muted/30 rounded-xl">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No {protocol} clients configured
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by adding your first {protocol} client connection
      </p>
      <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm min-h-[44px]">
        + Add {protocol} Client
      </button>
    </div>
  );
}

function PageHeader({ isLoading = false }: { isLoading?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 border border-border rounded-md text-sm min-h-[44px]">← Back</button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">VPN Clients</h1>
          <p className="text-sm text-muted-foreground">
            Configure and manage outgoing VPN connections
          </p>
        </div>
      </div>
      <button
        disabled={isLoading}
        className="flex items-center gap-2 min-h-[44px] px-3 border border-border rounded-md text-sm disabled:opacity-50"
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
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader />
          <ProtocolTabs active="All" />

          {/* WireGuard section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">WireGuard</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">2</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'WireGuard').map((c) => (
                <ClientCard key={c.id} client={c} />
              ))}
            </div>
          </div>

          {/* OpenVPN section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">OpenVPN</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'OpenVPN').map((c) => (
                <ClientCard key={c.id} client={c} />
              ))}
            </div>
          </div>

          {/* L2TP section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">L2TP</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'L2TP').map((c) => (
                <ClientCard key={c.id} client={c} />
              ))}
            </div>
          </div>

          {/* PPTP / SSTP / IKEv2 – empty */}
          {['PPTP', 'SSTP', 'IKEv2'].map((p) => (
            <div key={p} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">{p}</h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">0</span>
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
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader />
          <ProtocolTabs active="WireGuard" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">WireGuard</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">2</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_CLIENTS.filter((c) => c.protocol === 'WireGuard').map((c) => (
                <ClientCard key={c.id} client={c} />
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
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader />
          <ProtocolTabs active="All" />
          {PROTOCOLS.map((p) => (
            <div key={p} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">{p}</h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">0</span>
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
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader isLoading />
          <div className="space-y-4" role="status" aria-label="Loading VPN clients">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 w-full rounded-xl bg-muted animate-pulse" />
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
