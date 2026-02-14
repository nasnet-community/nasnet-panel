import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useServiceHealthBadge,
  mapHealthStateToRuntimeState,
  formatUptime,
  formatLastHealthy,
} from './useServiceHealthBadge';
import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';

describe('useServiceHealthBadge', () => {
  it('should return UNKNOWN state when health is null', () => {
    const { result } = renderHook(() => useServiceHealthBadge(null));

    expect(result.current.healthState).toBe('UNKNOWN');
    expect(result.current.showWarning).toBe(false);
    expect(result.current.hasFailures).toBe(false);
  });

  it('should return UNKNOWN state when health is undefined', () => {
    const { result } = renderHook(() => useServiceHealthBadge(undefined));

    expect(result.current.healthState).toBe('UNKNOWN');
  });

  it('should map HEALTHY state correctly', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 25,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { result } = renderHook(() => useServiceHealthBadge(health));

    expect(result.current.healthState).toBe('HEALTHY');
    expect(result.current.isProcessAlive).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.hasFailures).toBe(false);
    expect(result.current.showWarning).toBe(false);
    expect(result.current.latencyColor).toBe('success');
  });

  it('should map UNHEALTHY state correctly', () => {
    const health: ServiceInstanceHealth = {
      status: 'UNHEALTHY',
      processAlive: false,
      connectionStatus: 'FAILED',
      latencyMs: null,
      lastHealthy: '2024-01-15T09:00:00Z',
      consecutiveFails: 5,
      uptimeSeconds: 0,
    };

    const { result } = renderHook(() => useServiceHealthBadge(health));

    expect(result.current.healthState).toBe('CRITICAL');
    expect(result.current.isProcessAlive).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.hasFailures).toBe(true);
    expect(result.current.showWarning).toBe(true);
  });

  it('should map CHECKING state to DEGRADED', () => {
    const health: ServiceInstanceHealth = {
      status: 'CHECKING',
      processAlive: true,
      connectionStatus: 'CONNECTING',
      latencyMs: null,
      lastHealthy: null,
      consecutiveFails: 0,
      uptimeSeconds: null,
    };

    const { result } = renderHook(() => useServiceHealthBadge(health));

    expect(result.current.healthState).toBe('DEGRADED');
  });

  it('should determine latency color correctly', () => {
    // Good latency (< 50ms)
    const goodHealth: ServiceInstanceHealth = {
      status: 'HEALTHY',
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 30,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 0,
      uptimeSeconds: 3600,
    };

    const { result: goodResult } = renderHook(() => useServiceHealthBadge(goodHealth));
    expect(goodResult.current.latencyColor).toBe('success');

    // OK latency (50-150ms)
    const okHealth: ServiceInstanceHealth = {
      ...goodHealth,
      latencyMs: 100,
    };

    const { result: okResult } = renderHook(() => useServiceHealthBadge(okHealth));
    expect(okResult.current.latencyColor).toBe('warning');

    // Poor latency (> 150ms)
    const poorHealth: ServiceInstanceHealth = {
      ...goodHealth,
      latencyMs: 200,
    };

    const { result: poorResult } = renderHook(() => useServiceHealthBadge(poorHealth));
    expect(poorResult.current.latencyColor).toBe('error');
  });

  it('should show warning for consecutive failures', () => {
    const health: ServiceInstanceHealth = {
      status: 'HEALTHY', // Still healthy but has failures
      processAlive: true,
      connectionStatus: 'CONNECTED',
      latencyMs: 45,
      lastHealthy: '2024-01-15T10:30:00Z',
      consecutiveFails: 2, // Has failures but not critical yet
      uptimeSeconds: 3600,
    };

    const { result } = renderHook(() => useServiceHealthBadge(health));

    expect(result.current.showWarning).toBe(true);
    expect(result.current.hasFailures).toBe(true);
  });
});

describe('mapHealthStateToRuntimeState', () => {
  it('should map HEALTHY to HEALTHY', () => {
    expect(mapHealthStateToRuntimeState('HEALTHY')).toBe('HEALTHY');
  });

  it('should map UNHEALTHY to CRITICAL', () => {
    expect(mapHealthStateToRuntimeState('UNHEALTHY')).toBe('CRITICAL');
  });

  it('should map CHECKING to DEGRADED', () => {
    expect(mapHealthStateToRuntimeState('CHECKING')).toBe('DEGRADED');
  });

  it('should map UNKNOWN to UNKNOWN', () => {
    expect(mapHealthStateToRuntimeState('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('formatUptime', () => {
  it('should format seconds as "Xs"', () => {
    expect(formatUptime(45)).toBe('45s');
  });

  it('should format minutes as "Xm Ys"', () => {
    expect(formatUptime(125)).toBe('2m 5s');
  });

  it('should format hours as "Xh Ym"', () => {
    expect(formatUptime(3665)).toBe('1h 1m');
  });

  it('should format days as "Xd Yh"', () => {
    expect(formatUptime(90061)).toBe('1d 1h');
  });

  it('should handle null values', () => {
    expect(formatUptime(null)).toBe('N/A');
  });

  it('should handle undefined values', () => {
    expect(formatUptime(undefined)).toBe('N/A');
  });

  it('should handle zero', () => {
    expect(formatUptime(0)).toBe('0s');
  });
});

describe('formatLastHealthy', () => {
  it('should format recent timestamp as "X seconds ago"', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    const result = formatLastHealthy(thirtySecondsAgo.toISOString());
    expect(result).toMatch(/\d+ seconds? ago/);
  });

  it('should format timestamp as "X minutes ago"', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const result = formatLastHealthy(fiveMinutesAgo.toISOString());
    expect(result).toMatch(/\d+ minutes? ago/);
  });

  it('should handle null values', () => {
    expect(formatLastHealthy(null)).toBe('Never');
  });

  it('should handle undefined values', () => {
    expect(formatLastHealthy(undefined)).toBe('Never');
  });
});
