/**
 * Storybook stories for VPNServersPage
 *
 * VPNServersPage lists all VPN server configurations grouped by protocol
 * (WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2). Protocol tabs allow
 * filtering to a single protocol. Each server card supports toggle, edit,
 * delete and view-details actions.
 *
 * Stories use presentational replicas because the component depends on
 * multiple API hooks and Tanstack Router context.
 */

import { VPNServersPage } from './VPNServersPage';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof VPNServersPage> = {
  title: 'App/Pages/VPNServersPage',
  component: VPNServersPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VPN Servers page. Displays all VPN server configurations grouped by protocol ' +
          'with WireGuard interfaces, OpenVPN servers and L2TP/PPTP/SSTP/IKEv2 servers. ' +
          'Supports protocol-tab filtering, enable/disable toggle, edit, delete and ' +
          'view-details actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VPNServersPage>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const PROTOCOLS = ['WireGuard', 'OpenVPN', 'L2TP', 'PPTP', 'SSTP', 'IKEv2'] as const;

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

interface MockServer {
  id: string;
  name: string;
  protocol: string;
  running: boolean;
  disabled: boolean;
  port?: number;
  connectedClients?: number;
  rx?: number;
  tx?: number;
  comment?: string;
}

const MOCK_SERVERS: MockServer[] = [
  {
    id: 'wg-iface-1',
    name: 'wg0',
    protocol: 'WireGuard',
    running: true,
    disabled: false,
    port: 13231,
    rx: 15728640,
    tx: 8388608,
  },
  {
    id: 'wg-iface-2',
    name: 'wg1',
    protocol: 'WireGuard',
    running: false,
    disabled: false,
    port: 13232,
    rx: 0,
    tx: 0,
    comment: 'Guest network tunnel',
  },
  {
    id: 'ovpn-server-1',
    name: 'ovpn-tcp-1194',
    protocol: 'OpenVPN',
    running: true,
    disabled: false,
    port: 1194,
    connectedClients: 3,
    comment: 'Primary OpenVPN server',
  },
  {
    id: 'l2tp-server',
    name: 'l2tp-server',
    protocol: 'L2TP',
    running: true,
    disabled: false,
    connectedClients: 2,
  },
  {
    id: 'ikev2-peer-1',
    name: 'ikev2-responder',
    protocol: 'IKEv2',
    running: true,
    disabled: false,
    port: 500,
    comment: 'IKEv2 passive mode',
  },
];

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ServerCard({ server }: { server: MockServer }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{server.name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              server.running
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {server.running ? 'Running' : 'Stopped'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            {server.protocol}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className={`w-10 h-6 rounded-full transition-colors ${
              !server.disabled ? 'bg-success' : 'bg-muted'
            }`}
            aria-label={`Toggle ${server.name}`}
          />
          <button className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="View details">🔍</button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Edit">✏️</button>
          <button className="p-1.5 text-muted-foreground hover:text-error" aria-label="Delete">🗑️</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {server.port != null && <span>Port {server.port}</span>}
        {server.connectedClients != null && (
          <span>{server.connectedClients} connected clients</span>
        )}
        {server.rx != null && <span className="text-success">↓ {formatBytes(server.rx)}</span>}
        {server.tx != null && <span className="text-primary">↑ {formatBytes(server.tx)}</span>}
      </div>

      {server.comment && (
        <p className="text-xs text-muted-foreground italic">{server.comment}</p>
      )}
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
  const isUnique = ['L2TP', 'PPTP', 'SSTP'].includes(protocol);
  return (
    <div className="text-center py-8 bg-muted/30 rounded-xl">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No {protocol} {isUnique ? 'server' : 'servers'} configured
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {isUnique
          ? `Enable the ${protocol} server to allow incoming connections`
          : `Add your first ${protocol} server to get started`}
      </p>
      <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm min-h-[44px]">
        {isUnique ? `Enable ${protocol} Server` : `+ Add ${protocol} Server`}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">VPN Servers</h1>
          <p className="text-sm text-muted-foreground">
            Configure and manage your VPN server infrastructure
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
 * All-tab showing servers across WireGuard, OpenVPN, L2TP and IKEv2 protocols.
 */
export const AllProtocols: Story = {
  name: 'All protocols – loaded',
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <PageHeader />
          <ProtocolTabs active="All" />

          {/* WireGuard */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">WireGuard</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">2</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_SERVERS.filter((s) => s.protocol === 'WireGuard').map((s) => (
                <ServerCard key={s.id} server={s} />
              ))}
            </div>
          </div>

          {/* OpenVPN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">OpenVPN</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_SERVERS.filter((s) => s.protocol === 'OpenVPN').map((s) => (
                <ServerCard key={s.id} server={s} />
              ))}
            </div>
          </div>

          {/* L2TP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">L2TP</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">1</span>
            </div>
            <ServerCard server={MOCK_SERVERS.find((s) => s.protocol === 'L2TP') as MockServer} />
          </div>

          {/* PPTP / SSTP – empty */}
          {['PPTP', 'SSTP'].map((p) => (
            <div key={p} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">{p}</h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">0</span>
              </div>
              <EmptyProtocolSection protocol={p} />
            </div>
          ))}

          {/* IKEv2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">IKEv2</h2>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">1</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_SERVERS.filter((s) => s.protocol === 'IKEv2').map((s) => (
                <ServerCard key={s.id} server={s} />
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
          'All-tab view with WireGuard (2 interfaces), OpenVPN (1 server), L2TP (1 server), ' +
          'IKEv2 (1 peer) and empty PPTP/SSTP sections.',
      },
    },
  },
};

/**
 * WireGuard protocol tab selected.
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
              {MOCK_SERVERS.filter((s) => s.protocol === 'WireGuard').map((s) => (
                <ServerCard key={s.id} server={s} />
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
          'WireGuard tab active. Shows two WireGuard interface cards with port, traffic stats ' +
          'and comments. wg0 is running; wg1 is stopped.',
      },
    },
  },
};

/**
 * Completely empty – no servers on any protocol.
 */
export const EmptyAllProtocols: Story = {
  name: 'Empty – no servers',
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
          'No servers configured on any protocol. Each section shows an empty state with an ' +
          '"Add/Enable Server" CTA.',
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
          <div className="space-y-4" role="status" aria-label="Loading VPN servers">
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
          'Four skeleton cards shown while the six protocol queries are in-flight. ' +
          'Protocol tabs are not yet rendered and the Refresh button is disabled.',
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
