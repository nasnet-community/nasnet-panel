/**
 * NAT Rules Table Component
 * Displays NAT rules in a sortable table with row actions
 * Epic 0.6, Story 0.6.2
 */

import { useMemo, useState } from 'react';
import {
  useNATRules,
  useDeleteNATRule,
  useToggleNATRule,
} from '@nasnet/api-client/queries';
import { useConnectionStore, useNATUIStore } from '@nasnet/state/stores';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  toast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { SafetyConfirmation } from '@nasnet/ui/patterns';
import { MoreVertical, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import type { NATRule } from '@nasnet/core/types';

/**
 * Action badge with color coding for NAT actions
 * - masquerade: blue
 * - dst-nat: purple
 * - src-nat: teal
 * - redirect: orange
 */
function NATActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    masquerade: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'dst-nat': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'src-nat': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    redirect: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  const colorClass = colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {action}
    </span>
  );
}

/**
 * Chain badge component
 */
function ChainBadge({ chain }: { chain: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
      {chain}
    </span>
  );
}

export interface NATRulesTableProps {
  className?: string;
  chain?: string;
  onEditRule?: (rule: NATRule) => void;
}

/**
 * NATRulesTable Component
 *
 * Features:
 * - Displays all NAT rules (srcnat/dstnat)
 * - Color-coded actions (masquerade=blue, dst-nat=purple, src-nat=teal)
 * - Shows to-addresses and to-ports for port forwarding rules
 * - Visual distinction for disabled rules (muted, strikethrough)
 * - Row actions: Edit, Delete (with SafetyConfirmation), Toggle disable
 * - Auto-refresh with 5-minute cache
 * - Sortable by any column
 *
 * @param props - Component props
 * @returns NAT rules table component
 */
export function NATRulesTable({ className, chain, onEditRule }: NATRulesTableProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: allRules, isLoading, error } = useNATRules(routerIp);
  const { showDisabledRules } = useNATUIStore();

  const deleteRuleMutation = useDeleteNATRule(routerIp);
  const toggleRuleMutation = useToggleNATRule(routerIp);

  const [sortColumn, setSortColumn] = useState<keyof NATRule>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  // Filter rules by chain if specified
  const rules = chain && chain !== 'all' ? allRules?.filter((r) => r.chain === chain) : allRules;

  // Filter out disabled rules if needed
  const visibleRules = showDisabledRules ? rules : rules?.filter((r) => !r.disabled);

  // Sorted rules
  const sortedRules = useMemo(() => {
    if (!visibleRules) return [];

    return [...visibleRules].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [visibleRules, sortColumn, sortDirection]);

  // ========================================
  // Handlers
  // ========================================

  // Handle column header click for sorting
  const handleSort = (column: keyof NATRule) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleEdit = (rule: NATRule) => {
    onEditRule?.(rule);
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteRuleMutation.mutateAsync(ruleToDelete);
      toast({
        title: 'NAT Rule Deleted',
        description: 'The NAT rule has been deleted successfully.',
        variant: 'default',
      });
      setRuleToDelete(null);
    } catch (error) {
      toast({
        title: 'Failed to Delete NAT Rule',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (ruleId: string, disabled: boolean) => {
    try {
      await toggleRuleMutation.mutateAsync({ ruleId, disabled });
      toast({
        title: disabled ? 'NAT Rule Disabled' : 'NAT Rule Enabled',
        description: `The NAT rule has been ${disabled ? 'disabled' : 'enabled'}.`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Failed to Toggle NAT Rule',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        Error loading NAT rules: {error.message}
      </div>
    );
  }

  // Empty state
  if (!sortedRules || sortedRules.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        No NAT rules found {chain && chain !== 'all' ? `in ${chain} chain` : ''}
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => handleSort('order')}
              >
                # {sortColumn === 'order' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => handleSort('chain')}
              >
                Chain {sortColumn === 'chain' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => handleSort('action')}
              >
                Action {sortColumn === 'action' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Src Address</TableHead>
              <TableHead>Dst Address</TableHead>
              <TableHead>To Addresses</TableHead>
              <TableHead>To Ports</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRules.map((rule) => (
              <TableRow
                key={rule.id}
                className={rule.disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''}
              >
                <TableCell className="font-mono text-xs">{rule.order}</TableCell>
                <TableCell>
                  <ChainBadge chain={rule.chain} />
                </TableCell>
                <TableCell>
                  <NATActionBadge action={rule.action} />
                </TableCell>
                <TableCell className={rule.disabled ? 'line-through' : ''}>
                  {rule.protocol || '-'}
                </TableCell>
                <TableCell className={rule.disabled ? 'line-through' : ''}>
                  {rule.srcAddress || '-'}
                </TableCell>
                <TableCell className={rule.disabled ? 'line-through' : ''}>
                  {rule.dstAddress || '-'}
                </TableCell>
                <TableCell className={`font-medium ${rule.disabled ? 'line-through' : ''}`}>
                  {rule.toAddresses || '-'}
                </TableCell>
                <TableCell className={`font-medium ${rule.disabled ? 'line-through' : ''}`}>
                  {rule.toPorts || '-'}
                </TableCell>
                <TableCell
                  className={`text-sm text-slate-600 dark:text-slate-400 ${rule.disabled ? 'line-through' : ''}`}
                >
                  {rule.comment || ''}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(rule.id, !rule.disabled)}>
                        {rule.disabled ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Enable
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Disable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Safety Confirmation for Delete */}
      <SafetyConfirmation
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Delete NAT Rule"
        description="You are about to permanently delete this NAT rule. This action cannot be undone."
        consequences={[
          'The NAT rule will be removed from the firewall',
          'Traffic matching this rule will no longer be translated',
          'Existing connections may be disrupted',
          'Port forwarding or masquerading will stop working',
        ]}
        confirmText="DELETE"
        countdownSeconds={3}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRuleToDelete(null)}
      />
    </>
  );
}
