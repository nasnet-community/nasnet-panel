/**
 * Persistence Tests
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  persistMachineState,
  restoreMachineState,
  clearMachineState,
  hasSavedSession,
  getSessionAge,
  clearAllMachineStates,
  cleanupStaleSessions,
  getSavedMachineIds,
  formatSessionAge,
  STORAGE_KEY_PREFIX,
  SESSION_TIMEOUT_MS,
} from '../persistence';

describe('Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('persistMachineState', () => {
    it('should save state to localStorage', () => {
      const context = { step: 1, data: { name: 'Test' } };

      persistMachineState('test-machine', 'step', context);

      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}test-machine`);
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toMatchObject({
        state: 'step',
        context,
        machineId: 'test-machine',
      });
    });

    it('should include timestamp', () => {
      persistMachineState('test-machine', 'step', { data: {} });

      const stored = JSON.parse(
        localStorage.getItem(`${STORAGE_KEY_PREFIX}test-machine`)!
      );
      expect(stored.timestamp).toBeDefined();
      expect(typeof stored.timestamp).toBe('number');
    });
  });

  describe('restoreMachineState', () => {
    it('should restore saved state', () => {
      const context = { step: 2, data: { name: 'Test' } };
      persistMachineState('test-machine', 'validating', context);

      const restored = restoreMachineState('test-machine');

      expect(restored).toBeDefined();
      expect(restored?.context).toEqual(context);
      expect(restored?.state).toBe('validating');
    });

    it('should return null for non-existent machine', () => {
      const restored = restoreMachineState('non-existent');
      expect(restored).toBeNull();
    });

    it('should return null for stale sessions', () => {
      // Manually create an old session
      const oldData = {
        state: 'step',
        context: {},
        timestamp: Date.now() - SESSION_TIMEOUT_MS - 1000,
        machineId: 'old-machine',
      };
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}old-machine`,
        JSON.stringify(oldData)
      );

      const restored = restoreMachineState('old-machine');

      expect(restored).toBeNull();
    });

    it('should respect custom maxAge', () => {
      const context = { data: {} };
      persistMachineState('test-machine', 'step', context);

      // Session is fresh (just created), so should be restored
      const restored = restoreMachineState('test-machine', 60000);
      expect(restored).toBeDefined();
    });

    it('should clear corrupted data', () => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}corrupt`, 'not-json');

      const restored = restoreMachineState('corrupt');

      expect(restored).toBeNull();
      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}corrupt`)).toBeNull();
    });
  });

  describe('clearMachineState', () => {
    it('should remove saved state', () => {
      persistMachineState('test-machine', 'step', {});

      clearMachineState('test-machine');

      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}test-machine`)).toBeNull();
    });

    it('should handle non-existent machine gracefully', () => {
      expect(() => clearMachineState('non-existent')).not.toThrow();
    });
  });

  describe('hasSavedSession', () => {
    it('should return true for existing session', () => {
      persistMachineState('test-machine', 'step', {});

      expect(hasSavedSession('test-machine')).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(hasSavedSession('non-existent')).toBe(false);
    });

    it('should return false for stale session', () => {
      const oldData = {
        state: 'step',
        context: {},
        timestamp: Date.now() - SESSION_TIMEOUT_MS - 1000,
        machineId: 'old-machine',
      };
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}old-machine`,
        JSON.stringify(oldData)
      );

      expect(hasSavedSession('old-machine')).toBe(false);
    });
  });

  describe('getSessionAge', () => {
    it('should return age in milliseconds', () => {
      persistMachineState('test-machine', 'step', {});

      const age = getSessionAge('test-machine');

      expect(age).toBeDefined();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(1000); // Should be very recent
    });

    it('should return null for non-existent session', () => {
      expect(getSessionAge('non-existent')).toBeNull();
    });
  });

  describe('clearAllMachineStates', () => {
    it('should clear all machine states', () => {
      persistMachineState('machine1', 'step', {});
      persistMachineState('machine2', 'step', {});
      localStorage.setItem('other-key', 'value'); // Should not be cleared

      clearAllMachineStates();

      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}machine1`)).toBeNull();
      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}machine2`)).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('value');
    });
  });

  describe('cleanupStaleSessions', () => {
    it('should remove stale sessions', () => {
      // Fresh session
      persistMachineState('fresh', 'step', {});

      // Stale session
      const oldData = {
        state: 'step',
        context: {},
        timestamp: Date.now() - SESSION_TIMEOUT_MS - 1000,
        machineId: 'stale',
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}stale`, JSON.stringify(oldData));

      const cleaned = cleanupStaleSessions();

      expect(cleaned).toBe(1);
      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}fresh`)).not.toBeNull();
      expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}stale`)).toBeNull();
    });

    it('should return number of cleaned sessions', () => {
      // Create multiple stale sessions
      for (let i = 0; i < 3; i++) {
        const oldData = {
          state: 'step',
          context: {},
          timestamp: Date.now() - SESSION_TIMEOUT_MS - 1000,
          machineId: `stale-${i}`,
        };
        localStorage.setItem(`${STORAGE_KEY_PREFIX}stale-${i}`, JSON.stringify(oldData));
      }

      const cleaned = cleanupStaleSessions();

      expect(cleaned).toBe(3);
    });
  });

  describe('getSavedMachineIds', () => {
    it('should return all saved machine IDs', () => {
      persistMachineState('machine1', 'step', {});
      persistMachineState('machine2', 'step', {});

      const ids = getSavedMachineIds();

      expect(ids).toContain('machine1');
      expect(ids).toContain('machine2');
      expect(ids.length).toBe(2);
    });

    it('should return empty array when no machines saved', () => {
      expect(getSavedMachineIds()).toEqual([]);
    });
  });

  describe('formatSessionAge', () => {
    it('should format seconds as "just now"', () => {
      expect(formatSessionAge(5000)).toBe('just now');
      expect(formatSessionAge(30000)).toBe('just now');
    });

    it('should format minutes', () => {
      expect(formatSessionAge(60000)).toBe('1 minute ago');
      expect(formatSessionAge(120000)).toBe('2 minutes ago');
      expect(formatSessionAge(600000)).toBe('10 minutes ago');
    });

    it('should format hours', () => {
      expect(formatSessionAge(3600000)).toBe('1 hour ago');
      expect(formatSessionAge(7200000)).toBe('2 hours ago');
    });

    it('should format days', () => {
      expect(formatSessionAge(86400000)).toBe('1 day ago');
      expect(formatSessionAge(172800000)).toBe('2 days ago');
    });
  });
});
