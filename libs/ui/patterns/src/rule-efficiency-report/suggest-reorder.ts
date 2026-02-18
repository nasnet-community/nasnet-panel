/**
 * Reordering suggestion algorithm for firewall rules
 *
 * Identifies opportunities to improve firewall performance by reordering
 * rules so that high-traffic rules are evaluated earlier.
 */

import type { FirewallRule } from '@nasnet/core/types';

import type { Suggestion, ReorderOpportunity, SuggestionSeverity } from './types';

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate potential performance improvement
 */
function calculateImprovement(rule: FirewallRule, currentPosition: number, suggestedPosition: number): string {
  const positionsSaved = currentPosition - suggestedPosition;
  const packetsPerSecond = rule.packets || 0;

  if (packetsPerSecond === 0) {
    return 'No traffic to optimize';
  }

  // Simplified calculation: assume each position check takes ~1μs
  const timeSavedPerPacket = positionsSaved; // microseconds
  const totalTimeSaved = (timeSavedPerPacket * packetsPerSecond) / 1000; // milliseconds

  if (totalTimeSaved < 1) {
    return `~${timeSavedPerPacket}μs per packet`;
  }

  return `~${totalTimeSaved.toFixed(2)}ms saved per measurement interval`;
}

/**
 * Determine severity based on traffic volume and position difference
 */
function getSeverity(opportunity: ReorderOpportunity): SuggestionSeverity {
  const { packetRatio, currentPosition, suggestedPosition } = opportunity;
  const positionDiff = currentPosition - suggestedPosition;

  // High severity: large traffic difference AND significant position change
  if (packetRatio >= 5 && positionDiff >= 3) {
    return 'high';
  }

  // Medium severity: moderate traffic difference OR moderate position change
  if (packetRatio >= 3 || positionDiff >= 2) {
    return 'medium';
  }

  // Low severity: small improvements
  return 'low';
}

/**
 * Find the optimal position for a high-traffic rule
 *
 * Rules should be ordered by traffic volume (descending) within the same chain,
 * but we must respect logical dependencies (e.g., can't move a specific rule
 * before a general rule that would override it).
 */
function findOptimalPosition(
  rule: FirewallRule,
  currentIndex: number,
  chainRules: FirewallRule[]
): number {
  const rulePackets = rule.packets || 0;

  // Find the first position where this rule's traffic is >= the next rule's traffic
  for (let i = 0; i < currentIndex; i++) {
    const otherRule = chainRules[i];
    const otherPackets = otherRule.packets || 0;

    // If this rule has more traffic than the rule at position i,
    // suggest moving it to position i
    if (rulePackets > otherPackets * 2) { // Threshold: 2x traffic difference
      return i;
    }
  }

  return currentIndex; // No better position found
}

/**
 * Suggest rule reordering for performance optimization
 *
 * Identifies rules with high traffic that appear late in the chain,
 * and suggests moving them earlier to reduce average evaluation time.
 */
export function suggestReorder(rules: FirewallRule[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Group rules by chain
  const rulesByChain = rules.reduce((acc, rule) => {
    const chain = rule.chain;
    if (!acc[chain]) {
      acc[chain] = [];
    }
    acc[chain].push(rule);
    return acc;
  }, {} as Record<string, FirewallRule[]>);

  // Process each chain separately
  Object.entries(rulesByChain).forEach(([chain, chainRules]) => {
    // Sort by current order
    const sortedRules = [...chainRules].sort((a, b) => a.order - b.order);

    // Skip chains with very few rules
    if (sortedRules.length < 3) {
      return;
    }

    // Check each rule for reordering opportunities
    sortedRules.forEach((rule, currentIndex) => {
      // Skip first rule (can't move earlier)
      if (currentIndex === 0) {
        return;
      }

      // Skip disabled rules
      if (rule.disabled) {
        return;
      }

      const rulePackets = rule.packets || 0;

      // Skip rules with no traffic
      if (rulePackets === 0) {
        return;
      }

      // Check if previous rule has significantly less traffic
      const prevRule = sortedRules[currentIndex - 1];
      const prevPackets = prevRule.packets || 0;

      // Calculate traffic ratio
      const ratio = prevPackets === 0 ? Infinity : rulePackets / prevPackets;

      // Only suggest reorder if traffic difference is significant (2x threshold)
      if (ratio < 2) {
        return;
      }

      // Find optimal position
      const suggestedPosition = findOptimalPosition(rule, currentIndex, sortedRules);

      if (suggestedPosition < currentIndex) {
        const opportunity: ReorderOpportunity = {
          rule,
          currentPosition: currentIndex,
          suggestedPosition,
          improvement: calculateImprovement(rule, currentIndex, suggestedPosition),
          packetRatio: ratio,
        };

        const severity = getSeverity(opportunity);

        const suggestion: Suggestion = {
          id: `reorder-${rule.id}`,
          type: 'reorder',
          title: `Move high-traffic rule earlier in ${chain} chain`,
          description: `Rule #${rule.order} "${rule.comment || 'Unnamed'}" has ${rule.packets?.toLocaleString()} packets but appears at position ${currentIndex + 1}. Moving it to position ${suggestedPosition + 1} would improve performance. ${opportunity.improvement}.`,
          affectedRules: [rule.id],
          action: 'move',
          targetPosition: suggestedPosition,
          severity,
          estimatedImpact: opportunity.improvement,
        };

        suggestions.push(suggestion);
      }
    });
  });

  return suggestions;
}
