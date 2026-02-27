/**
 * Drift Detection Utilities
 *
 * Utility functions for drift detection including hash computation and field comparison.
 * Uses FNV-1a for fast, deterministic hashing.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */
import { type DriftedField, type DriftDetectionOptions } from './types';
/**
 * Compute configuration hash for quick drift detection
 *
 * @param config - Configuration object to hash
 * @returns Hex string hash
 */
export declare function computeConfigHash(config: unknown): string;
/**
 * Normalize an object for comparison by:
 * 1. Sorting object keys alphabetically
 * 2. Removing undefined values
 * 3. Converting dates to ISO strings
 * 4. Handling nested objects/arrays recursively
 *
 * @param value - Value to normalize
 * @returns Normalized value
 */
export declare function normalizeForComparison(value: unknown): unknown;
/**
 * Check if a field path should be excluded from drift comparison
 *
 * @param path - Field path (dot-separated)
 * @param excludeFields - Additional fields to exclude
 * @returns True if field should be excluded
 */
export declare function shouldExcludeField(path: string, excludeFields?: string[]): boolean;
/**
 * Remove excluded fields from an object
 *
 * @param obj - Object to filter
 * @param excludeFields - Additional fields to exclude
 * @param prefix - Current path prefix for nested objects
 * @returns Filtered object
 */
export declare function omitExcludedFields(
  obj: unknown,
  excludeFields?: string[],
  prefix?: string
): unknown;
/**
 * Find fields that differ between two objects
 *
 * @param config - Configuration object (desired state)
 * @param deploy - Deployment object (actual state)
 * @param options - Detection options
 * @param prefix - Current path prefix
 * @returns Array of drifted fields
 */
export declare function findDriftedFields(
  config: unknown,
  deploy: unknown,
  options?: DriftDetectionOptions,
  prefix?: string
): DriftedField[];
/**
 * Quick hash-based comparison to determine if drift exists
 * Use this for performance-critical checks before doing full field-level diff
 *
 * @param config - Configuration object
 * @param deploy - Deployment object
 * @param excludeFields - Fields to exclude
 * @returns True if configurations differ
 */
export declare function hasQuickDrift(
  config: unknown,
  deploy: unknown,
  excludeFields?: string[]
): boolean;
/**
 * Check if deployment layer is stale (older than threshold)
 *
 * @param appliedAt - Timestamp when deployment was applied
 * @param thresholdMs - Staleness threshold in milliseconds
 * @returns True if deployment is stale
 */
export declare function isDeploymentStale(
  appliedAt: string | Date | undefined | null,
  thresholdMs?: number
): boolean;
/**
 * Format a drift field value for display
 *
 * @param value - Value to format
 * @returns Formatted string
 */
export declare function formatDriftValue(value: unknown): string;
//# sourceMappingURL=driftUtils.d.ts.map
