/**
 * GraphQL documents for bridge configuration management
 * NAS-6.6: Bridge Configuration
 */
/**
 * Get list of bridges on a router
 */
export declare const GET_BRIDGES: import("graphql").DocumentNode;
/**
 * Get detailed information for a single bridge including ports and VLANs
 */
export declare const GET_BRIDGE: import("graphql").DocumentNode;
/**
 * Get bridge ports for a specific bridge
 */
export declare const GET_BRIDGE_PORTS: import("graphql").DocumentNode;
/**
 * Get bridge VLANs for a specific bridge
 */
export declare const GET_BRIDGE_VLANS: import("graphql").DocumentNode;
/**
 * Get interfaces available to add to a bridge (not in any bridge)
 */
export declare const GET_AVAILABLE_INTERFACES: import("graphql").DocumentNode;
/**
 * Create a new bridge
 */
export declare const CREATE_BRIDGE: import("graphql").DocumentNode;
/**
 * Update an existing bridge
 */
export declare const UPDATE_BRIDGE: import("graphql").DocumentNode;
/**
 * Delete a bridge
 */
export declare const DELETE_BRIDGE: import("graphql").DocumentNode;
/**
 * Undo a bridge operation (within 10-second window)
 */
export declare const UNDO_BRIDGE_OPERATION: import("graphql").DocumentNode;
/**
 * Add a port to a bridge
 */
export declare const ADD_BRIDGE_PORT: import("graphql").DocumentNode;
/**
 * Update bridge port settings
 */
export declare const UPDATE_BRIDGE_PORT: import("graphql").DocumentNode;
/**
 * Remove a port from a bridge
 */
export declare const REMOVE_BRIDGE_PORT: import("graphql").DocumentNode;
/**
 * Create a bridge VLAN entry
 */
export declare const CREATE_BRIDGE_VLAN: import("graphql").DocumentNode;
/**
 * Delete a bridge VLAN entry
 */
export declare const DELETE_BRIDGE_VLAN: import("graphql").DocumentNode;
/**
 * Subscribe to STP status changes for a bridge
 */
export declare const BRIDGE_STP_STATUS_CHANGED: import("graphql").DocumentNode;
/**
 * Subscribe to bridge port changes
 */
export declare const BRIDGE_PORTS_CHANGED: import("graphql").DocumentNode;
//# sourceMappingURL=bridge-queries.graphql.d.ts.map