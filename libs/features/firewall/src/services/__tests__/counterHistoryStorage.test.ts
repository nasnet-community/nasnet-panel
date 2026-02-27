/**
 * Counter History Storage Tests
 *
 * Tests IndexedDB storage for firewall rule counter history
 * Uses fake-indexeddb for isolated testing without browser dependency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { CounterHistoryStorage, type CounterHistoryEntry } from '../counterHistoryStorage';

describe('CounterHistoryStorage', () => {
  let storage: CounterHistoryStorage;

  beforeEach(async () => {
    // Create a fresh storage instance for each test
    storage = new CounterHistoryStorage();
    await storage.init();
  });

  afterEach(async () => {
    // Clean up after each test
    await storage.clearAll();
    storage.close();
  });

  describe('init', () => {
    it('should initialize database successfully', async () => {
      const newStorage = new CounterHistoryStorage();
      await expect(newStorage.init()).resolves.not.toThrow();
      newStorage.close();
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      await storage.init();
      await storage.init();
      await storage.init();

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should throw error when accessing database before init', async () => {
      const uninitializedStorage = new CounterHistoryStorage();
      await expect(uninitializedStorage.saveCounterSnapshot([])).rejects.toThrow(
        'Database not initialized'
      );
      uninitializedStorage.close();
    });
  });

  describe('saveCounterSnapshot', () => {
    it('should save single entry', async () => {
      const entry: CounterHistoryEntry = {
        id: 'router1-rule1-1000000',
        routerId: 'router1',
        ruleId: 'rule1',
        timestamp: 1000000,
        packets: 100,
        bytes: 5000,
      };

      await storage.saveCounterSnapshot([entry]);

      // Use startTime = 0 to get all entries (not just last 7 days)
      const history = await storage.getCounterHistory('router1', 'rule1', 0);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(entry);
    });

    it('should save multiple entries in batch', async () => {
      const entries: CounterHistoryEntry[] = [
        {
          id: 'router1-rule1-1000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 100,
          bytes: 5000,
        },
        {
          id: 'router1-rule1-2000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 2000000,
          packets: 200,
          bytes: 10000,
        },
        {
          id: 'router1-rule2-1000000',
          routerId: 'router1',
          ruleId: 'rule2',
          timestamp: 1000000,
          packets: 50,
          bytes: 2500,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(3);
    });

    it('should handle empty array gracefully', async () => {
      await expect(storage.saveCounterSnapshot([])).resolves.not.toThrow();

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should update existing entry with same ID', async () => {
      const entry: CounterHistoryEntry = {
        id: 'router1-rule1-1000000',
        routerId: 'router1',
        ruleId: 'rule1',
        timestamp: 1000000,
        packets: 100,
        bytes: 5000,
      };

      await storage.saveCounterSnapshot([entry]);

      // Update with same ID
      const updatedEntry: CounterHistoryEntry = {
        ...entry,
        packets: 200,
        bytes: 10000,
      };

      await storage.saveCounterSnapshot([updatedEntry]);

      // Use startTime = 0 to get all entries
      const history = await storage.getCounterHistory('router1', 'rule1', 0);
      expect(history).toHaveLength(1);
      expect(history[0].packets).toBe(200);
      expect(history[0].bytes).toBe(10000);
    });
  });

  describe('getCounterHistory', () => {
    beforeEach(async () => {
      // Setup test data
      const now = Date.now();
      const entries: CounterHistoryEntry[] = [
        {
          id: `router1-rule1-${now - 8 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago
          packets: 50,
          bytes: 2500,
        },
        {
          id: `router1-rule1-${now - 6 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 6 * 24 * 60 * 60 * 1000, // 6 days ago
          packets: 100,
          bytes: 5000,
        },
        {
          id: `router1-rule1-${now - 1 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          packets: 200,
          bytes: 10000,
        },
        {
          id: `router1-rule2-${now - 1 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule2',
          timestamp: now - 1 * 24 * 60 * 60 * 1000,
          packets: 300,
          bytes: 15000,
        },
        {
          id: `router2-rule1-${now - 1 * 24 * 60 * 60 * 1000}`,
          routerId: 'router2',
          ruleId: 'rule1',
          timestamp: now - 1 * 24 * 60 * 60 * 1000,
          packets: 400,
          bytes: 20000,
        },
      ];

      await storage.saveCounterSnapshot(entries);
    });

    it('should retrieve history for specific router and rule', async () => {
      // Use startTime = 0 to get all entries (including the 8-day-old one)
      const history = await storage.getCounterHistory('router1', 'rule1', 0);

      expect(history).toHaveLength(3);
      expect(history.every((e) => e.routerId === 'router1')).toBe(true);
      expect(history.every((e) => e.ruleId === 'rule1')).toBe(true);
    });

    it('should filter by start time (default 7 days)', async () => {
      const history = await storage.getCounterHistory('router1', 'rule1');

      // Should exclude the 8-day-old entry (outside 7-day window)
      expect(history).toHaveLength(2);
      expect(history.every((e) => e.packets >= 100)).toBe(true);
    });

    it('should filter by custom start time', async () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const history = await storage.getCounterHistory('router1', 'rule1', twoDaysAgo);

      // Should only include entries from last 2 days
      expect(history).toHaveLength(1);
      expect(history[0].packets).toBe(200);
    });

    it('should return empty array for non-existent router/rule', async () => {
      const history = await storage.getCounterHistory('nonexistent', 'rule1');
      expect(history).toHaveLength(0);
    });

    it('should sort entries by timestamp ascending', async () => {
      const history = await storage.getCounterHistory('router1', 'rule1');

      for (let i = 1; i < history.length; i++) {
        expect(history[i].timestamp).toBeGreaterThan(history[i - 1].timestamp);
      }
    });
  });

  describe('cleanupOldEntries', () => {
    it('should delete entries older than 7 days', async () => {
      const now = Date.now();
      const entries: CounterHistoryEntry[] = [
        {
          id: `router1-rule1-${now - 8 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 8 * 24 * 60 * 60 * 1000, // 8 days ago (old)
          packets: 50,
          bytes: 2500,
        },
        {
          id: `router1-rule1-${now - 10 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago (old)
          packets: 75,
          bytes: 3750,
        },
        {
          id: `router1-rule1-${now - 5 * 24 * 60 * 60 * 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago (recent)
          packets: 100,
          bytes: 5000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      const deletedCount = await storage.cleanupOldEntries();

      expect(deletedCount).toBe(2); // Two old entries deleted

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(1); // One recent entry remains
    });

    it('should return 0 when no old entries exist', async () => {
      const now = Date.now();
      const entry: CounterHistoryEntry = {
        id: `router1-rule1-${now}`,
        routerId: 'router1',
        ruleId: 'rule1',
        timestamp: now,
        packets: 100,
        bytes: 5000,
      };

      await storage.saveCounterSnapshot([entry]);

      const deletedCount = await storage.cleanupOldEntries();

      expect(deletedCount).toBe(0);

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(1);
    });

    it('should handle empty database', async () => {
      const deletedCount = await storage.cleanupOldEntries();
      expect(deletedCount).toBe(0);
    });

    it('should handle exactly 7-day boundary correctly', async () => {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const entries: CounterHistoryEntry[] = [
        {
          id: `router1-rule1-${sevenDaysAgo - 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: sevenDaysAgo - 1000, // Just over 7 days (old)
          packets: 50,
          bytes: 2500,
        },
        {
          id: `router1-rule1-${sevenDaysAgo + 1000}`,
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: sevenDaysAgo + 1000, // Just under 7 days (recent)
          packets: 100,
          bytes: 5000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      const deletedCount = await storage.cleanupOldEntries();

      expect(deletedCount).toBe(1);

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(1);
    });
  });

  describe('exportToCsv', () => {
    it('should export entries to CSV format', async () => {
      const entries: CounterHistoryEntry[] = [
        {
          id: 'router1-rule1-1000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 100,
          bytes: 5000,
        },
        {
          id: 'router1-rule1-2000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 2000000,
          packets: 200,
          bytes: 10000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      // Use startTime = 0 to get all entries
      const csv = await storage.exportToCsv('router1', 'rule1', 0);

      // Check header
      expect(csv).toContain('timestamp,packets,bytes');

      // Check data rows
      expect(csv).toContain('100,5000');
      expect(csv).toContain('200,10000');

      // Check timestamp format (ISO 8601)
      expect(csv).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return empty CSV with headers when no data exists', async () => {
      const csv = await storage.exportToCsv('nonexistent', 'rule1');

      expect(csv).toBe('timestamp,packets,bytes\n');
    });

    it('should export entries in chronological order', async () => {
      const entries: CounterHistoryEntry[] = [
        {
          id: 'router1-rule1-3000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 3000000,
          packets: 300,
          bytes: 15000,
        },
        {
          id: 'router1-rule1-1000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 100,
          bytes: 5000,
        },
        {
          id: 'router1-rule1-2000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 2000000,
          packets: 200,
          bytes: 10000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      // Use startTime = 0 to get all entries
      const csv = await storage.exportToCsv('router1', 'rule1', 0);
      const lines = csv.split('\n');

      // Skip header, check data rows are in ascending order
      expect(lines[1]).toContain('100,5000');
      expect(lines[2]).toContain('200,10000');
      expect(lines[3]).toContain('300,15000');
    });
  });

  describe('getStats', () => {
    it('should return 0 for empty database', async () => {
      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should return correct total count', async () => {
      const entries: CounterHistoryEntry[] = [
        {
          id: 'router1-rule1-1000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 100,
          bytes: 5000,
        },
        {
          id: 'router1-rule2-1000000',
          routerId: 'router1',
          ruleId: 'rule2',
          timestamp: 1000000,
          packets: 200,
          bytes: 10000,
        },
        {
          id: 'router2-rule1-1000000',
          routerId: 'router2',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 300,
          bytes: 15000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(3);
    });
  });

  describe('clearAll', () => {
    it('should remove all entries', async () => {
      const entries: CounterHistoryEntry[] = [
        {
          id: 'router1-rule1-1000000',
          routerId: 'router1',
          ruleId: 'rule1',
          timestamp: 1000000,
          packets: 100,
          bytes: 5000,
        },
        {
          id: 'router1-rule2-1000000',
          routerId: 'router1',
          ruleId: 'rule2',
          timestamp: 1000000,
          packets: 200,
          bytes: 10000,
        },
      ];

      await storage.saveCounterSnapshot(entries);

      await storage.clearAll();

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should handle clearing empty database', async () => {
      await expect(storage.clearAll()).resolves.not.toThrow();

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      // Save some data first
      const entry: CounterHistoryEntry = {
        id: 'router1-rule1-1000000',
        routerId: 'router1',
        ruleId: 'rule1',
        timestamp: 1000000,
        packets: 100,
        bytes: 5000,
      };
      await storage.saveCounterSnapshot([entry]);

      // Close the connection
      storage.close();

      // Attempting to use closed storage should fail
      await expect(storage.getStats()).rejects.toThrow('Database not initialized');

      // Re-init for afterEach cleanup
      await storage.init();
    });

    it('should handle multiple close calls safely', async () => {
      expect(() => {
        storage.close();
        storage.close();
        storage.close();
      }).not.toThrow();

      // Re-init for afterEach cleanup
      await storage.init();
    });
  });

  describe('edge cases and large datasets', () => {
    it('should handle large batch inserts efficiently', async () => {
      const largeDataset: CounterHistoryEntry[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `router1-rule1-${i}`,
        routerId: 'router1',
        ruleId: 'rule1',
        timestamp: Date.now() - i * 60000, // 1 minute intervals
        packets: i * 10,
        bytes: i * 500,
      }));

      await storage.saveCounterSnapshot(largeDataset);

      const stats = await storage.getStats();
      expect(stats.totalEntries).toBe(1000);
    });

    it('should handle queries with no results gracefully', async () => {
      const history = await storage.getCounterHistory('router999', 'rule999');
      expect(history).toEqual([]);
    });

    it('should handle special characters in IDs', async () => {
      const entry: CounterHistoryEntry = {
        id: 'router-1_test-rule-1_test-1000000',
        routerId: 'router-1_test',
        ruleId: 'rule-1_test',
        timestamp: 1000000,
        packets: 100,
        bytes: 5000,
      };

      await storage.saveCounterSnapshot([entry]);

      // Use startTime = 0 to get all entries
      const history = await storage.getCounterHistory('router-1_test', 'rule-1_test', 0);
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('router-1_test-rule-1_test-1000000');
    });
  });
});
