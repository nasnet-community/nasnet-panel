/**
 * MetricDisplay Tablet Presenter
 *
 * Balanced layout optimized for tablets (640–1024px) with both touch and mouse support.
 * Combines aspects of mobile (touch-friendly) and desktop (more details) presenters.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */
import type { MetricDisplayProps } from './types';
/**
 * Tablet-optimized MetricDisplay presenter
 *
 * - Balanced card layout (between mobile and desktop)
 * - 40–44px minimum touch target for tablet interaction
 * - Hover states for mouse users
 * - Horizontal trend layout (like desktop)
 * - Improved readability with medium sizing
 */
declare function MetricDisplayTabletComponent(props: MetricDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace MetricDisplayTabletComponent {
    var displayName: string;
}
export declare const MetricDisplayTablet: import("react").MemoExoticComponent<typeof MetricDisplayTabletComponent>;
export {};
//# sourceMappingURL=MetricDisplay.Tablet.d.ts.map