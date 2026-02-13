/**
 * Alert Rule Templates Apollo Client Hooks
 * NAS-18.12: Alert Rule Templates Feature
 *
 * React hooks for querying and mutating alert rule templates using Apollo Client.
 * Provides type-safe interfaces for all template operations.
 */

import { useQuery, useMutation, useApolloClient, type ApolloError } from '@apollo/client';
import {
  GET_ALERT_RULE_TEMPLATES,
  GET_ALERT_RULE_TEMPLATE_BY_ID,
  PREVIEW_ALERT_RULE_TEMPLATE,
  APPLY_ALERT_RULE_TEMPLATE,
  SAVE_CUSTOM_ALERT_RULE_TEMPLATE,
  DELETE_CUSTOM_ALERT_RULE_TEMPLATE,
  IMPORT_ALERT_RULE_TEMPLATE,
  EXPORT_ALERT_RULE_TEMPLATE,
} from '@nasnet/api-client/queries';
import type {
  AlertRuleTemplate,
  AlertRuleTemplatePreview,
  AlertRuleTemplateCategory,
} from '../schemas/alert-rule-template.schema';

// =============================================================================
// Types
// =============================================================================

/**
 * GraphQL response types
 */
interface GetAlertRuleTemplatesResponse {
  alertRuleTemplates: AlertRuleTemplate[];
}

interface GetAlertRuleTemplateByIdResponse {
  alertRuleTemplate: AlertRuleTemplate | null;
}

interface PreviewAlertRuleTemplateResponse {
  previewAlertRuleTemplate: {
    preview: AlertRuleTemplatePreview | null;
    errors: Array<{ field: string; message: string }>;
  };
}

interface ApplyAlertRuleTemplateResponse {
  applyAlertRuleTemplate: {
    alertRule: {
      id: string;
      name: string;
      description: string;
      eventType: string;
      conditions: Array<{
        field: string;
        operator: string;
        value: string;
      }>;
      severity: string;
      channels: string[];
      throttle: {
        maxAlerts: number;
        periodSeconds: number;
        groupByField?: string;
      } | null;
      enabled: boolean;
      createdAt: string;
      updatedAt: string;
    } | null;
    errors: Array<{ field: string; message: string }>;
  };
}

interface SaveCustomAlertRuleTemplateResponse {
  saveCustomAlertRuleTemplate: {
    template: AlertRuleTemplate | null;
    errors: Array<{ field: string; message: string }>;
  };
}

interface DeleteCustomAlertRuleTemplateResponse {
  deleteCustomAlertRuleTemplate: {
    success: boolean;
    deletedId: string | null;
    errors: Array<{ field: string; message: string }>;
  };
}

interface ImportAlertRuleTemplateResponse {
  importAlertRuleTemplate: {
    template: AlertRuleTemplate | null;
    errors: Array<{ field: string; message: string }>;
  };
}

interface ExportAlertRuleTemplateResponse {
  exportAlertRuleTemplate: string;
}

/**
 * Hook options
 */
interface UseAlertRuleTemplatesOptions {
  category?: AlertRuleTemplateCategory;
  enabled?: boolean;
  pollInterval?: number;
}

interface UseAlertRuleTemplateOptions {
  enabled?: boolean;
}

