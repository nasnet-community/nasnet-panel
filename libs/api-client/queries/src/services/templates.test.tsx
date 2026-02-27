/**
 * Service Templates API Hooks Tests
 *
 * Unit tests for template-related hooks with MSW mocked responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import type { MockedResponse } from '@apollo/client/testing';
import type { ReactNode } from 'react';
import type {
  ServiceTemplate,
  TemplateInstallResult,
  ServiceTemplateCategory,
} from '@nasnet/api-client/generated';

import { useServiceTemplates } from './useServiceTemplates';
import { useInstallTemplate } from './useInstallTemplate';
import { useExportAsTemplate } from './useExportAsTemplate';
import { useImportTemplate } from './useImportTemplate';
import { useDeleteTemplate } from './useDeleteTemplate';
import {
  GET_SERVICE_TEMPLATES,
  INSTALL_SERVICE_TEMPLATE,
  EXPORT_AS_TEMPLATE,
  IMPORT_SERVICE_TEMPLATE,
  DELETE_SERVICE_TEMPLATE,
} from './templates.graphql';

// Mock template data
const mockTemplate: ServiceTemplate = {
  id: 'template-1',
  name: 'Privacy Stack',
  description: 'Complete privacy setup with Tor and Xray',
  category: 'PRIVACY' as ServiceTemplateCategory,
  scope: 'CHAIN',
  version: '1.0.0',
  isBuiltIn: true,
  author: null,
  routerID: null,
  services: [],
  configVariables: [],
  suggestedRouting: [],
  estimatedResources: null,
  tags: ['privacy', 'tor'],
  prerequisites: [],
  documentation: null,
  examples: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockCustomTemplate: ServiceTemplate = {
  ...mockTemplate,
  id: 'template-2',
  name: 'My Custom Stack',
  description: 'Custom proxy configuration',
  isBuiltIn: false,
  routerID: 'router-1',
  author: 'admin',
  tags: ['proxy', 'custom'],
};

// Wrapper component for Apollo Client
function createWrapper(mocks: unknown[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider
        mocks={mocks as readonly MockedResponse[]}
        addTypename={true}
      >
        {children}
      </MockedProvider>
    );
  };
}

describe('useServiceTemplates', () => {
  it('fetches templates successfully', async () => {
    const mocks = [
      {
        request: {
          query: GET_SERVICE_TEMPLATES,
          variables: { routerID: null, category: null, scope: null },
        },
        result: {
          data: {
            serviceTemplates: [mockTemplate, mockCustomTemplate],
          },
        },
      },
    ];

    const { result } = renderHook(() => useServiceTemplates(), {
      wrapper: createWrapper(mocks),
    });

    // Initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.templates).toEqual([]);

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toHaveLength(2);
    expect(result.current.templates[0].name).toBe('Privacy Stack');
    expect(result.current.error).toBeUndefined();
  });

  it('filters templates by search query', async () => {
    const mocks = [
      {
        request: {
          query: GET_SERVICE_TEMPLATES,
          variables: { routerID: null, category: null, scope: null },
        },
        result: {
          data: {
            serviceTemplates: [mockTemplate, mockCustomTemplate],
          },
        },
      },
    ];

    const { result } = renderHook(() => useServiceTemplates({ searchQuery: 'privacy' }), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only match "Privacy Stack"
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe('Privacy Stack');
  });

  it('filters built-in vs custom templates', async () => {
    const mocks = [
      {
        request: {
          query: GET_SERVICE_TEMPLATES,
          variables: { routerID: null, category: null, scope: null },
        },
        result: {
          data: {
            serviceTemplates: [mockTemplate, mockCustomTemplate],
          },
        },
      },
    ];

    const { result } = renderHook(() => useServiceTemplates({ includeBuiltIn: false }), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only show custom template
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].isBuiltIn).toBe(false);
  });
});

describe('useInstallTemplate', () => {
  it('installs template successfully', async () => {
    const mockResult: TemplateInstallResult = {
      success: true,
      instanceIDs: ['instance-1', 'instance-2'],
      serviceMapping: {
        tor: 'instance-1',
        xray: 'instance-2',
      },
      errors: [],
      progress: null,
    };

    const mocks = [
      {
        request: {
          query: INSTALL_SERVICE_TEMPLATE,
          variables: {
            input: {
              routerID: 'router-1',
              templateID: 'template-1',
              variables: { TOR_NAME: 'Tor Node' },
              dryRun: false,
            },
          },
        },
        result: {
          data: {
            installServiceTemplate: mockResult,
          },
        },
      },
    ];

    const onCompleted = vi.fn();
    const { result } = renderHook(() => useInstallTemplate({ onCompleted }), {
      wrapper: createWrapper(mocks),
    });

    // Call mutation
    await result.current.installTemplate({
      routerID: 'router-1',
      templateID: 'template-1',
      variables: { TOR_NAME: 'Tor Node' },
      dryRun: false,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.instanceIDs).toHaveLength(2);
    expect(onCompleted).toHaveBeenCalledWith(mockResult);
  });

  it('handles installation errors', async () => {
    const mocks = [
      {
        request: {
          query: INSTALL_SERVICE_TEMPLATE,
          variables: {
            input: {
              routerID: 'router-1',
              templateID: 'template-1',
              variables: {},
              dryRun: false,
            },
          },
        },
        error: new Error('Installation failed: insufficient resources'),
      },
    ];

    const onError = vi.fn();
    const { result } = renderHook(() => useInstallTemplate({ onError }), {
      wrapper: createWrapper(mocks),
    });

    try {
      await result.current.installTemplate({
        routerID: 'router-1',
        templateID: 'template-1',
        variables: {},
        dryRun: false,
      });
    } catch (err) {
      // Expected to throw
    }

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(onError).toHaveBeenCalled();
  });
});

describe('useExportAsTemplate', () => {
  it('exports instances as template successfully', async () => {
    const mocks = [
      {
        request: {
          query: EXPORT_AS_TEMPLATE,
          variables: {
            input: {
              routerID: 'router-1',
              instanceIDs: ['instance-1'],
              name: 'My Template',
              description: 'Custom template',
              category: 'PRIVACY',
              scope: 'SINGLE',
            },
          },
        },
        result: {
          data: {
            exportAsTemplate: mockCustomTemplate,
          },
        },
      },
    ];

    const onCompleted = vi.fn();
    const { result } = renderHook(() => useExportAsTemplate({ onCompleted }), {
      wrapper: createWrapper(mocks),
    });

    await result.current.exportAsTemplate({
      routerID: 'router-1',
      instanceIDs: ['instance-1'],
      name: 'My Template',
      description: 'Custom template',
      category: 'PRIVACY' as ServiceTemplateCategory,
      scope: 'SINGLE',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.template?.name).toBe('My Custom Stack');
    expect(onCompleted).toHaveBeenCalledWith(mockCustomTemplate);
  });
});

describe('useImportTemplate', () => {
  it('imports template from JSON successfully', async () => {
    const templateData = {
      name: 'Imported Template',
      description: 'From JSON',
      category: 'PRIVACY',
    };

    const mocks = [
      {
        request: {
          query: IMPORT_SERVICE_TEMPLATE,
          variables: {
            input: {
              routerID: 'router-1',
              templateData,
            },
          },
        },
        result: {
          data: {
            importServiceTemplate: { ...mockCustomTemplate, name: 'Imported Template' },
          },
        },
      },
    ];

    const onCompleted = vi.fn();
    const { result } = renderHook(() => useImportTemplate({ onCompleted }), {
      wrapper: createWrapper(mocks),
    });

    await result.current.importTemplate({
      routerID: 'router-1',
      templateData,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.template?.name).toBe('Imported Template');
    expect(onCompleted).toHaveBeenCalled();
  });
});

describe('useDeleteTemplate', () => {
  it('deletes template successfully', async () => {
    const mocks = [
      {
        request: {
          query: DELETE_SERVICE_TEMPLATE,
          variables: {
            routerID: 'router-1',
            templateID: 'template-2',
          },
        },
        result: {
          data: {
            deleteServiceTemplate: true,
          },
        },
      },
    ];

    const onCompleted = vi.fn();
    const { result } = renderHook(() => useDeleteTemplate({ onCompleted }), {
      wrapper: createWrapper(mocks),
    });

    const success = await result.current.deleteTemplate({
      routerID: 'router-1',
      templateID: 'template-2',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(success).toBe(true);
    expect(onCompleted).toHaveBeenCalled();
  });

  it('handles deletion errors for built-in templates', async () => {
    const mocks = [
      {
        request: {
          query: DELETE_SERVICE_TEMPLATE,
          variables: {
            routerID: 'router-1',
            templateID: 'template-1',
          },
        },
        error: new Error('Cannot delete built-in template'),
      },
    ];

    const onError = vi.fn();
    const { result } = renderHook(() => useDeleteTemplate({ onError }), {
      wrapper: createWrapper(mocks),
    });

    try {
      await result.current.deleteTemplate({
        routerID: 'router-1',
        templateID: 'template-1',
      });
    } catch (err) {
      // Expected to throw
    }

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(onError).toHaveBeenCalled();
  });
});
