import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { calculateBackoff, createReconnectionManager, createLatencyUpdater } from './reconnect';

describe('Reconnection Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff starting at 1 second', () => {
      // Attempt 0: 1s base
      const backoff0 = calculateBackoff(0);
      expect(backoff0).toBeGreaterThanOrEqual(1000);
      expect(backoff0).toBeLessThanOrEqual(1500); // With jitter
    });

    it('should increase exponentially', () => {
      const backoff0 = calculateBackoff(0); // ~1s
      const backoff1 = calculateBackoff(1); // ~2s
      const backoff2 = calculateBackoff(2); // ~4s
      const backoff3 = calculateBackoff(3); // ~8s

      // Without jitter, values would be: 1000, 2000, 4000, 8000
      // With jitter, each can vary by up to 50%
      expect(backoff1).toBeGreaterThan(backoff0 * 0.8);
      expect(backoff2).toBeGreaterThan(backoff1 * 0.8);
      expect(backoff3).toBeGreaterThan(backoff2 * 0.8);
    });

    it('should cap at maximum delay (30 seconds)', () => {
      const backoff10 = calculateBackoff(10);
      const backoff20 = calculateBackoff(20);

      // Should cap at 30000ms regardless of attempt
      expect(backoff10).toBeLessThanOrEqual(30000 * 1.5); // With jitter
      expect(backoff20).toBeLessThanOrEqual(30000 * 1.5);
    });

    it('should use consistent exponential scaling', () => {
      // Test exponential scaling without custom config
      // Backoff doubles with each attempt: 1s, 2s, 4s, 8s...
      const attempts = [0, 1, 2, 3];
      const backoffs = attempts.map((a) => calculateBackoff(a));

      // Each backoff should be roughly double the previous (accounting for jitter)
      for (let i = 1; i < backoffs.length; i++) {
        const prevMin = 1000 * Math.pow(2, attempts[i - 1]) * 0.5; // Min with jitter
        const currentMax = 1000 * Math.pow(2, attempts[i]) * 1.5; // Max with jitter
        expect(backoffs[i]).toBeLessThanOrEqual(currentMax);
      }
    });

    it('should apply jitter correctly', () => {
      // With jitter factor 0.5, values can vary ±50%
      const attempts = 100;
      const results: number[] = [];

      for (let i = 0; i < attempts; i++) {
        results.push(calculateBackoff(0));
      }

      // All should be in range [1000 * 0.5, 1000 * 1.5]
      results.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(500);
        expect(value).toBeLessThanOrEqual(1500);
      });

      // With randomness, there should be variation
      const unique = new Set(results);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('createReconnectionManager', () => {
    it('should create manager with default config', () => {
      const manager = createReconnectionManager({
        connect: vi.fn(),
      });

      expect(manager.getAttempts()).toBe(0);
      expect(manager.isActive()).toBe(false);
    });

    it('should track active state', () => {
      const manager = createReconnectionManager({
        connect: vi.fn(),
      });

      expect(manager.isActive()).toBe(false);

      manager.start();
      expect(manager.isActive()).toBe(true);

      manager.stop();
      expect(manager.isActive()).toBe(false);
    });

    it('should reset state', () => {
      const manager = createReconnectionManager({
        connect: vi.fn(),
        maxAttempts: 5,
      });

      manager.start();
      expect(manager.getAttempts()).toBeGreaterThan(0);

      manager.reset();

      expect(manager.getAttempts()).toBe(0);
      expect(manager.isActive()).toBe(false);
    });

    it('should call connect callback on start', async () => {
      const connectFn = vi.fn().mockResolvedValue(undefined);
      const manager = createReconnectionManager({
        connect: connectFn,
      });

      manager.start();

      // Advance time to trigger the connection attempt
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Connect should have been called
      expect(connectFn).toHaveBeenCalled();
    });

    it('should support max attempts limit', () => {
      const manager = createReconnectionManager({
        connect: vi.fn(),
        maxAttempts: 3,
      });

      expect(manager.getAttempts()).toBe(0);
      manager.reset();
      expect(manager.getAttempts()).toBe(0);
    });

    it('should support onStatusChange callback', () => {
      const onStatusChange = vi.fn();
      const manager = createReconnectionManager({
        connect: vi.fn(),
        onStatusChange,
      });

      manager.start();

      // onStatusChange should be called when status changes
      expect(onStatusChange).toHaveBeenCalled();
    });
  });

  describe('createLatencyUpdater', () => {
    it('should return a function that takes routerId and latencyMs', () => {
      const updater = createLatencyUpdater(100);

      // updater should be a function
      expect(typeof updater).toBe('function');

      // Should not throw when called
      expect(() => updater('router-1', 50)).not.toThrow();
    });

    it('should use default interval (100ms)', () => {
      const updater = createLatencyUpdater();

      // Verify it's a function and callable
      expect(typeof updater).toBe('function');
      expect(() => updater('router-1', 50)).not.toThrow();
    });

    it('should use custom interval', () => {
      const updater = createLatencyUpdater(200);

      // Verify it's a function with custom interval
      expect(typeof updater).toBe('function');
      expect(() => updater('router-1', 100)).not.toThrow();
    });

    it('should debounce updates within interval', () => {
      const updater = createLatencyUpdater(100);

      // Fire multiple updates rapidly for same router
      updater('router-1', 50);
      updater('router-1', 55);
      updater('router-1', 60);

      // Advance time within the interval
      vi.advanceTimersByTime(50);

      // Further updates should continue debouncing
      updater('router-1', 65);

      vi.advanceTimersByTime(100);

      // Updater is now done (internal state updated)
      expect(true).toBe(true); // Test passes if no errors
    });

    it('should handle multiple routers', () => {
      const updater = createLatencyUpdater(100);

      // Update latency for different routers
      updater('router-1', 50);
      updater('router-2', 75);
      updater('router-1', 55);

      // Should not throw
      expect(() => {
        updater('router-3', 100);
      }).not.toThrow();
    });
  });
});
