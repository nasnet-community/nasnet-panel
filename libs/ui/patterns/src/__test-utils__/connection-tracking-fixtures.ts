/**
 * Test Fixtures for Connection Tracking
 *
 * Mock data for testing connection list and connection tracking settings components.
 * Used across unit tests, component tests, and Storybook stories.
 *
 * Story: NAS-7.4 - Implement Connection Tracking
 *
 * NOTE: Using official types from @nasnet/core/types (backend layer complete)
 */

// Type definitions for connection tracking
// These types would come from GraphQL generated types in a production setup

export type ConnectionState = 'established' | 'new' | 'related' | 'invalid';
export type ConnectionTrackingState = ConnectionState;

export interface Connection {
  id: string;
  protocol: 'tcp' | 'udp' | 'icmp';
  srcAddress: string;
  srcPort?: number;
  dstAddress: string;
  dstPort?: number;
  replyDstAddress?: string;
  replyDstPort?: number;
  state: ConnectionState;
  timeout: string;
  packets: number;
  bytes: number;
  assured: boolean;
  confirmed: boolean;
}

export interface ConnectionTrackingSettings {
  enabled: boolean;
  maxEntries: number;
  genericTimeout: number;
  tcpEstablishedTimeout: number;
  tcpTimeWaitTimeout: number;
  tcpCloseTimeout: number;
  tcpSynSentTimeout: number;
  tcpSynReceivedTimeout: number;
  tcpFinWaitTimeout: number;
  tcpCloseWaitTimeout: number;
  tcpLastAckTimeout: number;
  udpTimeout: number;
  udpStreamTimeout: number;
  icmpTimeout: number;
  looseTracking: boolean;
}

export interface ConnectionFilters {
  ipAddress?: string;
  port?: number;
  protocol?: string;
  state?: ConnectionTrackingState;
}

// =============================================================================
// Mock Connection Data
// =============================================================================

/**
 * Single established TCP connection
 */
export const mockEstablishedConnection: Connection = {
  id: 'conn-1',
  protocol: 'tcp',
  srcAddress: '192.168.1.100',
  srcPort: 54321,
  dstAddress: '203.0.113.10',
  dstPort: 443,
  state: 'established',
  timeout: '23h59m50s',
  packets: 1250,
  bytes: 524288,
  assured: true,
  confirmed: true,
};

/**
 * UDP connection without ports displayed
 */
export const mockUdpConnection: Connection = {
  id: 'conn-2',
  protocol: 'udp',
  srcAddress: '192.168.1.50',
  srcPort: 51234,
  dstAddress: '8.8.8.8',
  dstPort: 53,
  state: 'established',
  timeout: '10s',
  packets: 4,
  bytes: 256,
  assured: false,
  confirmed: true,
};

/**
 * ICMP connection (no ports)
 */
export const mockIcmpConnection: Connection = {
  id: 'conn-3',
  protocol: 'icmp',
  srcAddress: '192.168.1.1',
  dstAddress: '1.1.1.1',
  state: 'established',
  timeout: '5s',
  packets: 2,
  bytes: 128,
  assured: false,
  confirmed: true,
};

/**
 * RELATED state connection (related to existing connection)
 */
export const mockTimeWaitConnection: Connection = {
  id: 'conn-4',
  protocol: 'tcp',
  srcAddress: '192.168.1.100',
  srcPort: 49152,
  dstAddress: '198.51.100.50',
  dstPort: 80,
  state: 'related',
  timeout: '10s',
  packets: 500,
  bytes: 102400,
  assured: true,
  confirmed: true,
};

/**
 * NEW state connection (new connection attempt)
 */
export const mockSynSentConnection: Connection = {
  id: 'conn-5',
  protocol: 'tcp',
  srcAddress: '192.168.1.25',
  srcPort: 60000,
  dstAddress: '203.0.113.100',
  dstPort: 22,
  state: 'new',
  timeout: '5s',
  packets: 1,
  bytes: 64,
  assured: false,
  confirmed: false,
};

/**
 * Connection with NAT (reply address different)
 */
