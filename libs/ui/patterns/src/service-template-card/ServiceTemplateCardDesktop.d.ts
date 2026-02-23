/**
 * ServiceTemplateCard Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceTemplateCard pattern.
 * Horizontal layout with hover states and inline actions.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import type { ServiceTemplateCardProps } from './types';
/**
 * Desktop presenter for ServiceTemplateCard
 *
 * Features:
 * - Compact horizontal layout
 * - Hover states and transitions
 * - Secondary actions in dropdown menu
 * - Tooltip on description truncation
 * - Inline metadata display
 */
declare function ServiceTemplateCardDesktopComponent(props: ServiceTemplateCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceTemplateCardDesktop: React.MemoExoticComponent<typeof ServiceTemplateCardDesktopComponent>;
export {};
//# sourceMappingURL=ServiceTemplateCardDesktop.d.ts.map