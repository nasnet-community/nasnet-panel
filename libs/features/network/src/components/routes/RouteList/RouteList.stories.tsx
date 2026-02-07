/**
 * RouteList Storybook Stories
 * NAS-6.5: Task 9.6 - Static Route Management
 *
 * Demonstrates the RouteList component in various states and platform configurations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { RouteListDesktop } from './RouteListDesktop';
import { RouteListMobile } from './RouteListMobile';
import { RouteType, RouteScope, type Route } from '@nasnet/api-client/queries';
import type { RouteFilters, RouteSortOptions } from './types';

/**
 * Mock route data covering all route types and states
 */
const mockRoutes: Route[] = [
  // Default route (0.0.0.0/0) - CRITICAL route
  {
    id: 'route-default',
    destination: '0.0.0.0/0',
    gateway: '192.168.1.1',
    interface: 'ether1',
    distance: 1,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.STATIC,
    scope: RouteScope.GLOBAL,
    comment: 'Default gateway to ISP',
    active: true,
    disabled: false,
  },
  // Connected route (automatically generated)
  {
    id: 'route-lan',
    destination: '192.168.88.0/24',
    gateway: undefined,
    interface: 'bridge1',
    distance: 0,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.CONNECTED,
    scope: RouteScope.LINK,
    comment: undefined,
    active: true,
    disabled: false,
  },
  // Static route to VPN subnet
  {
    id: 'route-vpn',
    destination: '10.8.0.0/24',
    gateway: '192.168.1.254',
    interface: 'wg-vpn',
    distance: 1,
    routingMark: 'vpn-mark',
    routingTable: 'vpn',
    type: RouteType.STATIC,
    scope: RouteScope.GLOBAL,
    comment: 'WireGuard VPN subnet',
    active: true,
    disabled: false,
  },
  // BGP learned route
  {
    id: 'route-bgp',
    destination: '172.16.0.0/12',
    gateway: '10.0.0.1',
    interface: undefined,
    distance: 20,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.BGP,
    scope: RouteScope.GLOBAL,
    comment: undefined,
    active: true,
    disabled: false,
  },
  // OSPF route
  {
    id: 'route-ospf',
    destination: '172.20.0.0/16',
    gateway: '10.0.0.2',
    interface: 'ether2',
    distance: 110,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.OSPF,
    scope: RouteScope.GLOBAL,
    comment: 'OSPF Area 0',
    active: true,
    disabled: false,
  },
  // Disabled static route
  {
    id: 'route-disabled',
    destination: '192.168.100.0/24',
    gateway: '192.168.1.100',
    interface: undefined,
    distance: 5,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.STATIC,
    scope: RouteScope.GLOBAL,
    comment: 'Temporarily disabled route',
    active: false,
    disabled: true,
  },
  // Inactive route (gateway unreachable)
  {
    id: 'route-inactive',
    destination: '10.99.0.0/16',
    gateway: '192.168.1.99',
    interface: undefined,
    distance: 1,
    routingMark: undefined,
    routingTable: 'main',
    type: RouteType.STATIC,
    scope: RouteScope.GLOBAL,
    comment: 'Unreachable gateway',
    active: false,
    disabled: false,
  },
];

const availableTables = ['main', 'vpn', 'guest', 'iot'];

const defaultFilters: RouteFilters = {
  table: undefined,
  type: undefined,
  searchText: '',
  activeOnly: false,
};

const vpnFilteredFilters: RouteFilters = {
  table: 'vpn',
  type: undefined,
  searchText: '',
  activeOnly: false,
};

const staticOnlyFilters: RouteFilters = {
  table: undefined,
  type: RouteType.STATIC,
  searchText: '',
  activeOnly: false,
};

const defaultSortOptions: RouteSortOptions = {
  field: 'destination',
  direction: 'asc',
};

const baseProps = {
  routerId: 'router-1',
  routes: mockRoutes,
  loading: false,
  error: undefined,
  filters: defaultFilters,
  sortOptions: defaultSortOptions,
  availableTables,
  onFiltersChange: action('onFiltersChange'),
  onSortChange: action('onSortChange'),
  onRefresh: action('onRefresh'),
  onEdit: action('onEdit'),
  onDelete: action('onDelete'),
  onToggleDisabled: action('onToggleDisabled'),
};

// Desktop Stories
const metaDesktop: Meta<typeof RouteListDesktop> = {
  title: 'Features/Network/Routes/RouteList/Desktop',
  component: RouteListDesktop,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
    },
    docs: {
      description: {
        component:
          'Route list component with filtering, sorting, and CRUD operations for static routes. Desktop variant uses DataTable layout optimized for keyboard/mouse interaction. Only STATIC routes can be edited or deleted.',
      },
    },
  },
  tags: ['autodocs'],
};