export const mockNatConnection: Connection = {
  id: 'conn-6',
  protocol: 'tcp',
  srcAddress: '10.0.0.50',
  srcPort: 45678,
  dstAddress: '203.0.113.200',
  dstPort: 443,
  replyDstAddress: '192.168.1.1',
  replyDstPort: 45678,
  state: 'established',
  timeout: '1d',
  packets: 5000,
  bytes: 5242880,
  assured: true,
  confirmed: true,
};

/**
 * Array of diverse connections for list testing
 */
export const mockConnections: Connection[] = [
  mockEstablishedConnection,
  mockUdpConnection,
  mockIcmpConnection,
  mockTimeWaitConnection,
  mockSynSentConnection,
  mockNatConnection,
];

/**
 * Generate large connection list for performance testing
 */
export function generateMockConnections(count: number): Connection[] {
  const states: ConnectionState[] = ['established', 'new', 'related', 'invalid'];
  const protocols = ['tcp', 'udp', 'icmp'];

  return Array.from({ length: count }, (_, i) => ({
    id: `conn-${i + 1}`,
    protocol: protocols[i % protocols.length] as 'tcp' | 'udp' | 'icmp',
    srcAddress: `192.168.${Math.floor(i / 256) % 256}.${i % 256}`,
    srcPort: protocols[i % protocols.length] !== 'icmp' ? 50000 + i : undefined,
    dstAddress: `203.0.${Math.floor(i / 256) % 256}.${i % 256}`,
    dstPort: protocols[i % protocols.length] !== 'icmp' ? 443 : undefined,
    state: states[i % states.length],
    timeout: i % 2 === 0 ? '23h59m50s' : '10s',
    packets: Math.floor(Math.random() * 10000),
    bytes: Math.floor(Math.random() * 10485760),
    assured: i % 3 === 0,
    confirmed: i % 2 === 0,
  }));
}

// =============================================================================
// Mock Connection Tracking Settings
// =============================================================================

/**
 * Default connection tracking settings
 */
export const mockDefaultSettings: ConnectionTrackingSettings = {
  enabled: true,
  maxEntries: 32768,
  genericTimeout: 600, // 10 minutes
  tcpEstablishedTimeout: 86400, // 1 day
  tcpTimeWaitTimeout: 10,
  tcpCloseTimeout: 10,
  tcpSynSentTimeout: 5,
  tcpSynReceivedTimeout: 5,
  tcpFinWaitTimeout: 10,
  tcpCloseWaitTimeout: 10,
  tcpLastAckTimeout: 10,
  udpTimeout: 10,
  udpStreamTimeout: 180, // 3 minutes
  icmpTimeout: 10,
  looseTracking: true,
};

/**
 * Modified settings for testing changes
 */
export const mockModifiedSettings: ConnectionTrackingSettings = {
  enabled: true,
  maxEntries: 65536,
  genericTimeout: 300, // 5 minutes
  tcpEstablishedTimeout: 43200, // 12 hours
  tcpTimeWaitTimeout: 30,
  tcpCloseTimeout: 15,
  tcpSynSentTimeout: 10,
  tcpSynReceivedTimeout: 10,
  tcpFinWaitTimeout: 15,
  tcpCloseWaitTimeout: 15,
  tcpLastAckTimeout: 15,
  udpTimeout: 20,
  udpStreamTimeout: 300, // 5 minutes
  icmpTimeout: 15,
  looseTracking: false,
};

/**
 * Disabled tracking settings
 */
export const mockDisabledSettings: ConnectionTrackingSettings = {
  ...mockDefaultSettings,
  enabled: false,
};

// =============================================================================
// Mock Filter Scenarios
// =============================================================================

/**
 * Filter by specific IP address
 */
export const mockIpFilter: ConnectionFilters = {
  ipAddress: '192.168.1.100',
};

/**
 * Filter by wildcard IP (192.168.1.*)
 */
export const mockWildcardFilter: ConnectionFilters = {
  ipAddress: '192.168.1.*',
};

/**
 * Filter by protocol
 */
export const mockProtocolFilter: ConnectionFilters = {
  protocol: 'tcp',
};

/**
 * Filter by port
 */
export const mockPortFilter: ConnectionFilters = {
  port: 443,
};

