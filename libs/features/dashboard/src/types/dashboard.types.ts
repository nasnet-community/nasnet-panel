/**
 * Dashboard Domain Types
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Type definitions for dashboard components following
 * the Domain-Driven Design patterns from ADR-017.
 */

/**
 * Router Health Data
 *
 * Aggregated health and status information for a single router.
 * This is the primary data contract between GraphQL queries and UI components.
 */
export interface RouterHealthData {
  /** Unique router identifier (UUID) */
  uuid: string;
  /** User-defined router name */
  name: string;
  /** Router model (e.g., "MikroTik hAP ac2") */
  model: string;
  /** RouterOS version (e.g., "7.12.1") */
  version: string;
  /** Uptime in seconds */
  uptime: number;
  /** Connection status */
  status: RouterStatus;
  /** Overall health status */
  health: HealthStatus;
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage percentage (0-100) */
  memoryUsage: number;
  /** Timestamp of last successful data update */
  lastUpdate: Date;
  /** Optional temperature in Celsius */
  temperature?: number;
}

/**
 * Router connection status
 */
export type RouterStatus = 'online' | 'offline' | 'degraded';

/**
 * Overall health status derived from metrics and alerts
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

/**
 * Semantic color mapping for health status
 */
export type HealthColor = 'green' | 'amber' | 'red';

/**
 * Cache data freshness status
 */
export type CacheStatus = 'fresh' | 'warning' | 'critical';

/**
 * Health threshold configuration
 *
 * Defines warning and critical thresholds for various metrics.
 * These values align with industry best practices and RouterOS monitoring guidelines.
 */
export interface HealthThresholds {
  cpu: {
    warning: number; // Default: 70%
    critical: number; // Default: 90%
  };
  memory: {
    warning: number; // Default: 80%
    critical: number; // Default: 95%
  };
  temperature: {
    warning: number; // Default: 60°C
    critical: number; // Default: 75°C
  };
}

/**
 * Default health thresholds
 */
export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 80, critical: 95 },
  temperature: { warning: 60, critical: 75 },
} as const;
