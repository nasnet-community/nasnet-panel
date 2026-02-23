/**
 * Storybook stories for VPNDashboard
 *
 * VPNDashboard is the top-level VPN overview page that renders a status hero,
 * navigation cards to Servers/Clients, a protocol stats grid and an issues
 * list. It uses the useVPNStats query hook and Tanstack Router navigation.
 *
 * Stories use a render-wrapper approach with presentational replicas so that
 * the visual contract is documented without requiring live API/router context.
 */

import { VPNDashboard } from './VPNDashboard';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof VPNDashboard> = {
  title: 'App/Pages/VPNDashboard',
  component: VPNDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main VPN dashboard (UX Direction 2: Card-Heavy Dashboard). Provides an at-a-glance ' +
          'view of VPN infrastructure health, server/client counts, per-protocol stats and ' +
          'active issue alerts. Navigate to Servers or Clients pages from here.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VPNDashboard>;

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const PROTOCOL_STATS = [
  { protocol: 'WireGuard', servers: 2, clients: 3, active: 4, rx: 15728640, tx: 8388608 },
  { protocol: 'OpenVPN', servers: 1, clients: 1, active: 1, rx: 5242880, tx: 2621440 },
  { protocol: 'L2TP', servers: 1, clients: 0, active: 2, rx: 1048576, tx: 524288 },
  { protocol: 'PPTP', servers: 0, clients: 0, active: 0, rx: 0, tx: 0 },
  { protocol: 'SSTP', servers: 0, clients: 0, active: 0, rx: 0, tx: 0 },
  { protocol: 'IKEv2', servers: 1, clients: 0, active: 1, rx: 2097152, tx: 1048576 },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

interface DashboardShellProps {
  healthStatus: 'healthy' | 'warning' | 'critical';
  totalServers: number;
  totalClients: number;
  activeConnections: number;
  totalRx: number;
  totalTx: number;
  issueCount?: number;
  showIssues?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

function DashboardShell({
  healthStatus,
  totalServers,
  totalClients,
  activeConnections,
  totalRx,
  totalTx,
  issueCount = 0,
  showIssues = false,
  isLoading = false,
  isError = false,
}: DashboardShellProps) {
  const heroBg =
    healthStatus === 'healthy'
      ? 'bg-success text-success-foreground'
      : healthStatus === 'warning'
        ? 'bg-warning text-warning-foreground'
        : 'bg-destructive text-destructive-foreground';

  const heroTitle =
    healthStatus === 'healthy'
      ? 'All Systems Protected'
      : healthStatus === 'warning'
        ? 'Attention Required'
        : 'Issues Detected';

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                VPN Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor and manage your VPN infrastructure
              </p>
            </div>
            <button
              disabled={isLoading}
              className="flex items-center gap-2 min-h-[44px] min-w-[44px] px-3 border border-border rounded-md text-sm disabled:opacity-50"
              aria-label="Refresh VPN dashboard"
            >
              Refresh
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-6" role="status" aria-label="Loading VPN dashboard">
              <div className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-36 rounded-xl bg-muted animate-pulse" />
                <div className="h-36 rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div
              className="bg-error/10 dark:bg-error/20 border-2 border-error rounded-2xl p-6"
              role="alert"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Failed to load VPN statistics
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to retrieve VPN data from the router. Please check your connection.
              </p>
              <button className="px-3 py-2 border border-border rounded-md text-sm min-h-[44px]">
                Try Again
              </button>
            </div>
          )}

          {/* Dashboard content */}
          {!isLoading && !isError && (
            <>
              {/* Status Hero */}
              <div className={`rounded-2xl overflow-hidden ${heroBg}`}>
                <div className="p-6 pb-8 text-center">
                  <h2 className="text-2xl font-bold mb-1">{heroTitle}</h2>
                  <p className="opacity-70 text-sm">Your VPN infrastructure status</p>
                  {issueCount > 0 && healthStatus !== 'healthy' && (
                    <p className="mt-2 text-sm font-medium">
                      {issueCount} {issueCount === 1 ? 'issue' : 'issues'} found
                    </p>
                  )}
                </div>
                <div className="bg-black/10 px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    {[
                      { label: 'Servers', value: totalServers },
                      { label: 'Clients', value: totalClients },
                      { label: 'Active', value: activeConnections },
                      { label: 'Traffic', value: formatBytes(totalRx + totalTx) },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center">
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs opacity-70">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { type: 'Servers', count: totalServers, active: 4, icon: '🖥️' },
                  { type: 'Clients', count: totalClients, active: 3, icon: '💻' },
                ].map((card) => (
                  <div
                    key={card.type}
                    className="bg-card border border-border rounded-xl p-5 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {card.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {card.active} active / {card.count} total
                      </p>
                    </div>
                    <span className="text-2xl" aria-hidden="true">
                      {card.icon}
                    </span>
                  </div>
                ))}
              </div>

              {/* Protocol Stats Grid */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Protocols</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PROTOCOL_STATS.map((p) => (
                    <div
                      key={p.protocol}
                      className="bg-card border border-border rounded-xl p-4 space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <p className="font-semibold text-foreground">{p.protocol}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{p.servers} servers</span>
                        <span>{p.clients} clients</span>
                        <span>{p.active} active</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-success">↓ {formatBytes(p.rx)}</span>
                        <span className="text-primary">↑ {formatBytes(p.tx)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues Section */}
              {showIssues && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Issues &amp; Alerts</h2>
                  <div className="space-y-3">
                    {[
                      {
                        id: '1',
                        severity: 'error',
                        protocol: 'WireGuard',
                        name: 'wg1',
                        message: 'Interface is down – no handshake in 30 minutes',
                      },
                      {
                        id: '2',
                        severity: 'warning',
                        protocol: 'L2TP',
                        name: 'l2tp-server',
                        message: 'High connection latency detected (>500ms)',
                      },
                    ].map((issue) => (
                      <div
                        key={issue.id}
                        className={`border rounded-xl p-4 flex items-start gap-3 ${
                          issue.severity === 'error'
                            ? 'border-error/30 bg-error/5'
                            : 'border-warning/30 bg-warning/5'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            issue.severity === 'error'
                              ? 'bg-error/20 text-error'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {issue.protocol} – {issue.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <button className="flex items-center gap-2 min-h-[44px] px-4 border border-border rounded-md text-sm">
                  Configure Servers
                </button>
                <button className="flex items-center gap-2 min-h-[44px] px-4 border border-border rounded-md text-sm">
                  Configure Clients
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Healthy VPN infrastructure with servers, clients and protocol stats.
 */
export const Healthy: Story = {
  name: 'Loaded – healthy',
  render: () => (
    <DashboardShell
      healthStatus="healthy"
      totalServers={5}
      totalClients={4}
      activeConnections={7}
      totalRx={24117248}
      totalTx={12582912}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'All VPN interfaces are running correctly. The hero shows a green "All Systems ' +
          'Protected" banner with aggregate traffic and counts.',
      },
    },
  },
};

/**
 * Warning state – some interfaces need attention.
 */
export const WithWarnings: Story = {
  name: 'Loaded – warnings',
  render: () => (
    <DashboardShell
      healthStatus="warning"
      totalServers={5}
      totalClients={4}
      activeConnections={5}
      totalRx={18874368}
      totalTx={9437184}
      issueCount={2}
      showIssues
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Two issues detected: one WireGuard interface is down and one L2TP server has high ' +
          'latency. The hero shows an amber warning banner and the Issues section lists both.',
      },
    },
  },
};

/**
 * Loading skeleton before data arrives.
 */
export const Loading: Story = {
  name: 'Loading state',
  render: () => (
    <DashboardShell
      healthStatus="healthy"
      totalServers={0}
      totalClients={0}
      activeConnections={0}
      totalRx={0}
      totalTx={0}
      isLoading
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton placeholders shown while the useVPNStats query is in-flight. The refresh ' +
          'button is disabled.',
      },
    },
  },
};

/**
 * Error state when the stats API fails.
 */
export const ErrorState: Story = {
  name: 'Error state',
  render: () => (
    <DashboardShell
      healthStatus="healthy"
      totalServers={0}
      totalClients={0}
      activeConnections={0}
      totalRx={0}
      totalTx={0}
      isError
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error banner with a "Try Again" button shown when the VPN stats query fails.',
      },
    },
  },
};

export const Mobile: Story = {
  ...Healthy,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Healthy,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
