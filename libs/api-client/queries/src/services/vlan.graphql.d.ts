/**
 * GraphQL documents for VLAN Auto-Allocation & Pool Management
 * Story NAS-8.18: Virtual Interface Factory VLAN management
 */
/**
 * List all VLAN allocations with optional filtering
 */
export declare const GET_VLAN_ALLOCATIONS: import("graphql").DocumentNode;
/**
 * Get VLAN pool status for a router
 */
export declare const GET_VLAN_POOL_STATUS: import("graphql").DocumentNode;
/**
 * Detect orphaned VLAN allocations for a router (diagnostic query)
 */
export declare const DETECT_ORPHANED_VLANS: import("graphql").DocumentNode;
/**
 * Clean up orphaned VLAN allocations for a router
 */
export declare const CLEANUP_ORPHANED_VLANS: import("graphql").DocumentNode;
/**
 * Update VLAN pool configuration
 */
export declare const UPDATE_VLAN_POOL_CONFIG: import("graphql").DocumentNode;
//# sourceMappingURL=vlan.graphql.d.ts.map