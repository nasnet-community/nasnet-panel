/**
 * Types for RuleEfficiencyReport component
 */

import type { FirewallRule } from '@nasnet/core/types';

export type SuggestionType = 'redundant' | 'reorder';
export type SuggestionAction = 'delete' | 'disable' | 'move';
export type SuggestionSeverity = 'low' | 'medium' | 'high';

/**
 * Represents an optimization suggestion for firewall rules
 */
export interface Suggestion {
  /** Unique identifier for the suggestion */
  id: string;
  /** Type of suggestion (redundant rule detection or reordering) */
  type: SuggestionType;
  /** Title describing the suggestion */
  title: string;
  /** Detailed description of the issue and recommended action */
  description: string;
  /** IDs of rules affected by this suggestion */
  affectedRules: string[];
  /** Recommended action to take */
  action: SuggestionAction;
  /** Target position for move actions (0-indexed) */
  targetPosition?: number;
  /** Severity level of the issue */
  severity: SuggestionSeverity;
  /** Estimated performance impact (for reorder suggestions) */
  estimatedImpact?: string;
}

/**
 * Props for RuleEfficiencyReport component
 */
export interface RuleEfficiencyReportProps {
  /** Array of firewall rules to analyze */
  rules: FirewallRule[];
  /** Callback when a suggestion is applied */
  onApplySuggestion: (suggestion: Suggestion) => void;
  /** Callback when previewing a suggestion */
  onPreview: (suggestion: Suggestion) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Result of redundancy detection algorithm
 */
export interface RedundancyMatch {
  /** The redundant rule */
  rule: FirewallRule;
  /** The rule that makes this one redundant */
  supersededBy: FirewallRule;
  /** Reason for redundancy */
  reason: string;
}

/**
 * Result of reordering suggestion algorithm
 */
export interface ReorderOpportunity {
  /** The rule that should be moved */
  rule: FirewallRule;
  /** Current position in the chain */
  currentPosition: number;
  /** Suggested new position */
  suggestedPosition: number;
  /** Estimated performance improvement */
  improvement: string;
  /** Ratio of packet counts that triggered this suggestion */
  packetRatio: number;
}
