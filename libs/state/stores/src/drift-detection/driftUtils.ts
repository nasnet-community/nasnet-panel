/**
 * Drift Detection Utilities
 *
 * Utility functions for drift detection including hash computation and field comparison.
 * Uses FNV-1a for fast, deterministic hashing.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

import {
  RUNTIME_ONLY_FIELDS,
  type DriftedField,
  type DriftDetectionOptions,
  DEFAULT_DRIFT_OPTIONS,
} from './types';

// =============================================================================
// FNV-1a Hash Implementation
// =============================================================================

/**
 * FNV-1a 32-bit hash constants
 * Fast, deterministic hash suitable for configuration comparison
 */
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

/**
 * Compute FNV-1a 32-bit hash of a string
 *
 * @param str - String to hash
 * @returns 32-bit hash as hex string
 */
function fnv1a32(str: string): number {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Force unsigned 32-bit integer
  return hash >>> 0;
}

/**
 * Compute configuration hash for quick drift detection
 *
 * @param config - Configuration object to hash
 * @returns Hex string hash
 */
export function computeConfigHash(config: unknown): string {
  const normalized = normalizeForComparison(config);
  const json = JSON.stringify(normalized);
  const hash = fnv1a32(json);
  return hash.toString(16).padStart(8, '0');
}

// =============================================================================
// Normalization
// =============================================================================

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
export function normalizeForComparison(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const normalized: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      const val = obj[key];
      if (val !== undefined) {
        normalized[key] = normalizeForComparison(val);
      }
    }

    return normalized;
  }

  return value;
}

// =============================================================================
// Field Exclusion
// =============================================================================

/**
 * Check if a field path should be excluded from drift comparison
 *
 * @param path - Field path (dot-separated)
 * @param excludeFields - Additional fields to exclude
 * @returns True if field should be excluded
 */
export function shouldExcludeField(
  path: string,
  excludeFields: string[] = []
): boolean {
  // Get the field name (last part of path)
  const fieldName = path.split('.').pop() ?? path;

  // Check runtime-only fields
  if (
    (RUNTIME_ONLY_FIELDS as readonly string[]).includes(fieldName) ||
    (RUNTIME_ONLY_FIELDS as readonly string[]).includes(path)
  ) {
    return true;
  }

  // Check additional exclusions
  if (excludeFields.includes(fieldName) || excludeFields.includes(path)) {
    return true;
  }

  return false;
}

/**
 * Remove excluded fields from an object
 *
 * @param obj - Object to filter
 * @param excludeFields - Additional fields to exclude
 * @param prefix - Current path prefix for nested objects
 * @returns Filtered object
 */
export function omitExcludedFields(
  obj: unknown,
  excludeFields: string[] = [],
  prefix = ''
): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      omitExcludedFields(item, excludeFields, `${prefix}[${index}]`)
    );
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (!shouldExcludeField(fieldPath, excludeFields)) {
        result[key] = omitExcludedFields(value, excludeFields, fieldPath);
      }
    }

    return result;
  }

  return obj;
}

// =============================================================================
// Field-Level Diff
// =============================================================================

/**
 * Find fields that differ between two objects
 *
 * @param config - Configuration object (desired state)
 * @param deploy - Deployment object (actual state)
 * @param options - Detection options
 * @param prefix - Current path prefix
 * @returns Array of drifted fields
 */
