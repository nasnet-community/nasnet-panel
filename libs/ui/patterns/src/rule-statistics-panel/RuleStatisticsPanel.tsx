/**
 * RuleStatisticsPanel Component
 *
 * Main wrapper component with platform detection.
 * Implements Headless + Platform Presenters pattern.
 */

import { useMediaQuery } from '@nasnet/ui/primitives';
import { RuleStatisticsPanelDesktop } from './RuleStatisticsPanelDesktop';
import { RuleStatisticsPanelMobile } from './RuleStatisticsPanelMobile';
import type { RuleStatisticsPanelProps } from './types';

/**
 * RuleStatisticsPanel - Platform-aware statistics panel
 *
 * Displays detailed rule statistics with historical traffic charts.
 * Automatically renders mobile or desktop layout based on viewport.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <RuleStatisticsPanel
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   rule={rule}
 *   historyData={historyData}
 *   onExportCsv={() => exportToCsv(historyData)}
 * />
 * ```
 */
export function RuleStatisticsPanel(props: RuleStatisticsPanelProps) {
  // Platform detection: mobile (<640px) vs desktop (>=640px)
  const isMobile = useMediaQuery('(max-width: 639px)');

  // Render appropriate platform presenter
  return isMobile ? (
    <RuleStatisticsPanelMobile {...props} />
  ) : (
    <RuleStatisticsPanelDesktop {...props} />
  );
}
