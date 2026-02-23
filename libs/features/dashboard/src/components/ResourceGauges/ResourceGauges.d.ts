/**
 * ResourceGauges Component
 * @description Real-time resource utilization gauges with threshold-based coloring
 * Displays CPU, Memory, Storage, and Temperature with responsive layout
 *
 * AC 5.2.1: Real-time resource gauges for CPU, Memory, Storage, Temperature
 * AC 5.2.3: Colors change based on configurable thresholds
 * AC 5.2.4: Click CPU gauge to see per-core breakdown
 * AC 5.2.5: Temperature gauge hidden if not supported
 *
 * Pattern: Headless + Platform Presenters (ADR-018)
 * - useResourceMetrics: Headless data hook
 * - ResourceGaugesDesktop: Desktop presenter (4-column grid)
 * - ResourceGaugesMobile: Mobile presenter (2x2 grid)
 */
/**
 * ResourceGauges props
 */
export interface ResourceGaugesProps {
    /** Router device ID */
    deviceId: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * ResourceGauges Main Component
 * Auto-detects platform and delegates to appropriate presenter
 *
 * Pattern: Headless + Platform Presenters (ADR-018)
 */
export declare const ResourceGauges: {
    (props: ResourceGaugesProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=ResourceGauges.d.ts.map