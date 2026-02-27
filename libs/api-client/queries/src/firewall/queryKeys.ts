/**
 * Query keys for firewall-related queries
 * Follows TanStack Query best practices for hierarchical keys
 */

import type { ConnectionFilters } from '@nasnet/core/types';

export const firewallConnectionKeys = {
  all: (routerId: string) => ['firewall', 'connections', routerId] as const,

  list: (routerId: string, filters?: ConnectionFilters) =>
    [...firewallConnectionKeys.all(routerId), 'list', filters] as const,

  byId: (routerId: string, connectionId: string) =>
    [...firewallConnectionKeys.all(routerId), connectionId] as const,

  tracking: (routerId: string) => ['firewall', 'tracking', routerId] as const,
};

/**
 * Query keys for firewall template operations
 */
export const firewallTemplateKeys = {
  all: ['firewall', 'templates'] as const,

  lists: () => [...firewallTemplateKeys.all, 'list'] as const,

  list: (filters?: { category?: string; complexity?: string }) =>
    [...firewallTemplateKeys.lists(), filters] as const,

  details: () => [...firewallTemplateKeys.all, 'detail'] as const,

  detail: (templateId: string) => [...firewallTemplateKeys.details(), templateId] as const,

  preview: (routerId: string, templateId: string, variables: Record<string, string>) =>
    [...firewallTemplateKeys.all, 'preview', routerId, templateId, variables] as const,

  custom: () => ['firewall', 'templates', 'custom'] as const,
};
