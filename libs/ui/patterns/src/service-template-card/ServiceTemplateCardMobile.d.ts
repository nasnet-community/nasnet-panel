/**
 * ServiceTemplateCard Mobile Presenter
 *
 * Mobile/Tablet-optimized presenter for ServiceTemplateCard pattern.
 * Vertical layout with large touch targets and bottom-aligned actions.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { ServiceTemplateCardProps } from './types';
/**
 * Mobile presenter for ServiceTemplateCard
 *
 * Features:
 * - Vertical layout optimized for narrow screens
 * - 44px minimum touch targets
 * - Bottom-aligned action buttons
 * - Truncated descriptions with ellipsis
 * - Prominent scope badge
 */
declare function ServiceTemplateCardMobileComponent(props: ServiceTemplateCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceTemplateCardMobile: React.MemoExoticComponent<typeof ServiceTemplateCardMobileComponent>;
export {};
//# sourceMappingURL=ServiceTemplateCardMobile.d.ts.map