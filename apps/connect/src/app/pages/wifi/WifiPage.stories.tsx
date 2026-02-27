/**
 * Storybook stories for WifiPage
 *
 * WifiPage is the main WiFi management dashboard. It renders:
 * - A page header with quick-action buttons (refresh, scan, etc.)
 * - WifiStatusHero: a 4-cell stats grid (clients, active interfaces,
 *   average signal, frequency bands)
 * - WifiInterfaceList: per-interface cards with controls
 * - ConnectedClientsTable: registration table for connected devices
 * - WifiSecuritySummary: security profile status per interface
 *
 * Because WifiPage depends on API hooks and Zustand stores, stories use
 * presentational replicas driven by inline mock data that document the
 * intended visual outcome for each state.
 */

import type { FrequencyBand } from '@nasnet/core/types';

import { WifiPage } from './WifiPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WifiPage> = {
  title: 'App/Pages/WifiPage',
  component: WifiPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main WiFi management dashboard. Implements FR0-14 (wireless interface list with ' +
          'status). Shows a stats hero, interface list with per-interface controls, ' +
          'a connected clients table and a security summary panel. Supports manual refresh ' +
          'via the QueryClient invalidation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WifiPage>;

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const MOCK_INTERFACES: Array<{
  id: string;
  name: string;
  macAddress: string;
  ssid: string;
  disabled: boolean;
  running: boolean;
  band: FrequencyBand;
  frequency: number;
  channel: string;
  mode: string;
  txPower: number;
  securityProfile: string;
  connectedClients: number;
}> = [
  {
    id: '*1',
    name: 'wlan1',
    macAddress: 'AA:BB:CC:DD:EE:01',
    ssid: 'HomeNetwork',
    disabled: false,
    running: true,
    band: '2.4GHz',
    frequency: 2437,
    channel: '6',
    mode: 'ap-bridge',
    txPower: 20,
    securityProfile: 'wpa2-default',
    connectedClients: 5,
  },
  {
    id: '*2',
    name: 'wlan2',
    macAddress: 'AA:BB:CC:DD:EE:02',
    ssid: 'HomeNetwork-5G',
    disabled: false,
    running: true,
    band: '5GHz',
    frequency: 5180,
    channel: '36',
    mode: 'ap-bridge',
    txPower: 23,
    securityProfile: 'wpa2-default',
    connectedClients: 3,
  },
  {
    id: '*3',
    name: 'wlan3',
    macAddress: 'AA:BB:CC:DD:EE:03',
    ssid: 'GuestNet',
    disabled: true,
    running: false,
    band: '2.4GHz',
    frequency: 2462,
    channel: '11',
    mode: 'ap-bridge',
    txPower: 15,
    securityProfile: 'guest-profile',
    connectedClients: 0,
  },
];

const MOCK_CLIENTS = [
  {
    id: 'c1',
    macAddress: '11:22:33:44:55:01',
    interface: 'wlan1',
    signalStrength: -52,
    txRate: 54,
    rxRate: 54,
    uptime: '3h 12m',
    lastActivity: '2s',
    rxBytes: 10485760,
    txBytes: 5242880,
    rxPackets: 12000,
    txPackets: 8000,
  },
  {
    id: 'c2',
    macAddress: '11:22:33:44:55:02',
    interface: 'wlan1',
    signalStrength: -65,
    txRate: 36,
    rxRate: 24,
    uptime: '1d 5h',
    lastActivity: '15s',
    rxBytes: 52428800,
    txBytes: 26214400,
    rxPackets: 45000,
    txPackets: 30000,
  },
  {
    id: 'c3',
    macAddress: '11:22:33:44:55:03',
    interface: 'wlan2',
    signalStrength: -45,
    txRate: 300,
    rxRate: 300,
    uptime: '45m',
    lastActivity: '1s',
    rxBytes: 104857600,
    txBytes: 52428800,
    rxPackets: 90000,
    txPackets: 60000,
  },
];

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

function getSignalLabel(dbm: number) {
  if (dbm >= -50) return { label: 'Excellent', color: 'text-success' };
  if (dbm >= -60) return { label: 'Good', color: 'text-success' };
  if (dbm >= -70) return { label: 'Fair', color: 'text-warning' };
  return { label: 'Weak', color: 'text-error' };
}

interface StatusHeroProps {
  interfaces: typeof MOCK_INTERFACES;
  clients: typeof MOCK_CLIENTS;
}

function StatusHero({ interfaces, clients }: StatusHeroProps) {
  const activeInterfaces = interfaces.filter((i) => !i.disabled && i.running);
  const activePercent =
    interfaces.length > 0 ? Math.round((activeInterfaces.length / interfaces.length) * 100) : 0;
  const avgSignal =
    clients.length > 0 ?
      Math.round(clients.reduce((sum, c) => sum + c.signalStrength, 0) / clients.length)
    : -100;
  const { label: sigLabel, color: sigColor } = getSignalLabel(avgSignal);
  const bands = {
    '2.4GHz': interfaces.filter((i) => i.band === '2.4GHz').length,
    '5GHz': interfaces.filter((i) => i.band === '5GHz').length,
    '6GHz': interfaces.filter((i) => i.band === '6GHz').length,
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
      {/* Clients */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Clients</p>
        <p className="text-foreground text-xl font-bold md:text-2xl">{clients.length}</p>
        <p className="text-muted-foreground mt-1 text-xs">Connected devices</p>
      </div>

      {/* Active Interfaces */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Active</p>
        <p className="text-foreground text-xl font-bold md:text-2xl">
          {activeInterfaces.length}
          <span className="text-muted-foreground ml-1 text-sm font-normal">
            /{interfaces.length}
          </span>
        </p>
        <div
          className="bg-muted mt-2 h-1.5 w-full rounded-full"
          role="progressbar"
          aria-valuenow={activePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-1.5 rounded-full bg-emerald-500"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Signal */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Signal</p>
        <p className={`text-xl font-bold md:text-2xl ${sigColor}`}>
          {clients.length > 0 ? `${avgSignal} dBm` : '—'}
        </p>
        {clients.length > 0 && <p className={`mt-1 text-xs ${sigColor}`}>{sigLabel}</p>}
      </div>

      {/* Bands */}
      <div className="bg-card border-border rounded-xl border p-3 md:p-4">
        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Bands</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {bands['2.4GHz'] > 0 && (
            <span className="bg-info/10 text-info rounded px-1.5 py-0.5 text-xs font-medium">
              2.4G
            </span>
          )}
          {bands['5GHz'] > 0 && (
            <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium">
              5G
            </span>
          )}
          {bands['6GHz'] > 0 && (
            <span className="bg-error/10 text-error rounded px-1.5 py-0.5 text-xs font-medium">
              6G
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {interfaces.length} interface{interfaces.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function InterfaceCard({ iface }: { iface: (typeof MOCK_INTERFACES)[0] }) {
  return (
    <div className="bg-card border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground font-semibold">{iface.name}</span>
          {iface.ssid && <span className="text-muted-foreground text-sm">{iface.ssid}</span>}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              iface.running ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}
          >
            {iface.running ? 'Running' : 'Stopped'}
          </span>
          <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
            {iface.band}
          </span>
        </div>
        <button
          className={`h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
            !iface.disabled ? 'bg-success' : 'bg-muted'
          }`}
          aria-label={`Toggle ${iface.name}`}
        />
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
        <span>Ch {iface.channel}</span>
        <span>{iface.frequency} MHz</span>
        <span>TX {iface.txPower} dBm</span>
        <span>{iface.connectedClients} clients</span>
        <span>{iface.macAddress}</span>
      </div>
    </div>
  );
}

function ClientsTable({ clients }: { clients: typeof MOCK_CLIENTS }) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border">
      <div className="border-border border-b p-4">
        <h2 className="text-foreground font-semibold">Connected Clients</h2>
        <p className="text-muted-foreground text-xs">{clients.length} devices connected</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-muted/30 border-b">
              <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase">
                MAC
              </th>
              <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase">
                Interface
              </th>
              <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase">
                Signal
              </th>
              <th className="text-muted-foreground p-3 text-left text-xs font-medium uppercase">
                Uptime
              </th>
              <th className="text-muted-foreground p-3 text-right text-xs font-medium uppercase">
                RX / TX
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const { label, color } = getSignalLabel(client.signalStrength);
              return (
                <tr
                  key={client.id}
                  className="border-border hover:bg-muted/20 border-b last:border-0"
                >
                  <td className="text-foreground p-3 font-mono text-xs">{client.macAddress}</td>
                  <td className="text-muted-foreground p-3">{client.interface}</td>
                  <td className={`p-3 ${color}`}>
                    {client.signalStrength} dBm
                    <span className="ml-1 text-xs opacity-70">({label})</span>
                  </td>
                  <td className="text-muted-foreground p-3">{client.uptime}</td>
                  <td className="p-3 text-right text-xs">
                    <span className="text-success">↓ {formatBytes(client.rxBytes)}</span>
                    {' / '}
                    <span className="text-primary">↑ {formatBytes(client.txBytes)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SecuritySummary({ interfaces }: { interfaces: typeof MOCK_INTERFACES }) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border">
      <div className="border-border border-b p-4">
        <h2 className="text-foreground font-semibold">Security Summary</h2>
        <p className="text-muted-foreground text-xs">Security profile status per interface</p>
      </div>
      <div className="space-y-3 p-4">
        {interfaces.map((iface) => (
          <div
            key={iface.id}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-foreground text-sm font-medium">{iface.name}</p>
              <p className="text-muted-foreground text-xs">{iface.securityProfile}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                iface.securityProfile.includes('guest') ?
                  'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
              }`}
            >
              {iface.securityProfile.includes('guest') ? 'Moderate' : 'Strong'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Fully loaded dashboard with interfaces, clients and security summary.
 */
export const Default: Story = {
  name: 'Loaded – full dashboard',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6 md:py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">WiFi Management</h1>
            <p className="text-muted-foreground text-sm">
              Monitor and manage your wireless networks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="border-border flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-sm">
              Refresh
            </button>
            <button className="bg-primary text-primary-foreground flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm">
              Scan Clients
            </button>
          </div>
        </div>

        <StatusHero
          interfaces={MOCK_INTERFACES}
          clients={MOCK_CLIENTS}
        />

        {/* Interface list */}
        <div className="space-y-3">
          <h2 className="text-foreground text-lg font-semibold">Wireless Interfaces</h2>
          {MOCK_INTERFACES.map((iface) => (
            <InterfaceCard
              key={iface.id}
              iface={iface}
            />
          ))}
        </div>

        <ClientsTable clients={MOCK_CLIENTS} />
        <SecuritySummary interfaces={MOCK_INTERFACES} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Full dashboard with three wireless interfaces (2.4 GHz + 5 GHz running, one ' +
          '2.4 GHz guest disabled), three connected clients and a security summary.',
      },
    },
  },
};

/**
 * No connected clients – signal and client count show empty/zero.
 */
export const NoClients: Story = {
  name: 'Loaded – no connected clients',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-4 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">WiFi Management</h1>
            <p className="text-muted-foreground text-sm">
              Monitor and manage your wireless networks
            </p>
          </div>
          <button className="border-border flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-sm">
            Refresh
          </button>
        </div>

        <StatusHero
          interfaces={MOCK_INTERFACES}
          clients={[]}
        />

        <div className="space-y-3">
          <h2 className="text-foreground text-lg font-semibold">Wireless Interfaces</h2>
          {MOCK_INTERFACES.map((iface) => (
            <InterfaceCard
              key={iface.id}
              iface={iface}
            />
          ))}
        </div>

        <div className="bg-card border-border rounded-xl border p-12 text-center">
          <p className="text-foreground mb-2 text-lg font-semibold">No clients connected</p>
          <p className="text-muted-foreground text-sm">
            There are currently no devices connected to any wireless interface.
          </p>
        </div>

        <SecuritySummary interfaces={MOCK_INTERFACES} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Interfaces are up but no clients are connected. The stats hero shows 0 clients ' +
          'and "—" for signal. The clients area shows an empty state message.',
      },
    },
  },
};

/**
 * Loading skeleton shown while both wireless queries are in-flight.
 */
export const Loading: Story = {
  name: 'Loading state',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        {/* Loading skeleton */}
        <div
          className="animate-pulse space-y-6"
          role="status"
          aria-label="Loading WiFi data"
        >
          {/* Header skeleton */}
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="bg-muted h-7 w-40 rounded" />
              <div className="bg-muted h-4 w-60 rounded" />
            </div>
            <div className="bg-muted h-11 w-24 rounded-md" />
          </div>
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-muted space-y-2 rounded-xl p-3 md:p-4"
              >
                <div className="bg-muted-foreground/20 h-3 w-12 rounded" />
                <div className="bg-muted-foreground/20 h-7 w-8 rounded" />
                <div className="bg-muted-foreground/20 h-1.5 rounded-full" />
              </div>
            ))}
          </div>
          {/* Interface cards skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-24 rounded-xl"
              />
            ))}
          </div>
          {/* Table skeleton */}
          <div className="bg-muted h-64 rounded-xl" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton loading state shown while useWirelessInterfaces and useWirelessClients ' +
          'queries are in-flight.',
      },
    },
  },
};

/**
 * Error state when the wireless interfaces query fails.
 */
export const ErrorState: Story = {
  name: 'Error state',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <div
          className="bg-destructive/10 border-destructive/30 rounded-xl border p-6 text-center"
          role="alert"
        >
          <h3 className="text-destructive mb-2 text-lg font-semibold">Failed to load WiFi data</h3>
          <p className="text-destructive/80 mb-4 text-sm">
            Connection refused: unable to reach the router at 192.168.88.1
          </p>
          <button className="border-border min-h-[44px] rounded-md border px-4 py-2 text-sm">
            Try Again
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error banner shown when the wireless interfaces query fails. Displays the error ' +
          'message and a "Try Again" button that re-invalidates the wireless query cache.',
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
