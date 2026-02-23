/**
 * DiagnosticsPanel Mobile Presenter
 *
 * Mobile-optimized presenter for DiagnosticsPanel pattern.
 * Touch-first interface with 44px targets and simplified layout.
 *
 * @description
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Expandable accordions for test details
 * - Simplified layout for small screens
 * - Progress indicator during execution
 * - Startup failure alerts
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import { type DiagnosticsPanelProps } from './useDiagnosticsPanel';
/**
 * DiagnosticsPanelMobile component
 *
 * @description
 * Mobile presenter for DiagnosticsPanel with touch-optimized interface.
 * Uses accordions for test details with 44px touch targets.
 * Simplified layout for small screens with progressive disclosure.
 *
 * @param props - Component props
 * @returns Rendered mobile diagnostics panel
 */
declare function DiagnosticsPanelMobileComponent(props: DiagnosticsPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const DiagnosticsPanelMobile: React.MemoExoticComponent<typeof DiagnosticsPanelMobileComponent>;
export {};
//# sourceMappingURL=DiagnosticsPanelMobile.d.ts.map