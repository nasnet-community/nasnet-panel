/**
 * ResourceCard Mobile Presenter
 *
 * Mobile-optimized presenter for ResourceCard pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { BaseResource, ResourceCardProps } from './types';
/**
 * Mobile presenter for ResourceCard
 *
 * Features:
 * - Large touch targets (44px minimum)
 * - Single column layout
 * - Primary action as full-width button
 * - Tap to expand for details
 */
declare function ResourceCardMobileComponent<T extends BaseResource>(props: ResourceCardProps<T>): import("react/jsx-runtime").JSX.Element;
declare namespace ResourceCardMobileComponent {
    var displayName: string;
}
export declare const ResourceCardMobile: typeof ResourceCardMobileComponent;
export {};
//# sourceMappingURL=ResourceCard.Mobile.d.ts.map