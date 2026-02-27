/**
 * GraphQL documents for Service Instance Management
 * Feature Marketplace: Tor, sing-box, Xray, MTProxy, Psiphon, AdGuard Home
 */
/**
 * List all available services from the Feature Marketplace
 */
export declare const GET_AVAILABLE_SERVICES: import('graphql').DocumentNode;
/**
 * List all service instances for a router
 */
export declare const GET_SERVICE_INSTANCES: import('graphql').DocumentNode;
/**
 * Get a specific service instance
 */
export declare const GET_SERVICE_INSTANCE: import('graphql').DocumentNode;
/**
 * Install a new service instance on a router
 */
export declare const INSTALL_SERVICE: import('graphql').DocumentNode;
/**
 * Start a service instance
 */
export declare const START_INSTANCE: import('graphql').DocumentNode;
/**
 * Stop a service instance
 */
export declare const STOP_INSTANCE: import('graphql').DocumentNode;
/**
 * Restart a service instance
 */
export declare const RESTART_INSTANCE: import('graphql').DocumentNode;
/**
 * Delete a service instance
 */
export declare const DELETE_INSTANCE: import('graphql').DocumentNode;
/**
 * Subscribe to installation progress events
 */
export declare const SUBSCRIBE_INSTALL_PROGRESS: import('graphql').DocumentNode;
/**
 * Subscribe to instance status change events
 */
export declare const SUBSCRIBE_INSTANCE_STATUS_CHANGED: import('graphql').DocumentNode;
/**
 * Get all dependencies of a service instance (services it depends on)
 */
export declare const GET_DEPENDENCIES: import('graphql').DocumentNode;
/**
 * Get all dependents of a service instance (services that depend on it)
 */
export declare const GET_DEPENDENTS: import('graphql').DocumentNode;
/**
 * Get the full dependency graph for a router (for visualization)
 */
export declare const GET_DEPENDENCY_GRAPH: import('graphql').DocumentNode;
/**
 * Get the current boot sequence progress (if running)
 */
export declare const GET_BOOT_SEQUENCE_PROGRESS: import('graphql').DocumentNode;
/**
 * Add a new dependency relationship between service instances
 */
export declare const ADD_DEPENDENCY: import('graphql').DocumentNode;
/**
 * Remove an existing dependency relationship
 */
export declare const REMOVE_DEPENDENCY: import('graphql').DocumentNode;
/**
 * Manually trigger the boot sequence for auto-start instances
 */
export declare const TRIGGER_BOOT_SEQUENCE: import('graphql').DocumentNode;
/**
 * Subscribe to boot sequence events
 */
export declare const SUBSCRIBE_BOOT_SEQUENCE_EVENTS: import('graphql').DocumentNode;
//# sourceMappingURL=services.graphql.d.ts.map
