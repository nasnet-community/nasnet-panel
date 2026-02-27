/**
 * GraphQL queries, mutations, and subscriptions for VLAN management (NAS-6.7)
 * Following NasNetConnect's GraphQL patterns
 */
/**
 * Query to fetch all VLANs for a router with optional filtering
 */
export declare const GET_VLANS: import('graphql').DocumentNode;
/**
 * Query to fetch a single VLAN by ID
 */
export declare const GET_VLAN: import('graphql').DocumentNode;
/**
 * Query to check if a VLAN ID is available on a specific parent interface
 * Used during form validation to prevent duplicate VLAN IDs
 */
export declare const CHECK_VLAN_ID_AVAILABLE: import('graphql').DocumentNode;
/**
 * Mutation to create a new VLAN interface
 */
export declare const CREATE_VLAN: import('graphql').DocumentNode;
/**
 * Mutation to update an existing VLAN interface
 */
export declare const UPDATE_VLAN: import('graphql').DocumentNode;
/**
 * Mutation to delete a VLAN interface
 */
export declare const DELETE_VLAN: import('graphql').DocumentNode;
/**
 * Mutation to configure a bridge port for VLAN access or trunk mode
 */
export declare const CONFIGURE_VLAN_PORT: import('graphql').DocumentNode;
/**
 * Subscription for real-time VLAN change events
 * Notifies when VLANs are created, updated, or deleted
 */
export declare const VLAN_CHANGED: import('graphql').DocumentNode;
//# sourceMappingURL=vlan-queries.graphql.d.ts.map
