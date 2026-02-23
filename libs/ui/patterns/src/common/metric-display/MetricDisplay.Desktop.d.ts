/**
 * MetricDisplay Desktop Presenter
 *
 * Optimized for desktop (>1024px) with hover states, denser layout, and full details visibility.
 * Supports keyboard navigation and mouse interaction with comprehensive accessibility.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */
import type { MetricDisplayProps } from './types';
/**
 * Desktop-optimized MetricDisplay presenter
 *
 * - Compact card layout with semantic design tokens
 * - Hover states for mouse users
 * - Horizontal trend layout for quick scanning
 * - Full keyboard navigation support (Enter/Space)
 * - Responsive focus indicators (3px ring offset)
 */
declare function MetricDisplayDesktopComponent(props: MetricDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace MetricDisplayDesktopComponent {
    var displayName: string;
}
export declare const MetricDisplayDesktop: import("react").MemoExoticComponent<typeof MetricDisplayDesktopComponent>;
export {};
//# sourceMappingURL=MetricDisplay.Desktop.d.ts.map