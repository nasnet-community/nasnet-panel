/**
 * Route Lookup Tool - Test Utilities
 *
 * Provides mock data structures and utilities for testing the Route Lookup diagnostic tool.
 * Used across component tests, E2E tests, and Storybook stories.
 *
 * @see Story NAS-6.10 - Implement Route Lookup Diagnostic - Task 9
 */

import type { Route, RouteType, RouteScope, RouteLookupResult, RouteLookupCandidate, VPNTunnelInfo, TunnelStatus } from '@nasnet/api-client/generated';

// =============================================================================
// Mock Route Objects
// =============================================================================

export const mockRoute = {
  staticDefault: {
    id: 'route-1',
    destination: '0.0.0.0/0',
    gateway: '192.168.88.1',
    interface: 'ether1',
    distance: 1,
    routingMark: null,
    routingTable: 'main',
    type: 'STATIC' as RouteType,
    scope: 'GLOBAL' as RouteScope,
    comment: 'Default route via ISP',
    active: true,
    disabled: false,
  },
  specificNetwork: {
    id: 'route-2',
    destination: '10.0.1.0/24',
    gateway: '192.168.88.254',
    interface: 'ether2',
    distance: 1,
    routingMark: null,
    routingTable: 'main',
    type: 'STATIC' as RouteType,
    scope: 'GLOBAL' as RouteScope,
    comment: 'Branch office network',
    active: true,
    disabled: false,
  },
  broaderNetwork: {
    id: 'route-3',
    destination: '10.0.0.0/8',
    gateway: '192.168.88.253',
    interface: 'ether3',
    distance: 10,
    routingMark: null,
    routingTable: 'main',
    type: 'STATIC' as RouteType,
    scope: 'GLOBAL' as RouteScope,
    comment: 'Entire 10.0.0.0/8 network',
    active: true,
    disabled: false,
  },
  vpnRoute: {
    id: 'route-4',
    destination: '172.16.0.0/12',
    gateway: null,
    interface: 'wireguard1',
    distance: 1,
    routingMark: null,
    routingTable: 'main',
    type: 'STATIC' as RouteType,
    scope: 'GLOBAL' as RouteScope,
    comment: 'VPN tunnel to remote site',
    active: true,
    disabled: false,
  },
  connectedRoute: {
    id: 'route-5',
    destination: '192.168.88.0/24',
    gateway: null,
    interface: 'bridge-lan',
    distance: 0,
    routingMark: null,
    routingTable: 'main',
    type: 'CONNECTED' as RouteType,
    scope: 'LINK' as RouteScope,
    comment: null,
    active: true,
    disabled: false,
  },
  ospfRoute: {
    id: 'route-6',
    destination: '10.20.30.0/24',
    gateway: '192.168.88.100',
    interface: 'ether4',
    distance: 110,
    routingMark: null,
    routingTable: 'main',
    type: 'OSPF' as RouteType,
    scope: 'GLOBAL' as RouteScope,
    comment: 'Learned via OSPF',
    active: true,
    disabled: false,
  },
} as const;

// =============================================================================
// Mock VPN Tunnel Info
// =============================================================================

export const mockVPNTunnel = {
  wireguardConnected: {
    name: 'wireguard1',
    type: 'wireguard',
    status: 'CONNECTED' as TunnelStatus,
    remoteAddress: '203.0.113.50',
  },
  wireguardDisconnected: {
    name: 'wireguard2',
    type: 'wireguard',
    status: 'DISCONNECTED' as TunnelStatus,
    remoteAddress: '203.0.113.51',
  },
  ipsecConnecting: {
    name: 'ipsec-tunnel1',
    type: 'ipsec',
    status: 'CONNECTING' as TunnelStatus,
    remoteAddress: '198.51.100.10',
  },
  ovpnConnected: {
    name: 'ovpn-client1',
    type: 'ovpn',
    status: 'CONNECTED' as TunnelStatus,
    remoteAddress: '192.0.2.100',
  },
} as const;

// =============================================================================
// Mock Route Lookup Candidates
// =============================================================================

export const mockCandidates = {
  singleMatch: [
    {
      route: mockRoute.specificNetwork,
      prefixLength: 24,
      distance: 1,
      selected: true,
      selectionReason: 'Only matching route',
    },
  ] as RouteLookupCandidate[],

  longestPrefixMatch: [
    {
      route: mockRoute.specificNetwork,
      prefixLength: 24,
      distance: 1,
      selected: true,
      selectionReason: 'Longest prefix match (most specific route)',
    },
    {
      route: mockRoute.broaderNetwork,
      prefixLength: 8,
      distance: 10,
      selected: false,
      selectionReason: 'Less specific prefix than selected route',
    },
    {
      route: mockRoute.staticDefault,
      prefixLength: 0,
      distance: 1,
      selected: false,
      selectionReason: 'Default route (fallback only)',
    },
  ] as RouteLookupCandidate[],

  distanceTiebreaker: [
    {
      route: { ...mockRoute.specificNetwork, distance: 5 },
      prefixLength: 24,
      distance: 5,
      selected: true,
      selectionReason: 'Lower administrative distance (5 vs 10)',
    },
    {
      route: { ...mockRoute.specificNetwork, id: 'route-2b', gateway: '192.168.88.200', distance: 10 },
      prefixLength: 24,
      distance: 10,
      selected: false,
      selectionReason: 'Higher administrative distance',
    },
  ] as RouteLookupCandidate[],

  defaultOnly: [
    {
      route: mockRoute.staticDefault,
      prefixLength: 0,
      distance: 1,
      selected: true,
      selectionReason: 'Default route (no more specific routes available)',
    },
  ] as RouteLookupCandidate[],
} as const;

