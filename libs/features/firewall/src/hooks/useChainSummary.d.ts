/**
 * Chain Summary Hook
 * @description Aggregates firewall filter rules by chain to provide summary statistics.
 * Computes rule counts per action (accept, drop, reject, log) and tracks disabled rules.
 *
 * @example
 * const summaries = useChainSummary(rules);
 * summaries.forEach(summary => {
 *   console.log(`${summary.chain}: ${summary.totalRules} rules`);
 * });
 */
import type { FirewallRule, ChainSummary, FirewallChain } from '@nasnet/core/types';
/**
 * Calculate summary statistics for firewall rules grouped by chain
 *
 * @param rules - Array of firewall rules
 * @returns Array of chain summaries with statistics
 */
export declare function useChainSummary(rules: FirewallRule[] | undefined): ChainSummary[];
/**
 * Get semantic color token for a chain
 * @description Maps firewall chains to design system semantic color tokens.
 * @param chain - The firewall chain identifier
 * @returns Semantic color token for Tailwind CSS
 */
export declare function getChainColor(chain: FirewallChain): string;
/**
 * Get human-readable description for a chain
 * @description Provides user-friendly explanations of firewall chain purposes.
 * @param chain - The firewall chain identifier
 * @returns Localized description of the chain's purpose
 */
export declare function getChainDescription(chain: FirewallChain): string;
//# sourceMappingURL=useChainSummary.d.ts.map