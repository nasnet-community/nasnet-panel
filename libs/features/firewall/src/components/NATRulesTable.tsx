/**
 * NAT Rules Table Component
 * Displays NAT rules in a sortable table with row actions
 *
 * @description Table showing all NAT rules (source/destination NAT) with sorting and actions
 * @see Epic 0.6, Story 0.6.2
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';
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
  Badge,
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
 * @description Action badge using Badge component with semantic variants for NAT actions
 */
const NATActionBadge = memo(function NATActionBadge({ action }: { action: string }) {
  const VARIANT_MAP: Record<string, 'default' | 'info' | 'secondary' | 'warning' | 'outline'> = {
    masquerade: 'info',
    'dst-nat': 'secondary',
    'src-nat': 'default',
    redirect: 'warning',
  };

  const variant = VARIANT_MAP[action] || 'outline';

  return (
    <Badge variant={variant} className="text-xs">
      {action}
    </Badge>
  );
});

/**
 * @description Chain badge component with monospace font
 */
const ChainBadge = memo(function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {chain}
    </Badge>
  );
});

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
export const NATRulesTable = memo(function NATRulesTable({ className, chain, onEditRule }: NATRulesTableProps) {
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

  // Sorted rules with useMemo for stability
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

  // Handle column header click for sorting with useCallback
  const handleSort = useCallback((column: keyof NATRule) => {
    setSortDirection((prevDirection) =>
      sortColumn === column ? (prevDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    );
    setSortColumn(column);
  }, [sortColumn]);

  const handleEdit = useCallback((rule: NATRule) => {
    onEditRule?.(rule);
  }, [onEditRule]);

  const handleDelete = useCallback((ruleId: string) => {
    setRuleToDelete(ruleId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [ruleToDelete, deleteRuleMutation]);

  const handleToggle = useCallback(async (ruleId: string, isDisabled: boolean) => {
    try {
      await toggleRuleMutation.mutateAsync({ ruleId, disabled: isDisabled });
      toast({
        title: isDisabled ? 'NAT Rule Disabled' : 'NAT Rule Enabled',
        description: `The NAT rule has been ${isDisabled ? 'disabled' : 'enabled'}.`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Failed to Toggle NAT Rule',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [toggleRuleMutation]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 ${className || ''}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-error ${className || ''}`} role="alert">
        Error loading NAT rules: {error.message}
      </div>
    );
  }

  // Empty state
  if (!sortedRules || sortedRules.length === 0) {
    return (
      <div className={`p-8 text-center text-muted-foreground ${className || ''}`}>
        No NAT rules found {chain && chain !== 'all' ? `in ${chain} chain` : ''}
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <Table aria-label="NAT rules">
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('order')}
                aria-sort={sortColumn === 'order' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                role="columnheader"
              >
                # {sortColumn === 'order' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('chain')}
                aria-sort={sortColumn === 'chain' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                role="columnheader"
              >
                Chain {sortColumn === 'chain' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead
                scope="col"
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort('action')}
                aria-sort={sortColumn === 'action' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                role="columnheader"
              >
                Action {sortColumn === 'action' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead scope="col">Protocol</TableHead>
              <TableHead scope="col">Src Address</TableHead>
              <TableHead scope="col">Dst Address</TableHead>
              <TableHead scope="col">To Addresses</TableHead>
              <TableHead scope="col">To Ports</TableHead>
              <TableHead scope="col">Comment</TableHead>
              <TableHead scope="col" className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRules.map((rule) => (
              <TableRow
                key={rule.id}
                className={rule.disabled ? 'opacity-50 bg-muted/50' : ''}
              >
                <TableCell className="font-mono text-xs">{rule.order}</TableCell>
                <TableCell>
                  <ChainBadge chain={rule.chain} />
                </TableCell>
                <TableCell>
                  <NATActionBadge action={rule.action} />
                </TableCell>
                <TableCell className={cn(rule.disabled && 'line-through')}>
                  {rule.protocol || '-'}
                </TableCell>
                <TableCell className={cn('font-mono text-xs', rule.disabled && 'line-through')}>
                  {rule.srcAddress || '-'}
                </TableCell>
                <TableCell className={cn('font-mono text-xs', rule.disabled && 'line-through')}>
                  {rule.dstAddress || '-'}
                </TableCell>
                <TableCell className={cn('font-medium font-mono text-xs', rule.disabled && 'line-through')}>
                  {rule.toAddresses || '-'}
                </TableCell>
                <TableCell className={cn('font-medium font-mono text-xs', rule.disabled && 'line-through')}>
                  {rule.toPorts || '-'}
                </TableCell>
                <TableCell
                  className={cn('text-sm text-muted-foreground', rule.disabled && 'line-through')}
                >
                  {rule.comment || ''}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={`Actions for rule ${rule.order}`}
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(rule)}>
                        <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(rule.id, !rule.disabled)}>
                        {rule.disabled ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                            Enable
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" aria-hidden="true" />
                            Disable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(rule.id)}
                        className="text-error"
                      >
                        <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
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
});

NATRulesTable.displayName = 'NATRulesTable';
