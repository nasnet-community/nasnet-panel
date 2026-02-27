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

import { useMemo } from 'react';
import type { FirewallRule, ChainSummary, FirewallChain } from '@nasnet/core/types';

/**
 * Calculate summary statistics for firewall rules grouped by chain
 *
 * @param rules - Array of firewall rules
 * @returns Array of chain summaries with statistics
 */
export function useChainSummary(rules: FirewallRule[] | undefined): ChainSummary[] {
  return useMemo(() => {
    if (!rules || rules.length === 0) {
      // Return empty summaries for main chains
      const defaultChains: FirewallChain[] = ['input', 'forward', 'output'];
      return defaultChains.map((chain) => ({
        chain,
        totalRules: 0,
        acceptCount: 0,
        dropCount: 0,
        rejectCount: 0,
        logCount: 0,
        disabledCount: 0,
      }));
    }

    // Group rules by chain
    const chainMap = new Map<FirewallChain, ChainSummary>();

    // Initialize with default chains
    const defaultChains: FirewallChain[] = ['input', 'forward', 'output'];
    defaultChains.forEach((chain) => {
      chainMap.set(chain, {
        chain,
        totalRules: 0,
        acceptCount: 0,
        dropCount: 0,
        rejectCount: 0,
        logCount: 0,
        disabledCount: 0,
      });
    });

    // Aggregate rules
    rules.forEach((rule) => {
      const chain = rule.chain;

      // Get or create summary for this chain
      if (!chainMap.has(chain)) {
        chainMap.set(chain, {
          chain,
          totalRules: 0,
          acceptCount: 0,
          dropCount: 0,
          rejectCount: 0,
          logCount: 0,
          disabledCount: 0,
        });
      }

      const summary = chainMap.get(chain)!;
      summary.totalRules++;

      // Count by action
      switch (rule.action) {
        case 'accept':
          summary.acceptCount++;
          break;
        case 'drop':
          summary.dropCount++;
          break;
        case 'reject':
          summary.rejectCount++;
          break;
        case 'log':
          summary.logCount++;
          break;
      }

      // Count disabled rules
      if (rule.disabled) {
        summary.disabledCount++;
      }
    });

    // Convert map to array, sorted by chain priority
    const chainOrder: FirewallChain[] = ['input', 'forward', 'output', 'prerouting', 'postrouting'];

    return chainOrder.filter((chain) => chainMap.has(chain)).map((chain) => chainMap.get(chain)!);
  }, [rules]);
}

/**
 * Get semantic color token for a chain
 * @description Maps firewall chains to design system semantic color tokens.
 * @param chain - The firewall chain identifier
 * @returns Semantic color token for Tailwind CSS
 */
export function getChainColor(chain: FirewallChain): string {
  const CHAIN_COLORS: Record<FirewallChain, string> = {
    input: 'info', // Blue for incoming traffic
    forward: 'warning', // Amber for pass-through
    output: 'success', // Green for outgoing
    prerouting: 'info', // Blue for pre-routing
    postrouting: 'success', // Green for post-routing
  };
  return CHAIN_COLORS[chain] || 'muted';
}

/**
 * Get human-readable description for a chain
 * @description Provides user-friendly explanations of firewall chain purposes.
 * @param chain - The firewall chain identifier
 * @returns Localized description of the chain's purpose
 */
export function getChainDescription(chain: FirewallChain): string {
  const CHAIN_DESCRIPTIONS: Record<FirewallChain, string> = {
    input: 'Traffic destined to the router',
    forward: 'Traffic passing through the router',
    output: 'Traffic originating from the router',
    prerouting: 'Before routing decision (NAT)',
    postrouting: 'After routing decision (NAT)',
  };
  return CHAIN_DESCRIPTIONS[chain] || chain;
}
