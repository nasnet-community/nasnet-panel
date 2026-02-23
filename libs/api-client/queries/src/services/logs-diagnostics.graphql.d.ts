/**
 * GraphQL documents for Service Logs & Diagnostics (NAS-8.12)
 * Provides log streaming, diagnostic testing, and health monitoring
 */
/**
 * Get recent log entries for a service instance
 */
export declare const GET_SERVICE_LOG_FILE: import("graphql").DocumentNode;
/**
 * Get diagnostic history for a service instance
 */
export declare const GET_DIAGNOSTIC_HISTORY: import("graphql").DocumentNode;
/**
 * Get available diagnostic tests for a service type
 */
export declare const GET_AVAILABLE_DIAGNOSTICS: import("graphql").DocumentNode;
/**
 * Manually run diagnostics on a service instance
 */
export declare const RUN_SERVICE_DIAGNOSTICS: import("graphql").DocumentNode;
/**
 * Subscribe to real-time log stream for a service instance
 */
export declare const SUBSCRIBE_SERVICE_LOGS: import("graphql").DocumentNode;
/**
 * Subscribe to diagnostic progress updates
 */
export declare const SUBSCRIBE_DIAGNOSTICS_PROGRESS: import("graphql").DocumentNode;
//# sourceMappingURL=logs-diagnostics.graphql.d.ts.map