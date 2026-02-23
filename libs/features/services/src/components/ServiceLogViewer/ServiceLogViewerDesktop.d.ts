/**
 * ServiceLogViewer Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceLogViewer pattern.
 * Features virtual scrolling with @tanstack/react-virtual for performance.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import { type ServiceLogViewerProps } from './useServiceLogViewer';
/**
 * Desktop presenter for ServiceLogViewer
 *
 * Features:
 * - Virtual scrolling with @tanstack/react-virtual
 * - Searchable with live filtering
 * - Log level filtering with counts
 * - Auto-scroll toggle
 * - Copy to clipboard
 * - JetBrains Mono font for logs
 *
 * @description High-performance presenter with virtual scrolling for 1000+ log lines
 */
declare function ServiceLogViewerDesktopComponent(props: ServiceLogViewerProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceLogViewerDesktop: React.MemoExoticComponent<typeof ServiceLogViewerDesktopComponent>;
export {};
//# sourceMappingURL=ServiceLogViewerDesktop.d.ts.map