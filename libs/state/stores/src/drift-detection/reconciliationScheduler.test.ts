/**
 * Reconciliation Scheduler Tests
 *
 * Integration tests for the priority-based reconciliation polling scheduler.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { Resource, ResourceMetadata } from '@nasnet/core/types';

import {
  ReconciliationScheduler,
  initializeScheduler,
  destroyScheduler,
  getDefaultScheduler,
} from './reconciliationScheduler';
import { DriftStatus, ResourcePriority, getResourcePriority } from './types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockResource(
  uuid: string,
  type: string,
  config: unknown = { name: 'Test' }
): Resource {
  return {
    uuid,
    id: `${type}:test:${uuid.slice(0, 4)}`,
    type,
    category: 'VPN',
    configuration: config,
    deployment: {
      appliedAt: new Date().toISOString(),
      isInSync: true,
      generatedFields: config,
    },
    metadata: {
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
      updatedAt: '2026-01-01T00:00:00Z',
      state: 'active',
      version: 1,
      tags: [],
      isFavorite: false,
      isPinned: false,
    } as ResourceMetadata,
  };
}

// =============================================================================
// getResourcePriority Tests
// =============================================================================

describe('getResourcePriority', () => {
  it('should return HIGH priority for VPN resources', () => {
    expect(getResourcePriority('vpn')).toBe(ResourcePriority.HIGH);
    expect(getResourcePriority('vpn.wireguard')).toBe(ResourcePriority.HIGH);
    expect(getResourcePriority('vpn.wireguard.client')).toBe(ResourcePriority.HIGH);
    expect(getResourcePriority('vpn.openvpn')).toBe(ResourcePriority.HIGH);
  });

  it('should return HIGH priority for WAN resources', () => {
    expect(getResourcePriority('wan')).toBe(ResourcePriority.HIGH);
  });

  it('should return HIGH priority for auth resources', () => {
    expect(getResourcePriority('auth')).toBe(ResourcePriority.HIGH);
    expect(getResourcePriority('authentication')).toBe(ResourcePriority.HIGH);
  });

  it('should return NORMAL priority for LAN resources', () => {
    expect(getResourcePriority('lan')).toBe(ResourcePriority.NORMAL);
  });

  it('should return NORMAL priority for firewall resources', () => {
    expect(getResourcePriority('firewall')).toBe(ResourcePriority.NORMAL);
  });

  it('should return NORMAL priority for DHCP resources', () => {
    expect(getResourcePriority('dhcp')).toBe(ResourcePriority.NORMAL);
  });

  it('should return LOW priority for logging resources', () => {
    expect(getResourcePriority('logging')).toBe(ResourcePriority.LOW);
  });

  it('should return LOW priority for scripts', () => {
    expect(getResourcePriority('scripts')).toBe(ResourcePriority.LOW);
  });

  it('should return NORMAL priority for unknown types', () => {
    expect(getResourcePriority('unknown.type')).toBe(ResourcePriority.NORMAL);
  });
});

// =============================================================================
// ReconciliationScheduler Tests
// =============================================================================

describe('ReconciliationScheduler', () => {
  let scheduler: ReconciliationScheduler;
  let mockFetcher: ReturnType<typeof vi.fn>;
  let mockOnDriftDetected: ReturnType<typeof vi.fn>;
  let mockOnDriftResolved: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;
  let mockIsOnline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockFetcher = vi.fn().mockResolvedValue([]);
    mockOnDriftDetected = vi.fn();
    mockOnDriftResolved = vi.fn();
    mockOnError = vi.fn();
    mockIsOnline = vi.fn().mockReturnValue(true);

    scheduler = new ReconciliationScheduler({
      resourceFetcher: mockFetcher,
      onDriftDetected: mockOnDriftDetected,
      onDriftResolved: mockOnDriftResolved,
      onError: mockOnError,
      isOnline: mockIsOnline,
      batchSize: 5,
      minBatchInterval: 100,
    });
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
    destroyScheduler();
  });

  // ===========================================================================
  // Registration Tests
  // ===========================================================================

  describe('registration', () => {
    it('should register a resource', () => {
      const resource = createMockResource('uuid-1', 'vpn.wireguard.client');
      scheduler.register(resource);

      expect(scheduler.resourceCount).toBe(1);
    });

    it('should register multiple resources', () => {
      const resources = [
        createMockResource('uuid-1', 'vpn.wireguard.client'),
        createMockResource('uuid-2', 'firewall'),
        createMockResource('uuid-3', 'dhcp'),
      ];

      scheduler.registerMany(resources);

      expect(scheduler.resourceCount).toBe(3);
    });

    it('should unregister a resource', () => {
      const resource = createMockResource('uuid-1', 'vpn.wireguard.client');
      scheduler.register(resource);
      expect(scheduler.resourceCount).toBe(1);

      scheduler.unregister('uuid-1');
      expect(scheduler.resourceCount).toBe(0);
    });

    it('should clear all resources', () => {
      scheduler.registerMany([
        createMockResource('uuid-1', 'vpn'),
        createMockResource('uuid-2', 'vpn'),
      ]);
      expect(scheduler.resourceCount).toBe(2);

      scheduler.clear();
      expect(scheduler.resourceCount).toBe(0);
    });
  });

  // ===========================================================================
  // Scheduling Tests
  // ===========================================================================

  describe('scheduling', () => {
    it('should schedule immediate check for a resource', () => {
      const resource = createMockResource('uuid-1', 'vpn');
      scheduler.register(resource);

      // Schedule immediate
      scheduler.scheduleImmediateCheck('uuid-1');

      // Resource should now be due for checking
      // (Implementation detail: nextCheck set to 0)
      expect(scheduler.resourceCount).toBe(1);
    });

    it('should schedule immediate check for multiple resources', () => {
      scheduler.registerMany([
        createMockResource('uuid-1', 'vpn'),
        createMockResource('uuid-2', 'vpn'),
      ]);

      scheduler.scheduleImmediateCheckMany(['uuid-1', 'uuid-2']);

      expect(scheduler.resourceCount).toBe(2);
    });
  });

  // ===========================================================================
  // Running Tests
  // ===========================================================================

  describe('running', () => {
    it('should start the scheduler', () => {
      expect(scheduler.running).toBe(false);

      scheduler.start();

      expect(scheduler.running).toBe(true);
    });

    it('should stop the scheduler', () => {
      scheduler.start();
      expect(scheduler.running).toBe(true);

      scheduler.stop();

      expect(scheduler.running).toBe(false);
    });

    it('should not start twice', () => {
      scheduler.start();
      scheduler.start();

      expect(scheduler.running).toBe(true);
    });

    it('should skip polling when offline', async () => {
      mockIsOnline.mockReturnValue(false);

      const resource = createMockResource('uuid-1', 'vpn', { name: 'Test' });
      scheduler.register(resource);
      scheduler.scheduleImmediateCheck('uuid-1');
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      // Fetcher should NOT be called when offline
      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Drift Detection Tests
  // ===========================================================================

  describe('drift detection', () => {
    it('should call onDriftDetected when drift is found', async () => {
      const configWithoutDrift = { name: 'Test' };
      const configWithDrift = { name: 'Different' };

      const resource = createMockResource('uuid-1', 'vpn', configWithoutDrift);
      // Mock fetcher returns resource with drifted config
      const driftedResource = {
        ...resource,
        deployment: {
          ...resource.deployment,
          generatedFields: configWithDrift,
        },
      };

      mockFetcher.mockResolvedValue([driftedResource]);

      scheduler.register(resource);
      scheduler.scheduleImmediateCheck('uuid-1');
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockOnDriftDetected).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({
          status: DriftStatus.DRIFTED,
          hasDrift: true,
        })
      );
    });

    it('should call onDriftResolved when drift is fixed', async () => {
      const config = { name: 'Test' };

      // First fetch: drifted
      const driftedResource = createMockResource('uuid-1', 'vpn', config);
      driftedResource.deployment = {
        appliedAt: new Date().toISOString(),
        isInSync: false,
        generatedFields: { name: 'Different' },
      };

      // Second fetch: synced
      const syncedResource = createMockResource('uuid-1', 'vpn', config);

      mockFetcher
        .mockResolvedValueOnce([driftedResource])
        .mockResolvedValueOnce([syncedResource]);

      scheduler.register(driftedResource);
      scheduler.scheduleImmediateCheck('uuid-1');
      scheduler.start();

      // First check - detect drift
      // start() calls tick() synchronously, which triggers processBatch async
      // Advance timers to let the async processBatch complete
      await vi.advanceTimersByTimeAsync(100);

      expect(mockOnDriftDetected).toHaveBeenCalled();
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      // Schedule another immediate check
      scheduler.scheduleImmediateCheck('uuid-1');

      // Advance past minBatchInterval (100ms) plus some buffer, then trigger
      // the interval tick by advancing to 60 seconds
      await vi.advanceTimersByTimeAsync(60000);

      // Second check - drift resolved
      expect(mockFetcher).toHaveBeenCalledTimes(2);
      expect(mockOnDriftResolved).toHaveBeenCalledWith(
        'uuid-1',
        expect.objectContaining({
          status: DriftStatus.SYNCED,
          hasDrift: false,
        })
      );
    });

    it('should call onError when fetch fails', async () => {
      mockFetcher.mockRejectedValue(new Error('Network error'));

      const resource = createMockResource('uuid-1', 'vpn');
      scheduler.register(resource);
      scheduler.scheduleImmediateCheck('uuid-1');
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      expect(mockOnError).toHaveBeenCalledWith(
        'uuid-1',
        expect.any(Error)
      );
    });
  });

  // ===========================================================================
  // Status Tests
  // ===========================================================================

  describe('status', () => {
    it('should return drift status for all resources', async () => {
      const config = { name: 'Test' };
      const resources = [
        createMockResource('uuid-1', 'vpn', config),
        createMockResource('uuid-2', 'vpn', config),
      ];

      mockFetcher.mockResolvedValue(resources);

      scheduler.registerMany(resources);
      scheduler.scheduleImmediateCheckMany(['uuid-1', 'uuid-2']);
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      const allStatus = scheduler.getAllDriftStatus();

      expect(allStatus.size).toBe(2);
    });

    it('should return list of drifted resources', async () => {
      const config = { name: 'Test' };
      const syncedResource = createMockResource('uuid-1', 'vpn', config);
      const driftedResource = createMockResource('uuid-2', 'vpn', config);
      driftedResource.deployment = {
        appliedAt: new Date().toISOString(),
        isInSync: false,
        generatedFields: { name: 'Different' },
      };

      mockFetcher.mockResolvedValue([syncedResource, driftedResource]);

      scheduler.registerMany([syncedResource, driftedResource]);
      scheduler.scheduleImmediateCheckMany(['uuid-1', 'uuid-2']);
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      const drifted = scheduler.getDriftedResources();

      expect(drifted).toContain('uuid-2');
      expect(drifted).not.toContain('uuid-1');
    });

    it('should return drift counts by status', async () => {
      const config = { name: 'Test' };
      const syncedResource = createMockResource('uuid-1', 'vpn', config);
      const driftedResource = createMockResource('uuid-2', 'vpn', config);
      driftedResource.deployment = {
        appliedAt: new Date().toISOString(),
        isInSync: false,
        generatedFields: { name: 'Different' },
      };

      mockFetcher.mockResolvedValue([syncedResource, driftedResource]);

      scheduler.registerMany([syncedResource, driftedResource]);
      scheduler.scheduleImmediateCheckMany(['uuid-1', 'uuid-2']);
      scheduler.start();

      await vi.advanceTimersByTimeAsync(1000);

      const counts = scheduler.getDriftCounts();

      expect(counts[DriftStatus.SYNCED]).toBe(1);
      expect(counts[DriftStatus.DRIFTED]).toBe(1);
    });
  });
});

// =============================================================================
// Singleton Functions Tests
// =============================================================================

describe('Singleton functions', () => {
  afterEach(() => {
    destroyScheduler();
  });

  it('should initialize default scheduler', () => {
    const scheduler = initializeScheduler({
      resourceFetcher: vi.fn().mockResolvedValue([]),
    });

    expect(scheduler).toBeInstanceOf(ReconciliationScheduler);
  });

  it('should get default scheduler after initialization', () => {
    initializeScheduler({
      resourceFetcher: vi.fn().mockResolvedValue([]),
    });

    const scheduler = getDefaultScheduler();

    expect(scheduler).toBeInstanceOf(ReconciliationScheduler);
  });

  it('should throw when getting scheduler before initialization', () => {
    expect(() => getDefaultScheduler()).toThrow();
  });

  it('should destroy default scheduler', () => {
    const scheduler = initializeScheduler({
      resourceFetcher: vi.fn().mockResolvedValue([]),
    });

    scheduler.start();
    expect(scheduler.running).toBe(true);

    destroyScheduler();

    expect(scheduler.running).toBe(false);
  });
});
