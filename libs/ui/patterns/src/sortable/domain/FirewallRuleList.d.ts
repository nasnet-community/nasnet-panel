/**
 * FirewallRuleList Component
 *
 * Domain-specific sortable list for firewall rules.
 * Supports critical ordering with visual feedback for rule priority.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import type { SortableItemData, ReorderEvent } from '../types';
export interface FirewallRule extends SortableItemData {
    id: string;
    chain: 'input' | 'forward' | 'output';
    action: 'accept' | 'drop' | 'reject' | 'log' | 'passthrough';
    src?: string;
    dst?: string;
    protocol?: string;
    dstPort?: string;
    comment?: string;
    disabled?: boolean;
    hitCount?: number;
}
export interface FirewallRuleListProps {
    /** Firewall rules to display */
    rules: FirewallRule[];
    /** Callback when rules are reordered */
    onReorder?: (event: ReorderEvent<FirewallRule>) => void;
    /** Callback to delete a rule */
    onDelete?: (rule: FirewallRule) => void;
    /** Callback to duplicate a rule */
    onDuplicate?: (rule: FirewallRule) => void;
    /** Callback to edit a rule */
    onEdit?: (rule: FirewallRule) => void;
    /** Whether to show confirmation for dangerous changes */
    confirmDangerous?: boolean;
    /** CSS class */
    className?: string;
}
export declare const FirewallRuleList: React.FC<FirewallRuleListProps>;
export default FirewallRuleList;
//# sourceMappingURL=FirewallRuleList.d.ts.map