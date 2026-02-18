/**
 * Redundancy detection algorithm for firewall rules
 *
 * Identifies rules that are redundant because they are superseded by
 * earlier rules with the same or broader matching criteria.
 */

import type { FirewallRule } from '@nasnet/core/types';

import type { Suggestion, RedundancyMatch, SuggestionSeverity } from './types';

/**
 * Check if an address/network is a superset of another
 * Supports CIDR notation and wildcards
 */
function isAddressSuperset(broader: string | undefined, narrower: string | undefined): boolean {
  if (!broader && !narrower) return true; // Both undefined = match all
  if (!broader) return true; // Broader is undefined = match all
  if (!narrower) return false; // Broader defined but narrower undefined

  // Exact match
  if (broader === narrower) return true;

  // Wildcard matching (simple implementation)
  if (broader.includes('*')) {
    const pattern = broader.replace(/\./g, '\\.').replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`).test(narrower);
  }

  // CIDR matching would require more complex logic
  // For now, treat different CIDRs as non-overlapping
  return false;
}

/**
 * Check if a port specification is a superset of another
 */
function isPortSuperset(broader: string | undefined, narrower: string | undefined): boolean {
  if (!broader && !narrower) return true;
  if (!broader) return true; // No port restriction = match all
  if (!narrower) return false;

  // Exact match
  if (broader === narrower) return true;

  // Range matching (e.g., "1-65535" vs "80")
  // Simple implementation - just exact match for now
  return false;
}

/**
 * Check if two rules match the same traffic with one being more general
 */
function isRuleSupersededBy(rule: FirewallRule, other: FirewallRule): { superseded: boolean; reason: string } {
  // Must be in same chain
  if (rule.chain !== other.chain) {
    return { superseded: false, reason: '' };
  }

  // Must have same action
  if (rule.action !== other.action) {
    return { superseded: false, reason: '' };
  }

  // If the 'other' rule appears later in order, it cannot supersede this rule
  if (other.order >= rule.order) {
    return { superseded: false, reason: '' };
  }

  // Check if 'other' matches same or broader traffic
  const protocolMatch = !other.protocol || !rule.protocol || other.protocol === rule.protocol || other.protocol === 'all';
  const srcAddrMatch = isAddressSuperset(other.srcAddress, rule.srcAddress);
  const dstAddrMatch = isAddressSuperset(other.dstAddress, rule.dstAddress);
  const srcPortMatch = isPortSuperset(other.srcPort, rule.srcPort);
  const dstPortMatch = isPortSuperset(other.dstPort, rule.dstPort);
  const inInterfaceMatch = !other.inInterface || !rule.inInterface || other.inInterface === rule.inInterface;
  const outInterfaceMatch = !other.outInterface || !rule.outInterface || other.outInterface === rule.outInterface;

  const isSuperseded = protocolMatch && srcAddrMatch && dstAddrMatch &&
                       srcPortMatch && dstPortMatch &&
                       inInterfaceMatch && outInterfaceMatch;

  if (!isSuperseded) {
    return { superseded: false, reason: '' };
  }

  // Build reason string
  const reasons: string[] = [];
  if (!other.protocol || other.protocol === 'all') reasons.push('any protocol');
  if (!other.srcAddress) reasons.push('any source');
  if (!other.dstAddress) reasons.push('any destination');
  if (!other.srcPort) reasons.push('any source port');
  if (!other.dstPort) reasons.push('any destination port');

  const reason = reasons.length > 0
    ? `Matches ${reasons.join(', ')}`
    : 'Exact duplicate of earlier rule';

  return { superseded: true, reason };
}

/**
 * Determine severity based on rule characteristics
 */
function getSeverity(match: RedundancyMatch): SuggestionSeverity {
  const rule = match.rule;

  // High severity if the rule is enabled and accepts traffic
  if (!rule.disabled && rule.action === 'accept') {
    return 'high';
  }

  // Medium severity if the rule is enabled but drops/rejects
  if (!rule.disabled) {
    return 'medium';
  }

  // Low severity if already disabled
  return 'low';
}

/**
 * Detect redundant firewall rules
 *
 * Groups rules by chain, then finds rules that are superseded by
 * earlier rules with the same action and broader or equal matching criteria.
 */
export function detectRedundantRules(rules: FirewallRule[]): Suggestion[] {
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
    // Sort by order to ensure correct precedence
    const sortedRules = [...chainRules].sort((a, b) => a.order - b.order);

    // Check each rule against all earlier rules
    sortedRules.forEach((rule, index) => {
      const earlierRules = sortedRules.slice(0, index);

      for (const earlierRule of earlierRules) {
        const { superseded, reason } = isRuleSupersededBy(rule, earlierRule);

        if (superseded) {
          const match: RedundancyMatch = {
            rule,
            supersededBy: earlierRule,
            reason,
          };

          const severity = getSeverity(match);

          // Determine action based on severity and current state
          const action: 'delete' | 'disable' = rule.disabled ? 'delete' : 'disable';

          const suggestion: Suggestion = {
            id: `redundant-${rule.id}`,
            type: 'redundant',
            title: `Redundant rule in ${chain} chain`,
            description: `Rule #${rule.order} "${rule.comment || 'Unnamed'}" is redundant. ${reason}. Earlier rule #${earlierRule.order} "${earlierRule.comment || 'Unnamed'}" already handles this traffic with action: ${earlierRule.action}.`,
            affectedRules: [rule.id, earlierRule.id],
            action,
            severity,
          };

          suggestions.push(suggestion);
          break; // Only report first match to avoid duplicates
        }
      }
    });
  });

  return suggestions;
}
