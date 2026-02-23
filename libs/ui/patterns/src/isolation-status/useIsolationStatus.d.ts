/**
 * useIsolationStatus Hook
 *
 * Headless hook for isolation status logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */
import type { UseIsolationStatusConfig, UseIsolationStatusReturn } from './types';
/**
 * Health-to-color mapping using semantic design tokens
 */
export declare const HEALTH_COLORS: {
    readonly healthy: "success";
    readonly warning: "warning";
    readonly critical: "destructive";
    readonly unknown: "muted";
};
/**
 * Health-to-icon mapping for lucide-react icons
 */
export declare const HEALTH_ICONS: {
    readonly healthy: "ShieldCheck";
    readonly warning: "ShieldAlert";
    readonly critical: "ShieldX";
    readonly unknown: "ShieldQuestion";
};
/**
 * Human-readable labels for isolation health
 */
export declare const HEALTH_LABELS: {
    readonly healthy: "Isolated";
    readonly warning: "Warnings detected";
    readonly critical: "Critical violations";
    readonly unknown: "Unknown status";
};
/**
 * Severity-to-color mapping
 */
export declare const SEVERITY_COLORS: {
    readonly ERROR: "destructive";
    readonly WARNING: "warning";
    readonly INFO: "muted";
};
/**
 * Layer-to-icon mapping
 */
export declare const LAYER_ICONS: Record<string, string>;
/**
 * Layer-to-label mapping
 */
export declare const LAYER_LABELS: Record<string, string>;
/**
 * Headless hook for isolation status component.
 *
 * Encapsulates all logic for:
 * - Health calculation from violations
 * - Color and icon selection
 * - Timestamp formatting
 * - Violation enrichment with display metadata
 * - Resource limit editing
 * - ARIA label generation
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useIsolationStatus({
 *   isolation: { checkedAt: '2026-02-13T10:00:00Z', violations: [], resourceLimits: {...} },
 *   instanceId: 'inst_123',
 *   routerId: 'router_456',
 *   onHealthChange: (health) => console.log('Health changed:', health),
 * });
 *
 * // state.health === 'healthy'
 * // state.color === 'success'
 * // state.ariaLabel === 'Isolated, no violations detected'
 * ```
 */
export declare function useIsolationStatus(config: UseIsolationStatusConfig): UseIsolationStatusReturn;
//# sourceMappingURL=useIsolationStatus.d.ts.map