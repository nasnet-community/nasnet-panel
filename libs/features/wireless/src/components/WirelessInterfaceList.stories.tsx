/**
 * WirelessInterfaceList Stories
 *
 * The list component fetches data via useWirelessInterfaces, navigates on
 * card click via useNavigate, and reads the current router IP from
 * useConnectionStore. All three hooks are runtime dependencies that require
 * providers (MSW, TanStack Router, Zustand) in a full Storybook setup.
 *
 * To keep stories self-contained we render the internal sub-components
 * directly so every visual state (loading, empty, error, populated grid) can
 * be demonstrated without network or store setup.
 */

import { Wifi } from 'lucide-react';

import type { WirelessInterface } from '@nasnet/core/types';

import { WirelessInterfaceCard } from './WirelessInterfaceCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Lightweight skeleton / state helpers (mirrors WirelessInterfaceList internals)
// ---------------------------------------------------------------------------

function WirelessInterfaceSkeleton() {
  return (
    <div
      className="border-border p-component-md animate-pulse space-y-3 rounded-2xl border md:rounded-3xl"
      role="status"
      aria-label="Loading wireless interface"
    >
      <div className="flex items-start justify-between">
        <div className="gap-component-sm flex items-center">
          <div className="bg-muted h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <div className="bg-muted h-5 w-24 rounded" />
            <div className="bg-muted h-4 w-32 rounded" />
          </div>
        </div>
        <div className="bg-muted h-6 w-16 rounded-full" />
      </div>
      <div className="gap-component-md flex items-center">
        <div className="bg-muted h-5 w-16 rounded-md" />
        <div className="bg-muted h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
      <WirelessInterfaceSkeleton />
      <WirelessInterfaceSkeleton />
      <WirelessInterfaceSkeleton />
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="px-component-md flex flex-col items-center justify-center py-16 text-center"
      role="status"
    >
      <div className="bg-muted mb-4 rounded-full p-6">
        <Wifi
          className="text-muted-foreground h-12 w-12"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">No wireless interfaces found</h3>
      <p className="text-muted-foreground max-w-md text-sm">
        Your router doesn&apos;t appear to have any wireless interfaces configured. This is normal
        for routers without WiFi capabilities.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="px-component-md flex flex-col items-center justify-center py-16 text-center"
      role="alert"
    >
      <div className="bg-error/10 mb-4 rounded-full p-6">
        <Wifi
          className="text-error h-12 w-12"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">
        Failed to load wireless interfaces
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md text-sm">{message}</p>
      <button className="px-component-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring min-h-[44px] rounded-lg py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2">
        Retry
      </button>
    </div>
  );
}

interface PopulatedGridProps {
  interfaces: WirelessInterface[];
}

function PopulatedGrid({ interfaces }: PopulatedGridProps) {
  return (
    <div className="gap-component-md grid grid-cols-1 md:grid-cols-2">
      {interfaces.map((iface) => (
        <WirelessInterfaceCard
          key={iface.id}
          interface={iface}
          onClick={() => {}}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockInterfaces: WirelessInterface[] = [
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
    securityProfile: 'default',
    connectedClients: 4,
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
    txPower: 17,
    securityProfile: 'default',
    connectedClients: 8,
  },
];

const mockInterfacesMixed: WirelessInterface[] = [
  ...mockInterfaces,
  {
    id: '*3',
    name: 'wlan3',
    macAddress: 'AA:BB:CC:DD:EE:03',
    ssid: 'GuestNetwork',
    disabled: true,
    running: false,
    band: '2.4GHz',
    frequency: 2437,
    channel: '11',
    mode: 'ap-bridge',
    txPower: 10,
    securityProfile: 'guest',
    connectedClients: 0,
  },
  {
    id: '*4',
    name: 'wlan4',
    macAddress: 'AA:BB:CC:DD:EE:04',
    ssid: 'IoT-Devices',
    disabled: false,
    running: true,
    band: '2.4GHz',
    frequency: 2422,
    channel: '3',
    mode: 'ap-bridge',
    txPower: 15,
    securityProfile: 'iot',
    connectedClients: 11,
  },
];

// ---------------------------------------------------------------------------
// Meta — using LoadingGrid as the "component" for Storybook's controls panel
// ---------------------------------------------------------------------------

const meta: Meta<typeof LoadingGrid> = {
  title: 'Features/Wireless/WirelessInterfaceList',
  component: LoadingGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Renders a responsive grid of WirelessInterfaceCard components. Handles ' +
          'four distinct states: loading (skeleton cards), empty (no WiFi hardware), ' +
          'error (API failure with retry button), and the populated grid. ' +
          'Layout is single-column on mobile and two-column on tablet+.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingGrid>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading State',
  render: () => <LoadingGrid />,
};

export const Empty: Story = {
  name: 'Empty State — No Interfaces',
  render: () => <EmptyState />,
};

export const ErrorState_: Story = {
  name: 'Error State — API Failure',
  render: () => (
    <ErrorState message="Connection refused. Make sure the router is reachable and the API is running." />
  ),
};

export const TwoInterfaces: Story = {
  name: 'Populated — Two Interfaces',
  render: () => <PopulatedGrid interfaces={mockInterfaces} />,
};

export const FourInterfaces: Story = {
  name: 'Populated — Four Interfaces (mixed states)',
  render: () => <PopulatedGrid interfaces={mockInterfacesMixed} />,
};

export const SingleInterface: Story = {
  name: 'Populated — Single Interface',
  render: () => <PopulatedGrid interfaces={[mockInterfaces[0]]} />,
};
