/**
 * MetricDisplay Mobile Presenter
 *
 * Touch-optimized presenter for mobile devices (<640px).
 * Features 44px minimum touch targets, simplified vertical layout, and reduced motion support.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */
import type { MetricDisplayProps } from './types';
/**
 * Mobile-optimized MetricDisplay presenter
 *
 * - Full-width card layout for narrow screens
 * - 44px minimum touch target for accessibility
 * - Larger text for improved readability on small screens
 * - Vertical stacking for mobile scrolling
 * - Active scale feedback for touch interaction
 */
declare function MetricDisplayMobileComponent(props: MetricDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace MetricDisplayMobileComponent {
    var displayName: string;
}
export declare const MetricDisplayMobile: import("react").MemoExoticComponent<typeof MetricDisplayMobileComponent>;
export {};
//# sourceMappingURL=MetricDisplay.Mobile.d.ts.map