/**
 * GraphQL documents for network interface management
 * NAS-6.1: Interface List and Configuration
 */
/**
 * Get list of interfaces with optional type filtering and pagination
 */
export declare const GET_INTERFACES: import('graphql').DocumentNode;
/**
 * Get detailed information for a single interface
 */
export declare const GET_INTERFACE: import('graphql').DocumentNode;
/**
 * Update interface settings (MTU, comment, enabled state)
 */
export declare const UPDATE_INTERFACE: import('graphql').DocumentNode;
/**
 * Enable a disabled interface
 */
export declare const ENABLE_INTERFACE: import('graphql').DocumentNode;
/**
 * Disable an active interface
 */
export declare const DISABLE_INTERFACE: import('graphql').DocumentNode;
/**
 * Perform batch operations on multiple interfaces
 */
export declare const BATCH_INTERFACE_OPERATION: import('graphql').DocumentNode;
/**
 * Subscribe to interface status changes for real-time updates
 */
export declare const INTERFACE_STATUS_CHANGED: import('graphql').DocumentNode;
//# sourceMappingURL=queries.graphql.d.ts.map
