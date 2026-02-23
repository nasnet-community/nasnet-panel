/**
 * DiagnosticsPanel Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @description Displays diagnostic test results with pass/fail indicators and manual test controls
 * @see NAS-8.12: Service Logs & Diagnostics
 *
 * @example
 * ```tsx
 * <DiagnosticsPanel
 *   routerId="router-1"
 *   instanceId="instance-123"
 *   serviceName="tor"
 *   maxHistory={10}
 *   onDiagnosticsComplete={(results) => console.log(results)}
 * />
 * ```
 */
import type { DiagnosticsPanelProps } from './useDiagnosticsPanel';
/**
 * DiagnosticsPanel - Displays diagnostic test results with execution controls
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with 44px targets and accordions
 * - Tablet/Desktop (≥640px): Dense layout with expandable collapsibles
 *
 * Features:
 * - Display diagnostic history with pass/fail indicators
 * - Run manual diagnostics with progress tracking
 * - Show startup failure alerts
 * - Real-time progress updates
 * - Expandable test details
 */
declare function DiagnosticsPanelComponent(props: DiagnosticsPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const DiagnosticsPanel: import("react").MemoExoticComponent<typeof DiagnosticsPanelComponent>;
export {};
//# sourceMappingURL=DiagnosticsPanel.d.ts.map