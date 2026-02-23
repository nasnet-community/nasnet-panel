/**
 * RuleEfficiencyReport - Pattern component for firewall rule optimization
 * Layer 2 pattern component following ADR-017
 *
 * Features:
 * - Detects redundant firewall rules
 * - Suggests performance-improving reordering
 * - Provides actionable recommendations
 * - WCAG AAA accessible
 */
import React from 'react';
import type { RuleEfficiencyReportProps } from './types';
/**
 * RuleEfficiencyReport component
 *
 * Analyzes firewall rules to detect redundancies and suggest performance
 * improvements through reordering.
 */
declare function RuleEfficiencyReportComponent({ rules, onApplySuggestion, onPreview, className, }: RuleEfficiencyReportProps): import("react/jsx-runtime").JSX.Element;
export declare const RuleEfficiencyReport: React.MemoExoticComponent<typeof RuleEfficiencyReportComponent>;
export {};
//# sourceMappingURL=RuleEfficiencyReport.d.ts.map