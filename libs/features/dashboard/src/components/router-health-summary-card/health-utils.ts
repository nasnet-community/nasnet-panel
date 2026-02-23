/**
 * Health Calculation Utilities
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Pure functions for computing router health status from metrics.
 * These utilities follow the health threshold algorithm specified in Dev Notes.
 *
 * @see Story 5.1 Dev Notes: Health Calculation Algorithm
 */

import type {
  RouterHealthData,
  HealthStatus,
  HealthColor,
  HealthThresholds,
} from '../../types/dashboard.types';
import { DEFAULT_HEALTH_THRESHOLDS } from '../../types/dashboard.types';

/**
 * Compute overall health status from router metrics
 *
 * Algorithm (priority-ordered):
 * 1. Critical if router offline
 * 2. Critical if any metric >= critical threshold
 * 3. Warning if any metric >= warning threshold
 * 4. Warning if router degraded
 * 5. Healthy otherwise
 *
 * @param router - Router health data
 * @param thresholds - Custom thresholds (optional, uses defaults if not provided)
 * @returns Computed health status
 *
 * @example
 * ```ts
 * const health = computeHealthStatus({
 *   status: 'online',
 *   cpuUsage: 85,
 *   memoryUsage: 60,
 *   temperature: 55,
 * });
 * // Returns: 'warning' (CPU at 85% exceeds 70% warning threshold)
 * ```
 */
export function computeHealthStatus(
  router: Pick<RouterHealthData, 'status' | 'cpuUsage' | 'memoryUsage' | 'temperature'>,
  thresholds: HealthThresholds = DEFAULT_HEALTH_THRESHOLDS
): HealthStatus {
  // Critical: Router offline
  if (router.status === 'offline') {
    return 'critical';
  }

  // Critical: CPU usage >= critical threshold
  if (router.cpuUsage >= thresholds.cpu.critical) {
    return 'critical';
  }

  // Critical: Memory usage >= critical threshold
  if (router.memoryUsage >= thresholds.memory.critical) {
    return 'critical';
  }

  // Critical: Temperature >= critical threshold (if available)
  if (router.temperature !== undefined && router.temperature >= thresholds.temperature.critical) {
    return 'critical';
  }

  // Warning: CPU usage >= warning threshold
  if (router.cpuUsage >= thresholds.cpu.warning) {
    return 'warning';
  }

  // Warning: Memory usage >= warning threshold
  if (router.memoryUsage >= thresholds.memory.warning) {
    return 'warning';
  }

  // Warning: Temperature >= warning threshold (if available)
  if (router.temperature !== undefined && router.temperature >= thresholds.temperature.warning) {
    return 'warning';
  }

  // Warning: Router in degraded state
  if (router.status === 'degraded') {
    return 'warning';
  }

  // Healthy: All metrics within normal range
  return 'healthy';
}

/**
 * Get semantic color for health status
 *
 * Maps health status to traffic-light color semantics:
 * - healthy → green (#22C55E)
 * - warning → amber (#F59E0B)
 * - critical → red (#EF4444)
 *
 * @param status - Health status
 * @returns Semantic color name (maps to design tokens)
 */
export function getHealthColor(status: HealthStatus): HealthColor {
  const colorMap: Record<HealthStatus, HealthColor> = {
    healthy: 'green',
    warning: 'amber',
    critical: 'red',
  };
  return colorMap[status];
}

/**
 * Get Tailwind CSS class for health status background
 *
 * Uses semantic color tokens (NOT primitive colors).
 * This ensures proper theme support and accessibility compliance.
 *
 * @param status - Health status
 * @returns Tailwind CSS class string
 */
export function getHealthBgClass(status: HealthStatus): string {
  const classMap: Record<HealthStatus, string> = {
    healthy: 'bg-semantic-success',
    warning: 'bg-semantic-warning',
    critical: 'bg-semantic-error',
  };
  return classMap[status];
}

/**
 * Get Tailwind CSS class for health status text
 *
 * @param status - Health status
 * @returns Tailwind CSS class string
 */
export function getHealthTextClass(status: HealthStatus): string {
  const classMap: Record<HealthStatus, string> = {
    healthy: 'text-semantic-success',
    warning: 'text-semantic-warning',
    critical: 'text-semantic-error',
  };
  return classMap[status];
}

/**
 * Format uptime seconds to human-readable string
 *
 * @description Converts seconds to human-readable format with days, hours, or minutes.
 * Uses font-variant-numeric: tabular-nums for proper alignment in data columns.
 *
 * Format rules:
 * - >1 day: "Xd Yh" (e.g., "14d 6h")
 * - >1 hour: "Xh Ym" (e.g., "6h 30m")
 * - <1 hour: "Xm" (e.g., "45m")
 *
 * @param seconds - Uptime in seconds
 * @returns Formatted uptime string
 *
 * @example
 * ```ts
 * formatUptime(1209600) // "14d 0h"
 * formatUptime(23400)   // "6h 30m"
 * formatUptime(2700)    // "45m"
 * ```
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) return '0m';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Calculate cache age in minutes
 *
 * @description Computes time elapsed since last update in minutes (rounded down).
 *
 * @param lastUpdate - Timestamp of last data update
 * @returns Age in minutes (rounded down)
 */
export function getCacheAgeMinutes(lastUpdate: Date): number {
  const now = Date.now();
  const ageMs = now - lastUpdate.getTime();
  return Math.floor(ageMs / 60000);
}

/**
 * Determine if cached data is stale
 *
 * @description Categorizes cache age into staleness levels for UI feedback.
 *
 * Staleness thresholds:
 * - fresh: <1 minute
 * - warning: 1-5 minutes
 * - critical: >5 minutes
 *
 * @param ageMinutes - Cache age in minutes
 * @returns Cache status
 */
export function getCacheStatus(ageMinutes: number): 'fresh' | 'warning' | 'critical' {
  if (ageMinutes < 1) return 'fresh';
  if (ageMinutes <= 5) return 'warning';
  return 'critical';
}

/**
 * Check if data is too stale for mutations
 *
 * @description Determines if mutations should be disabled based on cache age.
 * Mutations (configuration changes) should be disabled if cache is >5 minutes old
 * to prevent applying changes based on outdated router state.
 *
 * @param ageMinutes - Cache age in minutes
 * @returns True if mutations should be disabled
 */
export function shouldDisableMutations(ageMinutes: number): boolean {
  return ageMinutes > 5;
}
