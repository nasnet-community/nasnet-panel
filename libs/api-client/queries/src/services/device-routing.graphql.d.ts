/**
 * GraphQL documents for Device-to-Service Routing (NAS-8.3)
 *
 * Queries, mutations, and subscriptions for managing device routing assignments.
 * Devices can be routed through service instances (Tor, Xray, etc.) using PBR.
 */
/**
 * Query: Get complete device routing matrix
 *
 * Returns all data needed for the device-to-service routing UI:
 * - Discovered network devices (DHCP + ARP)
 * - Active virtual interfaces (service gateways)
 * - Current routing assignments
 * - Summary statistics
 *
 * @param routerID - Router ID to fetch matrix for
 */
export declare const GET_DEVICE_ROUTING_MATRIX: import("graphql").DocumentNode;
/**
 * Query: Get all device routings with optional filters
 *
 * @param routerID - Router ID to fetch routings for
 * @param deviceID - Optional: filter by device ID
 * @param instanceID - Optional: filter by service instance ID
 * @param active - Optional: filter by active status
 */
export declare const GET_DEVICE_ROUTINGS: import("graphql").DocumentNode;
/**
 * Query: Get single device routing by ID
 *
 * @param id - Device routing ID
 */
export declare const GET_DEVICE_ROUTING: import("graphql").DocumentNode;
/**
 * Mutation: Assign device to service instance
 *
 * Creates a new device routing assignment. This:
 * 1. Creates a mangle rule for PBR
 * 2. Records the assignment in the database
 * 3. Returns the created routing with mangle rule ID
 *
 * @param input - Assignment input with device and service details
 */
export declare const ASSIGN_DEVICE_ROUTING: import("graphql").DocumentNode;
/**
 * Mutation: Remove device routing assignment
 *
 * Removes a device routing assignment. This:
 * 1. Deletes the mangle rule (O(1) lookup via mangleRuleID)
 * 2. Soft-deletes the assignment record
 * 3. Returns true on success
 *
 * @param id - Device routing ID to remove
 */
export declare const REMOVE_DEVICE_ROUTING: import("graphql").DocumentNode;
/**
 * Mutation: Bulk assign multiple devices to service instances
 *
 * Assigns multiple devices in a single operation. Returns:
 * - Success count and successful assignments
 * - Failure count and failed assignments with error messages
 *
 * Continues on error - does not stop at first failure.
 *
 * @param input - Bulk assignment input with router ID and assignments array
 */
export declare const BULK_ASSIGN_ROUTING: import("graphql").DocumentNode;
/**
 * Subscription: Real-time device routing changes
 *
 * Subscribes to device routing events for a router:
 * - assigned: New device routing created
 * - removed: Device routing deleted
 * - updated: Device routing modified
 *
 * @param routerID - Router ID to subscribe to
 */
export declare const SUBSCRIBE_DEVICE_ROUTING_CHANGES: import("graphql").DocumentNode;
//# sourceMappingURL=device-routing.graphql.d.ts.map