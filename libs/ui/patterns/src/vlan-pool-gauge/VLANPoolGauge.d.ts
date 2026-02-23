/**
 * VLANPoolGauge Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Displays VLAN pool utilization with color-coded visual feedback.
 *
 * @example
 * ```tsx
 * <VLANPoolGauge
 *   total={1000}
 *   allocated={750}
 *   shouldWarn={false}
 * />
 * ```
 */
export interface VLANPoolGaugeProps {
    /** Total number of VLANs in pool */
    total: number;
    /** Number of allocated VLANs */
    allocated: number;
    /** Whether to show warning indicator (>80% utilization) */
    shouldWarn: boolean;
    /** Optional className for additional styling */
    className?: string;
}
/**
 * VLANPoolGauge - Circular progress indicator for VLAN pool utilization
 *
 * Color coding:
 * - Green: <70% utilization
 * - Amber: 70-90% utilization
 * - Red: >90% utilization
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Larger gauge with simplified layout
 * - Tablet/Desktop (>=640px): Compact gauge with detailed stats
 */
declare function VLANPoolGaugeComponent(props: VLANPoolGaugeProps): import("react/jsx-runtime").JSX.Element;
export declare const VLANPoolGauge: import("react").MemoExoticComponent<typeof VLANPoolGaugeComponent>;
export {};
//# sourceMappingURL=VLANPoolGauge.d.ts.map