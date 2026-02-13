/**
 * Firewall Templates Query Hooks
 * NAS-7.6: Firewall Templates Feature
 *
 * Provides TanStack Query hooks for fetching and managing firewall templates.
 * Supports built-in templates, custom templates, preview, and apply operations.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { firewallTemplateKeys } from './queryKeys';
import type {
  FirewallTemplate,
  TemplatePreviewResult,
  FirewallTemplateResult,
} from '@nasnet/core/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Template list filters
 */
export interface TemplateFilters {
  category?: string;
  complexity?: string;
}

/**
 * Preview template input
 */
export interface PreviewTemplateInput {
  routerId: string;
  templateId: string;
  variables: Record<string, string>;
}

/**
 * Apply template input
 */
export interface ApplyTemplateInput {
  routerId: string;
  templateId: string;
  variables: Record<string, string>;
}

/**
 * Rollback template input
 */
export interface RollbackTemplateInput {
  routerId: string;
  rollbackId: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all firewall templates (built-in + custom)
 * Endpoint: GET /api/firewall/templates
 */
async function fetchTemplates(filters?: TemplateFilters): Promise<FirewallTemplate[]> {
  // For now, load from static JSON files
  // This will be replaced with actual API call later
  const templates: FirewallTemplate[] = [];

  // Load built-in templates
  const builtInIds = ['basic-security', 'home-network', 'gaming-optimized', 'iot-isolation', 'guest-network'];

  for (const id of builtInIds) {
    try {
      const response = await fetch(`/templates/firewall/${id}.json`);
      if (response.ok) {
        const template = await response.json();
        templates.push(template);
      }
    } catch (error) {
      console.warn(`Failed to load template ${id}:`, error);
    }
  }

  // Apply filters
  let filtered = templates;

  if (filters?.category) {
    filtered = filtered.filter((t) => t.category === filters.category);
  }

  if (filters?.complexity) {
    filtered = filtered.filter((t) => t.complexity === filters.complexity);
  }

  return filtered;
}

/**
 * Fetch a specific template by ID
 * Endpoint: GET /api/firewall/templates/:id
 */
async function fetchTemplateById(templateId: string): Promise<FirewallTemplate> {
  // Try loading from static files first
  try {
    const response = await fetch(`/templates/firewall/${templateId}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Fall through to error
  }

  throw new Error(`Template ${templateId} not found`);
}

/**
 * Preview template with variable resolution and conflict detection
 * Endpoint: POST /api/firewall/templates/preview
 */
async function previewTemplate(input: PreviewTemplateInput): Promise<TemplatePreviewResult> {
  const result = await makeRouterOSRequest<TemplatePreviewResult>(
    input.routerId,
    'firewall/templates/preview',
    {
      method: 'POST',
      body: JSON.stringify({
        templateId: input.templateId,
        variables: input.variables,
      }),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to preview template');
  }

  return result.data;
}

/**
 * Apply template to router
 * Endpoint: POST /api/firewall/templates/apply
 */
async function applyTemplate(input: ApplyTemplateInput): Promise<FirewallTemplateResult> {
  const result = await makeRouterOSRequest<FirewallTemplateResult>(
    input.routerId,
    'firewall/templates/apply',
    {
      method: 'POST',
      body: JSON.stringify({
        templateId: input.templateId,
        variables: input.variables,
      }),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to apply template');
  }

  return result.data;
}

/**
 * Rollback template application
 * Endpoint: POST /api/firewall/templates/rollback
 */
async function rollbackTemplate(input: RollbackTemplateInput): Promise<void> {
  const result = await makeRouterOSRequest(
    input.routerId,
    'firewall/templates/rollback',
    {
      method: 'POST',
      body: JSON.stringify({
        rollbackId: input.rollbackId,
      }),
    }
  );

  if (!result.success) {
    throw new Error(result.error || 'Failed to rollback template');
  }
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch all firewall templates
 *
 * @param filters - Optional filters for category and complexity
 * @param options - Query options
 * @returns Query result with FirewallTemplate[] data
 *
 * @example
 * ```tsx
 * const { data: templates, isLoading } = useTemplates({
 *   category: 'HOME',
 *   complexity: 'SIMPLE',
 * });
 * ```
 */
interface UseTemplatesOptions {
  filters?: TemplateFilters;
  enabled?: boolean;
}

export function useTemplates(options?: UseTemplatesOptions): UseQueryResult<FirewallTemplate[], Error> {
  return useQuery({
    queryKey: firewallTemplateKeys.list(options?.filters),
    queryFn: () => fetchTemplates(options?.filters),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes - templates don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
  });
}

/**
 * Hook to fetch a specific template by ID
 *
 * @param templateId - Template ID to fetch
 * @param options - Query options
 * @returns Query result with FirewallTemplate data
 *
 * @example
 * ```tsx
 * const { data: template } = useTemplate('basic-security');
 * ```
 */
interface UseTemplateOptions {
  enabled?: boolean;
}

export function useTemplate(
  templateId: string | null,
  options?: UseTemplateOptions
): UseQueryResult<FirewallTemplate, Error> {
  return useQuery({
    queryKey: firewallTemplateKeys.detail(templateId || ''),
    queryFn: () => fetchTemplateById(templateId!),
    enabled: !!templateId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to preview a template with variable resolution
 *
 * @param input - Preview input (routerId, templateId, variables)
 * @param options - Query options
 * @returns Query result with TemplatePreviewResult data
 *
 * @example
 * ```tsx
 * const { data: preview, isLoading } = usePreviewTemplate({
 *   routerId: '192.168.88.1',
 *   templateId: 'basic-security',
 *   variables: { LAN_INTERFACE: 'bridge1' },
 * });
 * ```
 */
interface UsePreviewTemplateOptions {
  enabled?: boolean;
}

export function usePreviewTemplate(
  input: PreviewTemplateInput | null,
  options?: UsePreviewTemplateOptions
): UseQueryResult<TemplatePreviewResult, Error> {
  return useQuery({
    queryKey: input
      ? firewallTemplateKeys.preview(input.routerId, input.templateId, input.variables)
      : ['preview-placeholder'],
    queryFn: () => previewTemplate(input!),
    enabled: !!input && (options?.enabled ?? true),
    staleTime: 0, // Don't cache previews - variables might change
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to apply a firewall template
 *
 * Automatically invalidates related queries to refresh UI after apply.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const applyMutation = useApplyTemplate();
 *
 * await applyMutation.mutateAsync({
 *   routerId: '192.168.88.1',
 *   templateId: 'basic-security',
 *   variables: { LAN_INTERFACE: 'bridge1' },
 * });
 * ```
 */
export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyTemplateInput) => applyTemplate(input),
    onSuccess: (_data, variables) => {
      // Invalidate firewall rules queries to show newly created rules
      queryClient.invalidateQueries({
        queryKey: ['firewall', 'rules', variables.routerId],
      });

      // Invalidate address lists if template creates lists
      queryClient.invalidateQueries({
        queryKey: ['addressLists', 'lists', variables.routerId],
      });

      // Invalidate NAT rules
      queryClient.invalidateQueries({
        queryKey: ['firewall', 'nat', variables.routerId],
      });

      // Invalidate mangle rules
      queryClient.invalidateQueries({
        queryKey: ['firewall', 'mangle', variables.routerId],
      });
    },
    retry: false, // Don't auto-retry template application
  });
}

/**
 * Hook to rollback a template application
 *
 * Automatically invalidates queries to refresh UI after rollback.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const rollbackMutation = useRollbackTemplate();
 *
 * await rollbackMutation.mutateAsync({
 *   routerId: '192.168.88.1',
 *   rollbackId: 'rollback-123456',
 * });
 * ```
 */
export function useRollbackTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RollbackTemplateInput) => rollbackTemplate(input),
    onSuccess: (_data, variables) => {
      // Invalidate all firewall-related queries
      queryClient.invalidateQueries({
        queryKey: ['firewall', variables.routerId],
      });

      queryClient.invalidateQueries({
        queryKey: ['addressLists', 'lists', variables.routerId],
      });
    },
    retry: false,
  });
}
