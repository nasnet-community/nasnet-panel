/**
 * Health Utils Unit Tests
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Comprehensive test coverage for all health threshold combinations.
 */

import { describe, it, expect } from 'vitest';
import {
  computeHealthStatus,
  getHealthColor,
  getHealthBgClass,
  getHealthTextClass,
  formatUptime,
  getCacheAgeMinutes,
  getCacheStatus,
  shouldDisableMutations,
} from './health-utils';
import { DEFAULT_HEALTH_THRESHOLDS } from '../../types/dashboard.types';

describe('computeHealthStatus', () => {
  describe('Critical conditions', () => {
    it('should return critical when router is offline', () => {
      const result = computeHealthStatus({
        status: 'offline',
        cpuUsage: 10,
        memoryUsage: 20,
      });
      expect(result).toBe('critical');
    });

    it('should return critical when CPU usage >= critical threshold (90%)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 92,
        memoryUsage: 50,
      });
      expect(result).toBe('critical');
    });

    it('should return critical when memory usage >= critical threshold (95%)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 50,
        memoryUsage: 96,
      });
      expect(result).toBe('critical');
    });

    it('should return critical when temperature >= critical threshold (75°C)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 50,
        memoryUsage: 50,
        temperature: 76,
      });
      expect(result).toBe('critical');
    });

    it('should return critical when CPU at exactly critical threshold', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 90,
        memoryUsage: 50,
      });
      expect(result).toBe('critical');
    });
  });

  describe('Warning conditions', () => {
    it('should return warning when CPU usage >= warning threshold (70%)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 85,
        memoryUsage: 50,
      });
      expect(result).toBe('warning');
    });

    it('should return warning when memory usage >= warning threshold (80%)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 50,
        memoryUsage: 85,
      });
      expect(result).toBe('warning');
    });

    it('should return warning when temperature >= warning threshold (60°C)', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 50,
        memoryUsage: 50,
        temperature: 65,
      });
      expect(result).toBe('warning');
    });

    it('should return warning when router is degraded', () => {
      const result = computeHealthStatus({
        status: 'degraded',
        cpuUsage: 50,
        memoryUsage: 50,
      });
      expect(result).toBe('warning');
    });

    it('should return warning when CPU at exactly warning threshold', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 70,
        memoryUsage: 50,
      });
      expect(result).toBe('warning');
    });
  });

  describe('Healthy conditions', () => {
    it('should return healthy when all metrics are normal', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 45,
        memoryUsage: 60,
      });
      expect(result).toBe('healthy');
    });

    it('should return healthy with low utilization', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 10,
        memoryUsage: 20,
        temperature: 40,
      });
      expect(result).toBe('healthy');
    });

    it('should return healthy when just below warning thresholds', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 69,
        memoryUsage: 79,
        temperature: 59,
      });
      expect(result).toBe('healthy');
    });
  });

  describe('Custom thresholds', () => {
    it('should use custom thresholds when provided', () => {
      const customThresholds = {
        cpu: { warning: 50, critical: 80 },
        memory: { warning: 60, critical: 85 },
        temperature: { warning: 50, critical: 65 },
      };

      const result = computeHealthStatus(
        {
          status: 'online',
          cpuUsage: 75,
          memoryUsage: 50,
        },
        customThresholds
      );

      expect(result).toBe('warning'); // 75% exceeds custom CPU warning (50%)
    });
  });

  describe('Priority order', () => {
    it('should prioritize offline over high metrics', () => {
      const result = computeHealthStatus({
        status: 'offline',
        cpuUsage: 95,
        memoryUsage: 98,
      });
      expect(result).toBe('critical');
    });

    it('should prioritize critical metrics over warning metrics', () => {
      const result = computeHealthStatus({
        status: 'online',
        cpuUsage: 92, // Critical
        memoryUsage: 85, // Warning
      });
      expect(result).toBe('critical');
    });

    it('should prioritize warning metrics over degraded status', () => {
      const result = computeHealthStatus({
        status: 'degraded',
        cpuUsage: 75, // Warning
        memoryUsage: 50,
      });
      expect(result).toBe('warning');
    });
  });
});

