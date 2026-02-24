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
import type { FilterRule } from '@nasnet/core/types';
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
export declare function useRuleNavigation({ routerId, }: UseRuleNavigationOptions): UseRuleNavigationReturn;
//# sourceMappingURL=use-rule-navigation.d.ts.map