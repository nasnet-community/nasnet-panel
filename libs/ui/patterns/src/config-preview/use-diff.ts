/**
 * useDiff Hook
 *
 * Computes a line-by-line diff between two scripts.
 * Uses a simple but effective line-matching algorithm.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import { useMemo } from 'react';

import type { DiffLine, UseDiffConfig, UseDiffReturn } from './config-preview.types';

/**
 * Compute the Longest Common Subsequence (LCS) of two arrays of lines
 * This is used to determine which lines are unchanged between old and new
 */
function computeLCS(oldLines: string[], newLines: string[]): Set<string> {
  const m = oldLines.length;
  const n = newLines.length;

  // Create DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  // Fill the DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS elements
  const lcsSet = new Set<string>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      lcsSet.add(`${i - 1}:${j - 1}:${oldLines[i - 1]}`);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcsSet;
}

/**
 * Compute diff between two scripts using Myers-like diff algorithm
 */
function computeDiff(oldScript: string, newScript: string): DiffLine[] {
  const oldLines = oldScript.split('\n');
  const newLines = newScript.split('\n');

  // Handle edge cases
  if (oldScript === newScript) {
    return oldLines.map((content, index) => ({
      type: 'unchanged' as const,
      content,
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
    }));
  }

  if (oldScript === '') {
    return newLines.map((content, index) => ({
      type: 'added' as const,
      content,
      newLineNumber: index + 1,
    }));
  }

  if (newScript === '') {
    return oldLines.map((content, index) => ({
      type: 'removed' as const,
      content,
      oldLineNumber: index + 1,
    }));
  }

  // Compute LCS to find matching lines
  const lcsSet = computeLCS(oldLines, newLines);

  // Create maps for quick lookup
  const lcsOldIndices = new Map<number, number>();
  const lcsNewIndices = new Map<number, number>();
  for (const entry of lcsSet) {
    const [oldIdx, newIdx] = entry.split(':').map(Number);
    lcsOldIndices.set(oldIdx, newIdx);
    lcsNewIndices.set(newIdx, oldIdx);
  }

  // Build diff result
  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    // Check if current positions are part of LCS
    const oldInLcs = lcsOldIndices.has(oldIdx) && lcsOldIndices.get(oldIdx) === newIdx;
    const newInLcs = lcsNewIndices.has(newIdx) && lcsNewIndices.get(newIdx) === oldIdx;

    if (oldInLcs && newInLcs) {
      // Lines match - unchanged
      result.push({
        type: 'unchanged',
        content: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else if (oldIdx < oldLines.length && !lcsOldIndices.has(oldIdx)) {
      // Old line not in LCS - removed
      result.push({
        type: 'removed',
        content: oldLines[oldIdx],
        oldLineNumber: oldIdx + 1,
      });
      oldIdx++;
    } else if (newIdx < newLines.length && !lcsNewIndices.has(newIdx)) {
      // New line not in LCS - added
      result.push({
        type: 'added',
        content: newLines[newIdx],
        newLineNumber: newIdx + 1,
      });
      newIdx++;
    } else {
      // Handle remaining edge cases
      if (oldIdx < oldLines.length) {
        result.push({
          type: 'removed',
          content: oldLines[oldIdx],
          oldLineNumber: oldIdx + 1,
        });
        oldIdx++;
      }
      if (newIdx < newLines.length) {
        result.push({
          type: 'added',
          content: newLines[newIdx],
          newLineNumber: newIdx + 1,
        });
        newIdx++;
      }
    }
  }

  return result;
}

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
export function useDiff({ oldScript, newScript }: UseDiffConfig): UseDiffReturn {
  return useMemo(() => {
    const diffLines = computeDiff(oldScript, newScript);

    const addedCount = diffLines.filter((l) => l.type === 'added').length;
    const removedCount = diffLines.filter((l) => l.type === 'removed').length;
    const unchangedCount = diffLines.filter((l) => l.type === 'unchanged').length;
    const hasDiff = addedCount > 0 || removedCount > 0;

    return {
      diffLines,
      addedCount,
      removedCount,
      unchangedCount,
      hasDiff,
    };
  }, [oldScript, newScript]);
}
