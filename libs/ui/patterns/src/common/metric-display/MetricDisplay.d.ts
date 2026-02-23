/**
 * MetricDisplay Component
 *
 * Auto-detecting wrapper that renders the appropriate presenter
 * based on the current platform (mobile/desktop).
 *
 * @see ADR-018 for Headless + Presenter architecture
 *
 * @example
 * ```tsx
 * import { MetricDisplay } from '@nasnet/ui/patterns';
 * import { Cpu } from 'lucide-react';
 *
 * // Basic usage
 * <MetricDisplay
 *   label="CPU Usage"
 *   value={85}
 *   unit="%"
 * />
 *
 * // With trend and icon
 * <MetricDisplay
 *   label="Memory"
 *   value={512}
 *   unit="MB"
 *   icon={Cpu}
 *   variant="warning"
 *   trend="up"
 *   trendValue="+15%"
 *   onClick={() => navigate('/system/memory')}
 * />
 *
 * // Loading state
 * <MetricDisplay
 *   label="Network Traffic"
 *   value={0}
 *   isLoading
 * />
 * ```
 */
import type { MetricDisplayProps } from './types';
/**
 * MetricDisplay - Platform-adaptive metric display
 *
 * Displays a key metric with label, value, optional unit, trend, and icon.
 * Automatically selects the appropriate presenter based on device.
 *
 * Supports manual presenter override via the `presenter` prop for testing
 * or special layout scenarios (not recommended for production).
 *
 * Use cases:
 * - Dashboard KPIs (CPU, memory, bandwidth)
 * - Statistics cards
 * - Counter displays
 * - Performance metrics
 */
declare function MetricDisplayComponent(props: MetricDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace MetricDisplayComponent {
    var displayName: string;
}
export declare const MetricDisplay: import("react").MemoExoticComponent<typeof MetricDisplayComponent>;
export {};
//# sourceMappingURL=MetricDisplay.d.ts.map