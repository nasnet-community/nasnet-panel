/**
 * Integration Tests for Firewall Templates GraphQL Hooks (NAS-7.6 Task 7.4)
 *
 * Tests GraphQL query/mutation hooks for firewall templates.
 * This is a TEMPLATE file - uncomment and move to the appropriate location once
 * the GraphQL hooks are implemented.
 *
 * MOVE TO: libs/api-client/queries/src/firewall/templates.test.ts
 *
 * @see libs/api-client/queries/src/firewall/templates.ts
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// TODO: Uncomment once implementation exists
// import {
//   useFirewallTemplates,
//   usePreviewTemplate,
//   useApplyTemplate,
//   useRollbackTemplate,
//   useSaveTemplate,
//   useDeleteTemplate,
//   useRouterInterfaces,
//   templateKeys,
// } from './templates';
import {
  mockAllTemplates,
  mockFirewallTemplatesResponse,
  mockPreviewTemplateResponse,
  mockApplyTemplateResponse,
  mockRollbackTemplateResponse,
  mockSaveTemplateResponse,
  mockDeleteTemplateResponse,
  mockRouterInterfacesResponse,
  mockBasicSecurityTemplate,
  mockCustomTemplate,
  generateMockVariables,
} from '../../../ui/patterns/src/__test-utils__/firewall-templates/template-fixtures';

// Mock GraphQL client
// TODO: Update mock based on actual GraphQL implementation (Apollo vs TanStack Query)
vi.mock('@nasnet/api-client/core', () => ({
  graphqlRequest: vi.fn(),
}));

// TODO: Uncomment once useFirewallTemplates is implemented
/*
// Test utilities
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
describe('useFirewallTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all templates successfully', async () => {
    mockGraphqlRequest.mockResolvedValue(mockFirewallTemplatesResponse);

    const { result } = renderHook(() => useFirewallTemplates('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(mockAllTemplates.length);
    expect(result.current.data![0].id).toBe('basic-security');
  });

  it('filters templates by category', async () => {
    const homeCategoryTemplates = mockAllTemplates.filter((t) => t.category === 'HOME');
    mockGraphqlRequest.mockResolvedValue({
      data: { firewallTemplates: homeCategoryTemplates },
    });

    const { result } = renderHook(
      () => useFirewallTemplates('router-123', { category: 'HOME' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(homeCategoryTemplates.length);
    expect(result.current.data!.every((t) => t.category === 'HOME')).toBe(true);
  });

  it('separates built-in and custom templates', async () => {
    mockGraphqlRequest.mockResolvedValue(mockFirewallTemplatesResponse);

    const { result } = renderHook(() => useFirewallTemplates('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const builtIn = result.current.data!.filter((t) => t.isBuiltIn);
    const custom = result.current.data!.filter((t) => !t.isBuiltIn);

    expect(builtIn.length).toBeGreaterThan(0);
    expect(custom.length).toBeGreaterThan(0);
  });

  it('handles error gracefully', async () => {
    mockGraphqlRequest.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFirewallTemplates('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('can be disabled via enabled option', () => {
    const { result } = renderHook(
      () => useFirewallTemplates('router-123', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });
});

describe('usePreviewTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('previews template with variables', async () => {
    mockGraphqlRequest.mockResolvedValue(mockPreviewTemplateResponse);

    const { result } = renderHook(() => usePreviewTemplate(), {
      wrapper: createWrapper(),
    });

    const variables = generateMockVariables();
    await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables,
    });

    expect(mockGraphqlRequest).toHaveBeenCalledWith(
      expect.any(String), // Query string
      expect.objectContaining({
        routerId: 'router-123',
        templateId: 'basic-security',
        variables,
      })
    );
  });

  it('returns resolved rules', async () => {
    mockGraphqlRequest.mockResolvedValue(mockPreviewTemplateResponse);

    const { result } = renderHook(() => usePreviewTemplate(), {
      wrapper: createWrapper(),
    });

    const preview = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(preview.resolvedRules).toBeDefined();
    expect(preview.resolvedRules.length).toBeGreaterThan(0);
    expect(preview.resolvedRules[0].comment).not.toContain('{{');
  });

  it('returns conflicts if any', async () => {
    const previewWithConflicts = {
      data: {
        previewTemplate: {
          ...mockPreviewTemplateResponse.data.previewTemplate,
          conflicts: [
            {
              type: 'DUPLICATE_RULE',
              message: 'Similar rule exists',
              existingRuleId: '*1',
              proposedRule: mockBasicSecurityTemplate.rules[0],
            },
          ],
        },
      },
    };
    mockGraphqlRequest.mockResolvedValue(previewWithConflicts);

    const { result } = renderHook(() => usePreviewTemplate(), {
      wrapper: createWrapper(),
    });

    const preview = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(preview.conflicts).toHaveLength(1);
    expect(preview.conflicts[0].type).toBe('DUPLICATE_RULE');
  });

  it('returns impact analysis', async () => {
    mockGraphqlRequest.mockResolvedValue(mockPreviewTemplateResponse);

    const { result } = renderHook(() => usePreviewTemplate(), {
      wrapper: createWrapper(),
    });

    const preview = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(preview.impactAnalysis).toBeDefined();
    expect(preview.impactAnalysis.newRulesCount).toBeGreaterThan(0);
    expect(preview.impactAnalysis.affectedChains).toBeInstanceOf(Array);
  });
});

describe('useApplyTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies template successfully', async () => {
    mockGraphqlRequest.mockResolvedValue(mockApplyTemplateResponse);

    const { result } = renderHook(() => useApplyTemplate(), {
      wrapper: createWrapper(),
    });

    const applyResult = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(applyResult.success).toBe(true);
    expect(applyResult.appliedRulesCount).toBeGreaterThan(0);
    expect(applyResult.rollbackId).toBeDefined();
  });

  it('returns rollback ID for undo', async () => {
    mockGraphqlRequest.mockResolvedValue(mockApplyTemplateResponse);

    const { result } = renderHook(() => useApplyTemplate(), {
      wrapper: createWrapper(),
    });

    const applyResult = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(applyResult.rollbackId).toBeTruthy();
    expect(applyResult.rollbackId).toMatch(/rollback-/);
  });

  it('handles partial failure', async () => {
    const partialFailure = {
      data: {
        applyFirewallTemplate: {
          success: false,
          appliedRulesCount: 3,
          rollbackId: 'rollback-123',
          errors: ['Failed to create rule 4', 'Failed to create rule 5'],
        },
      },
    };
    mockGraphqlRequest.mockResolvedValue(partialFailure);

    const { result } = renderHook(() => useApplyTemplate(), {
      wrapper: createWrapper(),
    });

    const applyResult = await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(applyResult.success).toBe(false);
    expect(applyResult.errors.length).toBeGreaterThan(0);
  });

  it('invalidates template queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockGraphqlRequest.mockResolvedValue(mockApplyTemplateResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApplyTemplate(), { wrapper });

    await result.current.mutateAsync({
      routerId: 'router-123',
      templateId: 'basic-security',
      variables: generateMockVariables(),
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(['firewall-rules']),
    });
  });
});

describe('useRollbackTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rolls back template successfully', async () => {
    mockGraphqlRequest.mockResolvedValue(mockRollbackTemplateResponse);

    const { result } = renderHook(() => useRollbackTemplate(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.mutateAsync({
      routerId: 'router-123',
      rollbackId: 'rollback-123456',
    });

    expect(success).toBe(true);
  });

  it('handles expired rollback ID', async () => {
    mockGraphqlRequest.mockResolvedValue({
      data: { rollbackFirewallTemplate: false },
    });

    const { result } = renderHook(() => useRollbackTemplate(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.mutateAsync({
      routerId: 'router-123',
      rollbackId: 'expired-rollback',
    });

    expect(success).toBe(false);
  });

  it('invalidates firewall rules on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockGraphqlRequest.mockResolvedValue(mockRollbackTemplateResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRollbackTemplate(), { wrapper });

    await result.current.mutateAsync({
      routerId: 'router-123',
      rollbackId: 'rollback-123456',
    });

    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe('useSaveTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves custom template to IndexedDB', async () => {
    mockGraphqlRequest.mockResolvedValue(mockSaveTemplateResponse);

    const { result } = renderHook(() => useSaveTemplate(), {
      wrapper: createWrapper(),
    });

    const savedTemplate = await result.current.mutateAsync({
      name: 'My Custom Template',
      description: 'Custom rules',
      category: 'CUSTOM',
      variables: [],
      rules: [],
    });

    expect(savedTemplate.id).toBeDefined();
    expect(savedTemplate.isBuiltIn).toBe(false);
  });

  it('invalidates template list on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockGraphqlRequest.mockResolvedValue(mockSaveTemplateResponse);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSaveTemplate(), { wrapper });

    await result.current.mutateAsync({
      name: 'Test',
      description: 'Test',
      category: 'CUSTOM',
      variables: [],
      rules: [],
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: templateKeys.all(),
    });
  });
});

describe('useDeleteTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes custom template', async () => {
    mockGraphqlRequest.mockResolvedValue(mockDeleteTemplateResponse);

    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.mutateAsync('custom-template-id');

    expect(success).toBe(true);
  });

  it('prevents deletion of built-in templates', async () => {
    mockGraphqlRequest.mockResolvedValue({
      data: { deleteFirewallTemplate: false },
    });

    const { result } = renderHook(() => useDeleteTemplate(), {
      wrapper: createWrapper(),
    });

    const success = await result.current.mutateAsync('basic-security');

    expect(success).toBe(false);
  });
});

describe('useRouterInterfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches router interfaces for autocomplete', async () => {
    mockGraphqlRequest.mockResolvedValue(mockRouterInterfacesResponse);

    const { result } = renderHook(() => useRouterInterfaces('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeInstanceOf(Array);
    expect(result.current.data!).toContain('bridge1');
    expect(result.current.data!).toContain('ether1');
  });

  it('handles router with no interfaces gracefully', async () => {
    mockGraphqlRequest.mockResolvedValue({ data: { routerInterfaces: [] } });

    const { result } = renderHook(() => useRouterInterfaces('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});
*/

// TODO: Add tests for caching, refetching, and optimistic updates once implementation exists
