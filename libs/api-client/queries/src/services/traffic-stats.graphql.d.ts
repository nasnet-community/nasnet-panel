/**
 * Service Traffic Statistics GraphQL Documents
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * Provides GraphQL queries, mutations, subscriptions for:
 * - Real-time service traffic monitoring (total, upload, download)
 * - Historical traffic data with time-series graphs
 * - Per-device bandwidth breakdown (using mangle counters)
 * - Traffic quota management with automated enforcement
 */
/**
 * Query service traffic statistics with historical data
 * Returns total traffic, current period usage, historical data points, and quota info
 */
export declare const GET_SERVICE_TRAFFIC_STATS: import("graphql").DocumentNode;
/**
 * Query per-device traffic breakdown for a service instance
 * Returns detailed bandwidth consumption per connected device
 */
export declare const GET_SERVICE_DEVICE_BREAKDOWN: import("graphql").DocumentNode;
/**
 * Mutation to set traffic quota for a service instance
 * Configures bandwidth limits with automated warnings and enforcement
 */
export declare const SET_TRAFFIC_QUOTA: import("graphql").DocumentNode;
/**
 * Mutation to reset/remove traffic quota for a service instance
 * Removes all quota restrictions and resets counters
 */
export declare const RESET_TRAFFIC_QUOTA: import("graphql").DocumentNode;
/**
 * Subscribe to real-time traffic statistics updates
 * Receives periodic updates when traffic counters change
 */
export declare const SUBSCRIBE_SERVICE_TRAFFIC_UPDATED: import("graphql").DocumentNode;
//# sourceMappingURL=traffic-stats.graphql.d.ts.map