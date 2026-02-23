import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeDiagnosticStep } from './diagnostic-executor';
import * as apiClient from '@nasnet/api-client/core';

/**
 * @description Unit tests for diagnostic-executor service.
 * Tests the executeDiagnosticStep function's error handling and result parsing.
 */

// Mock the Apollo Client
vi.mock('@nasnet/api-client/core', () => ({
  apolloClient: {
    mutate: vi.fn(),
  },
}));

vi.mock('@nasnet/api-client/queries', () => ({
  RUN_TROUBLESHOOT_STEP: 'MOCK_MUTATION',
  TroubleshootStepType: {
    WAN: 'WAN',
    GATEWAY: 'GATEWAY',
    INTERNET: 'INTERNET',
    DNS: 'DNS',
    NAT: 'NAT',
  },
}));

describe('executeDiagnosticStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute a WAN diagnostic step successfully', async () => {
    const mockResult = {
      success: true,
      message: 'WAN interface is up',
      details: { interfaceName: 'ether1', status: 'connected' },
      executionTimeMs: 250,
      issueCode: null,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        runTroubleshootStep: {
          step: { result: mockResult },
        },
      },
    } as any);

    const result = await executeDiagnosticStep('wan', 'router-123', 'session-456');

    expect(result.success).toBe(true);
    expect(result.message).toBe('WAN interface is up');
    expect(result.details).toEqual({ interfaceName: 'ether1', status: 'connected' });
  });

  it('should handle unknown diagnostic step with actionable error', async () => {
    const result = await executeDiagnosticStep('invalid-step', 'router-123', 'session-456');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Unsupported diagnostic step');
    expect(result.message).toContain('wan, gateway, internet, dns, nat');
  });

  it('should handle missing result from GraphQL response', async () => {
    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        runTroubleshootStep: {
          step: { result: null },
        },
      },
    } as any);

    const result = await executeDiagnosticStep('wan', 'router-123', 'session-456');

    expect(result.success).toBe(false);
    expect(result.message).toContain('backend may be overloaded');
  });

  it('should handle GraphQL mutation errors gracefully', async () => {
    const error = new Error('Network timeout');
    vi.spyOn(apiClient.apolloClient, 'mutate').mockRejectedValue(error);

    const result = await executeDiagnosticStep('gateway', 'router-123', 'session-456');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Network timeout');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should handle unknown errors with fallback message', async () => {
    vi.spyOn(apiClient.apolloClient, 'mutate').mockRejectedValue('Unknown error type');

    const result = await executeDiagnosticStep('dns', 'router-123', 'session-456');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Please check your router connection');
  });

  it('should map all step IDs correctly', async () => {
    const mockResult = {
      success: true,
      message: 'OK',
      details: {},
      executionTimeMs: 100,
      issueCode: null,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        runTroubleshootStep: {
          step: { result: mockResult },
        },
      },
    } as any);

    const steps = ['wan', 'gateway', 'internet', 'dns', 'nat'];

    for (const step of steps) {
      const result = await executeDiagnosticStep(step, 'router-123', 'session-456');
      expect(result.success).toBe(true);
      expect(apiClient.apolloClient.mutate).toHaveBeenCalled();
    }
  });

  it('should include execution time in result', async () => {
    const mockResult = {
      success: true,
      message: 'OK',
      details: {},
      executionTimeMs: 350,
      issueCode: null,
    };

    vi.spyOn(apiClient.apolloClient, 'mutate').mockResolvedValue({
      data: {
        runTroubleshootStep: {
          step: { result: mockResult },
        },
      },
    } as any);

    const result = await executeDiagnosticStep('internet', 'router-123', 'session-456');

    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