/**
 * Filter by state
 */
export const mockStateFilter: ConnectionFilters = {
  state: 'established' as ConnectionTrackingState,
};

/**
 * Combined filters
 */
export const mockCombinedFilters: ConnectionFilters = {
  ipAddress: '192.168.1.*',
  protocol: 'tcp',
  state: 'established',
};

// =============================================================================
// GraphQL Mock Responses
// =============================================================================

/**
 * Mock GraphQL query response for connections list
 */
export const mockConnectionsQueryResponse = {
  data: {
    connections: mockConnections,
  },
};

/**
 * Mock GraphQL query response for empty connections
 */
export const mockEmptyConnectionsQueryResponse = {
  data: {
    connections: [],
  },
};

/**
 * Mock GraphQL query response for large connections list (1000+)
 */
export const mockLargeConnectionsQueryResponse = {
  data: {
    connections: generateMockConnections(1500),
  },
};

/**
 * Mock GraphQL query response for tracking settings
 */
export const mockSettingsQueryResponse = {
  data: {
    connectionTrackingSettings: mockDefaultSettings,
  },
};

/**
 * Mock GraphQL mutation response for killing connection
 */
export const mockKillConnectionMutationResponse = {
  data: {
    killConnection: {
      success: true,
      connectionId: 'conn-1',
    },
  },
};

/**
 * Mock GraphQL mutation response for updating settings
 */
export const mockUpdateSettingsMutationResponse = {
  data: {
    updateConnectionTrackingSettings: {
      success: true,
      settings: mockModifiedSettings,
    },
  },
};

/**
 * Mock GraphQL error response
 */
export const mockErrorResponse = {
  errors: [
    {
      message: 'Failed to fetch connections',
      extensions: {
        code: 'ROUTER_UNREACHABLE',
      },
    },
  ],
};

// =============================================================================
// Test Helper Functions
// =============================================================================

/**
 * Filter connections by IP address with wildcard support
 */
export function filterConnectionsByIP(connections: Connection[], ipPattern: string): Connection[] {
  if (!ipPattern) return connections;

  // Convert wildcard pattern to regex
  const regexPattern = ipPattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+');
  const regex = new RegExp(`^${regexPattern}$`);

  return connections.filter((conn) => regex.test(conn.srcAddress) || regex.test(conn.dstAddress));
}

/**
 * Filter connections by port (source or destination)
 */
export function filterConnectionsByPort(connections: Connection[], port: number): Connection[] {
  if (!port) return connections;

  return connections.filter((conn) => conn.srcPort === port || conn.dstPort === port);
}

/**
 * Filter connections by protocol
 */
export function filterConnectionsByProtocol(
  connections: Connection[],
  protocol: string
): Connection[] {
  if (!protocol) return connections;

  return connections.filter((conn) => conn.protocol === protocol);
}

/**
 * Filter connections by state
 */
export function filterConnectionsByState(
  connections: Connection[],
  state: ConnectionTrackingState
): Connection[] {
  if (!state) return connections;

  return connections.filter((conn) => conn.state === state);
}

/**
 * Apply all filters to connection list
 */
export function applyConnectionFilters(
  connections: Connection[],
  filters: ConnectionFilters
): Connection[] {
  let filtered = connections;

  if (filters.ipAddress) {
    filtered = filterConnectionsByIP(filtered, filters.ipAddress);
  }

  if (filters.port) {
    filtered = filterConnectionsByPort(filtered, filters.port);
  }

  if (filters.protocol) {
    filtered = filterConnectionsByProtocol(filtered, filters.protocol);
  }

  if (filters.state) {
    filtered = filterConnectionsByState(filtered, filters.state);
  }

  return filtered;
}

/**
 * Format seconds to duration string (e.g., "1d" or "10s")
 */
export function formatDuration(seconds: number): string {
  if (seconds >= 86400) {
    return `${Math.floor(seconds / 86400)}d`;
  }
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m`;
  }
  return `${seconds}s`;
}

/**
 * Parse duration string to seconds (e.g., "1d" -> 86400)
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 86400;
    case 'h':
      return value * 3600;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return 0;
  }
}
