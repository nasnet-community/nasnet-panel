/**
 * useAlertRuleTemplates Hook
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Apollo Client hook for fetching alert rule templates.
 * Supports optional category filtering.
 */

import {
  useQuery,
  useMutation,
  type QueryHookOptions,
  type MutationHookOptions,
} from '@apollo/client';

import {
  GET_ALERT_RULE_TEMPLATES,
  GET_ALERT_RULE_TEMPLATE_BY_ID,
  PREVIEW_ALERT_RULE_TEMPLATE,
  APPLY_ALERT_RULE_TEMPLATE,
  SAVE_CUSTOM_ALERT_RULE_TEMPLATE,
  DELETE_CUSTOM_ALERT_RULE_TEMPLATE,
  IMPORT_ALERT_RULE_TEMPLATE,
  EXPORT_ALERT_RULE_TEMPLATE,
} from './alert-rule-templates.graphql';

// =============================================================================
// Type Definitions
// =============================================================================

interface AlertRuleTemplateVariable {
  name: string;
  label: string;
  type: 'STRING' | 'INTEGER' | 'DURATION' | 'PERCENTAGE';
  required: boolean;
  defaultValue?: string;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}

interface AlertCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'REGEX';
  value: string;
}

interface ThrottleConfig {
  maxAlerts: number;
  periodSeconds: number;
  groupByField?: string;
}

export interface AlertRuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'NETWORK' | 'SECURITY' | 'RESOURCES' | 'VPN' | 'DHCP' | 'SYSTEM' | 'CUSTOM';
  eventType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  conditions: AlertCondition[];
  channels: string[];
  throttle?: ThrottleConfig;
  variables: AlertRuleTemplateVariable[];
  isBuiltIn: boolean;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ValidationInfo {
  isValid: boolean;
  missingVariables: string[];
  warnings: string[];
}

interface AlertRuleTemplatePreview {
  template: AlertRuleTemplate;
  resolvedConditions: AlertCondition[];
  validationInfo: ValidationInfo;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  conditions: AlertCondition[];
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  channels: string[];
  throttle?: ThrottleConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FieldError {
  field: string;
  message: string;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all alert rule templates with optional category filtering
 */
export function useAlertRuleTemplates(
  options?: QueryHookOptions<{ alertRuleTemplates: AlertRuleTemplate[] }, { category?: string }>
) {
  return useQuery<{ alertRuleTemplates: AlertRuleTemplate[] }, { category?: string }>(
    GET_ALERT_RULE_TEMPLATES,
    options
  );
}

/**
 * Fetch a single alert rule template by ID
 */
export function useAlertRuleTemplate(
  id: string,
  options?: QueryHookOptions<{ alertRuleTemplate: AlertRuleTemplate | null }, { id: string }>
) {
  return useQuery<{ alertRuleTemplate: AlertRuleTemplate | null }, { id: string }>(
    GET_ALERT_RULE_TEMPLATE_BY_ID,
    {
      ...options,
      variables: { id },
      skip: !id || options?.skip,
    }
  );
}

/**
 * Preview an alert rule template with variable substitution
 */
export function usePreviewAlertRuleTemplate(
  options?: QueryHookOptions<
    {
      previewAlertRuleTemplate: {
        preview: AlertRuleTemplatePreview | null;
        errors: FieldError[];
      };
    },
    { templateId: string; variables: Record<string, string | number> }
  >
) {
  return useQuery<
    {
      previewAlertRuleTemplate: {
        preview: AlertRuleTemplatePreview | null;
        errors: FieldError[];
      };
    },
    { templateId: string; variables: Record<string, string | number> }
  >(PREVIEW_ALERT_RULE_TEMPLATE, {
    ...options,
    skip: !options?.variables?.templateId || options?.skip,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Apply an alert rule template to create a new alert rule
 */
export function useApplyAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      applyAlertRuleTemplate: {
        alertRule: AlertRule | null;
        errors: FieldError[];
      };
    },
    {
      templateId: string;
      variables: Record<string, string | number>;
      customizations?: {
        name?: string;
        description?: string;
        deviceId?: string;
        enabled?: boolean;
      };
    }
  >
) {
  return useMutation<
    {
      applyAlertRuleTemplate: {
        alertRule: AlertRule | null;
        errors: FieldError[];
      };
    },
    {
      templateId: string;
      variables: Record<string, string | number>;
      customizations?: {
        name?: string;
        description?: string;
        deviceId?: string;
        enabled?: boolean;
      };
    }
  >(APPLY_ALERT_RULE_TEMPLATE, options);
}

/**
 * Save a custom alert rule template
 */
export function useSaveCustomAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      saveCustomAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: FieldError[];
      };
    },
    {
      input: {
        name: string;
        description: string;
        category: string;
        severity: string;
        eventType: string;
        conditions: AlertCondition[];
        channels: string[];
        throttle?: ThrottleConfig;
        variables?: AlertRuleTemplateVariable[];
      };
    }
  >
) {
  return useMutation<
    {
      saveCustomAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: FieldError[];
      };
    },
    {
      input: {
        name: string;
        description: string;
        category: string;
        severity: string;
        eventType: string;
        conditions: AlertCondition[];
        channels: string[];
        throttle?: ThrottleConfig;
        variables?: AlertRuleTemplateVariable[];
      };
    }
  >(SAVE_CUSTOM_ALERT_RULE_TEMPLATE, options);
}

/**
 * Delete a custom alert rule template
 */
export function useDeleteCustomAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      deleteCustomAlertRuleTemplate: {
        success: boolean;
        deletedId: string | null;
        errors: FieldError[];
      };
    },
    { id: string }
  >
) {
  return useMutation<
    {
      deleteCustomAlertRuleTemplate: {
        success: boolean;
        deletedId: string | null;
        errors: FieldError[];
      };
    },
    { id: string }
  >(DELETE_CUSTOM_ALERT_RULE_TEMPLATE, options);
}

/**
 * Import an alert rule template from JSON
 */
export function useImportAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      importAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: FieldError[];
      };
    },
    { json: string }
  >
) {
  return useMutation<
    {
      importAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: FieldError[];
      };
    },
    { json: string }
  >(IMPORT_ALERT_RULE_TEMPLATE, options);
}

/**
 * Export an alert rule template as JSON
 */
export function useExportAlertRuleTemplate(
  options?: MutationHookOptions<{ exportAlertRuleTemplate: string }, { id: string }>
) {
  return useMutation<{ exportAlertRuleTemplate: string }, { id: string }>(
    EXPORT_ALERT_RULE_TEMPLATE,
    options
  );
}
