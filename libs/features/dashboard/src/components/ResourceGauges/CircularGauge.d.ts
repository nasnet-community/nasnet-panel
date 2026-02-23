/**
 * CircularGauge Component
 * @description SVG-based circular progress indicator with threshold-based semantic coloring
 * SVG-based circular progress indicator with threshold-based coloring
 *
 * AC 5.2.3: Colors change based on configurable thresholds
 * - Supports three sizes: sm (80px), md (120px), lg (160px)
 * - Smooth 500ms transition animation
 * - WCAG AAA accessible with proper ARIA attributes
 */
/**
 * Threshold configuration for warning and critical states
 */
export interface GaugeThresholds {
    warning: number;
    critical: number;
}
/**
 * CircularGauge props
 */
export interface CircularGaugeProps {
    /** Current value (0-100) */
    value: number;
    /** Primary label (e.g., "CPU") */
    label: string;
    /** Optional secondary label (e.g., "4 cores") */
    sublabel?: string;
    /** Threshold configuration for color changes */
    thresholds?: GaugeThresholds;
    /** Gauge size */
    size?: 'sm' | 'md' | 'lg';
    /** Optional click handler */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * CircularGauge Component
 *
 * Renders a circular progress indicator with:
 * - SVG-based visual with smooth animations
 * - Threshold-based semantic coloring (green/amber/red)
 * - Full WCAG AAA accessibility support
 * - Responsive sizing
 */
export declare const CircularGauge: import("react").NamedExoticComponent<CircularGaugeProps>;
//# sourceMappingURL=CircularGauge.d.ts.map