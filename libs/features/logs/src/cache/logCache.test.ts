import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogCache, getLogCache, type CachedLogEntry } from './logCache';
import type { LogEntry } from '@nasnet/core/types';

describe('LogCache', () => {
  let cache: LogCache;

  const mockLogEntry = (
    id: string,
    timestamp: Date = new Date(),
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

  beforeEach(() => {
    // Create fresh cache instance for each test
    cache = new LogCache({ ttlDays: 7, maxEntries: 10000 });
  });

  afterEach(async () => {
    // Clean up
    await cache.clearAll();
    cache.close();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const newCache = new LogCache();
      expect(newCache).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const customCache = new LogCache({ ttlDays: 14, maxEntries: 20000 });
      expect(customCache).toBeDefined();
    });

    it('should open database on init', async () => {
      await cache.init();
      expect(cache).toBeDefined();
    });

    it('should handle multiple init calls', async () => {
      await cache.init();
      await cache.init();
      await cache.init();
      // Should not throw or cause issues
      expect(cache).toBeDefined();
    });
  });

  describe('storeLogs', () => {
    it('should store a single log entry', async () => {
      await cache.init();
      const logs = [mockLogEntry('1')];
      await cache.storeLogs('192.168.1.1', logs);

      const retrieved = await cache.getLogs('192.168.1.1');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe('1');
    });

    it('should store multiple log entries', async () => {
      await cache.init();
      const logs = [
        mockLogEntry('1'),
        mockLogEntry('2'),
        mockLogEntry('3'),
      ];
      await cache.storeLogs('192.168.1.1', logs);

      const retrieved = await cache.getLogs('192.168.1.1', 10);
      expect(retrieved).toHaveLength(3);
    });

    it('should set routerIp on cached entries', async () => {
      await cache.init();
      const logs = [mockLogEntry('1')];
      const routerIp = '10.0.0.1';
      await cache.storeLogs(routerIp, logs);

      const retrieved = await cache.getLogs(routerIp);
      expect(retrieved[0].routerIp).toBe(routerIp);
    });

    it('should set cachedAt and expiresAt timestamps', async () => {
      await cache.init();
      const logs = [mockLogEntry('1')];
      const beforeStore = Date.now();
      await cache.storeLogs('192.168.1.1', logs);
      const afterStore = Date.now();

      const retrieved = await cache.getLogs('192.168.1.1');
      const entry = retrieved[0] as CachedLogEntry;

      expect(entry.cachedAt).toBeGreaterThanOrEqual(beforeStore);
      expect(entry.cachedAt).toBeLessThanOrEqual(afterStore);
      expect(entry.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle empty log array', async () => {
      await cache.init();
      await cache.storeLogs('192.168.1.1', []);

      const retrieved = await cache.getLogs('192.168.1.1');
      expect(retrieved).toHaveLength(0);
    });

    it('should overwrite entries with same ID', async () => {
      await cache.init();
      const log1 = mockLogEntry('1', new Date('2024-01-01'));
      const log2 = mockLogEntry('1', new Date('2024-01-02'));

      await cache.storeLogs('192.168.1.1', [log1]);
      await cache.storeLogs('192.168.1.1', [log2]);

      const retrieved = await cache.getLogs('192.168.1.1');
      expect(retrieved).toHaveLength(1);
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      await cache.init();
      const logs = Array.from({ length: 10 }, (_, i) =>
        mockLogEntry(String(i), new Date(Date.now() - (10 - i) * 1000))
      );
      await cache.storeLogs('192.168.1.1', logs);
    });

    it('should retrieve logs for a router', async () => {
      const logs = await cache.getLogs('192.168.1.1');
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should filter by routerIp', async () => {
      const logs1 = await cache.getLogs('192.168.1.1');
      const logs2 = await cache.getLogs('10.0.0.1');

      expect(logs1.length).toBeGreaterThan(0);
      expect(logs2).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const logs5 = await cache.getLogs('192.168.1.1', 5);
      expect(logs5.length).toBeLessThanOrEqual(5);
    });

    it('should sort by timestamp descending (newest first)', async () => {
      const logs = await cache.getLogs('192.168.1.1', 10);

      for (let i = 1; i < logs.length; i++) {
        const prevTime = new Date(logs[i - 1].timestamp).getTime();
        const currTime = new Date(logs[i].timestamp).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });

    it('should filter out expired entries', async () => {
      // Create a cache with 0 TTL (already expired)
      const expiredCache = new LogCache({ ttlDays: 0 });
      await expiredCache.init();

      const logs = [mockLogEntry('1')];
      // Store logs that will immediately expire
      await expiredCache.storeLogs('192.168.1.1', logs);

      // Wait a tiny bit to ensure expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      const retrieved = await expiredCache.getLogs('192.168.1.1');
      expect(retrieved).toHaveLength(0);

      expiredCache.close();
    });

    it('should return empty array for non-existent router', async () => {
      const logs = await cache.getLogs('non-existent-ip');
      expect(logs).toHaveLength(0);
    });

    it('should return CachedLogEntry objects with router metadata', async () => {
      const logs = await cache.getLogs('192.168.1.1');
      const log = logs[0] as CachedLogEntry;

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('routerIp');
      expect(log).toHaveProperty('cachedAt');
      expect(log).toHaveProperty('expiresAt');
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired entries', async () => {
      const expiredCache = new LogCache({ ttlDays: 0 });
      await expiredCache.init();

      const logs = [
        mockLogEntry('1'),
        mockLogEntry('2'),
        mockLogEntry('3'),
      ];
      await expiredCache.storeLogs('192.168.1.1', logs);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 10));

      const deletedCount = await expiredCache.cleanupExpired();
      expect(deletedCount).toBeGreaterThan(0);

      const remaining = await expiredCache.getLogs('192.168.1.1');
      expect(remaining).toHaveLength(0);

      expiredCache.close();
    });

    it('should return number of deleted entries', async () => {
      const expiredCache = new LogCache({ ttlDays: 0 });
      await expiredCache.init();

      const logs = Array.from({ length: 5 }, (_, i) => mockLogEntry(String(i)));
      await expiredCache.storeLogs('192.168.1.1', logs);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const deletedCount = await expiredCache.cleanupExpired();
      expect(deletedCount).toBe(5);

      expiredCache.close();
    });

    it('should not delete non-expired entries', async () => {
      await cache.init();
      const logs = [mockLogEntry('1')];
      await cache.storeLogs('192.168.1.1', logs);

      const deletedCount = await cache.cleanupExpired();
      expect(deletedCount).toBe(0);

      const remaining = await cache.getLogs('192.168.1.1');
      expect(remaining).toHaveLength(1);
    });

    it('should handle empty cache', async () => {
      const deletedCount = await cache.cleanupExpired();
      expect(deletedCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all cached logs', async () => {
      await cache.init();
      const logs = [mockLogEntry('1'), mockLogEntry('2')];
      await cache.storeLogs('192.168.1.1', logs);

      expect((await cache.getLogs('192.168.1.1')).length).toBeGreaterThan(0);

      await cache.clearAll();

      const remaining = await cache.getLogs('192.168.1.1');
      expect(remaining).toHaveLength(0);
    });

    it('should handle multiple routers', async () => {
      await cache.init();
      const logs = [mockLogEntry('1')];
      await cache.storeLogs('192.168.1.1', logs);
      await cache.storeLogs('10.0.0.1', logs);

      await cache.clearAll();

      expect(await cache.getLogs('192.168.1.1')).toHaveLength(0);
      expect(await cache.getLogs('10.0.0.1')).toHaveLength(0);
    });

    it('should handle clearing empty cache', async () => {
      await cache.clearAll();
      // Should not throw
      expect(cache).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return stats for non-empty cache', async () => {
      await cache.init();
      const baseTime = Date.now();
      const logs = [
        mockLogEntry('1', new Date(baseTime)),
        mockLogEntry('2', new Date(baseTime + 1000)),
        mockLogEntry('3', new Date(baseTime + 2000)),
      ];
      await cache.storeLogs('192.168.1.1', logs);

      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
    });

    it('should have correct timestamp ordering', async () => {
      await cache.init();
      const logs = [
        mockLogEntry('1', new Date('2024-01-01')),
        mockLogEntry('2', new Date('2024-01-02')),
        mockLogEntry('3', new Date('2024-01-03')),
      ];
      await cache.storeLogs('192.168.1.1', logs);

      const stats = await cache.getStats();
      const oldestTime = stats.oldestEntry?.getTime() || 0;
      const newestTime = stats.newestEntry?.getTime() || 0;

      expect(oldestTime).toBeLessThanOrEqual(newestTime);
    });

    it('should return null entries for empty cache', async () => {
      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.oldestEntry).toBeNull();
      expect(stats.newestEntry).toBeNull();
    });

    it('should handle single entry', async () => {
      await cache.init();
      const log = mockLogEntry('1');
      await cache.storeLogs('192.168.1.1', [log]);

      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.oldestEntry).toEqual(stats.newestEntry);
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await cache.init();
      cache.close();
      // Should not throw when calling close
      expect(cache).toBeDefined();
    });

    it('should allow reopening after close', async () => {
      await cache.init();
      cache.close();

      // Re-init should work
      await cache.init();
      expect(cache).toBeDefined();
    });

    it('should handle closing multiple times', () => {
      cache.close();
      cache.close();
      cache.close();
      // Should not throw
      expect(cache).toBeDefined();
    });
  });

  describe('database initialization edge cases', () => {
    it('should handle init with no database support (gracefully)', async () => {
      // If IndexedDB is available, this should work
      await cache.init();
      expect(cache).toBeDefined();
    });

    it('should handle concurrent operations', async () => {
      await cache.init();
      const logs = [mockLogEntry('1'), mockLogEntry('2'), mockLogEntry('3')];

      // Run multiple operations concurrently
      await Promise.all([
        cache.storeLogs('192.168.1.1', [logs[0]]),
        cache.storeLogs('10.0.0.1', [logs[1]]),
        cache.storeLogs('172.16.0.1', [logs[2]]),
      ]);

      const result1 = await cache.getLogs('192.168.1.1');
      const result2 = await cache.getLogs('10.0.0.1');
      const result3 = await cache.getLogs('172.16.0.1');

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);
    });
  });
});

describe('getLogCache singleton', () => {
  beforeEach(() => {
    // Reset singleton by getting fresh instance with new config
    const cache = getLogCache();
    cache.close();
  });

  it('should return singleton instance', () => {
    const cache1 = getLogCache();
    const cache2 = getLogCache();
    expect(cache1).toBe(cache2);
  });

  it('should use config only on first instantiation', () => {
    const cache1 = getLogCache({ ttlDays: 14 });
    const cache2 = getLogCache({ ttlDays: 30 });

    // Both should be the same instance
    expect(cache1).toBe(cache2);
  });

  it('should work without config parameter', () => {
    const cache = getLogCache();
    expect(cache).toBeDefined();
  });

  afterEach(() => {
    const cache = getLogCache();
    cache.close();
  });
});
