/**
 * Alert Rule Templates Apollo Client Hooks Tests
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Tests for Apollo Client hooks that interact with the GraphQL API.
 */

import React, { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { describe, it, expect } from 'vitest';
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
import {
  useAlertRuleTemplates,
  useAlertRuleTemplate,
  usePreviewAlertRuleTemplate,
  useApplyAlertRuleTemplate,
  useSaveCustomAlertRuleTemplate,
  useDeleteCustomAlertRuleTemplate,
  useImportAlertRuleTemplate,
  useExportAlertRuleTemplate,
} from './useAlertRuleTemplates';
import { deviceOfflineTemplate, highCPUTemplate } from '../__test-utils__/alert-rule-template-fixtures';

// =============================================================================
// Test Helpers
// =============================================================================

interface WrapperProps {
  children: ReactNode;
}

function createWrapper(mocks: MockedResponse[]) {
  return function Wrapper({ children }: WrapperProps): React.ReactElement {
    return React.createElement(
      MockedProvider,
      { mocks, addTypename: false },
      children
    );
  };
}

// =============================================================================
// Test Case 1: useAlertRuleTemplates - Success
// =============================================================================

describe('useAlertRuleTemplates', () => {
  it('should fetch all alert rule templates successfully', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_ALERT_RULE_TEMPLATES,
          variables: {},
        },
        result: {
          data: {
            alertRuleTemplates: [deviceOfflineTemplate, highCPUTemplate],
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useAlertRuleTemplates(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.alertRuleTemplates).toHaveLength(2);
    expect(result.current.data?.alertRuleTemplates[0].id).toBe('device-offline');
    expect(result.current.error).toBeUndefined();
  });

  it('should fetch templates filtered by category', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_ALERT_RULE_TEMPLATES,
          variables: { category: 'NETWORK' },
        },
        result: {
          data: {
            alertRuleTemplates: [deviceOfflineTemplate],
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useAlertRuleTemplates({ category: 'NETWORK' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.alertRuleTemplates).toHaveLength(1);
    expect(result.current.data?.alertRuleTemplates[0].category).toBe('NETWORK');
  });

  it('should handle errors gracefully', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_ALERT_RULE_TEMPLATES,
          variables: {},
        },
        error: new Error('Network error'),
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useAlertRuleTemplates(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });
});

// =============================================================================
// Test Case 2: useAlertRuleTemplate - Get Single Template
// =============================================================================

describe('useAlertRuleTemplate', () => {
  it('should fetch a single template by ID', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_ALERT_RULE_TEMPLATE_BY_ID,
          variables: { id: 'device-offline' },
        },
        result: {
          data: {
            alertRuleTemplate: deviceOfflineTemplate,
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useAlertRuleTemplate('device-offline'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.alertRuleTemplate?.id).toBe('device-offline');
    expect(result.current.data?.alertRuleTemplate?.name).toBe('Device Offline Alert');
  });

  it('should handle not found error', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_ALERT_RULE_TEMPLATE_BY_ID,
          variables: { id: 'non-existent' },
        },
        error: new Error('Template not found'),
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useAlertRuleTemplate('non-existent'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});

// =============================================================================
// Test Case 3: usePreviewAlertRuleTemplate - Preview with Variables
// =============================================================================

describe('usePreviewAlertRuleTemplate', () => {
  it('should preview template with variable substitution', async () => {
    const variables = { OFFLINE_DURATION: 60 };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: PREVIEW_ALERT_RULE_TEMPLATE,
          variables: {
            templateId: 'device-offline',
            variables,
          },
        },
        result: {
          data: {
            previewAlertRuleTemplate: {
              preview: {
                template: deviceOfflineTemplate,
                resolvedEventType: 'router.offline',
                resolvedConditions: {
                  conditions: [
                    { field: 'status', operator: 'EQUALS', value: 'offline' },
                    { field: 'duration', operator: 'GREATER_THAN', value: 60 },
                  ],
                },
                validationInfo: {
                  isValid: true,
                  missingVariables: [],
                  warnings: [],
                },
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(
      () => usePreviewAlertRuleTemplate('device-offline', variables),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.previewAlertRuleTemplate.preview?.validationInfo.isValid).toBe(
      true
    );
    expect(result.current.data?.previewAlertRuleTemplate.errors).toBeNull();
  });

  it('should show validation errors for missing variables', async () => {
    const variables = {}; // Missing required OFFLINE_DURATION

    const mocks: MockedResponse[] = [
      {
        request: {
          query: PREVIEW_ALERT_RULE_TEMPLATE,
          variables: {
            templateId: 'device-offline',
            variables,
          },
        },
        result: {
          data: {
            previewAlertRuleTemplate: {
              preview: {
                template: deviceOfflineTemplate,
                resolvedEventType: 'router.offline',
                resolvedConditions: {},
                validationInfo: {
                  isValid: false,
                  missingVariables: ['OFFLINE_DURATION'],
                  warnings: [],
                },
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(
      () => usePreviewAlertRuleTemplate('device-offline', variables),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.previewAlertRuleTemplate.preview?.validationInfo.isValid).toBe(
      false
    );
    expect(
      result.current.data?.previewAlertRuleTemplate.preview?.validationInfo.missingVariables
    ).toContain('OFFLINE_DURATION');
  });
});

// =============================================================================
// Test Case 4: useApplyAlertRuleTemplate - Create Rule from Template
// =============================================================================

describe('useApplyAlertRuleTemplate', () => {
  it('should apply template and create alert rule', async () => {
    const variables = { OFFLINE_DURATION: 60 };
    const customizations = {
      name: 'My Offline Alert',
      description: 'Custom offline alert',
      enabled: true,
    };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: APPLY_ALERT_RULE_TEMPLATE,
          variables: {
            templateId: 'device-offline',
            variables,
            customizations,
          },
        },
        result: {
          data: {
            applyAlertRuleTemplate: {
              alertRule: {
                id: 'rule-123',
                name: 'My Offline Alert',
                description: 'Custom offline alert',
                eventType: 'router.offline',
                severity: 'CRITICAL',
                enabled: true,
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useApplyAlertRuleTemplate(), { wrapper });

    // Call the mutation
    const applyResult = await result.current[0]({
      variables: {
        templateId: 'device-offline',
        variables,
        customizations,
      },
    });

    expect(applyResult.data?.applyAlertRuleTemplate.alertRule?.id).toBe('rule-123');
    expect(applyResult.data?.applyAlertRuleTemplate.alertRule?.name).toBe('My Offline Alert');
    expect(applyResult.data?.applyAlertRuleTemplate.errors).toBeNull();
  });

  it('should handle validation errors', async () => {
    const variables = {}; // Missing required variables
    const customizations = {
      name: 'Test Alert',
      enabled: true,
    };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: APPLY_ALERT_RULE_TEMPLATE,
          variables: {
            templateId: 'device-offline',
            variables,
            customizations,
          },
        },
        result: {
          data: {
            applyAlertRuleTemplate: {
              alertRule: null,
              errors: [
                {
                  code: 'VALIDATION_ERROR',
                  message: 'Missing required variables: OFFLINE_DURATION',
                  field: 'variables',
                },
              ],
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useApplyAlertRuleTemplate(), { wrapper });

    const applyResult = await result.current[0]({
      variables: {
        templateId: 'device-offline',
        variables,
        customizations,
      },
    });

    expect(applyResult.data?.applyAlertRuleTemplate.alertRule).toBeNull();
    expect(applyResult.data?.applyAlertRuleTemplate.errors).toHaveLength(1);
    expect(applyResult.data?.applyAlertRuleTemplate.errors?.[0]?.message).toBe('Missing required variables: OFFLINE_DURATION');
  });
});

// =============================================================================
// Test Case 5: useSaveCustomAlertRuleTemplate - Save Custom Template
// =============================================================================

describe('useSaveCustomAlertRuleTemplate', () => {
  it('should save a custom template', async () => {
    const input = {
      name: 'My Custom Template',
      description: 'A custom alert rule template',
      category: 'CUSTOM',
      severity: 'WARNING',
      eventType: 'custom.event',
      conditions: [
        {
          field: 'value',
          operator: 'GREATER_THAN',
          value: '{{THRESHOLD}}',
        },
      ],
      channels: ['email'],
      variables: [
        {
          name: 'THRESHOLD',
          label: 'Threshold Value',
          type: 'INTEGER',
          required: true,
          defaultValue: '100',
        },
      ],
    };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: SAVE_CUSTOM_ALERT_RULE_TEMPLATE,
          variables: { input },
        },
        result: {
          data: {
            saveCustomAlertRuleTemplate: {
              template: {
                id: 'custom-123',
                ...input,
                isBuiltIn: false,
                version: '1.0.0',
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useSaveCustomAlertRuleTemplate(), { wrapper });

    const saveResult = await result.current[0]({
      variables: { input },
    });

    expect(saveResult.data?.saveCustomAlertRuleTemplate.template?.id).toBe('custom-123');
    expect(saveResult.data?.saveCustomAlertRuleTemplate.template?.isBuiltIn).toBe(false);
    expect(saveResult.data?.saveCustomAlertRuleTemplate.errors).toBeNull();
  });
});

// =============================================================================
// Test Case 6: useDeleteCustomAlertRuleTemplate - Delete Template
// =============================================================================

describe('useDeleteCustomAlertRuleTemplate', () => {
  it('should delete a custom template', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: DELETE_CUSTOM_ALERT_RULE_TEMPLATE,
          variables: { id: 'custom-123' },
        },
        result: {
          data: {
            deleteCustomAlertRuleTemplate: {
              success: true,
              deletedId: 'custom-123',
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useDeleteCustomAlertRuleTemplate(), { wrapper });

    const deleteResult = await result.current[0]({
      variables: { id: 'custom-123' },
    });

    expect(deleteResult.data?.deleteCustomAlertRuleTemplate.success).toBe(true);
    expect(deleteResult.data?.deleteCustomAlertRuleTemplate.deletedId).toBe('custom-123');
  });

  it('should prevent deleting built-in templates', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: DELETE_CUSTOM_ALERT_RULE_TEMPLATE,
          variables: { id: 'device-offline' },
        },
        result: {
          data: {
            deleteCustomAlertRuleTemplate: {
              success: false,
              deletedId: null,
              errors: [
                {
                  code: 'FORBIDDEN',
                  message: 'Cannot delete built-in template',
                },
              ],
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useDeleteCustomAlertRuleTemplate(), { wrapper });

    const deleteResult = await result.current[0]({
      variables: { id: 'device-offline' },
    });

    expect(deleteResult.data?.deleteCustomAlertRuleTemplate.success).toBe(false);
    expect(deleteResult.data?.deleteCustomAlertRuleTemplate.errors).toHaveLength(1);
  });
});

// =============================================================================
// Test Case 7: Import/Export Templates
// =============================================================================

describe('Import/Export Templates', () => {
  it('should export a template as JSON', async () => {
    const templateJSON = JSON.stringify(deviceOfflineTemplate, null, 2);

    const mocks: MockedResponse[] = [
      {
        request: {
          query: EXPORT_ALERT_RULE_TEMPLATE,
          variables: { id: 'device-offline' },
        },
        result: {
          data: {
            exportAlertRuleTemplate: templateJSON,
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useExportAlertRuleTemplate(), { wrapper });

    const exportResult = await result.current[0]({
      variables: { id: 'device-offline' },
    });

    expect(exportResult.data?.exportAlertRuleTemplate).toBe(templateJSON);
  });

  it('should import a template from JSON', async () => {
    const templateJSON = JSON.stringify({
      id: 'imported-template',
      name: 'Imported Template',
      description: 'An imported template',
      category: 'CUSTOM',
      eventType: 'custom.event',
      severity: 'INFO',
      conditions: [],
      channels: ['email'],
      variables: [],
      version: '1.0.0',
    });

    const mocks: MockedResponse[] = [
      {
        request: {
          query: IMPORT_ALERT_RULE_TEMPLATE,
          variables: { json: templateJSON },
        },
        result: {
          data: {
            importAlertRuleTemplate: {
              template: {
                id: 'imported-template',
                name: 'Imported Template',
                isBuiltIn: false,
                category: 'CUSTOM',
              },
              errors: null,
            },
          },
        },
      },
    ];

    const wrapper = createWrapper(mocks);
    const { result } = renderHook(() => useImportAlertRuleTemplate(), { wrapper });

    const importResult = await result.current[0]({
      variables: { json: templateJSON },
    });

    expect(importResult.data?.importAlertRuleTemplate.template?.id).toBe('imported-template');
    expect(importResult.data?.importAlertRuleTemplate.template?.isBuiltIn).toBe(false);
  });
});
