import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLogCorrelation } from './useLogCorrelation';
import type { LogEntry } from '@nasnet/core/types';

describe('useLogCorrelation', () => {
  const createLogEntry = (
    id: string,
    timestamp: Date,
    topic: LogEntry['topic'] = 'system',
    severity: LogEntry['severity'] = 'info',
    message = 'Test message'
  ): LogEntry => ({
    id,
    timestamp,
    topic,
    severity,
    message,
  });

  const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const logs: LogEntry[] = [];
      const { result } = renderHook(() => useLogCorrelation(logs));

      expect(result.current.groups).toEqual([]);
      expect(result.current.flatLogs).toEqual([]);
      expect(result.current.isGrouped).toBe(true);
    });

    it('should accept options', () => {
      const logs: LogEntry[] = [];
      const { result } = renderHook(() =>
        useLogCorrelation(logs, {
          windowMs: 5000,
          groupByTopic: true,
          minGroupSize: 1,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('time-based grouping', () => {
    it('should group logs within time window', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 500), 'firewall', 'info'), // Within 1000ms window
        createLogEntry('3', new Date(baseTime + 2000), 'firewall', 'info'), // Outside window
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 1000, minGroupSize: 2 })
      );

      expect(result.current.groups.length).toBeGreaterThan(0);
      // First two entries should be grouped together
      const firstGroup = result.current.groups[0];
      expect(firstGroup.entries.length).toBeGreaterThanOrEqual(2);
    });

    it('should create individual groups for single entries below minGroupSize', () => {
      const logs = [createLogEntry('1', new Date(baseTime), 'firewall', 'info')];

      const { result } = renderHook(() => useLogCorrelation(logs, { minGroupSize: 2 }));

      expect(result.current.groups.length).toBe(1);
      expect(result.current.groups[0].entries.length).toBe(1);
      expect(result.current.groups[0].id).toMatch(/^single-/);
    });

    it('should sort groups by start time', () => {
      const logs = [
        createLogEntry('3', new Date(baseTime + 2000), 'firewall', 'info'),
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 1000), 'firewall', 'info'),
      ];

      const { result } = renderHook(() => useLogCorrelation(logs));

      const groupTimes = result.current.groups.map((g) => g.startTime.getTime());
      expect(groupTimes).toEqual([...groupTimes].sort((a, b) => a - b));
    });
  });

  describe('topic-based grouping', () => {
    it('should group logs by topic', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'dhcp', 'info'),
        createLogEntry('3', new Date(baseTime), 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { groupByTopic: true, minGroupSize: 2 })
      );

      expect(result.current.groups.length).toBe(2);
      const topicGroups = result.current.groups.filter((g) => g.id.startsWith('topic-'));
      expect(topicGroups.length).toBeGreaterThan(0);
    });

    it('should set primaryTopic correctly for topic groups', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'firewall', 'warning'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { groupByTopic: true, minGroupSize: 2 })
      );

      const firewallGroup = result.current.groups.find((g) => g.primaryTopic === 'firewall');
      expect(firewallGroup).toBeDefined();
      expect(firewallGroup!.entries).toHaveLength(2);
    });
  });

  describe('severity tracking', () => {
    it('should calculate highest severity in group', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 500), 'firewall', 'error'),
        createLogEntry('3', new Date(baseTime + 600), 'firewall', 'warning'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 1000, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group?.severityLevel).toBe('error');
    });

    it('should handle critical severity', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'error'),
        createLogEntry('2', new Date(baseTime + 500), 'firewall', 'critical'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 1000, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group?.severityLevel).toBe('critical');
    });
  });

  describe('grouping toggle', () => {
    it('should toggle grouping on/off', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 500), 'firewall', 'info'),
      ];

      const { result } = renderHook(() => useLogCorrelation(logs, { minGroupSize: 2 }));

      expect(result.current.isGrouped).toBe(true);
      const groupCountBefore = result.current.groups.length;

      act(() => {
        result.current.toggleGrouping();
      });

      expect(result.current.isGrouped).toBe(false);
      // When ungrouped, each log should be its own group
      expect(result.current.groups.length).toBe(logs.length);
    });

    it('should set groupByTopic mode', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'dhcp', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { groupByTopic: false, minGroupSize: 1 })
      );

      act(() => {
        result.current.setGroupByTopic(true);
      });

      expect(result.current.groups.length).toBeGreaterThan(0);
    });
  });

  describe('flatLogs property', () => {
    it('should always return original logs', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'dhcp', 'info'),
      ];

      const { result } = renderHook(() => useLogCorrelation(logs));

      expect(result.current.flatLogs).toEqual(logs);
    });

    it('should update when logs change', () => {
      const logs1 = [createLogEntry('1', new Date(baseTime), 'firewall', 'info')];
      const { result, rerender } = renderHook(({ logs }) => useLogCorrelation(logs), {
        initialProps: { logs: logs1 },
      });

      expect(result.current.flatLogs).toHaveLength(1);

      const logs2 = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'dhcp', 'info'),
      ];

      rerender({ logs: logs2 });

      expect(result.current.flatLogs).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty logs', () => {
      const { result } = renderHook(() => useLogCorrelation([], { minGroupSize: 1 }));

      expect(result.current.groups).toEqual([]);
      expect(result.current.flatLogs).toEqual([]);
    });

    it('should handle single log', () => {
      const logs = [createLogEntry('1', new Date(baseTime), 'firewall', 'info')];

      const { result } = renderHook(() => useLogCorrelation(logs, { minGroupSize: 2 }));

      expect(result.current.groups).toHaveLength(1);
      expect(result.current.groups[0].entries).toEqual(logs);
    });

    it('should handle mixed severity levels', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'debug'),
        createLogEntry('2', new Date(baseTime + 100), 'firewall', 'critical'),
        createLogEntry('3', new Date(baseTime + 200), 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 500, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group?.severityLevel).toBe('critical');
    });

    it('should handle very large time windows', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 1000000), 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 2000000, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group).toBeDefined();
    });

    it('should handle logs with same timestamp', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('3', new Date(baseTime), 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 1000, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group?.entries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('group properties', () => {
    it('should set correct start and end times', () => {
      const start = new Date(baseTime);
      const end = new Date(baseTime + 2000);

      const logs = [
        createLogEntry('1', start, 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 1000), 'firewall', 'info'),
        createLogEntry('3', end, 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 3000, minGroupSize: 2 })
      );

      const group = result.current.groups.find((g) => g.entries.length > 1);
      expect(group?.startTime).toEqual(start);
      expect(group?.endTime).toEqual(end);
    });

    it('should have unique group IDs', () => {
      const logs = [
        createLogEntry('1', new Date(baseTime), 'firewall', 'info'),
        createLogEntry('2', new Date(baseTime + 500), 'firewall', 'info'),
        createLogEntry('3', new Date(baseTime + 2000), 'firewall', 'info'),
      ];

      const { result } = renderHook(() =>
        useLogCorrelation(logs, { windowMs: 1000, minGroupSize: 2 })
      );

      const ids = result.current.groups.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
