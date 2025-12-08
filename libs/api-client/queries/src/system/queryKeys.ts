/**
 * Query keys for system-related queries
 * Follows TanStack Query best practices for hierarchical keys
 */

import type { LogTopic } from '@nasnet/core/types';

export const systemKeys = {
  all: ['system'] as const,

  // Log keys
  logs: (routerIp: string, options?: { topics?: LogTopic[]; limit?: number }) =>
    [...systemKeys.all, 'logs', routerIp, options] as const,

  // Note keys (for configuration import feature)
  note: (routerIp: string) => [...systemKeys.all, 'note', routerIp] as const,
};

/**
 * Query keys for IP-related queries
 */
export const ipKeys = {
  all: ['ip'] as const,

  // Services keys (api, ssh, telnet, etc.)
  services: (routerIp: string) => [...ipKeys.all, 'services', routerIp] as const,
};

/**
 * Query keys for batch job operations
 */
export const batchKeys = {
  all: ['batch'] as const,

  // Specific job by ID
  job: (jobId: string) => [...batchKeys.all, 'job', jobId] as const,
};
