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
import { type DependencyList } from 'react';
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
export declare function useStableCallback<T extends (...args: never[]) => unknown>(callback: T): T;
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
export declare function useStableEventHandler<E extends {
    preventDefault: () => void;
}>(handler: (event: E) => void | Promise<void>): (event: E) => void;
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
export declare function useStableCallbackWithDeps<T extends (...args: never[]) => unknown>(callback: T, deps: DependencyList): T;
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
export declare function useDebouncedCallback<T extends (...args: never[]) => unknown>(callback: T, delay: number): T;
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
export declare function useThrottledCallback<T extends (...args: never[]) => unknown>(callback: T, delay: number): T;
//# sourceMappingURL=useStableCallback.d.ts.map