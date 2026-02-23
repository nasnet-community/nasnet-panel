/**
 * Dashboard Domain Types
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Type definitions for dashboard components following
 * the Domain-Driven Design patterns from ADR-017.
 *
 * These types define the data contracts between:
 * - GraphQL queries (backend response structure)
 * - Dashboard components (UI layer consumption)
 * - State management (Zustand stores, caching)
 *
 * All types use semantic naming and include comprehensive JSDoc
 * to ensure team understanding and IDE autocomplete documentation.
 */
/**
 * Router Health Data
 *
 * Aggregated health and status information for a single router.
 * This is the primary data contract between GraphQL queries and UI components.
 *
 * Derived from Layer 4 (Runtime) metrics in the 8-layer Universal State v2 model:
 * - Real-time operational data from the running router
 * - Updated via GraphQL subscriptions or 2s polling fallback
 * - Used to populate dashboard gauges, status badges, and health indicators
 *
 * @see Universal State v2 (Docs/architecture/data-architecture.md)
 * @see ADR-017: Three-Layer Component Architecture
 */
export interface RouterHealthData {
    /** Unique router identifier (UUID v4 format), stable across reboots */
    uuid: string;
    /** User-defined router name (1-64 chars, editable in settings) */
    name: string;
    /** Router hardware model string (e.g., "MikroTik hAP ac2", "CCR1009") */
    model: string;
    /** RouterOS version string (e.g., "7.12.1", semantic versioning) */
    version: string;
    /** Uptime in seconds since last reboot (0+ integer) */
    uptime: number;
    /** Current connection status: online/offline/degraded */
    status: RouterStatus;
    /** Aggregated health status: healthy/warning/critical */
    health: HealthStatus;
    /** CPU usage percentage (0-100 integer, real-time) */
    cpuUsage: number;
    /** Memory usage percentage (0-100 integer, real-time) */
    memoryUsage: number;
    /** ISO 8601 timestamp of last successful data update from GraphQL */
    lastUpdate: Date;
    /** Optional CPU temperature in Celsius (integer), may be undefined if sensor unavailable */
    temperature?: number;
}
/**
 * Router connection status enumeration
 *
 * @see Design System - Semantic Status Colors (DESIGN_TOKENS.md)
 *
 * - **online** (green): Actively connected, responding to queries, fully operational
 * - **offline** (gray): No connection, cached data shown with stale badge, mutations disabled
 * - **degraded** (amber): Responding but slow/intermittent, mutations allowed with caution
 */
export type RouterStatus = 'online' | 'offline' | 'degraded';
/**
 * Overall health status derived from metrics and active alerts
 *
 * Computed from:
 * - CPU usage vs thresholds (DEFAULT_HEALTH_THRESHOLDS.cpu)
 * - Memory usage vs thresholds (DEFAULT_HEALTH_THRESHOLDS.memory)
 * - Temperature vs thresholds if sensor available
 * - Active alert count and severity
 *
 * @see Design System - Semantic Status Colors (DESIGN_TOKENS.md)
 *
 * - **healthy** (green): All metrics below warning thresholds, no active critical alerts
 * - **warning** (amber): Any metric between warning/critical, or 1+ medium-severity alerts
 * - **critical** (red): Any metric above critical threshold, or 1+ high-severity alerts
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';
/**
 * Semantic color mapping for health status values
 *
 * Used by StatusBadge, ResourceGauge, and other color-coordinated components.
 * Ensures consistency across all health-related UI elements.
 *
 * - **green**: Healthy/Online/Success/Valid state
 * - **amber**: Warning/Pending/Degraded state
 * - **red**: Critical/Offline/Error/Invalid state
 */
export type HealthColor = 'green' | 'amber' | 'red';
/**
 * Cache data freshness status
 *
 * Used by offline indicator components (CachedDataBadge) to communicate
 * how stale the displayed data is relative to last successful sync.
 *
 * Thresholds:
 * - **fresh** (<1 minute): Data synced recently, fully functional
 * - **warning** (1-5 minutes): Weak connection, operations slower, data may be slightly stale
 * - **critical** (>5 minutes): No recent sync, mutations disabled, data significantly stale
 *
 * @see CachedDataBadge (libs/features/dashboard/src/components/cached-data-badge)
 */
export type CacheStatus = 'fresh' | 'warning' | 'critical';
/**
 * Health threshold configuration for determining status
 *
 * Defines warning and critical thresholds for resource metrics.
 * These values align with RouterOS design patterns and industry best practices
 * for embedded networking appliances.
 *
 * Thresholds applied in health status computation logic
 * (Docs/architecture/data-architecture.md, Layer 4 computation).
 *
 * These defaults assume typical MikroTik deployments with:
 * - CPU cores: 2-8
 * - RAM: 256MB-2GB
 * - Typical ambient operating: 20-30°C, peak: 40-50°C
 */
export interface HealthThresholds {
    /** CPU usage thresholds (percentage of single core capacity) */
    cpu: {
        /** CPU usage threshold at which to show warning badge (default: 70%) */
        warning: number;
        /** CPU usage threshold at which to show critical/error badge (default: 90%) */
        critical: number;
    };
    /** Memory usage thresholds (percentage of total installed) */
    memory: {
        /** Memory usage threshold at which to show warning badge (default: 80%) */
        warning: number;
        /** Memory usage threshold at which to show critical/error badge (default: 95%) */
        critical: number;
    };
    /** CPU temperature thresholds (Celsius, if sensor available) */
    temperature: {
        /** Temperature at which to show warning badge (default: 60°C) */
        warning: number;
        /** Temperature at which to show critical/error badge (default: 75°C) */
        critical: number;
    };
}
/**
 * Default health thresholds
 *
 * Used by dashboard health status computation and resource gauge components.
 * Override per-router via router settings if needed for special deployments.
 *
 * These defaults are conservative and suitable for 24/7 operation:
 * - CPU: Warn at 70%, critical at 90% to leave headroom for spikes
 * - Memory: Warn at 80%, critical at 95% (memory-constrained routers)
 * - Temperature: Warn at 60°C (mid-range), critical at 75°C (high-temp limit)
 *
 * @constant
 * @readonly
 */
export declare const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds;
//# sourceMappingURL=dashboard.types.d.ts.map