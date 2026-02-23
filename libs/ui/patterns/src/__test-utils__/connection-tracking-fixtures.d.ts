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
/**
 * Single established TCP connection
 */
export declare const mockEstablishedConnection: Connection;
/**
 * UDP connection without ports displayed
 */
export declare const mockUdpConnection: Connection;
/**
 * ICMP connection (no ports)
 */
export declare const mockIcmpConnection: Connection;
/**
 * RELATED state connection (related to existing connection)
 */
export declare const mockTimeWaitConnection: Connection;
/**
 * NEW state connection (new connection attempt)
 */
export declare const mockSynSentConnection: Connection;
/**
 * Connection with NAT (reply address different)
 */
export declare const mockNatConnection: Connection;
/**
 * Array of diverse connections for list testing
 */
export declare const mockConnections: Connection[];
/**
 * Generate large connection list for performance testing
 */
export declare function generateMockConnections(count: number): Connection[];
/**
 * Default connection tracking settings
 */
export declare const mockDefaultSettings: ConnectionTrackingSettings;
/**
 * Modified settings for testing changes
 */
export declare const mockModifiedSettings: ConnectionTrackingSettings;
/**
 * Disabled tracking settings
 */
export declare const mockDisabledSettings: ConnectionTrackingSettings;
/**
 * Filter by specific IP address
 */
export declare const mockIpFilter: ConnectionFilters;
/**
 * Filter by wildcard IP (192.168.1.*)
 */
export declare const mockWildcardFilter: ConnectionFilters;
/**
 * Filter by protocol
 */
export declare const mockProtocolFilter: ConnectionFilters;
/**
 * Filter by port
 */
export declare const mockPortFilter: ConnectionFilters;
/**
 * Filter by state
 */
export declare const mockStateFilter: ConnectionFilters;
/**
 * Combined filters
 */
export declare const mockCombinedFilters: ConnectionFilters;
/**
 * Mock GraphQL query response for connections list
 */
export declare const mockConnectionsQueryResponse: {
    data: {
        connections: Connection[];
    };
};
/**
 * Mock GraphQL query response for empty connections
 */
export declare const mockEmptyConnectionsQueryResponse: {
    data: {
        connections: never[];
    };
};
/**
 * Mock GraphQL query response for large connections list (1000+)
 */
export declare const mockLargeConnectionsQueryResponse: {
    data: {
        connections: Connection[];
    };
};
/**
 * Mock GraphQL query response for tracking settings
 */
export declare const mockSettingsQueryResponse: {
    data: {
        connectionTrackingSettings: ConnectionTrackingSettings;
    };
};
/**
 * Mock GraphQL mutation response for killing connection
 */
export declare const mockKillConnectionMutationResponse: {
    data: {
        killConnection: {
            success: boolean;
            connectionId: string;
        };
    };
};
/**
 * Mock GraphQL mutation response for updating settings
 */
export declare const mockUpdateSettingsMutationResponse: {
    data: {
        updateConnectionTrackingSettings: {
            success: boolean;
            settings: ConnectionTrackingSettings;
        };
    };
};
/**
 * Mock GraphQL error response
 */
export declare const mockErrorResponse: {
    errors: {
        message: string;
        extensions: {
            code: string;
        };
    }[];
};
/**
 * Filter connections by IP address with wildcard support
 */
export declare function filterConnectionsByIP(connections: Connection[], ipPattern: string): Connection[];
/**
 * Filter connections by port (source or destination)
 */
export declare function filterConnectionsByPort(connections: Connection[], port: number): Connection[];
/**
 * Filter connections by protocol
 */
export declare function filterConnectionsByProtocol(connections: Connection[], protocol: string): Connection[];
/**
 * Filter connections by state
 */
export declare function filterConnectionsByState(connections: Connection[], state: ConnectionTrackingState): Connection[];
/**
 * Apply all filters to connection list
 */
export declare function applyConnectionFilters(connections: Connection[], filters: ConnectionFilters): Connection[];
/**
 * Format seconds to duration string (e.g., "1d" or "10s")
 */
export declare function formatDuration(seconds: number): string;
/**
 * Parse duration string to seconds (e.g., "1d" -> 86400)
 */
export declare function parseDuration(duration: string): number;
//# sourceMappingURL=connection-tracking-fixtures.d.ts.map