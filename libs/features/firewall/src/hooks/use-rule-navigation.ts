/**
 * Rule Navigation Hook
 *
 * Hook for navigating to firewall filter rules from log entries.
 * Searches for rules by log prefix and navigates to the filter rules page
 * with highlight functionality.
 *
 * Features:
 * - Find rules by log prefix
 * - Navigate to filter rules page with highlight query param
 * - Toast notification for "rule not found" case
 * - Type-safe TanStack Router navigation
 *
 * @see Task #9: Integration Task - Rule Navigation
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
  /** Target router ID */
  routerId: string;
}

export interface UseRuleNavigationReturn {
  /** Find a filter rule by log prefix */
  findRuleByPrefix: (prefix: string) => FilterRule | undefined;
  /** Navigate to a specific rule with highlight */
  navigateToRule: (ruleId: string) => void;
  /** Combined: find by prefix and navigate (with error handling) */
  navigateToRuleByPrefix: (prefix: string) => void;
  /** Whether filter rules are currently loading */
  isLoading: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for navigating to firewall filter rules from log entries
 *
 * @param options - Hook options with router ID
 * @returns Navigation functions and loading state
 *
 * @example
 * ```tsx
 * function LogEntry({ entry }: { entry: FirewallLogEntry }) {
 *   const { navigateToRuleByPrefix } = useRuleNavigation({
 *     routerId: router.id
 *   });
 *
 *   return (
 *     <button onClick={() => navigateToRuleByPrefix(entry.prefix)}>
 *       View Rule
 *     </button>
 *   );
 * }
 * ```
 */
export function useRuleNavigation({
  routerId,
}: UseRuleNavigationOptions): UseRuleNavigationReturn {
  const navigate = useNavigate();

  // Fetch all filter rules (cached by TanStack Query)
  const { data: rules, isLoading } = useFilterRules(routerId, {
    enabled: !!routerId,
  });

  /**
   * Find a filter rule by its log prefix
   *
   * @param prefix - Log prefix to search for (e.g., "SSH-DROP", "WEB-ALLOW")
   * @returns The matching FilterRule or undefined if not found
   */
  const findRuleByPrefix = useCallback(
    (prefix: string): FilterRule | undefined => {
      if (!rules || rules.length === 0) {
        return undefined;
      }

      // Search for rule with matching log prefix
      return rules.find(
        (rule) => rule.logPrefix && rule.logPrefix.toLowerCase() === prefix.toLowerCase()
      );
    },
    [rules]
  );

  /**
   * Navigate to the filter rules page with highlight query parameter
   *
   * @param ruleId - Rule ID to highlight (e.g., "*1", "*2")
   */
  const navigateToRule = useCallback(
    (ruleId: string): void => {
      // Navigate to filter rules page with highlight query param
      navigate({
        to: '/router/$id/firewall/filter',
        params: { id: routerId },
        search: { highlight: ruleId },
      });
    },
    [navigate, routerId]
  );

  /**
   * Find a rule by prefix and navigate to it (with error handling)
   *
   * Shows a toast notification if the rule is not found.
   *
   * @param prefix - Log prefix to search for
   */
  const navigateToRuleByPrefix = useCallback(
    (prefix: string): void => {
      const rule = findRuleByPrefix(prefix);

      if (!rule) {
        // Show error toast
        toast({
          variant: 'error',
          title: 'Rule Not Found',
          description: `No filter rule found with log prefix "${prefix}". The rule may have been deleted or the prefix was changed.`,
        });
        return;
      }

      // Navigate to the rule
      navigateToRule(rule.id);
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