export default metaDesktop;

type StoryDesktop = StoryObj<typeof RouteListDesktop>;

/**
 * Default state with multiple routes covering all RouteType values.
 * Shows default route (0.0.0.0/0), connected routes, static routes, BGP/OSPF routes, and disabled routes.
 */
export const Default: StoryDesktop = {
  args: baseProps,
};

/**
 * Loading state with skeleton UI while fetching routes from router.
 */
export const Loading: StoryDesktop = {
  args: {
    ...baseProps,
    routes: [],
    loading: true,
  },
};

/**
 * Empty state when no routes are configured on the router.
 * Shows empty message encouraging user to add their first route.
 */
export const Empty: StoryDesktop = {
  args: {
    ...baseProps,
    routes: [],
    allRoutes: [],
  },
};

/**
 * Error state when route query fails (connection refused, timeout, etc.).
 * Displays error alert with retry capability.
 */
export const Error: StoryDesktop = {
  args: {
    ...baseProps,
    routes: [],
    error: 'Failed to fetch routes from router. Connection refused.',
  },
};

/**
 * Filtered by routing table (VPN table only).
 * Demonstrates table-based filtering for policy routing setups.
 */
export const FilteredByTable: StoryDesktop = {
  args: {
    ...baseProps,
    routes: mockRoutes.filter((r) => r.routingTable === 'vpn'),
    filters: vpnFilteredFilters,
  },
};

/**
 * Filtered by route type (STATIC only).
 * Shows only user-configured static routes, excluding connected/dynamic routes.
 */
export const FilteredByType: StoryDesktop = {
  args: {
    ...baseProps,
    routes: mockRoutes.filter((r) => r.type === RouteType.STATIC),
    filters: staticOnlyFilters,
  },
};

/**
 * Performance test with 75 generated routes.
 * Demonstrates DataTable handling of larger datasets.
 */
export const ManyRoutes: StoryDesktop = {
  args: {
    ...baseProps,
    routes: Array.from({ length: 75 }, (_, i) => ({
      id: `route-${i}`,
      destination: `10.${Math.floor(i / 255)}.${i % 255}.0/24`,
      gateway: `192.168.${Math.floor(i / 255)}.${(i % 255) + 1}`,
      interface: i % 3 === 0 ? 'ether1' : i % 3 === 1 ? 'ether2' : undefined,
      distance: (i % 10) + 1,
      routingMark: i % 5 === 0 ? 'policy-mark' : undefined,
      routingTable: i % 3 === 0 ? 'main' : i % 3 === 1 ? 'vpn' : 'guest',
      type: [RouteType.STATIC, RouteType.CONNECTED, RouteType.DYNAMIC, RouteType.BGP, RouteType.OSPF][
        i % 5
      ],
      scope: RouteScope.GLOBAL,
      comment: i % 4 === 0 ? `Auto-generated route ${i}` : undefined,
      active: i % 7 !== 0,
      disabled: i % 11 === 0,
    })),
  },
};

// Mobile Stories
const metaMobile: Meta<typeof RouteListMobile> = {
  title: 'Features/Network/Routes/RouteList/Mobile',
  component: RouteListMobile,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        component:
          'Mobile variant of RouteList using card-based layout. Optimized for touch interaction with 44px minimum touch targets and vertical stacking.',
      },
    },
  },
  tags: ['autodocs'],
};

export { metaMobile };

type StoryMobile = StoryObj<typeof RouteListMobile>;

/**
 * Mobile default state with card-based layout.
 * Each route displayed as a full-width card with touch-optimized actions.
 */
export const MobileDefault: StoryMobile = {
  args: baseProps,
};

/**
 * Mobile loading state with spinner.
 */
export const MobileLoading: StoryMobile = {
  args: {
    ...baseProps,
    routes: [],
    loading: true,
  },
};

/**
 * Mobile empty state with centered empty message.
 */
export const MobileEmpty: StoryMobile = {
  args: {
    ...baseProps,
    routes: [],
    allRoutes: [],
  },
};

/**
 * Mobile error state with alert banner.
 */
export const MobileError: StoryMobile = {
  args: {
    ...baseProps,
    routes: [],
    error: 'Failed to load routes',
  },
};

/**
 * Mobile view with small dataset (easier to review on small screens).
 */
export const MobileFewRoutes: StoryMobile = {
  args: {
    ...baseProps,
    routes: mockRoutes.slice(0, 3),
  },
};

/**
 * Mobile view with longer scrollable list.
 */
export const MobileLongList: StoryMobile = {
  args: {
    ...baseProps,
    routes: mockRoutes.concat(mockRoutes).concat(mockRoutes),
  },
};
