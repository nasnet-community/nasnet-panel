/**
 * ResourceCard Desktop Presenter
 *
 * Desktop-optimized presenter for ResourceCard pattern.
 * Optimized for mouse interaction with hover states and dense layout.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { BaseResource, ResourceCardProps } from './types';
/**
 * Desktop presenter for ResourceCard
 *
 * Features:
 * - Dense information display
 * - Hover states for interactive feedback
 * - Dropdown menu for secondary actions
 * - Inline primary action button
 */
declare function ResourceCardDesktopComponent<T extends BaseResource>(props: ResourceCardProps<T>): import("react/jsx-runtime").JSX.Element;
declare namespace ResourceCardDesktopComponent {
    var displayName: string;
}
export declare const ResourceCardDesktop: typeof ResourceCardDesktopComponent;
export {};
//# sourceMappingURL=ResourceCard.Desktop.d.ts.map