/**
 * useRelativeTime Hook
 * Provides relative time display that updates every second
 */
/**
 * Hook to display relative time that updates every second
 * @param timestamp - Date to display relative to now
 * @returns Formatted relative time string that updates every second
 *
 * @example
 * ```tsx
 * function Component({ lastUpdated }: { lastUpdated: Date }) {
 *   const relativeTime = useRelativeTime(lastUpdated);
 *   return <span>{relativeTime}</span>; // "Updated 5 seconds ago"
 * }
 * ```
 */
export declare function useRelativeTime(timestamp: Date | null | undefined): string;
//# sourceMappingURL=useRelativeTime.d.ts.map