describe('getHealthColor', () => {
  it('should return green for healthy', () => {
    expect(getHealthColor('healthy')).toBe('green');
  });

  it('should return amber for warning', () => {
    expect(getHealthColor('warning')).toBe('amber');
  });

  it('should return red for critical', () => {
    expect(getHealthColor('critical')).toBe('red');
  });
});

describe('getHealthBgClass', () => {
  it('should return semantic success class for healthy', () => {
    expect(getHealthBgClass('healthy')).toBe('bg-semantic-success');
  });

  it('should return semantic warning class for warning', () => {
    expect(getHealthBgClass('warning')).toBe('bg-semantic-warning');
  });

  it('should return semantic error class for critical', () => {
    expect(getHealthBgClass('critical')).toBe('bg-semantic-error');
  });
});

describe('getHealthTextClass', () => {
  it('should return semantic success text class for healthy', () => {
    expect(getHealthTextClass('healthy')).toBe('text-semantic-success');
  });

  it('should return semantic warning text class for warning', () => {
    expect(getHealthTextClass('warning')).toBe('text-semantic-warning');
  });

  it('should return semantic error text class for critical', () => {
    expect(getHealthTextClass('critical')).toBe('text-semantic-error');
  });
});

describe('formatUptime', () => {
  it('should format days and hours correctly', () => {
    expect(formatUptime(1209600)).toBe('14d 0h'); // 14 days exactly
    expect(formatUptime(1231200)).toBe('14d 6h'); // 14 days + 6 hours
  });

  it('should format hours and minutes correctly', () => {
    expect(formatUptime(23400)).toBe('6h 30m'); // 6.5 hours
    expect(formatUptime(3600)).toBe('1h 0m'); // 1 hour exactly
  });

  it('should format minutes correctly', () => {
    expect(formatUptime(2700)).toBe('45m'); // 45 minutes
    expect(formatUptime(600)).toBe('10m'); // 10 minutes
    expect(formatUptime(60)).toBe('1m'); // 1 minute
  });

  it('should handle zero uptime', () => {
    expect(formatUptime(0)).toBe('0m');
  });

  it('should handle negative values gracefully', () => {
    expect(formatUptime(-100)).toBe('0m');
  });

  it('should handle very large uptimes', () => {
    const oneYear = 365 * 24 * 3600;
    const result = formatUptime(oneYear);
    expect(result).toMatch(/^\d+d \d+h$/);
  });
});

describe('getCacheAgeMinutes', () => {
  it('should return 0 for recent timestamp (< 1 minute ago)', () => {
    const now = new Date();
    expect(getCacheAgeMinutes(now)).toBe(0);
  });

  it('should calculate age correctly for 5 minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(getCacheAgeMinutes(fiveMinutesAgo)).toBe(5);
  });

  it('should calculate age correctly for 30 minutes ago', () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(getCacheAgeMinutes(thirtyMinutesAgo)).toBe(30);
  });

  it('should round down fractional minutes', () => {
    const ninetySecondsAgo = new Date(Date.now() - 90 * 1000);
    expect(getCacheAgeMinutes(ninetySecondsAgo)).toBe(1);
  });
});

describe('getCacheStatus', () => {
  it('should return fresh for < 1 minute', () => {
    expect(getCacheStatus(0)).toBe('fresh');
  });

  it('should return warning for 1-5 minutes', () => {
    expect(getCacheStatus(1)).toBe('warning');
    expect(getCacheStatus(3)).toBe('warning');
    expect(getCacheStatus(5)).toBe('warning');
  });

  it('should return critical for > 5 minutes', () => {
    expect(getCacheStatus(6)).toBe('critical');
    expect(getCacheStatus(10)).toBe('critical');
    expect(getCacheStatus(60)).toBe('critical');
  });
});

describe('shouldDisableMutations', () => {
  it('should not disable mutations for fresh data (0-5 minutes)', () => {
    expect(shouldDisableMutations(0)).toBe(false);
    expect(shouldDisableMutations(3)).toBe(false);
    expect(shouldDisableMutations(5)).toBe(false);
  });

  it('should disable mutations for stale data (> 5 minutes)', () => {
    expect(shouldDisableMutations(6)).toBe(true);
    expect(shouldDisableMutations(10)).toBe(true);
    expect(shouldDisableMutations(60)).toBe(true);
  });
});
