/**
 * Storybook stories for VPNPage
 *
 * VPNPage displays all VPN interface types (WireGuard, L2TP, PPTP, SSTP)
 * with auto-refresh, manual refresh, loading, error and empty states.
 *
 * Because VPNPage depends on API hooks and Zustand stores, stories use
 * a render wrapper that replaces the real component tree with a
 * presentational replica driven by inline mock data.
 */

import { VPNPage } from './VPNPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNPage> = {
  title: 'App/Pages/VPNPage',
  component: VPNPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main VPN configuration page. Shows WireGuard interfaces plus L2TP, PPTP and SSTP ' +
          'accordion sections. Implements FR0-19 (interface list) and FR0-21 (real-time status ' +
          'with 5-second auto-refresh and manual refresh button).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VPNPage>;

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const MOCK_WG_INTERFACES = [
  {
    id: '1',
    name: 'wg0',
    running: true,
    disabled: false,
    listenPort: 13231,
    publicKey: 'ABC123pubkeyABC123pubkeyABC123pubkeyABC123pubkey=',
    mtu: 1420,
    rx: 10485760,
    tx: 5242880,
  },
  {
    id: '2',
    name: 'wg1',
    running: false,
    disabled: false,
    listenPort: 13232,
    publicKey: 'DEF456pubkeyDEF456pubkeyDEF456pubkeyDEF456pubkey=',
    mtu: 1420,
    rx: 0,
    tx: 0,
  },
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Loaded state with two WireGuard interfaces and empty L2TP/PPTP/SSTP sections.
 *
 * Note: this story renders the real VPNPage component. In a full Storybook
 * setup you would provide MSW handlers or module mocks so the hooks return
 * the mock data. The story documents the intended visual outcome.
 */
export const Default: Story = {
  name: 'Loaded – WireGuard interfaces',
  render: () => (
    <div className="bg-background min-h-screen">
      {/* Presentational replica showing the loaded state */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-2xl font-semibold">VPN Configuration</h1>
              <p className="text-muted-foreground text-sm">
                View your VPN setup and monitor interface status{' '}
                <span className="text-xs opacity-70">(Auto-refreshes every 5s)</span>
              </p>
            </div>
            <button
              className="border-border flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md border px-3 text-sm"
              aria-label="Refresh VPN interfaces"
            >
              Refresh
            </button>
          </div>

          {/* WireGuard interfaces */}
          <div className="space-y-4">
            {MOCK_WG_INTERFACES.map((iface) => (
              <div
                key={iface.id}
                className="bg-card border-border space-y-2 rounded-2xl border p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-semibold">{iface.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        iface.running ?
                          'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {iface.running ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">Port {iface.listenPort}</span>
                </div>
                <p className="text-muted-foreground truncate font-mono text-xs">
                  {iface.publicKey}
                </p>
                <div className="text-muted-foreground flex gap-4 text-xs">
                  <span>MTU {iface.mtu}</span>
                  {iface.rx != null && <span>RX {(iface.rx / 1048576).toFixed(1)} MB</span>}
                  {iface.tx != null && <span>TX {(iface.tx / 1048576).toFixed(1)} MB</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Other VPN types */}
          <div className="space-y-4">
            <h2 className="text-foreground text-xl font-semibold">Other VPN Types</h2>
            <p className="text-muted-foreground text-sm">
              Additional VPN protocols configured on your router
            </p>
            {['L2TP', 'PPTP', 'SSTP'].map((type) => (
              <div
                key={type}
                className="bg-card border-border rounded-2xl border p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">{type}</span>
                  <span className="bg-muted rounded-full px-2 py-0.5 text-xs">0</span>
                </div>
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No {type} interfaces configured
                </p>
              </div>
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
          'Fully loaded state with two WireGuard interfaces (one running, one stopped) and ' +
          'empty accordion sections for L2TP, PPTP and SSTP.',
      },
    },
  },
};

/**
 * Loading skeleton state shown while all VPN queries are in-flight.
 */
export const Loading: Story = {
  name: 'Loading state',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-2xl font-semibold">VPN Configuration</h1>
              <p className="text-muted-foreground text-sm">
                View your VPN setup and monitor interface status{' '}
                <span className="text-xs opacity-70">(Auto-refreshes every 5s)</span>
              </p>
            </div>
            <button
              disabled
              className="border-border flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center gap-2 rounded-md border px-3 text-sm opacity-50"
              aria-label="Refresh VPN interfaces"
            >
              Refresh
            </button>
          </div>
          <div
            className="space-y-4"
            role="status"
            aria-label="Loading VPN interfaces"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted h-48 w-full animate-pulse rounded-2xl"
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
          'Skeleton state displayed while WireGuard, L2TP, PPTP and SSTP queries are still ' +
          'resolving. The refresh button is disabled.',
      },
    },
  },
};

/**
 * Error state when the WireGuard API call fails.
 */
export const ErrorState: Story = {
  name: 'Error state',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-2xl font-semibold">VPN Configuration</h1>
              <p className="text-muted-foreground text-sm">
                View your VPN setup and monitor interface status
              </p>
            </div>
            <button
              className="border-border flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md border px-3 text-sm"
              aria-label="Refresh VPN interfaces"
            >
              Refresh
            </button>
          </div>
          <div
            className="bg-error/10 dark:bg-error/20 border-error rounded-2xl border-2 p-6 shadow-sm"
            role="alert"
          >
            <div className="flex items-start gap-4">
              <svg
                className="text-error mt-0.5 h-6 w-6 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">
                  Failed to load VPN interfaces
                </h3>
                <p className="text-muted-foreground text-sm">
                  Unable to retrieve VPN configuration from the router. Please check your
                  connection.
                </p>
              </div>
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
          'Error state displayed when the WireGuard query fails. Shows an alert banner with ' +
          'guidance to check the router connection.',
      },
    },
  },
};

/**
 * Empty state when the router has no WireGuard interfaces configured.
 */
export const EmptyState: Story = {
  name: 'Empty state – no interfaces',
  render: () => (
    <div className="bg-background min-h-screen">
      <div className="px-6 py-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-foreground mb-1 text-2xl font-semibold">VPN Configuration</h1>
              <p className="text-muted-foreground text-sm">
                View your VPN setup and monitor interface status
              </p>
            </div>
            <button
              className="border-border flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md border px-3 text-sm"
              aria-label="Refresh VPN interfaces"
            >
              Refresh
            </button>
          </div>
          <div className="bg-card border-border rounded-2xl border p-12 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <svg
                className="text-muted-foreground h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-foreground mb-2 text-xl font-semibold">
              No WireGuard interfaces configured
            </h3>
            <p className="text-muted-foreground text-sm">
              Your router doesn&apos;t have any WireGuard VPN interfaces set up yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when the router has no WireGuard interfaces. Provides a lock icon ' +
          'and a descriptive message.',
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
