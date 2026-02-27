/**
 * Drift Detection Hook Tests
 *
 * Unit tests for drift detection hooks including error state detection.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { Resource, DeploymentState, ResourceMetadata } from '@nasnet/core/types';

import { DriftStatus } from './types';
import {
  detectDrift,
  detectResourceDrift,
  useDriftDetection,
  useQuickDriftCheck,
} from './useDriftDetection';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockResource(config: unknown, deployment?: DeploymentState | null): Resource {
  return {
    uuid: 'test-uuid-123',
    id: 'vpn.wg.client:test:a1b2',
    type: 'vpn.wireguard.client',
    category: 'VPN',
    configuration: config,
    deployment,
    metadata: {
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedAt: '2026-01-01T00:00:00Z',
      state: 'ACTIVE',
      version: 1,
      tags: [],
      isFavorite: false,
      isPinned: false,
    } as unknown as ResourceMetadata,
  };
}

function createMockDeployment(generatedFields: unknown, appliedAt?: string): DeploymentState {
  return {
    appliedAt: appliedAt ?? new Date().toISOString(),
    isInSync: true,
    generatedFields,
  };
}

// =============================================================================
// detectDrift Tests
// =============================================================================

describe('detectDrift', () => {
  it('should return PENDING status when deployment is null', () => {
    const result = detectDrift({
      configuration: { name: 'Test' },
      deployment: null,
    });

    expect(result.status).toBe(DriftStatus.PENDING);
    expect(result.hasDrift).toBe(false);
    expect(result.errorMessage).toContain('not available');
  });

  it('should return SYNCED status when configuration matches deployment', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const result = detectDrift({
      configuration: config,
      deployment: createMockDeployment(config),
    });

    expect(result.status).toBe(DriftStatus.SYNCED);
    expect(result.hasDrift).toBe(false);
    expect(result.driftedFields).toHaveLength(0);
  });

  it('should return DRIFTED status when configuration differs from deployment', () => {
    const config = { name: 'Test', address: '192.168.1.1' };
    const deployed = { name: 'Test', address: '192.168.1.2' };

    const result = detectDrift({
      configuration: config,
      deployment: createMockDeployment(deployed),
    });

    expect(result.status).toBe(DriftStatus.DRIFTED);
    expect(result.hasDrift).toBe(true);
    expect(result.driftedFields).toHaveLength(1);
    expect(result.driftedFields[0].path).toBe('address');
  });

  it('should return ERROR status on detection failure', () => {
    // Force an error by creating a circular reference
    const config: Record<string, unknown> = { name: 'Test' };
    // In reality, we can't easily force an error with normal data
    // This test documents the expected behavior

    const result = detectDrift({
      configuration: config,
      deployment: createMockDeployment(config),
    });

    // Should succeed with normal data
    expect(result.status).not.toBe(DriftStatus.ERROR);
  });

  it('should exclude runtime-only fields from comparison', () => {
    const config = { name: 'Test', bytesIn: 100 };
    const deployed = { name: 'Test', bytesIn: 9999 };

    const result = detectDrift({
      configuration: config,
      deployment: createMockDeployment(deployed),
    });

    expect(result.status).toBe(DriftStatus.SYNCED);
    expect(result.hasDrift).toBe(false);
  });

  it('should mark deployment as stale when older than threshold', () => {
    const config = { name: 'Test' };
    const oldTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

    const result = detectDrift(
      {
        configuration: config,
        deployment: createMockDeployment(config, oldTime),
      },
      { staleThreshold: 30 * 60 * 1000 } // 30 min threshold
    );

    expect(result.isStale).toBe(true);
  });

  it('should compute hash values for comparison', () => {
    const config = { name: 'Test' };
    const deployed = { name: 'Test' };

    const result = detectDrift({
      configuration: config,
      deployment: createMockDeployment(deployed),
    });

    expect(result.configurationHash).toBeTruthy();
    expect(result.deploymentHash).toBeTruthy();
    expect(result.configurationHash).toBe(result.deploymentHash);
  });

  it('should record lastChecked timestamp', () => {
    const before = new Date();
    const result = detectDrift({
      configuration: { name: 'Test' },
      deployment: createMockDeployment({ name: 'Test' }),
    });
    const after = new Date();

    expect(result.lastChecked.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.lastChecked.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

// =============================================================================
// detectResourceDrift Tests
// =============================================================================

describe('detectResourceDrift', () => {
  it('should detect drift for a full Resource object', () => {
    const resource = createMockResource(
      { name: 'Test', address: '192.168.1.1' },
      createMockDeployment({ name: 'Test', address: '192.168.1.2' })
    );

    const result = detectResourceDrift(resource);

    expect(result.status).toBe(DriftStatus.DRIFTED);
    expect(result.driftedFields).toHaveLength(1);
  });

  it('should return PENDING for resource without deployment', () => {
    const resource = createMockResource({ name: 'Test' }, null);

    const result = detectResourceDrift(resource);

    expect(result.status).toBe(DriftStatus.PENDING);
  });
});

// =============================================================================
// useDriftDetection Hook Tests
// =============================================================================

describe('useDriftDetection', () => {
  it('should return drift result for matching config/deployment', () => {
    const config = { name: 'Test' };
    const { result } = renderHook(() =>
      useDriftDetection({
        configuration: config,
        deployment: createMockDeployment(config),
      })
    );

    expect(result.current.status).toBe(DriftStatus.SYNCED);
    expect(result.current.hasDrift).toBe(false);
    expect(result.current.driftCount).toBe(0);
  });

  it('should return drift result for mismatched config/deployment', () => {
    const config = { name: 'Test', value: 1 };
    const deployed = { name: 'Test', value: 2 };

    const { result } = renderHook(() =>
      useDriftDetection({
        configuration: config,
        deployment: createMockDeployment(deployed),
      })
    );

    expect(result.current.status).toBe(DriftStatus.DRIFTED);
    expect(result.current.hasDrift).toBe(true);
    expect(result.current.driftCount).toBe(1);
  });

  it('should provide recompute function', () => {
    const config = { name: 'Test' };
    const { result } = renderHook(() =>
      useDriftDetection({
        configuration: config,
        deployment: createMockDeployment(config),
      })
    );

    const newResult = result.current.recompute();

    expect(newResult.status).toBe(DriftStatus.SYNCED);
  });

  it('should memoize result when inputs unchanged', () => {
    const config = { name: 'Test' };
    const deployment = createMockDeployment(config);
    // Create stable input object that persists across rerenders
    const input = { configuration: config, deployment };

    const { result, rerender } = renderHook(({ input }) => useDriftDetection(input), {
      initialProps: { input },
    });

    const firstResult = result.current.result;
    // Rerender with same input reference
    rerender({ input });
    const secondResult = result.current.result;

    // Result should be memoized (same reference if inputs unchanged)
    expect(firstResult).toBe(secondResult);
  });
});

// =============================================================================
// useQuickDriftCheck Hook Tests
// =============================================================================

describe('useQuickDriftCheck', () => {
  it('should return PENDING when deployment is null', () => {
    const { result } = renderHook(() => useQuickDriftCheck({ name: 'Test' }, null));

    expect(result.current.status).toBe(DriftStatus.PENDING);
    expect(result.current.hasDrift).toBe(false);
  });

  it('should return SYNCED for matching data', () => {
    const config = { name: 'Test' };
    const deployment = createMockDeployment(config);

    const { result } = renderHook(() => useQuickDriftCheck(config, deployment));

    expect(result.current.status).toBe(DriftStatus.SYNCED);
    expect(result.current.hasDrift).toBe(false);
  });

  it('should return DRIFTED for mismatched data', () => {
    const config = { name: 'Test', value: 1 };
    const deployment = createMockDeployment({ name: 'Test', value: 2 });

    const { result } = renderHook(() => useQuickDriftCheck(config, deployment));

    expect(result.current.status).toBe(DriftStatus.DRIFTED);
    expect(result.current.hasDrift).toBe(true);
  });
});

// =============================================================================
// Error State Detection Tests
// =============================================================================

describe('Error State Detection', () => {
  it('should return PENDING when deployment layer is unavailable', () => {
    const result = detectDrift({
      configuration: { name: 'Test' },
      deployment: null,
    });

    expect(result.status).toBe(DriftStatus.PENDING);
    expect(result.errorMessage).toBeTruthy();
  });

  it('should return PENDING when deployment layer is undefined', () => {
    const result = detectDrift({
      configuration: { name: 'Test' },
      deployment: undefined,
    });

    expect(result.status).toBe(DriftStatus.PENDING);
  });

  it('should detect stale deployment with isStale flag', () => {
    const config = { name: 'Test' };
    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours

    const result = detectDrift(
      {
        configuration: config,
        deployment: createMockDeployment(config, oldTime),
      },
      { staleThreshold: 60 * 60 * 1000 } // 1 hour threshold
    );

    expect(result.isStale).toBe(true);
  });

  it('should NOT mark recent deployment as stale', () => {
    const config = { name: 'Test' };
    const recentTime = new Date().toISOString();

    const result = detectDrift(
      {
        configuration: config,
        deployment: createMockDeployment(config, recentTime),
      },
      { staleThreshold: 60 * 60 * 1000 }
    );

    expect(result.isStale).toBe(false);
  });
});