interface UsePreviewTemplateOptions {
  enabled?: boolean;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch all alert rule templates with optional category filtering
 *
 * @param options - Query options and filters
 * @returns Query result with AlertRuleTemplate[] data
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertRuleTemplates({
 *   category: 'NETWORK',
 * });
 * ```
 */
export function useAlertRuleTemplates(options?: UseAlertRuleTemplatesOptions) {
  return useQuery<GetAlertRuleTemplatesResponse>(GET_ALERT_RULE_TEMPLATES, {
    variables: {
      category: options?.category,
    },
    skip: options?.enabled === false,
    pollInterval: options?.pollInterval,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
}

/**
 * Hook to fetch a single alert rule template by ID
 *
 * @param id - Template ID (null to skip query)
 * @param options - Query options
 * @returns Query result with AlertRuleTemplate data
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertRuleTemplate('router-offline-alert');
 * ```
 */
export function useAlertRuleTemplate(id: string | null, options?: UseAlertRuleTemplateOptions) {
  return useQuery<GetAlertRuleTemplateByIdResponse>(GET_ALERT_RULE_TEMPLATE_BY_ID, {
    variables: { id: id || '' },
    skip: !id || options?.enabled === false,
    fetchPolicy: 'cache-first',
  });
}

/**
 * Hook to preview a template with variable substitution
 *
 * @param templateId - Template ID to preview (null to skip)
 * @param variables - Variables for template resolution
 * @param options - Query options
 * @returns Query result with AlertRuleTemplatePreview data
 *
 * @example
 * ```tsx
 * const { data, loading } = usePreviewAlertRuleTemplate(
 *   'high-cpu-alert',
 *   { CPU_THRESHOLD: 80, DURATION_SECONDS: 300 }
 * );
 * ```
 */
export function usePreviewAlertRuleTemplate(
  templateId: string | null,
  variables: Record<string, unknown>,
  options?: UsePreviewTemplateOptions
) {
  return useQuery<PreviewAlertRuleTemplateResponse>(PREVIEW_ALERT_RULE_TEMPLATE, {
    variables: {
      templateId: templateId || '',
      variables,
    },
    skip: !templateId || options?.enabled === false,
    fetchPolicy: 'no-cache', // Always fetch fresh preview
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to apply a template and create an alert rule
 *
 * Automatically refetches alert rules after successful application.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [applyTemplate, { loading, error }] = useApplyAlertRuleTemplate();
 *
 * await applyTemplate({
 *   variables: {
 *     templateId: 'router-offline-alert',
 *     variables: { OFFLINE_DURATION: 60 },
 *     customizations: {
 *       name: 'My Router Offline Alert',
 *       enabled: true,
 *     },
 *   },
 * });
 * ```
 */
export function useApplyAlertRuleTemplate() {
  const client = useApolloClient();

  return useMutation<ApplyAlertRuleTemplateResponse>(APPLY_ALERT_RULE_TEMPLATE, {
    onCompleted: (data) => {
      if (data.applyAlertRuleTemplate.alertRule) {
        // Refetch alert rules to show the newly created rule
        client.refetchQueries({
          include: ['GetAlertRules'],
        });
      }
    },
    onError: (error: ApolloError) => {
      console.error('Failed to apply alert rule template:', error);
    },
  });
}

/**
 * Hook to save a custom alert rule template
 *
 * Automatically refetches template list after successful save.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [saveTemplate, { loading, error }] = useSaveCustomAlertRuleTemplate();
 *
 * await saveTemplate({
 *   variables: {
 *     input: {
 *       name: 'My Custom Template',
 *       description: 'Custom alert for my use case',
 *       category: 'CUSTOM',
 *       eventType: 'router.offline',
 *       severity: 'CRITICAL',
 *       conditions: [
 *         { field: 'status', operator: 'EQUALS', value: 'offline' }
 *       ],
 *       channels: ['email'],
 *       variables: [
 *         { name: 'DURATION', label: 'Duration', type: 'DURATION', required: true }
 *       ],
 *     },
 *   },
 * });
 * ```
 */
export function useSaveCustomAlertRuleTemplate() {
  const client = useApolloClient();

  return useMutation<SaveCustomAlertRuleTemplateResponse>(SAVE_CUSTOM_ALERT_RULE_TEMPLATE, {
    onCompleted: (data) => {
      if (data.saveCustomAlertRuleTemplate.template) {
        // Refetch template list to show the new template
        client.refetchQueries({
          include: ['GetAlertRuleTemplates'],
        });
      }
    },
    onError: (error: ApolloError) => {
      console.error('Failed to save custom template:', error);
    },
  });
}

/**
 * Hook to delete a custom alert rule template
 *
 * Automatically refetches template list after successful deletion.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [deleteTemplate, { loading, error }] = useDeleteCustomAlertRuleTemplate();
 *
 * await deleteTemplate({
 *   variables: { id: 'custom-template-123' },
 * });
 * ```
 */
export function useDeleteCustomAlertRuleTemplate() {
  const client = useApolloClient();

  return useMutation<DeleteCustomAlertRuleTemplateResponse>(DELETE_CUSTOM_ALERT_RULE_TEMPLATE, {
    onCompleted: (data) => {
      if (data.deleteCustomAlertRuleTemplate.success) {
        // Refetch template list to remove deleted template
        client.refetchQueries({
          include: ['GetAlertRuleTemplates'],
        });
      }
    },
    onError: (error: ApolloError) => {
      console.error('Failed to delete template:', error);
    },
  });
}

/**
 * Hook to import an alert rule template from JSON
 *
 * Automatically refetches template list after successful import.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [importTemplate, { loading, error }] = useImportAlertRuleTemplate();
 *
 * const templateJson = JSON.stringify({
 *   name: 'Imported Template',
 *   description: 'Template imported from file',
 *   // ... other template fields
 * });
 *
 * await importTemplate({
 *   variables: { json: templateJson },
 * });
 * ```
 */
export function useImportAlertRuleTemplate() {
  const client = useApolloClient();

  return useMutation<ImportAlertRuleTemplateResponse>(IMPORT_ALERT_RULE_TEMPLATE, {
    onCompleted: (data) => {
      if (data.importAlertRuleTemplate.template) {
        // Refetch template list to show imported template
        client.refetchQueries({
          include: ['GetAlertRuleTemplates'],
        });
      }
    },
    onError: (error: ApolloError) => {
      console.error('Failed to import template:', error);
    },
  });
}

/**
 * Hook to export an alert rule template as JSON
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [exportTemplate, { data, loading }] = useExportAlertRuleTemplate();
 *
 * const handleExport = async () => {
 *   const result = await exportTemplate({
 *     variables: { id: 'router-offline-alert' },
 *   });
 *
 *   if (result.data) {
 *     const json = result.data.exportAlertRuleTemplate;
 *     // Download JSON file
 *     const blob = new Blob([json], { type: 'application/json' });
 *     const url = URL.createObjectURL(blob);
 *     // ... trigger download
 *   }
 * };
 * ```
 */
export function useExportAlertRuleTemplate() {
  return useMutation<ExportAlertRuleTemplateResponse>(EXPORT_ALERT_RULE_TEMPLATE, {
    onError: (error: ApolloError) => {
      console.error('Failed to export template:', error);
    },
  });
}
