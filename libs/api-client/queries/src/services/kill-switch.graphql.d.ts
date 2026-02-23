/**
 * GraphQL documents for Kill Switch (NAS-8.14)
 *
 * Queries, mutations, and subscriptions for managing kill switch functionality.
 * Kill switch blocks traffic when a service instance becomes unhealthy.
 */
/**
 * Query: Get kill switch status for a device
 *
 * Returns the current kill switch configuration and state:
 * - Enabled/disabled status
 * - Current mode (block_all, allow_direct, fallback_service)
 * - Active state (whether traffic is currently being blocked)
 * - Activation history (counts, timestamps, reasons)
 *
 * @param routerID - Router ID
 * @param deviceID - Device ID to check kill switch status for
 */
export declare const GET_KILL_SWITCH_STATUS: import("graphql").DocumentNode;
/**
 * Mutation: Set kill switch configuration for a device
 *
 * Configures the kill switch for a device routing. This:
 * 1. Updates the device routing record with kill switch settings
 * 2. Creates MikroTik filter rules to block traffic when service is unhealthy
 * 3. Returns the updated device routing with kill switch fields
 *
 * @param input - Kill switch configuration input
 */
export declare const SET_KILL_SWITCH: import("graphql").DocumentNode;
/**
 * Subscription: Real-time kill switch changes
 *
 * Subscribes to kill switch events for a router:
 * - activated: Kill switch triggered (service became unhealthy)
 * - deactivated: Kill switch released (service recovered)
 * - configured: Kill switch settings changed
 *
 * @param routerID - Router ID to subscribe to
 */
export declare const SUBSCRIBE_KILL_SWITCH_CHANGES: import("graphql").DocumentNode;
//# sourceMappingURL=kill-switch.graphql.d.ts.map