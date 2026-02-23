/**
 * ResourceCard Tablet Presenter
 *
 * Tablet-optimized presenter for ResourceCard pattern.
 * Hybrid approach between mobile and desktop with balanced information density.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { BaseResource, ResourceCardProps } from './types';
/**
 * Tablet presenter for ResourceCard
 *
 * Features:
 * - Touch targets 38-44px for both touch and mouse input
 * - Balanced information density with optional collapsible details
 * - Secondary actions in dropdown (like desktop) or expandable (mobile-style)
 * - Support for both portrait and landscape orientations
 */
declare function ResourceCardTabletComponent<T extends BaseResource>(props: ResourceCardProps<T>): import("react/jsx-runtime").JSX.Element;
declare namespace ResourceCardTabletComponent {
    var displayName: string;
}
export declare const ResourceCardTablet: typeof ResourceCardTabletComponent;
export {};
//# sourceMappingURL=ResourceCard.Tablet.d.ts.map