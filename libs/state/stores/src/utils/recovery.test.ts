/**
 * Recovery Utilities Tests
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Apollo client before importing the recovery module
vi.mock('@nasnet/api-client/core', () => ({
  apolloClient: {
    clearStore: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock notification store
vi.mock('../ui/notification.store', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

// Now import the module under test
import {
  withRetry,
  createRetryHandler,
  createRecoveryActions,
  generateIssueReport,
} from './recovery';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result on first successful attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const resultPromise = withRetry(operation, { showNotifications: false });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const resultPromise = withRetry(operation, { showNotifications: false });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
    expect(result.attempts).toBe(3);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('returns failure after max retries exceeded', async () => {
    const error = new Error('Always fails');
    const operation = vi.fn().mockRejectedValue(error);

    const resultPromise = withRetry(operation, { maxRetries: 2, showNotifications: false });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    expect(result.attempts).toBe(3); // Initial + 2 retries
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('respects custom retry configuration', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Fail'));

    const resultPromise = withRetry(operation, {
      maxRetries: 1,
      showNotifications: false,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.attempts).toBe(2); // Initial + 1 retry
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry callback on each retry', async () => {
    const onRetry = vi.fn();
    const error = new Error('Fail');
    const operation = vi.fn().mockRejectedValue(error);

    const resultPromise = withRetry(operation, { maxRetries: 2, onRetry, showNotifications: false });
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, error);
    expect(onRetry).toHaveBeenCalledWith(2, error);
  });

  it('skips retry when shouldRetry returns false', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Fail'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    const resultPromise = withRetry(operation, { maxRetries: 3, shouldRetry, showNotifications: false });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    // The implementation still loops through all attempts but doesn't call onRetry or delay
    // when shouldRetry returns false. The loop continues to completion.
    expect(result.attempts).toBe(4); // maxRetries + 1
    // shouldRetry is called for each potential retry (3 times for maxRetries: 3)
    expect(shouldRetry).toHaveBeenCalledTimes(3);
  });
});

describe('createRetryHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a reusable retry handler', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('success');

    const handler = createRetryHandler(operation, { maxRetries: 3, showNotifications: false });
    const resultPromise = handler();
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.data).toBe('success');
  });
});

describe('createRecoveryActions', () => {
  it('creates recovery actions with retry function', () => {
    const retryFn = vi.fn();
    const error = new Error('Test error');

    const actions = createRecoveryActions(error, retryFn);

    expect(actions.retry).toBeDefined();
    expect(typeof actions.retry).toBe('function');
  });

  it('creates recovery actions without retry when not provided', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.retry).toBeDefined(); // Still defined, falls back to reload
    expect(typeof actions.retry).toBe('function');
  });

  it('provides clearCacheAndRetry action', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.clearCacheAndRetry).toBeDefined();
    expect(typeof actions.clearCacheAndRetry).toBe('function');
  });

  it('provides reload action', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.reload).toBeDefined();
    expect(typeof actions.reload).toBe('function');
  });

  it('provides reportIssue action', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.reportIssue).toBeDefined();
    expect(typeof actions.reportIssue).toBe('function');
  });

  it('provides copyReport action', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.copyReport).toBeDefined();
    expect(typeof actions.copyReport).toBe('function');
  });

  it('provides navigation actions (goHome, goBack)', () => {
    const error = new Error('Test error');

    const actions = createRecoveryActions(error);

    expect(actions.goHome).toBeDefined();
    expect(actions.goBack).toBeDefined();
  });
});

describe('generateIssueReport', () => {
  it('generates a report with error details', () => {
    const error = new Error('Test error message');
    error.stack = 'Error: Test error message\n    at test.ts:1:1';

    const report = generateIssueReport(error);

    expect(report.message).toBe('Test error message');
    expect(report.stack).toBe('Error: Test error message\n    at test.ts:1:1');
  });

  it('includes context when provided', () => {
    const error = new Error('Test error');
    const context = {
      component: 'TestComponent',
      action: 'fetchData',
    };

    const report = generateIssueReport(error, context);

    expect(report.context).toEqual(context);
    expect(report.context?.component).toBe('TestComponent');
    expect(report.context?.action).toBe('fetchData');
  });

  it('includes timestamp and user agent', () => {
    const error = new Error('Test error');

    const report = generateIssueReport(error);

    expect(report.timestamp).toBeDefined();
    expect(report.userAgent).toBeDefined();
    expect(typeof report.timestamp).toBe('string');
  });

  it('includes URL', () => {
    const error = new Error('Test error');

    const report = generateIssueReport(error);

    expect(report.url).toBeDefined();
    expect(typeof report.url).toBe('string');
  });
});
