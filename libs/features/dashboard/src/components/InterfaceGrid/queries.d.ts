/**
 * Interface Grid GraphQL Queries and Subscriptions
 *
 * This module defines GraphQL operations for fetching and subscribing
 * to interface data from the router.
 */
/**
 * GraphQL fragment for interface fields.
 *
 * @description
 * Shared field selection for Interface type. Ensures consistency
 * across queries and subscriptions. Includes real-time status,
 * traffic metrics, and hardware information.
 *
 * Fields included:
 * - Basic: id, name, type, comment
 * - Status: status, running, lastSeen
 * - Network: ip, mac, mtu
 * - Traffic: txRate, rxRate, linkSpeed
 * - Relations: usedBy, linkPartner
 */
export declare const INTERFACE_FIELDS: import("graphql").DocumentNode;
/**
 * GraphQL query to fetch all interfaces for a device.
 *
 * @description
 * Retrieves the complete interface list from the device.
 * Used as fallback when subscription is not available or for initial load.
 * Cached by Apollo Client (stableTime: 10s per architecture).
 *
 * Variables: deviceId (ID!) - UUID of the target device
 */
export declare const GET_INTERFACES: import("graphql").DocumentNode;
/**
 * GraphQL subscription for real-time interface status updates.
 *
 * @description
 * WebSocket subscription for live interface changes.
 * Returns the full list of interfaces on each update.
 * Priority: NORMAL (within 5 seconds) per GraphQL architecture.
 *
 * Variables: deviceId (ID!) - UUID of the target device
 * Update frequency: On any interface status/traffic change
 */
export declare const INTERFACE_STATUS_SUBSCRIPTION: import("graphql").DocumentNode;
//# sourceMappingURL=queries.d.ts.map