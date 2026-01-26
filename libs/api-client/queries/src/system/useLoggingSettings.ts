/**
 * TanStack Query hooks for RouterOS logging configuration
 * Provides CRUD operations for log rules and actions
 * Epic 0.8: System Logs - RouterOS Log Settings
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { systemKeys } from './queryKeys';

/**
 * RouterOS logging rule
 */
export interface LoggingRule {
  '.id': string;
  topics: string;
  action: string;
  prefix?: string;
  disabled: boolean;
}

/**
 * RouterOS logging action (destination)
 */
export interface LoggingAction {
  '.id': string;
  name: string;
  target: 'memory' | 'disk' | 'echo' | 'remote';
  'memory-lines'?: number;
  'memory-stop-on-full'?: boolean;
  'disk-file-name'?: string;
  'disk-file-count'?: number;
  'disk-lines-per-file'?: number;
  'disk-stop-on-full'?: boolean;
  remote?: string;
  'remote-port'?: number;
}

/**
 * Extended query keys for logging
 */
export const loggingKeys = {
  all: [...systemKeys.all, 'logging'] as const,
  rules: (routerIp: string) => [...loggingKeys.all, 'rules', routerIp] as const,
  actions: (routerIp: string) =>
    [...loggingKeys.all, 'actions', routerIp] as const,
};

/**
 * Fetch logging rules
 */
async function fetchLoggingRules(routerIp: string): Promise<LoggingRule[]> {
  const result = await makeRouterOSRequest<LoggingRule[]>(
    routerIp,
    'system/logging'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch logging rules');
  }

  return result.data;
}

/**
 * Fetch logging actions (destinations)
 */
async function fetchLoggingActions(routerIp: string): Promise<LoggingAction[]> {
  const result = await makeRouterOSRequest<LoggingAction[]>(
    routerIp,
    'system/logging/action'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch logging actions');
  }

  return result.data;
}

/**
 * Hook for fetching logging rules
 */
export function useLoggingRules(
  routerIp: string
): UseQueryResult<LoggingRule[], Error> {
  return useQuery({
    queryKey: loggingKeys.rules(routerIp),
    queryFn: () => fetchLoggingRules(routerIp),
    staleTime: 30_000, // 30 seconds
    enabled: !!routerIp,
  });
}

/**
 * Hook for fetching logging actions
 */
export function useLoggingActions(
  routerIp: string
): UseQueryResult<LoggingAction[], Error> {
  return useQuery({
    queryKey: loggingKeys.actions(routerIp),
    queryFn: () => fetchLoggingActions(routerIp),
    staleTime: 30_000, // 30 seconds
    enabled: !!routerIp,
  });
}

/**
 * Input for creating a logging rule
 */
export interface CreateLoggingRuleInput {
  topics: string;
  action: string;
  prefix?: string;
  disabled?: boolean;
}

/**
 * Input for updating a logging rule
 */
export interface UpdateLoggingRuleInput {
  id: string;
  topics?: string;
  action?: string;
  prefix?: string;
  disabled?: boolean;
}

/**
 * Input for updating a logging action
 */
export interface UpdateLoggingActionInput {
  id: string;
  'memory-lines'?: number;
  'memory-stop-on-full'?: boolean;
  'disk-file-name'?: string;
  'disk-file-count'?: number;
  'disk-lines-per-file'?: number;
  'disk-stop-on-full'?: boolean;
  remote?: string;
  'remote-port'?: number;
}

/**
 * Hook for creating a logging rule
 */
export function useCreateLoggingRule(
  routerIp: string
): UseMutationResult<LoggingRule, Error, CreateLoggingRuleInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLoggingRuleInput) => {
      const result = await makeRouterOSRequest<LoggingRule>(
        routerIp,
        'system/logging/add',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create logging rule');
      }

      return result.data as LoggingRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loggingKeys.rules(routerIp) });
    },
  });
}

/**
 * Hook for updating a logging rule
 */
export function useUpdateLoggingRule(
  routerIp: string
): UseMutationResult<void, Error, UpdateLoggingRuleInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLoggingRuleInput) => {
      const result = await makeRouterOSRequest(
        routerIp,
        `system/logging/set`,
        {
          method: 'POST',
          body: JSON.stringify({ '.id': id, ...input }),
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update logging rule');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loggingKeys.rules(routerIp) });
    },
  });
}

/**
 * Hook for deleting a logging rule
 */
export function useDeleteLoggingRule(
  routerIp: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await makeRouterOSRequest(
        routerIp,
        `system/logging/remove`,
        {
          method: 'POST',
          body: JSON.stringify({ '.id': ruleId }),
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete logging rule');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loggingKeys.rules(routerIp) });
    },
  });
}

/**
 * Hook for toggling a logging rule enabled/disabled
 */
export function useToggleLoggingRule(
  routerIp: string
): UseMutationResult<void, Error, { id: string; disabled: boolean }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, disabled }) => {
      const endpoint = disabled
        ? 'system/logging/disable'
        : 'system/logging/enable';

      const result = await makeRouterOSRequest(routerIp, endpoint, {
        method: 'POST',
        body: JSON.stringify({ numbers: id }),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle logging rule');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loggingKeys.rules(routerIp) });
    },
  });
}

/**
 * Hook for updating a logging action (destination)
 */
export function useUpdateLoggingAction(
  routerIp: string
): UseMutationResult<void, Error, UpdateLoggingActionInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLoggingActionInput) => {
      const result = await makeRouterOSRequest(
        routerIp,
        `system/logging/action/set`,
        {
          method: 'POST',
          body: JSON.stringify({ '.id': id, ...input }),
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update logging action');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loggingKeys.actions(routerIp) });
    },
  });
}



























