/**
 * Subscription Test Utilities
 *
 * Helpers for testing Apollo GraphQL subscriptions in unit tests.
 * Provides mock observable patterns for subscription testing.
 *
 * @module @nasnet/api-client/core/apollo/__tests__
 */

import { Observable } from '@apollo/client';

/**
 * Mock subscription data interface
 */
export interface MockSubscriptionUpdate<T> {
  data: T;
  delay?: number;
}

/**
 * Create a mock subscription observable for testing.
 *
 * Returns an Observable that emits the provided updates in sequence,
 * with optional delays between emissions.
 *
 * @param updates - Array of updates to emit
 * @returns Observable that emits the updates
 *
 * @example
 * ```ts
 * const mockSub = createMockSubscription([
 *   { data: { routerStatus: { id: '1', status: 'CONNECTED' } }, delay: 0 },
 *   { data: { routerStatus: { id: '1', status: 'RECONNECTING' } }, delay: 100 },
 *   { data: { routerStatus: { id: '1', status: 'CONNECTED' } }, delay: 200 },
 * ]);
 * ```
 */
export function createMockSubscription<T>(
  updates: MockSubscriptionUpdate<T>[]
): Observable<{ data: T }> {
  return new Observable((observer) => {
    let index = 0;
    let timeoutId: NodeJS.Timeout | null = null;

    const emitNext = () => {
      if (index >= updates.length) {
        observer.complete?.();
        return;
      }

      const update = updates[index];
      const delay = update.delay ?? 0;

      timeoutId = setTimeout(() => {
        observer.next({ data: update.data });
        index++;
        emitNext();
      }, delay);
    };

    emitNext();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });
}

/**
 * Create a mock subscription that emits an error.
 *
 * @param error - Error to emit
 * @param delay - Delay before emitting error (default: 0)
 *
 * @example
 * ```ts
 * const errorSub = createMockSubscriptionError(
 *   new Error('Connection lost'),
 *   100
 * );
 * ```
 */
export function createMockSubscriptionError(error: Error, delay = 0): Observable<never> {
  return new Observable((observer) => {
    const timeoutId = setTimeout(() => {
      observer.error?.(error);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  });
}

/**
 * Create a mock subscription that never completes.
 * Useful for testing unsubscription cleanup.
 *
 * @param updates - Optional updates to emit before going silent
 *
 * @example
 * ```ts
 * const infiniteSub = createMockInfiniteSubscription([
 *   { data: { heartbeat: true }, delay: 1000 },
 * ]);
 *
 * const subscription = infiniteSub.subscribe({
 *   next: (data) => console.log('Heartbeat:', data),
 * });
 *
 * // Later: cleanup
 * subscription.unsubscribe();
 * ```
 */
export function createMockInfiniteSubscription<T>(
  updates: MockSubscriptionUpdate<T>[] = []
): Observable<{ data: T }> {
  return new Observable((observer) => {
    let index = 0;
    let intervalId: NodeJS.Timeout | null = null;

    if (updates.length === 0) {
      // Just stay open forever
      return () => {};
    }

    const emitNext = () => {
      if (index < updates.length) {
        const update = updates[index];
        const delay = update.delay ?? 0;

        intervalId = setTimeout(() => {
          observer.next({ data: update.data });
          index++;
          emitNext();
        }, delay);
      }
      // After all updates, just stay open without emitting
    };

    emitNext();

    return () => {
      if (intervalId) {
        clearTimeout(intervalId);
      }
    };
  });
}

/**
 * Wait for a subscription to emit a specific number of values.
 *
 * @param observable - The observable to collect from
 * @param count - Number of emissions to collect
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to array of emitted values
 *
 * @example
 * ```ts
 * const values = await collectSubscriptionValues(mockSub, 3);
 * expect(values).toHaveLength(3);
 * ```
 */
export function collectSubscriptionValues<T>(
  observable: Observable<T>,
  count: number,
  timeout = 5000
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const values: T[] = [];

    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: Only received ${values.length} of ${count} values`));
    }, timeout);

    const subscription = observable.subscribe({
      next: (value) => {
        values.push(value);
        if (values.length >= count) {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
          resolve(values);
        }
      },
      error: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      complete: () => {
        clearTimeout(timeoutId);
        if (values.length < count) {
          reject(new Error(`Subscription completed with only ${values.length} of ${count} values`));
        } else {
          resolve(values);
        }
      },
    });
  });
}
