/**
 * Query keys for service-related queries
 * Follows TanStack Query best practices for hierarchical keys
 *
 * Used with Apollo Client's cache for consistent invalidation and refetching
 */
export declare const serviceQueryKeys: {
    /**
     * Root key for all service queries
     */
    all: readonly ["services"];
    /**
     * Keys for the service catalog (available services)
     */
    catalog: () => readonly ["services", "catalog"];
    catalogByCategory: (category: string) => readonly ["services", "catalog", string];
    catalogByArchitecture: (architecture: string) => readonly ["services", "catalog", "arch", string];
    catalogFiltered: (category?: string, architecture?: string) => readonly ["services", "catalog", {
        readonly category: string | undefined;
        readonly architecture: string | undefined;
    }];
    /**
     * Keys for service instances on a specific router
     */
    instances: (routerId: string) => readonly ["services", "instances", string];
    instancesByStatus: (routerId: string, status?: string) => readonly ["services", "instances", string, "status", string | undefined];
    instancesByFeature: (routerId: string, featureID?: string) => readonly ["services", "instances", string, "feature", string | undefined];
    instancesFiltered: (routerId: string, status?: string, featureID?: string) => readonly ["services", "instances", string, {
        readonly status: string | undefined;
        readonly featureID: string | undefined;
    }];
    /**
     * Keys for a specific service instance
     */
    instance: (routerId: string, instanceId: string) => readonly ["services", "instances", string, string];
    /**
     * Keys for installation progress tracking
     */
    installProgress: (routerId: string) => readonly ["services", "install-progress", string];
    installProgressByInstance: (routerId: string, instanceId: string) => readonly ["services", "install-progress", string, string];
};
//# sourceMappingURL=queryKeys.d.ts.map