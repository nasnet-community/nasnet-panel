/**
 * NAT Rules Table Component
 * Displays NAT rules in a sortable table with row actions
 *
 * @description Table showing all NAT rules (source/destination NAT) with sorting and actions
 * @see Epic 0.6, Story 0.6.2
 */
import type { NATRule } from '@nasnet/core/types';
export interface NATRulesTableProps {
    /** Optional CSS class name */
    className?: string;
    /** Filter by specific chain (srcnat/dstnat) */
    chain?: string;
    /** Callback when edit action is clicked */
    onEditRule?: (rule: NATRule) => void;
}
/**
 * NATRulesTable Component
 *
 * Features:
 * - Displays all NAT rules (srcnat/dstnat)
 * - Color-coded actions using Badge semantic variants
 * - Shows to-addresses and to-ports for port forwarding rules
 * - Visual distinction for disabled rules (muted, strikethrough)
 * - Row actions: Edit, Delete (with SafetyConfirmation), Toggle disable
 * - Auto-refresh with 5-minute cache
 * - Sortable by any column
 *
 * @description Table display of firewall NAT rules with sorting and row actions
 * @param props - Component props
 * @returns NAT rules table component
 */
export declare const NATRulesTable: import("react").NamedExoticComponent<NATRulesTableProps>;
//# sourceMappingURL=NATRulesTable.d.ts.map