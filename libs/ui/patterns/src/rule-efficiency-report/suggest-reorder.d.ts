/**
 * Reordering suggestion algorithm for firewall rules
 *
 * Identifies opportunities to improve firewall performance by reordering
 * rules so that high-traffic rules are evaluated earlier.
 */
import type { FirewallRule } from '@nasnet/core/types';
import type { Suggestion } from './types';
/**
 * Suggest rule reordering for performance optimization
 *
 * Identifies rules with high traffic that appear late in the chain,
 * and suggests moving them earlier to reduce average evaluation time.
 */
export declare function suggestReorder(rules: FirewallRule[]): Suggestion[];
//# sourceMappingURL=suggest-reorder.d.ts.map