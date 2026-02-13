/**
 * Query keys for service-related queries
 * Follows TanStack Query best practices for hierarchical keys
 *
 * Used with Apollo Client's cache for consistent invalidation and refetching
 */

export const serviceQueryKeys = {
  /**
   * Root key for all service queries
   */
  all: ['services'] as const,

  /**
   * Keys for the service catalog (available services)
   */
  catalog: () => [...serviceQueryKeys.all, 'catalog'] as const,
  catalogByCategory: (category: string) => [...serviceQueryKeys.catalog(), category] as const,
  catalogByArchitecture: (architecture: string) =>
    [...serviceQueryKeys.catalog(), 'arch', architecture] as const,
  catalogFiltered: (category?: string, architecture?: string) =>
    [...serviceQueryKeys.catalog(), { category, architecture }] as const,

  /**
   * Keys for service instances on a specific router
   */
  instances: (routerId: string) => [...serviceQueryKeys.all, 'instances', routerId] as const,
  instancesByStatus: (routerId: string, status?: string) =>
    [...serviceQueryKeys.instances(routerId), 'status', status] as const,
  instancesByFeature: (routerId: string, featureID?: string) =>
    [...serviceQueryKeys.instances(routerId), 'feature', featureID] as const,
  instancesFiltered: (routerId: string, status?: string, featureID?: string) =>
    [...serviceQueryKeys.instances(routerId), { status, featureID }] as const,

  /**
   * Keys for a specific service instance
   */
  instance: (routerId: string, instanceId: string) =>
    [...serviceQueryKeys.instances(routerId), instanceId] as const,

  /**
   * Keys for installation progress tracking
   */
  installProgress: (routerId: string) =>
    [...serviceQueryKeys.all, 'install-progress', routerId] as const,
  installProgressByInstance: (routerId: string, instanceId: string) =>
    [...serviceQueryKeys.installProgress(routerId), instanceId] as const,
};
