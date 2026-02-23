/**
 * DiagnosticsPanel Desktop Presenter
 *
 * Desktop-optimized presenter for DiagnosticsPanel pattern.
 * Displays diagnostic test results with pass/fail indicators.
 * Provides full details visibility with expandable test results.
 *
 * @description
 * Features:
 * - Pass/fail indicators with color coding
 * - Expandable test result details
 * - Progress bar during test execution
 * - Startup failure alerts
 * - Diagnostic history
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import { type DiagnosticsPanelProps } from './useDiagnosticsPanel';
/**
 * DiagnosticsPanelDesktop component
 *
 * @description
 * Desktop presenter for DiagnosticsPanel with full detail visibility.
 * Displays test results in expandable collapsibles with complete metadata.
 * Shows startup failure alerts and historical diagnostic runs.
 *
 * @param props - Component props
 * @returns Rendered desktop diagnostics panel
 */
declare function DiagnosticsPanelDesktopComponent(props: DiagnosticsPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const DiagnosticsPanelDesktop: React.MemoExoticComponent<typeof DiagnosticsPanelDesktopComponent>;
export {};
//# sourceMappingURL=DiagnosticsPanelDesktop.d.ts.map