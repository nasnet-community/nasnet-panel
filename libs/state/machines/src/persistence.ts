/**
 * State Persistence Utilities for XState Machines
 *
 * Provides localStorage-based persistence for state machines,
 * enabling session recovery after browser close/crash.
 *
 * Features:
 * - Automatic state persistence on transitions
 * - Session recovery with configurable timeout
 * - Stale session cleanup (default: 24 hours)
 * - Type-safe persistence/restoration
 *
 * @see NAS-4.6: Implement Complex Flows with XState
 */

import type { PersistedMachineState, SessionRecoveryOptions } from './types';

// ===== Constants =====

/**
 * LocalStorage key prefix for machine states
 */
export const STORAGE_KEY_PREFIX = 'nasnet-machine-';

/**
 * Default session timeout in milliseconds (24 hours)
 */
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// ===== Helper Functions =====

/**
 * Generate storage key for a machine
 */
function getStorageKey(machineId: string): string {
  return `${STORAGE_KEY_PREFIX}${machineId}`;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ===== Core Functions =====

/**
 * Persist machine state to localStorage
 *
 * @param machineId - Unique machine identifier
 * @param stateValue - Current state value (e.g., "step", "validating")
 * @param context - Current machine context
 *
 * @example
 * ```ts
 * // In a machine action or effect
 * persistMachineState('vpn-wizard', state.value, state.context);
 * ```
 */
export function persistMachineState<TContext>(
  machineId: string,
  stateValue: string,
  context: TContext
): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[machines/persistence] localStorage not available');
    return;
  }

  const key = getStorageKey(machineId);
  const data: PersistedMachineState<TContext> = {
    state: stateValue,
    context,
    timestamp: Date.now(),
    machineId,
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('[machines/persistence] Failed to persist state:', error);
  }
}

/**
 * Restore machine state from localStorage
 *
 * Returns null if:
 * - No saved state exists
 * - Saved state is expired (older than maxAge)
 * - Saved state is corrupted
 *
 * @param machineId - Unique machine identifier
 * @param maxAge - Maximum age in ms before state is considered stale (default: 24 hours)
 * @returns Restored context or null if not available/expired
 *
 * @example
 * ```ts
 * const savedContext = restoreMachineState<WizardContext>('vpn-wizard');
 * if (savedContext) {
 *   // Resume wizard from saved state
 *   send({ type: 'RESTORE', savedContext });
 * }
 * ```
 */
export function restoreMachineState<TContext>(
  machineId: string,
  maxAge: number = SESSION_TIMEOUT_MS
): PersistedMachineState<TContext> | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  const key = getStorageKey(machineId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const data = JSON.parse(stored) as PersistedMachineState<TContext>;
    const age = Date.now() - data.timestamp;

    // Check if session is stale
    if (age > maxAge) {
      // Clear stale session
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    // Clear corrupted data
    console.error('[machines/persistence] Failed to restore state:', error);
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Clear saved machine state from localStorage
 *
 * @param machineId - Unique machine identifier
 *
 * @example
 * ```ts
 * // After wizard completion
 * clearMachineState('vpn-wizard');
 * ```
 */
export function clearMachineState(machineId: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  const key = getStorageKey(machineId);
  localStorage.removeItem(key);
}

/**
 * Check if a machine has a saved session
 *
 * @param machineId - Unique machine identifier
 * @param maxAge - Maximum age in ms to consider session valid
 * @returns True if a valid saved session exists
 *
 * @example
 * ```ts
 * if (hasSavedSession('vpn-wizard')) {
 *   showResumePrompt();
 * }
 * ```
 */
export function hasSavedSession(machineId: string, maxAge: number = SESSION_TIMEOUT_MS): boolean {
  return restoreMachineState(machineId, maxAge) !== null;
}

/**
 * Get session age in milliseconds
 *
 * @param machineId - Unique machine identifier
 * @returns Session age in ms, or null if no session exists
 *
 * @example
 * ```ts
 * const age = getSessionAge('vpn-wizard');
 * if (age && age > 60000) {
 *   console.log('Session is over a minute old');
 * }
 * ```
 */
export function getSessionAge(machineId: string): number | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  const key = getStorageKey(machineId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const data = JSON.parse(stored) as PersistedMachineState;
    return Date.now() - data.timestamp;
  } catch {
    return null;
  }
}

/**
 * Clear all saved machine states
 * Useful for logout or app reset
 *
 * @example
 * ```ts
 * // On user logout
 * clearAllMachineStates();
 * ```
 */
export function clearAllMachineStates(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Clean up stale sessions
 * Removes all sessions older than the specified max age
 *
 * @param maxAge - Maximum age in ms (default: 24 hours)
 * @returns Number of sessions cleaned up
 *
 * @example
 * ```ts
 * // On app startup
 * const cleaned = cleanupStaleSessions();
 * console.log(`Cleaned up ${cleaned} stale sessions`);
 * ```
 */
export function cleanupStaleSessions(maxAge: number = SESSION_TIMEOUT_MS): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  let cleanedCount = 0;
  const keysToCheck: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keysToCheck.push(key);
    }
  }

  keysToCheck.forEach((key) => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored) as PersistedMachineState;
        const age = Date.now() - data.timestamp;
        if (age > maxAge) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch {
        // Remove corrupted entries
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  });

  return cleanedCount;
}

/**
 * Get all saved machine IDs
 *
 * @returns Array of machine IDs with saved sessions
 *
 * @example
 * ```ts
 * const savedMachines = getSavedMachineIds();
 * console.log('Machines with saved state:', savedMachines);
 * ```
 */
export function getSavedMachineIds(): string[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  const machineIds: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      machineIds.push(key.slice(STORAGE_KEY_PREFIX.length));
    }
  }

  return machineIds;
}

/**
 * Format session age for display
 *
 * @param ageMs - Age in milliseconds
 * @returns Human-readable age string
 *
 * @example
 * ```ts
 * const age = getSessionAge('vpn-wizard');
 * if (age) {
 *   console.log(`Session is ${formatSessionAge(age)} old`);
 *   // Output: "Session is 2 hours ago old"
 * }
 * ```
 */
export function formatSessionAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

// ===== Session Recovery Hook Helpers =====

/**
 * Create session recovery options with defaults
 */
export function createSessionRecoveryOptions(
  options: Partial<SessionRecoveryOptions> = {}
): Required<SessionRecoveryOptions> {
  return {
    maxAge: options.maxAge ?? SESSION_TIMEOUT_MS,
    promptBeforeRestore: options.promptBeforeRestore ?? true,
    onRestore: options.onRestore ?? (() => {}),
    onDiscard: options.onDiscard ?? (() => {}),
  };
}