// =============================================================================
// Mock Route Lookup Results
// =============================================================================

export const mockRouteLookupResult = {
  singleMatch: {
    destination: '10.0.1.50',
    matchedRoute: mockRoute.specificNetwork,
    gateway: '192.168.88.254',
    interface: 'ether2',
    distance: 1,
    routeType: 'STATIC' as RouteType,
    isDefaultRoute: false,
    candidateRoutes: mockCandidates.singleMatch,
    explanation: 'Route 10.0.1.0/24 selected (only matching route)',
    vpnTunnel: null,
  } as RouteLookupResult,

  longestPrefixMatch: {
    destination: '10.0.1.100',
    matchedRoute: mockRoute.specificNetwork,
    gateway: '192.168.88.254',
    interface: 'ether2',
    distance: 1,
    routeType: 'STATIC' as RouteType,
    isDefaultRoute: false,
    candidateRoutes: mockCandidates.longestPrefixMatch,
    explanation: 'Route 10.0.1.0/24 selected (longest prefix match, distance 1)',
    vpnTunnel: null,
  } as RouteLookupResult,

  defaultRoute: {
    destination: '8.8.8.8',
    matchedRoute: mockRoute.staticDefault,
    gateway: '192.168.88.1',
    interface: 'ether1',
    distance: 1,
    routeType: 'STATIC' as RouteType,
    isDefaultRoute: true,
    candidateRoutes: mockCandidates.defaultOnly,
    explanation: 'Using default route via gateway 192.168.88.1',
    vpnTunnel: null,
  } as RouteLookupResult,

  vpnRoute: {
    destination: '172.16.10.50',
    matchedRoute: mockRoute.vpnRoute,
    gateway: null,
    interface: 'wireguard1',
    distance: 1,
    routeType: 'STATIC' as RouteType,
    isDefaultRoute: false,
    candidateRoutes: [
      {
        route: mockRoute.vpnRoute,
        prefixLength: 12,
        distance: 1,
        selected: true,
        selectionReason: 'Only matching route (via VPN tunnel)',
      },
    ],
    explanation: 'Route 172.16.0.0/12 selected (via VPN tunnel wireguard1)',
    vpnTunnel: mockVPNTunnel.wireguardConnected,
  } as RouteLookupResult,

  noRouteFound: {
    destination: '203.0.113.100',
    matchedRoute: null,
    gateway: null,
    interface: null,
    distance: null,
    routeType: 'STATIC' as RouteType,
    isDefaultRoute: false,
    candidateRoutes: [],
    explanation: 'No route found to 203.0.113.100. Check routing table or add a default route.',
    vpnTunnel: null,
  } as RouteLookupResult,

  ospfRoute: {
    destination: '10.20.30.50',
    matchedRoute: mockRoute.ospfRoute,
    gateway: '192.168.88.100',
    interface: 'ether4',
    distance: 110,
    routeType: 'OSPF' as RouteType,
    isDefaultRoute: false,
    candidateRoutes: [
      {
        route: mockRoute.ospfRoute,
        prefixLength: 24,
        distance: 110,
        selected: true,
        selectionReason: 'Learned via OSPF routing protocol',
      },
    ],
    explanation: 'Route 10.20.30.0/24 selected (learned via OSPF, distance 110)',
    vpnTunnel: null,
  } as RouteLookupResult,
} as const;

// =============================================================================
// GraphQL Mock Builders
// =============================================================================

/**
 * Creates a mock Apollo Client response for the routeLookup query
 */
export function createRouteLookupMock(
  routerId: string,
  destination: string,
  result: RouteLookupResult,
  source?: string
) {
  return {
    request: {
      query: require('./routeLookup.graphql').ROUTE_LOOKUP,
      variables: {
        routerId,
        destination,
        ...(source && { source }),
      },
    },
    result: {
      data: {
        routeLookup: result,
      },
    },
  };
}

/**
 * Creates a mock Apollo Client error response
 */
export function createRouteLookupErrorMock(
  routerId: string,
  destination: string,
  errorMessage: string,
  source?: string
) {
  return {
    request: {
      query: require('./routeLookup.graphql').ROUTE_LOOKUP,
      variables: {
        routerId,
        destination,
        ...(source && { source }),
      },
    },
    error: new Error(errorMessage),
  };
}

/**
 * Creates a loading state mock (never resolves)
 */
export function createRouteLookupLoadingMock(
  routerId: string,
  destination: string,
  source?: string
) {
  return {
    request: {
      query: require('./routeLookup.graphql').ROUTE_LOOKUP,
      variables: {
        routerId,
        destination,
        ...(source && { source }),
      },
    },
    delay: Infinity, // Never resolves to show loading state
  };
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Helper to wait for async updates in tests
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Helper to create a custom route for testing edge cases
 */
export function createMockRoute(overrides: Partial<Route>): Route {
  return {
    ...mockRoute.specificNetwork,
    ...overrides,
  };
}

/**
 * Helper to create a custom VPN tunnel for testing
 */
export function createMockVPNTunnel(overrides: Partial<VPNTunnelInfo>): VPNTunnelInfo {
  return {
    ...mockVPNTunnel.wireguardConnected,
    ...overrides,
  };
}

/**
 * Helper to create a custom candidate for testing
 */
export function createMockCandidate(overrides: Partial<RouteLookupCandidate>): RouteLookupCandidate {
  return {
    route: mockRoute.specificNetwork,
    prefixLength: 24,
    distance: 1,
    selected: false,
    selectionReason: null,
    ...overrides,
  };
}