export function findDriftedFields(
  config: unknown,
  deploy: unknown,
  options: DriftDetectionOptions = DEFAULT_DRIFT_OPTIONS,
  prefix = ''
): DriftedField[] {
  const drifted: DriftedField[] = [];
  const excludeFields = options.excludeFields ?? [];

  // Handle null/undefined cases
  if (config === null || config === undefined) {
    if (deploy !== null && deploy !== undefined) {
      if (!shouldExcludeField(prefix || 'root', excludeFields)) {
        drifted.push({
          path: prefix || 'root',
          configValue: config,
          deployValue: deploy,
        });
      }
    }
    return drifted;
  }

  if (deploy === null || deploy === undefined) {
    if (!shouldExcludeField(prefix || 'root', excludeFields)) {
      drifted.push({
        path: prefix || 'root',
        configValue: config,
        deployValue: deploy,
      });
    }
    return drifted;
  }

  // Handle primitive types
  if (typeof config !== 'object' || typeof deploy !== 'object') {
    if (normalizeForComparison(config) !== normalizeForComparison(deploy)) {
      if (!shouldExcludeField(prefix || 'root', excludeFields)) {
        drifted.push({
          path: prefix || 'root',
          configValue: config,
          deployValue: deploy,
          category: categorizeField(prefix),
        });
      }
    }
    return drifted;
  }

  // Handle arrays
  if (Array.isArray(config) || Array.isArray(deploy)) {
    if (!Array.isArray(config) || !Array.isArray(deploy)) {
      if (!shouldExcludeField(prefix || 'root', excludeFields)) {
        drifted.push({
          path: prefix || 'root',
          configValue: config,
          deployValue: deploy,
        });
      }
      return drifted;
    }

    // Compare array lengths first
    if (config.length !== deploy.length) {
      if (!shouldExcludeField(prefix || 'root', excludeFields)) {
        drifted.push({
          path: prefix || 'root',
          configValue: config,
          deployValue: deploy,
        });
      }
      return drifted;
    }

    // Compare each element if deep compare is enabled
    if (options.deepCompare) {
      for (let i = 0; i < config.length; i++) {
        const elementPath = prefix ? `${prefix}[${i}]` : `[${i}]`;
        drifted.push(
          ...findDriftedFields(config[i], deploy[i], options, elementPath)
        );
      }
    }

    return drifted;
  }

  // Handle objects
  const configObj = config as Record<string, unknown>;
  const deployObj = deploy as Record<string, unknown>;
  const allKeys = new Set([
    ...Object.keys(configObj),
    ...Object.keys(deployObj),
  ]);

  for (const key of allKeys) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    // Skip excluded fields
    if (shouldExcludeField(fieldPath, excludeFields)) {
      continue;
    }

    const configValue = configObj[key];
    const deployValue = deployObj[key];

    if (options.deepCompare && typeof configValue === 'object' && typeof deployValue === 'object') {
      // Recursively compare nested objects
      drifted.push(
        ...findDriftedFields(configValue, deployValue, options, fieldPath)
      );
    } else {
      // Compare normalized values
      const normalizedConfig = normalizeForComparison(configValue);
      const normalizedDeploy = normalizeForComparison(deployValue);

      if (JSON.stringify(normalizedConfig) !== JSON.stringify(normalizedDeploy)) {
        drifted.push({
          path: fieldPath,
          configValue,
          deployValue,
          category: categorizeField(fieldPath),
        });
      }
    }
  }

  return drifted;
}

/**
 * Categorize a field based on its path
 */
function categorizeField(
  path: string
): 'network' | 'security' | 'general' | undefined {
  const lowerPath = path.toLowerCase();

  // Network-related fields
  if (
    lowerPath.includes('ip') ||
    lowerPath.includes('address') ||
    lowerPath.includes('subnet') ||
    lowerPath.includes('gateway') ||
    lowerPath.includes('dns') ||
    lowerPath.includes('mac') ||
    lowerPath.includes('port') ||
    lowerPath.includes('interface') ||
    lowerPath.includes('vlan')
  ) {
    return 'network';
  }

  // Security-related fields
  if (
    lowerPath.includes('key') ||
    lowerPath.includes('secret') ||
    lowerPath.includes('password') ||
    lowerPath.includes('certificate') ||
    lowerPath.includes('auth') ||
    lowerPath.includes('firewall') ||
    lowerPath.includes('allow') ||
    lowerPath.includes('deny')
  ) {
    return 'security';
  }

  return 'general';
}

// =============================================================================
// Quick Comparison
// =============================================================================

/**
 * Quick hash-based comparison to determine if drift exists
 * Use this for performance-critical checks before doing full field-level diff
 *
 * @param config - Configuration object
 * @param deploy - Deployment object
 * @param excludeFields - Fields to exclude
 * @returns True if configurations differ
 */
export function hasQuickDrift(
  config: unknown,
  deploy: unknown,
  excludeFields: string[] = []
): boolean {
  const filteredConfig = omitExcludedFields(config, excludeFields);
  const filteredDeploy = omitExcludedFields(deploy, excludeFields);

  const configHash = computeConfigHash(filteredConfig);
  const deployHash = computeConfigHash(filteredDeploy);

  return configHash !== deployHash;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if deployment layer is stale (older than threshold)
 *
 * @param appliedAt - Timestamp when deployment was applied
 * @param thresholdMs - Staleness threshold in milliseconds
 * @returns True if deployment is stale
 */
export function isDeploymentStale(
  appliedAt: string | Date | undefined | null,
  thresholdMs: number = DEFAULT_DRIFT_OPTIONS.staleThreshold
): boolean {
  if (!appliedAt) {
    return true;
  }

  const appliedDate =
    typeof appliedAt === 'string' ? new Date(appliedAt) : appliedAt;
  const now = new Date();
  const ageMs = now.getTime() - appliedDate.getTime();

  return ageMs > thresholdMs;
}

/**
 * Format a drift field value for display
 *
 * @param value - Value to format
 * @returns Formatted string
 */
export function formatDriftValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
