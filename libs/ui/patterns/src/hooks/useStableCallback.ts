/**
 * @fileoverview Stable callback hook for preventing unnecessary re-renders
 *
 * This hook ensures callback identity stays stable across renders while always
 * calling the latest version of the callback. This solves the common problem of:
 *
 * 1. useCallback with empty deps → stale closure values
 * 2. useCallback with all deps → identity changes every render
 *
 * @example
 * ```tsx
 * // Problem: onClick identity changes when count changes
 * const onClick = useCallback(() => {
 *   console.log(count); // Needs count in deps
 * }, [count]); // But this causes re-renders!
 *
 * // Solution: Stable identity, fresh values
 * const onClick = useStableCallback(() => {
 *   console.log(count); // Always has latest count
 * }); // Identity never changes
 * ```
 */

import { useCallback, useRef, useEffect, type DependencyList } from 'react';

/**
 * Creates a stable callback reference that always invokes the latest callback
 *
 * Use this when you need a callback with:
 * - Stable identity (doesn't change between renders)
 * - Access to latest closure values (no stale data)
 *
 * @param callback - The callback function
 * @returns Stable callback that always calls the latest version
 *
 * @example
 * ```tsx
 * function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
 *   const [query, setQuery] = useState('');
 *   const [debounceMs, setDebounceMs] = useState(300);
 *
 *   // Problem: useCallback would need debounceMs in deps,
 *   // causing identity to change when debounceMs changes
 *   const debouncedSearch = useStableCallback((searchQuery: string) => {
 *     setTimeout(() => onSearch(searchQuery), debounceMs);
 *   });
 *
 *   // debouncedSearch identity never changes, safe to pass to memoized children
 *   return (
 *     <MemoizedInput
 *       value={query}
 *       onChange={setQuery}
 *       onSubmit={debouncedSearch}
 *     />
 *   );
 * }
 * ```
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);

  // Update ref on every render to capture latest closure
  // This is intentionally not in useEffect to avoid timing issues
  callbackRef.current = callback;

  // Create stable wrapper that delegates to current ref
  // Empty deps array ensures stable identity
  return useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, []);
}

/**
 * Creates a stable event handler that prevents default and stops propagation
 *
 * Useful for form submissions and link clicks where you want to prevent
 * the default browser behavior consistently.
 *
 * @param handler - Handler to call after preventing default
 * @returns Stable handler with prevention built-in
 *
 * @example
 * ```tsx
 * const handleSubmit = useStableEventHandler(async (e: FormEvent) => {
 *   await submitForm(formData);
 * });
 *
 * return <form onSubmit={handleSubmit}>...</form>;
 * ```
 */
export function useStableEventHandler<E extends { preventDefault: () => void }>(
  handler: (event: E) => void | Promise<void>
): (event: E) => void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  return useCallback((event: E) => {
    event.preventDefault();
    handlerRef.current(event);
  }, []);
}

/**
 * Creates a stable callback that only changes when specified deps change
 *
 * This is a middle ground between useCallback and useStableCallback:
 * - More control than useStableCallback (can trigger updates)
 * - Less re-renders than useCallback (only updates on specified deps)
 *
 * @param callback - The callback function
 * @param deps - Dependencies that should trigger callback identity change
 * @returns Callback that only changes when deps change
 *
 * @example
 * ```tsx
 * // Only change identity when userId changes, not on every render
 * const fetchUserData = useStableCallbackWithDeps(
 *   () => {
 *     return api.fetchUser(userId, { includeProfile: showProfile });
 *   },
 *   [userId] // showProfile changes won't cause identity change
 * );
 * ```
 */
export function useStableCallbackWithDeps<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Update callback ref if deps changed
  const depsChanged =
    deps.length !== depsRef.current.length ||
    deps.some((dep, i) => !Object.is(dep, depsRef.current[i]));

  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, deps);
}

/**
 * Creates a debounced stable callback
 *
 * @param callback - The callback to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced stable callback
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => searchApi(query),
 *   300
 * );
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = callback;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

/**
 * Creates a throttled stable callback
 *
 * @param callback - The callback to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled stable callback
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottledCallback(
 *   (scrollY: number) => updateScrollPosition(scrollY),
 *   100
 * );
 *
 * useEffect(() => {
 *   const handler = () => throttledScroll(window.scrollY);
 *   window.addEventListener('scroll', handler);
 *   return () => window.removeEventListener('scroll', handler);
 * }, [throttledScroll]);
 * ```
 */
export function useThrottledCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const lastCalledRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = callback;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCalledRef.current;

      if (timeSinceLastCall >= delay) {
        lastCalledRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCalledRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [delay]
  );
}
