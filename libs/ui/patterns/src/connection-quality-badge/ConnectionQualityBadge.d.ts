/**
 * Connection Quality Badge Component
 *
 * Displays connection quality metrics (latency, signal strength).
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
export type QualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unknown';
export interface ConnectionQualityBadgeProps {
    /**
     * Show latency value
     * @default true
     */
    showLatency?: boolean;
    /**
     * Show quality icon
     * @default true
     */
    showIcon?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Size variant
     * @default 'default'
     */
    size?: 'sm' | 'default' | 'lg';
}
/**
 * Connection Quality Badge
 *
 * Shows connection quality with optional latency display.
 * Auto-updates based on connection store state.
 *
 * @example
 * ```tsx
 * // Default with latency and icon
 * <ConnectionQualityBadge />
 *
 * // Latency only
 * <ConnectionQualityBadge showIcon={false} />
 *
 * // Icon only
 * <ConnectionQualityBadge showLatency={false} />
 *
 * // Small size
 * <ConnectionQualityBadge size="sm" />
 * ```
 */
export declare const ConnectionQualityBadge: import("react").NamedExoticComponent<ConnectionQualityBadgeProps>;
/**
 * Hook for custom quality badge implementations
 */
export declare function useConnectionQuality(): {
    quality: QualityLevel;
    latencyMs: number | null;
    latencyQuality: "moderate" | "good" | "poor" | null;
    isConnected: boolean;
    label: string;
    color: string;
};
//# sourceMappingURL=ConnectionQualityBadge.d.ts.map