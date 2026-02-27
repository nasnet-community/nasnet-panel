/**
 * Query keys for storage operations
 * Used for cache invalidation and refetching
 */

export const storageKeys = {
  all: ['storage'] as const,
  info: () => [...storageKeys.all, 'info'] as const,
  usage: (routerId?: string) => [...storageKeys.all, 'usage', { routerId }] as const,
  config: () => [...storageKeys.all, 'config'] as const,
  unavailableFeatures: (routerId?: string) =>
    [...storageKeys.all, 'unavailable', { routerId }] as const,
};
