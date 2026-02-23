/**
 * ResourceBudgetPanel Component
 *
 * Displays system-wide and per-instance resource budgets with platform-adaptive presentation.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Features:
 * - System totals overview
 * - Per-instance breakdown
 * - Sortable columns (desktop)
 * - Threshold-based status indicators
 * - Mobile: Card-based layout with collapsible details
 * - Desktop: Dense data table with inline usage bars
 * - WCAG AAA accessible
 */

import React from 'react';

import { ResourceBudgetPanelDesktop } from './ResourceBudgetPanelDesktop';
import { ResourceBudgetPanelMobile } from './ResourceBudgetPanelMobile';

import type { ResourceBudgetPanelProps } from './types';

/**
 * ResourceBudgetPanel Component
 *
 * Shows system-wide and per-instance resource usage and budgets.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * **Features:**
 * - System totals with usage bar and instance counts
 * - Per-instance breakdown with memory usage, limits, and status
 * - Sortable by: name, status, memory used, memory limit, usage %
 * - Mobile: Cards with expandable details
 * - Desktop: Sortable data table
 *
 * **Accessibility:**
 * - Semantic HTML (table for desktop, cards for mobile)
 * - Keyboard navigation (sortable headers)
 * - ARIA labels for status badges and usage bars
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * const instances: ServiceInstanceResource[] = [
 *   {
 *     id: '1',
 *     name: 'Tor',
 *     memoryUsed: 64,
 *     memoryLimit: 128,
 *     status: 'running',
 *   },
 *   {
 *     id: '2',
 *     name: 'Xray',
 *     memoryUsed: 32,
 *     memoryLimit: 64,
 *     status: 'running',
 *   },
 * ];
 *
 * const systemTotals: SystemResourceTotals = {
 *   totalMemoryUsed: 96,
 *   totalMemoryAvailable: 512,
 *   runningInstances: 2,
 *   stoppedInstances: 0,
 * };
 *
 * <ResourceBudgetPanel
 *   instances={instances}
 *   systemTotals={systemTotals}
 *   onInstanceClick={(instance) => console.log('Clicked:', instance.name)}
 * />
 * ```
 */
export const ResourceBudgetPanel = React.memo(function ResourceBudgetPanel(
  props: ResourceBudgetPanelProps
) {
  const { variant } = props;

  // Determine which presenter to use
  if (variant === 'mobile') {
    return <ResourceBudgetPanelMobile {...props} />;
  }

  if (variant === 'desktop') {
    return <ResourceBudgetPanelDesktop {...props} />;
  }

  // Auto-detect: mobile on small screens, desktop on larger screens
  return (
    <>
      {/* Mobile: shown on small screens (<640px) */}
      <div className="sm:hidden">
        <ResourceBudgetPanelMobile {...props} />
      </div>

      {/* Desktop: shown on larger screens (≥640px) */}
      <div className="hidden sm:block">
        <ResourceBudgetPanelDesktop {...props} />
      </div>
    </>
  );
});

ResourceBudgetPanel.displayName = 'ResourceBudgetPanel';

// ===== Exports =====

export { ResourceBudgetPanelMobile, ResourceBudgetPanelDesktop };
export * from './types';
export { useResourceBudgetPanel } from './useResourceBudgetPanel';
export type { UseResourceBudgetPanelReturn } from './useResourceBudgetPanel';
