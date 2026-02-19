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
  if (dbm >= -50) return { label: 'Excellent', color: 'text-emerald-500' };
  if (dbm >= -60) return { label: 'Good', color: 'text-green-500' };
  if (dbm >= -70) return { label: 'Fair', color: 'text-amber-500' };
  return { label: 'Weak', color: 'text-red-500' };
}

interface StatusHeroProps {
  interfaces: typeof MOCK_INTERFACES;
  clients: typeof MOCK_CLIENTS;
}

function StatusHero({ interfaces, clients }: StatusHeroProps) {
  const activeInterfaces = interfaces.filter((i) => !i.disabled && i.running);
  const activePercent =
    interfaces.length > 0
      ? Math.round((activeInterfaces.length / interfaces.length) * 100)
      : 0;
  const avgSignal =
    clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + c.signalStrength, 0) / clients.length)
      : -100;
  const { label: sigLabel, color: sigColor } = getSignalLabel(avgSignal);
  const bands = {
    '2.4GHz': interfaces.filter((i) => i.band === '2.4GHz').length,
    '5GHz': interfaces.filter((i) => i.band === '5GHz').length,
    '6GHz': interfaces.filter((i) => i.band === '6GHz').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {/* Clients */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Clients</p>
        <p className="text-xl md:text-2xl font-bold text-foreground">{clients.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Connected devices</p>
      </div>

      {/* Active Interfaces */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Active</p>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {activeInterfaces.length}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{interfaces.length}
          </span>
        </p>
        <div
          className="w-full bg-muted rounded-full h-1.5 mt-2"
          role="progressbar"
          aria-valuenow={activePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-emerald-500 h-1.5 rounded-full"
            style={{ width: `${activePercent}%` }}
          />
        </div>
      </div>

      {/* Signal */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Signal</p>
        <p className={`text-xl md:text-2xl font-bold ${sigColor}`}>
          {clients.length > 0 ? `${avgSignal} dBm` : '—'}
        </p>
        {clients.length > 0 && (
          <p className={`text-xs mt-1 ${sigColor}`}>{sigLabel}</p>
        )}
      </div>

      {/* Bands */}
      <div className="bg-card rounded-xl p-3 md:p-4 border border-border">
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Bands</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {bands['2.4GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              2.4G
            </span>
          )}
          {bands['5GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              5G
            </span>
          )}
          {bands['6GHz'] > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
              6G
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {interfaces.length} interface{interfaces.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function InterfaceCard({ iface }: { iface: (typeof MOCK_INTERFACES)[0] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{iface.name}</span>
          {iface.ssid && (
            <span className="text-sm text-muted-foreground">{iface.ssid}</span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              iface.running
                ? 'bg-success/10 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {iface.running ? 'Running' : 'Stopped'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            {iface.band}
          </span>
        </div>
        <button
          className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
            !iface.disabled ? 'bg-success' : 'bg-muted'
          }`}
          aria-label={`Toggle ${iface.name}`}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Connected Clients</h2>
        <p className="text-xs text-muted-foreground">{clients.length} devices connected</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">MAC</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Interface</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Signal</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Uptime</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">RX / TX</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const { label, color } = getSignalLabel(client.signalStrength);
              return (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs text-foreground">{client.macAddress}</td>
                  <td className="p-3 text-muted-foreground">{client.interface}</td>
                  <td className={`p-3 ${color}`}>
                    {client.signalStrength} dBm
                    <span className="ml-1 text-xs opacity-70">({label})</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{client.uptime}</td>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Security Summary</h2>
        <p className="text-xs text-muted-foreground">Security profile status per interface</p>
      </div>
      <div className="p-4 space-y-3">
        {interfaces.map((iface) => (
          <div key={iface.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{iface.name}</p>
              <p className="text-xs text-muted-foreground">{iface.securityProfile}</p>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                iface.securityProfile.includes('guest')
                  ? 'bg-warning/10 text-warning'
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
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 md:px-6 md:py-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">WiFi Management</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your wireless networks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 min-h-[44px] px-3 border border-border rounded-md text-sm">
              Refresh
            </button>
            <button className="flex items-center gap-2 min-h-[44px] px-3 bg-primary text-primary-foreground rounded-md text-sm">
              Scan Clients
            </button>
          </div>
        </div>

        <StatusHero interfaces={MOCK_INTERFACES} clients={MOCK_CLIENTS} />

        {/* Interface list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Wireless Interfaces</h2>
          {MOCK_INTERFACES.map((iface) => (
            <InterfaceCard key={iface.id} iface={iface} />
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
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 md:px-6 md:py-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">WiFi Management</h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your wireless networks
            </p>
          </div>
          <button className="flex items-center gap-2 min-h-[44px] px-3 border border-border rounded-md text-sm">
            Refresh
          </button>
        </div>

        <StatusHero interfaces={MOCK_INTERFACES} clients={[]} />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Wireless Interfaces</h2>
          {MOCK_INTERFACES.map((iface) => (
            <InterfaceCard key={iface.id} iface={iface} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">No clients connected</p>
          <p className="text-sm text-muted-foreground">
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
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-6" role="status" aria-label="Loading WiFi data">
          {/* Header skeleton */}
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 bg-muted rounded" />
              <div className="h-4 w-60 bg-muted rounded" />
            </div>
            <div className="h-11 w-24 bg-muted rounded-md" />
          </div>
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-xl p-3 md:p-4 space-y-2">
                <div className="h-3 w-12 bg-muted-foreground/20 rounded" />
                <div className="h-7 w-8 bg-muted-foreground/20 rounded" />
                <div className="h-1.5 bg-muted-foreground/20 rounded-full" />
              </div>
            ))}
          </div>
          {/* Interface cards skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          {/* Table skeleton */}
          <div className="h-64 bg-muted rounded-xl" />
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
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        <div
          className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center"
          role="alert"
        >
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load WiFi data
          </h3>
          <p className="text-sm text-destructive/80 mb-4">
            Connection refused: unable to reach the router at 192.168.88.1
          </p>
          <button className="px-4 py-2 border border-border rounded-md text-sm min-h-[44px]">
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
