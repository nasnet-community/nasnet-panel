/**
 * RuleStatisticsPanel Component
 *
 * Main wrapper component with platform detection.
 * Implements Headless + Platform Presenters pattern.
 */
import React from 'react';
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
declare function RuleStatisticsPanelComponent(props: RuleStatisticsPanelProps): import("react/jsx-runtime").JSX.Element;
export declare const RuleStatisticsPanel: React.MemoExoticComponent<typeof RuleStatisticsPanelComponent>;
export {};
//# sourceMappingURL=RuleStatisticsPanel.d.ts.map