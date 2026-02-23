/**
 * ServiceLogViewer Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceLogViewer pattern.
 * Touch-first interface with 44px targets and simplified UI.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import { type ServiceLogViewerProps } from './useServiceLogViewer';
/**
 * Mobile presenter for ServiceLogViewer
 *
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Bottom sheet for filters and actions
 * - Simplified layout for small screens
 * - Auto-scroll support
 * - JetBrains Mono font for logs
 *
 * @description Touch-first interface with bottom sheets for filters and actions
 */
declare function ServiceLogViewerMobileComponent(props: ServiceLogViewerProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceLogViewerMobile: React.MemoExoticComponent<typeof ServiceLogViewerMobileComponent>;
export {};
//# sourceMappingURL=ServiceLogViewerMobile.d.ts.map