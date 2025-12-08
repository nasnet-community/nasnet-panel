/**
 * Firewall Filter Rules Table Component
 * Displays firewall filter rules in a sortable, read-only table
 * Epic 0.6, Story 0.6.1
 */

import { useMemo, useState } from 'react';
import { useFilterRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';
import type { FirewallRule, FirewallFilters } from '@nasnet/core/types';
import { applyFilters } from '../hooks/useRuleFilters';

/**
 * Action badge with color coding
 * - accept: green
 * - drop: red
 * - reject: orange
 * - log: blue
 */
function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    accept: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    drop: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    reject: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    log: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
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

export interface FilterRulesTableProps {
  className?: string;
  /** Optional filters to apply to the rules */
  filters?: FirewallFilters;
}

/**
 * FilterRulesTable Component
 *
 * Features:
 * - Displays all firewall filter rules
 * - Color-coded actions (accept=green, drop=red, reject=orange)
 * - Visual distinction for disabled rules (muted, strikethrough)
 * - Read-only (no edit/delete buttons)
 * - Auto-refresh with 5-minute cache
 * - Sortable by any column
 * - Optional filtering support via filters prop
 *
 * @param props - Component props
 * @returns Filter rules table component
 */
export function FilterRulesTable({ className, filters }: FilterRulesTableProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules, isLoading, error } = useFilterRules(routerIp);
  const [sortColumn, setSortColumn] = useState<keyof FirewallRule>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort rules
  const sortedRules = useMemo(() => {
    if (!rules) return [];

    // Apply filters if provided
    let filteredRules = filters ? applyFilters(rules, filters) : rules;

    // Sort
    return [...filteredRules].sort((a, b) => {
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
  }, [rules, filters, sortColumn, sortDirection]);

  // Handle column header click for sorting
  const handleSort = (column: keyof FirewallRule) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
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
        Error loading firewall rules: {error.message}
      </div>
    );
  }

  // Empty state - no rules at all
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        No firewall filter rules found
      </div>
    );
  }

  // Empty state - no rules match filters
  if (sortedRules.length === 0 && filters) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        No rules match the current filters
      </div>
    );
  }

  return (
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
            <TableHead>Src Port</TableHead>
            <TableHead>Dst Port</TableHead>
            <TableHead>Comment</TableHead>
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
                <ActionBadge action={rule.action} />
              </TableCell>
              <TableCell className={rule.disabled ? 'line-through' : ''}>{rule.protocol || '-'}</TableCell>
              <TableCell className={rule.disabled ? 'line-through' : ''}>{rule.srcAddress || '-'}</TableCell>
              <TableCell className={rule.disabled ? 'line-through' : ''}>{rule.dstAddress || '-'}</TableCell>
              <TableCell className={rule.disabled ? 'line-through' : ''}>{rule.srcPort || '-'}</TableCell>
              <TableCell className={rule.disabled ? 'line-through' : ''}>{rule.dstPort || '-'}</TableCell>
              <TableCell className={`text-sm text-slate-600 dark:text-slate-400 ${rule.disabled ? 'line-through' : ''}`}>
                {rule.comment || ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
