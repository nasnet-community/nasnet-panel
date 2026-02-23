/**
 * useIsolationStatus Hook Tests
 *
 * Tests for the headless isolation status hook.
 * Validates business logic, state derivation, and mutation handling.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IsolationSeverity } from '@nasnet/api-client/generated';
import type { IsolationStatus as GraphQLIsolationStatus } from '@nasnet/api-client/generated';

import {
  useIsolationStatus,
  HEALTH_COLORS,
  HEALTH_ICONS,
  HEALTH_LABELS,
  SEVERITY_COLORS,
  LAYER_ICONS,
} from './useIsolationStatus';

// Mock the Apollo Client hook
vi.mock('@nasnet/api-client/queries', () => ({
  useSetResourceLimits: vi.fn(() => [
    vi.fn().mockResolvedValue({ data: { setResourceLimits: { success: true } } }),
    { loading: false },
  ]),
}));

describe('useIsolationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Calculation', () => {
    it('should return "healthy" when no violations exist', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.health).toBe('healthy');
      expect(result.current.color).toBe('success');
      expect(result.current.iconName).toBe('ShieldCheck');
      expect(result.current.healthLabel).toBe('Isolated');
      expect(result.current.violationCount).toBe(0);
      expect(result.current.criticalCount).toBe(0);
      expect(result.current.warningCount).toBe(0);
    });

    it('should return "warning" when only warning violations exist', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'Process Binding',
            severity: IsolationSeverity.Warning,
            message: 'Process may bind to additional addresses',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.health).toBe('warning');
      expect(result.current.color).toBe('warning');
      expect(result.current.iconName).toBe('ShieldAlert');
      expect(result.current.healthLabel).toBe('Warnings detected');
      expect(result.current.violationCount).toBe(1);
      expect(result.current.criticalCount).toBe(0);
      expect(result.current.warningCount).toBe(1);
    });

    it('should return "critical" when critical violations exist', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'IP Binding',
            severity: IsolationSeverity.Error,
            message: 'Wildcard bind IP detected',
            timestamp: '2026-02-13T10:00:00Z',
          },
          {
            layer: 'Port Registry',
            severity: IsolationSeverity.Warning,
            message: 'Port not allocated',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.health).toBe('critical');
      expect(result.current.color).toBe('destructive');
      expect(result.current.iconName).toBe('ShieldX');
      expect(result.current.healthLabel).toBe('Critical violations');
      expect(result.current.violationCount).toBe(2);
      expect(result.current.criticalCount).toBe(1);
      expect(result.current.warningCount).toBe(1);
    });

    it('should return "unknown" when isolation is null', () => {
      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation: null,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.health).toBe('unknown');
      expect(result.current.color).toBe('muted');
      expect(result.current.iconName).toBe('ShieldQuestion');
      expect(result.current.healthLabel).toBe('Unknown status');
      expect(result.current.violationCount).toBe(0);
    });
  });

  describe('Violation Enrichment', () => {
    it('should enrich violations with color and icon metadata', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'IP Binding',
            severity: IsolationSeverity.Error,
            message: 'Wildcard bind IP detected',
            timestamp: '2026-02-13T10:00:00Z',
          },
          {
            layer: 'Directory',
            severity: IsolationSeverity.Warning,
            message: 'Insecure directory permissions',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.violations).toHaveLength(2);

      // Critical violation
      expect(result.current.violations[0]).toMatchObject({
        violation: {
          layer: 'IP Binding',
          severity: IsolationSeverity.Error,
          message: 'Wildcard bind IP detected',
        },
        color: 'destructive',
        icon: 'Network',
        layerLabel: 'IP Binding',
      });

      // Warning violation
      expect(result.current.violations[1]).toMatchObject({
        violation: {
          layer: 'Directory',
          severity: IsolationSeverity.Warning,
          message: 'Insecure directory permissions',
        },
        color: 'warning',
        icon: 'FolderLock',
        layerLabel: 'Directory',
      });
    });

    it('should handle unknown layers gracefully', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'Unknown Layer',
            severity: IsolationSeverity.Info,
            message: 'Some info message',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.violations[0]).toMatchObject({
        color: 'muted',
        icon: 'AlertCircle', // Default icon
        layerLabel: 'Unknown Layer', // Falls back to original layer name
      });
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format "just now" for timestamps within 1 minute', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();

      const isolation: GraphQLIsolationStatus = {
        lastVerified: thirtySecondsAgo,
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.timestamp).toBe('Checked just now');
    });

    it('should format relative minutes for timestamps within 1 hour', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

      const isolation: GraphQLIsolationStatus = {
        lastVerified: fiveMinutesAgo,
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.timestamp).toBe('Checked 5 minutes ago');
    });

    it('should format relative hours for timestamps within 1 day', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

      const isolation: GraphQLIsolationStatus = {
        lastVerified: threeHoursAgo,
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.timestamp).toBe('Checked 3 hours ago');
    });

    it('should format relative days for timestamps beyond 1 day', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

      const isolation: GraphQLIsolationStatus = {
        lastVerified: twoDaysAgo,
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.timestamp).toBe('Checked 2 days ago');
    });

    it('should return null for missing timestamp', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: null,
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.timestamp).toBeNull();
    });
  });

  describe('Resource Limits', () => {
    it('should extract resource limits from isolation data', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [] as ReadonlyArray<any>,
        resourceLimits: {
          applied: true,
          cpuPercent: 50,
          memoryMB: 128,
        } as any,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.resourceLimits).toBeTruthy();
      expect(result.current.resourceLimits?.cpuPercent).toBe(50);
      expect(result.current.resourceLimits?.memoryMB).toBe(128);
    });

    it('should return null resource limits when not available', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.resourceLimits).toBeNull();
    });
  });

  describe('ARIA Labels', () => {
    it('should generate ARIA label for healthy state', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [],
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.ariaLabel).toContain('Isolated');
      expect(result.current.ariaLabel).toContain('no violations detected');
    });

    it('should generate ARIA label for warning state', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'Process Binding',
            severity: IsolationSeverity.Warning,
            message: 'Warning',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.ariaLabel).toContain('Warnings detected');
      expect(result.current.ariaLabel).toContain('1 violation detected');
    });

    it('should generate ARIA label for multiple violations', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [
          {
            layer: 'IP Binding',
            severity: IsolationSeverity.Error,
            message: 'Critical',
            timestamp: '2026-02-13T10:00:00Z',
          },
          {
            layer: 'Port Registry',
            severity: IsolationSeverity.Warning,
            message: 'Warning',
            timestamp: '2026-02-13T10:00:00Z',
          },
        ] as ReadonlyArray<any>,
        resourceLimits: null,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
        })
      );

      expect(result.current.ariaLabel).toContain('Critical violations');
      expect(result.current.ariaLabel).toContain('2 violations detected');
    });
  });

  describe('Configuration Options', () => {
    it('should respect showResourceLimits flag', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [] as ReadonlyArray<any>,
        resourceLimits: { applied: true, cpuPercent: 50, memoryMB: 128 } as any,
      };

      const { result: shown } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
          showResourceLimits: true,
        })
      );

      const { result: hidden } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
          showResourceLimits: false,
        })
      );

      expect(shown.current.showResourceLimits).toBe(true);
      expect(hidden.current.showResourceLimits).toBe(false);
    });

    it('should respect allowEdit flag', () => {
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [] as ReadonlyArray<any>,
        resourceLimits: { applied: true, cpuPercent: 50, memoryMB: 128 } as any,
      };

      const { result: editable } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
          allowEdit: true,
        })
      );

      const { result: readonly } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
          allowEdit: false,
        })
      );

      expect(editable.current.allowEdit).toBe(true);
      expect(readonly.current.allowEdit).toBe(false);
    });

    it('should call onHealthChange callback when provided', async () => {
      const onHealthChange = vi.fn();
      const isolation: GraphQLIsolationStatus = {
        lastVerified: '2026-02-13T10:00:00Z',
        violations: [] as ReadonlyArray<any>,
        resourceLimits: { applied: true, cpuPercent: 50, memoryMB: 128 } as any,
      };

      const { result } = renderHook(() =>
        useIsolationStatus({
          isolation,
          instanceId: 'inst_123',
          routerId: 'router_456',
          onHealthChange,
        })
      );

      // Trigger handleSaveLimits to invoke callback
      await act(async () => {
        await result.current.handleSaveLimits({
          instanceID: 'inst_123',
          routerID: 'router_456',
          memoryMB: 256,
          cpuWeight: 75,
        } as any);
      });

      await waitFor(() => {
        expect(onHealthChange).toHaveBeenCalledWith('healthy');
      });
    });
  });

  describe('Constants and Mappings', () => {
    it('should export HEALTH_COLORS', () => {
      expect(HEALTH_COLORS).toEqual({
        healthy: 'success',
        warning: 'warning',
        critical: 'destructive',
        unknown: 'muted',
      });
    });

    it('should export HEALTH_ICONS', () => {
      expect(HEALTH_ICONS).toEqual({
        healthy: 'ShieldCheck',
        warning: 'ShieldAlert',
        critical: 'ShieldX',
        unknown: 'ShieldQuestion',
      });
    });

    it('should export HEALTH_LABELS', () => {
      expect(HEALTH_LABELS).toEqual({
        healthy: 'Isolated',
        warning: 'Warnings detected',
        critical: 'Critical violations',
        unknown: 'Unknown status',
      });
    });

    it('should export SEVERITY_COLORS', () => {
      expect(SEVERITY_COLORS).toMatchObject({
        [IsolationSeverity.Error]: 'destructive',
        [IsolationSeverity.Warning]: 'warning',
        [IsolationSeverity.Info]: 'muted',
      });
    });

    it('should export LAYER_ICONS', () => {
      expect(LAYER_ICONS).toMatchObject({
        'IP Binding': 'Network',
        'Directory': 'FolderLock',
        'Port Registry': 'Webhook',
        'Process Binding': 'Activity',
      });
    });
  });
});
