/**
 * Storybook stories for RoutingTable
 *
 * RoutingTable fetches route data via useRoutes() (Apollo) and reads the
 * current router IP from Zustand. Because these data sources are unavailable
 * in Storybook, we provide static render stories that replicate the distinct
 * visual states of the component:
 *
 *  - Loading skeleton
 *  - Error state
 *  - Empty state
 *  - Populated table (active / dynamic / disabled / default route variants)
 *
 * The static stories use a thin wrapper that reproduces the exact JSX the
 * component renders for each state, keeping the stories tightly coupled to
 * the real component structure.
 */

import type { RouteEntry } from '@nasnet/core/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Inline mock data
// ---------------------------------------------------------------------------

const MOCK_ROUTES: RouteEntry[] = [
  {
    id: '1',
    destination: '0.0.0.0/0',
    gateway: '192.168.1.1',
    interface: 'ether1',
    distance: 1,
    routeType: 'unicast',
    dynamic: false,
    active: true,
    disabled: false,
  },
  {
    id: '2',
    destination: '192.168.1.0/24',
    gateway: undefined,
    interface: 'bridge1',
    distance: 0,
    routeType: 'unicast',
    dynamic: true,
    active: true,
    disabled: false,
  },
  {
    id: '3',
    destination: '10.8.0.0/24',
    gateway: undefined,
    interface: 'ovpn-out1',
    distance: 1,
    routeType: 'unicast',
    dynamic: true,
    active: true,
    disabled: false,
  },
  {
    id: '4',
    destination: '172.16.0.0/16',
    gateway: '10.0.0.1',
    interface: 'ether2',
    distance: 5,
    routeType: 'unicast',
    dynamic: false,
    active: false,
    disabled: true,
  },
  {
    id: '5',
    destination: '192.0.2.0/24',
    gateway: undefined,
    interface: undefined,
    distance: 1,
    routeType: 'blackhole',
    dynamic: false,
    active: true,
    disabled: false,
  },
  {
    id: '6',
    destination: '198.51.100.0/24',
    gateway: undefined,
    interface: undefined,
    distance: 1,
    routeType: 'unreachable',
    dynamic: false,
    active: false,
    disabled: false,
  },
];

// ---------------------------------------------------------------------------
// Helper sub-components matching the real component's rendering
// ---------------------------------------------------------------------------

function RouteTypeBadge({ type, dynamic }: { type: string; dynamic: boolean }) {
  const typeColors: Record<string, string> = {
    unicast: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blackhole: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    unreachable: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    prohibit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  const colorClass =
    typeColors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <div className="flex items-center gap-1">
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
      >
        {type}
      </span>
      {dynamic && (
        <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          dynamic
        </span>
      )}
    </div>
  );
}

const isDefaultRoute = (destination: string) =>
  destination === '0.0.0.0/0' || destination === '::/0';

function StaticRoutingTable({ routes }: { routes: RouteEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Destination</TableHead>
          <TableHead>Gateway</TableHead>
          <TableHead>Interface</TableHead>
          <TableHead>Distance</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((route) => (
          <TableRow
            key={route.id}
            className={[
              route.disabled ? 'bg-slate-50 opacity-50 dark:bg-slate-800/50' : '',
              route.active ? 'bg-green-50 dark:bg-green-950' : '',
              isDefaultRoute(route.destination) ? 'border-l-4 border-l-blue-500' : '',
            ].join(' ')}
          >
            <TableCell className={`font-mono ${route.active ? 'font-bold' : ''}`}>
              {route.destination}
              {isDefaultRoute(route.destination) && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(default)</span>
              )}
            </TableCell>
            <TableCell className={route.disabled ? 'line-through' : ''}>
              {route.gateway ?? '-'}
            </TableCell>
            <TableCell className={route.disabled ? 'line-through' : ''}>
              {route.interface ?? '-'}
            </TableCell>
            <TableCell className="text-center">{route.distance}</TableCell>
            <TableCell>
              <RouteTypeBadge
                type={route.routeType}
                dynamic={route.dynamic}
              />
            </TableCell>
            <TableCell className="text-center">
              {route.active ?
                <span className="font-medium text-green-600 dark:text-green-400">●</span>
              : <span className="text-slate-300 dark:text-slate-600">○</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

/**
 * Dummy component used as the Storybook "component" so argTypes and autodocs
 * are attached to the correct display name. The actual stories use render()
 * for static states.
 */
function RoutingTablePlaceholder(_props: { className?: string }) {
  return null;
}
RoutingTablePlaceholder.displayName = 'RoutingTable';

const meta: Meta<typeof RoutingTablePlaceholder> = {
  title: 'Features/Firewall/RoutingTable',
  component: RoutingTablePlaceholder,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays all IPv4/IPv6 routing table entries fetched from the router. Supports column sorting, highlights the default route, colour-codes route types (unicast / blackhole / unreachable / prohibit), and marks dynamic and active routes visually.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoutingTablePlaceholder>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Fully populated table with all route variant types: default gateway,
 * dynamic connected routes, a disabled route, a blackhole and an unreachable.
 */
export const Populated: Story = {
  render: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <StaticRoutingTable routes={MOCK_ROUTES} />
    </div>
  ),
};

/**
 * Single default-route-only view — highlights the blue left-border and "(default)" label.
 */
export const DefaultRouteHighlighted: Story = {
  render: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <StaticRoutingTable routes={MOCK_ROUTES.filter((r) => r.destination === '0.0.0.0/0')} />
    </div>
  ),
};

/**
 * Only active routes (active=true, disabled=false) — green row highlights.
 */
export const ActiveRoutesOnly: Story = {
  render: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <StaticRoutingTable routes={MOCK_ROUTES.filter((r) => r.active && !r.disabled)} />
    </div>
  ),
};

/**
 * Includes a disabled route — shows strikethrough on gateway/interface cells
 * and muted row styling.
 */
export const WithDisabledRoute: Story = {
  render: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <StaticRoutingTable routes={MOCK_ROUTES.filter((r) => r.disabled || r.id === '1')} />
    </div>
  ),
};

/**
 * Loading skeleton — matches the skeleton the real component renders while
 * the Apollo query is in flight.
 */
export const LoadingState: Story = {
  render: () => (
    <div className="p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  ),
};

/**
 * Error state — matches the red error message shown when the Apollo query fails.
 */
export const ErrorState: Story = {
  render: () => (
    <div className="p-4 text-red-600 dark:text-red-400">
      Error loading routes: connection refused — router is unreachable.
    </div>
  ),
};

/**
 * Empty state — no routes returned from the router.
 */
export const EmptyState: Story = {
  render: () => (
    <div className="p-8 text-center text-slate-500 dark:text-slate-400">No routes found</div>
  ),
};
