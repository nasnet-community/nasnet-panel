/**
 * Rule Navigation Hook
 *
 * Hook for navigating to firewall filter rules from log entries.
 * Searches for rules by log prefix and navigates to the filter rules page
 * with highlight functionality.
 *
 * Features:
 * - Find rules by log prefix (case-insensitive)
 * - Navigate to filter rules page with highlight query param
 * - Toast notification for "rule not found" case
 * - Type-safe TanStack Router navigation
 *
 * @example
 * ```tsx
 * const { navigateToRuleByPrefix } = useRuleNavigation({ routerId: '123' });
 * navigateToRuleByPrefix('SSH-DROP');
 * ```
 */

import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFilterRules } from '@nasnet/api-client/queries/firewall';
import { toast } from '@nasnet/ui/primitives';
import type { FilterRule } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

export interface UseRuleNavigationOptions {
  /** Target router ID for querying filter rules */
  routerId: string;
}

export interface UseRuleNavigationReturn {
  /** Find a filter rule by log prefix (case-insensitive) */
  findRuleByPrefix: (prefix: string) => FilterRule | undefined;
  /** Navigate to the filter rules page with a specific rule highlighted */
  navigateToRule: (ruleId: string) => void;
  /** Find a rule by prefix and navigate with error handling */
  navigateToRuleByPrefix: (prefix: string) => void;
  /** Loading state for filter rules query */
  isLoading: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for navigating to firewall filter rules from log entries.
 *
 * Provides functions to find rules by their log prefix and navigate to them
 * with automatic highlight. Useful for connecting firewall logs to their rules.
 *
 * @param options - Hook options including target router ID
 * @returns Object with navigation functions and loading state
 *
 * @example
 * ```tsx
 * function FirewallLogEntry({ entry }: { entry: FirewallLogEntry }) {
 *   const { navigateToRuleByPrefix, isLoading } = useRuleNavigation({
 *     routerId: routerId
 *   });
 *
 *   return (
 *     <Button
 *       onClick={() => navigateToRuleByPrefix(entry.prefix)}
 *       disabled={isLoading}
 *     >
 *       View Rule
 *     </Button>
 *   );
 * }
 * ```
 */
export function useRuleNavigation({ routerId }: UseRuleNavigationOptions): UseRuleNavigationReturn {
  const navigate = useNavigate();

  // Fetch all filter rules (cached by TanStack Query)
  const { data: rules, isLoading } = useFilterRules(routerId, {
    enabled: !!routerId,
  });

  /**
   * Find a filter rule by its log prefix (case-insensitive)
   *
   * Searches through cached filter rules to find one matching the given prefix.
   * Comparison is case-insensitive to handle various prefix formats.
   *
   * @param prefix - Log prefix to search for (e.g., "SSH-DROP", "WEB-ALLOW")
   * @returns The matching FilterRule, or undefined if not found
   */
  const findRuleByPrefix = useCallback(
    (prefix: string): FilterRule | undefined => {
      if (!rules || rules.length === 0) {
        return undefined;
      }

      // Search for rule with matching log prefix (case-insensitive)
      return rules.find(
        (rule) => rule.logPrefix && rule.logPrefix.toLowerCase() === prefix.toLowerCase()
      );
    },
    [rules]
  );

  /**
   * Navigate to the filter rules page with a specific rule highlighted
   *
   * Navigates to the firewall filter rules page and passes the rule ID as
   * a query parameter so it can be highlighted/scrolled into view.
   *
   * @param ruleId - Rule ID to highlight (e.g., "*1", "*2", "rule:123")
   */
  const navigateToRule = useCallback(
    (ruleId: string): void => {
      navigate({
        to: '/router/$id/firewall' as any,
        params: { id: routerId } as any,
        search: { highlight: ruleId } as any,
      });
    },
    [navigate, routerId]
  );

  /**
   * Find a rule by prefix and navigate to it with error handling
   *
   * Combines findRuleByPrefix and navigateToRule. Shows a helpful error
   * toast if the rule is not found, or navigates and highlights the rule
   * if found.
   *
   * @param prefix - Log prefix to search for (e.g., "SSH-DROP")
   */
  const navigateToRuleByPrefix = useCallback(
    (prefix: string): void => {
      const rule = findRuleByPrefix(prefix);

      if (!rule) {
        // Show error toast with actionable message
        toast({
          variant: 'destructive',
          title: 'Rule Not Found',
          description: `No filter rule found with log prefix "${prefix}". The rule may have been deleted or the prefix was recently changed.`,
        });
        return;
      }

      // Navigate to the rule with highlight
      navigateToRule(rule.id!);
    },
    [findRuleByPrefix, navigateToRule]
  );

  return {
    findRuleByPrefix,
    navigateToRule,
    navigateToRuleByPrefix,
    isLoading,
  };
}
