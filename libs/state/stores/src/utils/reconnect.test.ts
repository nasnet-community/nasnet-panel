import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  calculateBackoff,
  createReconnectionManager,
  createLatencyUpdater,
  DEFAULT_RECONNECT_CONFIG,
} from './reconnect';

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

    it('should use custom configuration', () => {
      const customConfig = {
        baseDelay: 500,
        maxDelay: 5000,
        jitterFactor: 0,
      };

      const backoff0 = calculateBackoff(0, customConfig);
      const backoff1 = calculateBackoff(1, customConfig);
      const backoff2 = calculateBackoff(2, customConfig);

      // Without jitter, exact values
      expect(backoff0).toBe(500);
      expect(backoff1).toBe(1000);
      expect(backoff2).toBe(2000);
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

  describe('DEFAULT_RECONNECT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RECONNECT_CONFIG.baseDelay).toBe(1000);
      expect(DEFAULT_RECONNECT_CONFIG.maxDelay).toBe(30000);
      expect(DEFAULT_RECONNECT_CONFIG.jitterFactor).toBe(0.5);
      expect(DEFAULT_RECONNECT_CONFIG.maxAttempts).toBe(10);
    });
  });

  describe('createReconnectionManager', () => {
    it('should create manager with default config', () => {
      const manager = createReconnectionManager();

      expect(manager.getAttempts()).toBe(0);
      expect(manager.shouldRetry()).toBe(true);
      expect(manager.isActive()).toBe(false);
    });

    it('should increment attempts', () => {
      const manager = createReconnectionManager();

      manager.start();
      expect(manager.getAttempts()).toBe(1);

      manager.incrementAttempt();
      expect(manager.getAttempts()).toBe(2);
    });

    it('should stop retrying at max attempts', () => {
      const manager = createReconnectionManager({ maxAttempts: 3 });

      manager.start(); // attempt 1
      expect(manager.shouldRetry()).toBe(true);

      manager.incrementAttempt(); // attempt 2
      expect(manager.shouldRetry()).toBe(true);

      manager.incrementAttempt(); // attempt 3
      expect(manager.shouldRetry()).toBe(false);
    });

    it('should reset state', () => {
      const manager = createReconnectionManager({ maxAttempts: 5 });

      manager.start();
      manager.incrementAttempt();
      manager.incrementAttempt();

      expect(manager.getAttempts()).toBe(3);
      expect(manager.isActive()).toBe(true);

      manager.reset();

      expect(manager.getAttempts()).toBe(0);
      expect(manager.isActive()).toBe(false);
      expect(manager.shouldRetry()).toBe(true);
    });

    it('should calculate next delay with exponential backoff', () => {
      const manager = createReconnectionManager({
        baseDelay: 1000,
        maxDelay: 30000,
        jitterFactor: 0,
      });

      manager.start();
      expect(manager.getNextDelay()).toBe(1000);

      manager.incrementAttempt();
      expect(manager.getNextDelay()).toBe(2000);

      manager.incrementAttempt();
      expect(manager.getNextDelay()).toBe(4000);
    });

    it('should call onMaxAttemptsReached callback', () => {
      const onMaxReached = vi.fn();
      const manager = createReconnectionManager({
        maxAttempts: 2,
        onMaxAttemptsReached: onMaxReached,
      });

      manager.start(); // attempt 1
      expect(onMaxReached).not.toHaveBeenCalled();

      manager.incrementAttempt(); // attempt 2 (max)
      expect(onMaxReached).toHaveBeenCalledTimes(1);

      // Should not call again on further increments
      manager.incrementAttempt();
      expect(onMaxReached).toHaveBeenCalledTimes(1);
    });

    it('should track active state', () => {
      const manager = createReconnectionManager();

      expect(manager.isActive()).toBe(false);

      manager.start();
      expect(manager.isActive()).toBe(true);

      manager.stop();
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('createLatencyUpdater', () => {
    it('should debounce latency updates', () => {
      const callback = vi.fn();
      const updater = createLatencyUpdater(callback);

      // Fire multiple updates rapidly
      updater(50);
      updater(55);
      updater(60);
      updater(65);

      // Callback should not be called yet
      expect(callback).not.toHaveBeenCalled();

      // Advance time by debounce period (100ms default)
      vi.advanceTimersByTime(100);

      // Should be called once with last value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(65);
    });

    it('should use custom debounce delay', () => {
      const callback = vi.fn();
      const updater = createLatencyUpdater(callback, 200);

      updater(100);

      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on new updates', () => {
      const callback = vi.fn();
      const updater = createLatencyUpdater(callback, 100);

      updater(50);
      vi.advanceTimersByTime(50);

      updater(75);
      vi.advanceTimersByTime(50);

      // Should not have called yet (timer reset)
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      // Now should be called
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(75);
    });

    it('should handle cancel', () => {
      const callback = vi.fn();
      const updater = createLatencyUpdater(callback);

      updater(50);
      updater.cancel();

      vi.advanceTimersByTime(200);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
