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

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { DiagnosticsPanelDesktop } from './DiagnosticsPanelDesktop';
import { DiagnosticsPanelMobile } from './DiagnosticsPanelMobile';

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
function DiagnosticsPanelComponent(props: DiagnosticsPanelProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <DiagnosticsPanelMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <DiagnosticsPanelDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const DiagnosticsPanel = memo(DiagnosticsPanelComponent);

// Set display name for React DevTools
DiagnosticsPanel.displayName = 'DiagnosticsPanel';
