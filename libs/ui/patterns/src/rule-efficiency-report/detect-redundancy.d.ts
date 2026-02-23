/**
 * Redundancy detection algorithm for firewall rules
 *
 * Identifies rules that are redundant because they are superseded by
 * earlier rules with the same or broader matching criteria.
 */
import type { FirewallRule } from '@nasnet/core/types';
import type { Suggestion } from './types';
/**
 * Detect redundant firewall rules
 *
 * Groups rules by chain, then finds rules that are superseded by
 * earlier rules with the same action and broader or equal matching criteria.
 */
export declare function detectRedundantRules(rules: FirewallRule[]): Suggestion[];
//# sourceMappingURL=detect-redundancy.d.ts.map