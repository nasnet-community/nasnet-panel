/**
 * useAlertRuleTemplates Hook
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Apollo Client hook for fetching alert rule templates.
 * Supports optional category filtering.
 */
import { type QueryHookOptions, type MutationHookOptions } from '@apollo/client';
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
/**
 * Fetch all alert rule templates with optional category filtering
 */
export declare function useAlertRuleTemplates(
  options?: QueryHookOptions<
    {
      alertRuleTemplates: AlertRuleTemplate[];
    },
    {
      category?: string;
    }
  >
): import('@apollo/client').InteropQueryResult<
  {
    alertRuleTemplates: AlertRuleTemplate[];
  },
  {
    category?: string;
  }
>;
/**
 * Fetch a single alert rule template by ID
 */
export declare function useAlertRuleTemplate(
  id: string,
  options?: QueryHookOptions<
    {
      alertRuleTemplate: AlertRuleTemplate | null;
    },
    {
      id: string;
    }
  >
): import('@apollo/client').InteropQueryResult<
  {
    alertRuleTemplate: AlertRuleTemplate | null;
  },
  {
    id: string;
  }
>;
/**
 * Preview an alert rule template with variable substitution
 */
export declare function usePreviewAlertRuleTemplate(
  options?: QueryHookOptions<
    {
      previewAlertRuleTemplate: {
        preview: AlertRuleTemplatePreview | null;
        errors: FieldError[];
      };
    },
    {
      templateId: string;
      variables: Record<string, string | number>;
    }
  >
): import('@apollo/client').InteropQueryResult<
  {
    previewAlertRuleTemplate: {
      preview: AlertRuleTemplatePreview | null;
      errors: FieldError[];
    };
  },
  {
    templateId: string;
    variables: Record<string, string | number>;
  }
>;
/**
 * Apply an alert rule template to create a new alert rule
 */
export declare function useApplyAlertRuleTemplate(
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
): import('@apollo/client').MutationTuple<
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
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Save a custom alert rule template
 */
export declare function useSaveCustomAlertRuleTemplate(
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
): import('@apollo/client').MutationTuple<
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
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Delete a custom alert rule template
 */
export declare function useDeleteCustomAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      deleteCustomAlertRuleTemplate: {
        success: boolean;
        deletedId: string | null;
        errors: FieldError[];
      };
    },
    {
      id: string;
    }
  >
): import('@apollo/client').MutationTuple<
  {
    deleteCustomAlertRuleTemplate: {
      success: boolean;
      deletedId: string | null;
      errors: FieldError[];
    };
  },
  {
    id: string;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Import an alert rule template from JSON
 */
export declare function useImportAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      importAlertRuleTemplate: {
        template: AlertRuleTemplate | null;
        errors: FieldError[];
      };
    },
    {
      json: string;
    }
  >
): import('@apollo/client').MutationTuple<
  {
    importAlertRuleTemplate: {
      template: AlertRuleTemplate | null;
      errors: FieldError[];
    };
  },
  {
    json: string;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
/**
 * Export an alert rule template as JSON
 */
export declare function useExportAlertRuleTemplate(
  options?: MutationHookOptions<
    {
      exportAlertRuleTemplate: string;
    },
    {
      id: string;
    }
  >
): import('@apollo/client').MutationTuple<
  {
    exportAlertRuleTemplate: string;
  },
  {
    id: string;
  },
  import('@apollo/client').DefaultContext,
  import('@apollo/client').ApolloCache<any>
>;
export {};
//# sourceMappingURL=useAlertRuleTemplates.d.ts.map
