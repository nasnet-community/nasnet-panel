/**
 * useDiff Hook
 *
 * Computes a line-by-line diff between two scripts.
 * Uses a simple but effective line-matching algorithm.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */
import type { UseDiffConfig, UseDiffReturn } from './config-preview.types';
/**
 * Hook for computing diff between two scripts
 *
 * Uses a Longest Common Subsequence (LCS) algorithm for accurate
 * line-by-line diff computation with correct line number tracking.
 *
 * @param config - Configuration with old and new scripts
 * @returns Diff lines and statistics
 *
 * @example
 * ```tsx
 * const { diffLines, hasDiff, addedCount, removedCount } = useDiff({
 *   oldScript: previousConfig,
 *   newScript: currentConfig,
 * });
 *
 * if (hasDiff) {
 *   return <DiffView lines={diffLines} />;
 * }
 * ```
 */
export declare function useDiff({ oldScript, newScript }: UseDiffConfig): UseDiffReturn;
//# sourceMappingURL=use-diff.d.ts.map