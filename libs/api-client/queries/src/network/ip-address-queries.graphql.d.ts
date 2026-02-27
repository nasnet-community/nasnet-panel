/**
 * GraphQL documents for IP address management
 * NAS-6.2: IP Address Management
 */
/**
 * Get list of IP addresses with optional interface filtering
 */
export declare const GET_IP_ADDRESSES: import('graphql').DocumentNode;
/**
 * Get detailed information for a single IP address
 */
export declare const GET_IP_ADDRESS: import('graphql').DocumentNode;
/**
 * Check if an IP address would conflict with existing addresses
 */
export declare const CHECK_IP_CONFLICT: import('graphql').DocumentNode;
/**
 * Get dependencies for an IP address (DHCP servers, routes, NAT/firewall rules)
 */
export declare const GET_IP_ADDRESS_DEPENDENCIES: import('graphql').DocumentNode;
/**
 * Create a new IP address on an interface
 */
export declare const CREATE_IP_ADDRESS: import('graphql').DocumentNode;
/**
 * Update an existing IP address
 */
export declare const UPDATE_IP_ADDRESS: import('graphql').DocumentNode;
/**
 * Delete an IP address
 */
export declare const DELETE_IP_ADDRESS: import('graphql').DocumentNode;
/**
 * Subscribe to IP address changes for real-time updates
 */
export declare const IP_ADDRESS_CHANGED: import('graphql').DocumentNode;
//# sourceMappingURL=ip-address-queries.graphql.d.ts.map
