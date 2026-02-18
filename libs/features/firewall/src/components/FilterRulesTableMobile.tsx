/**
 * Filter Rules Table Component (Mobile)
 *
 * Domain component for displaying filter rules on mobile devices.
 * Mobile presenter with card layout and touch-friendly interactions.
 *
 * Features:
 * - Card-based layout optimized for touch
 * - Inline actions (Edit, Duplicate, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useFilterRules,
  useDeleteFilterRule,
  useToggleFilterRule,
  useCreateFilterRule,
  useUpdateFilterRule,
} from '@nasnet/api-client/queries/firewall';
import type { FilterRule, FilterRuleInput, FilterChain } from '@nasnet/core/types';
import { CounterCell, FilterRuleEditor } from '@nasnet/ui/patterns';
import { RuleStatisticsPanel } from '@nasnet/ui/patterns';
import { useCounterSettingsStore } from '@nasnet/features/firewall';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { Pencil, Copy, Trash2 } from 'lucide-react';

// ============================================================================
// Action Badge Component (Refactored to use Badge with semantic variants)
// ============================================================================

function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  const variantMap: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
    accept: 'success',
    drop: 'error',
    reject: 'error',
    log: 'info',
    jump: 'warning',
    tarpit: 'error',
    passthrough: 'default',
  };

  const variant = variantMap[action] || 'default';

  return (
    <Badge variant={variant} className="text-xs">
      {action}
    </Badge>
  );
}

// ============================================================================
// Rule Card Component
// ============================================================================

interface RuleCardProps {
  rule: FilterRule;
  maxBytes: number;
  onEdit: (rule: FilterRule) => void;
  onDuplicate: (rule: FilterRule) => void;
  onDelete: (rule: FilterRule) => void;
  onToggle: (rule: FilterRule) => void;
  onShowStats: (rule: FilterRule) => void;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

function RuleCard({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats, isHighlighted, highlightRef }: RuleCardProps) {
  const { t } = useTranslation('firewall');
  const isUnused = (rule.packets ?? 0) === 0;
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);

  const matchers: string[] = [];
  if (rule.protocol && rule.protocol !== 'all') matchers.push(`${rule.protocol}`);
  if (rule.srcAddress) matchers.push(`${rule.srcAddress}`);
  if (rule.dstAddress) matchers.push(`→ ${rule.dstAddress}`);
  if (rule.srcPort) matchers.push(`:${rule.srcPort}`);
  if (rule.dstPort) matchers.push(`:${rule.dstPort}`);
  if (rule.connectionState && rule.connectionState.length > 0) {
    matchers.push(`[${rule.connectionState.join(',')}]`);
  }

  // Calculate percentage of max for progress bar
  const percentOfMax = maxBytes > 0 ? ((rule.bytes ?? 0) / maxBytes) * 100 : 0;

  return (
    <Card
      ref={isHighlighted ? highlightRef as React.RefObject<HTMLDivElement> : undefined}
      className={`${rule.disabled ? 'opacity-50' : ''} ${isUnused ? 'bg-muted/50 opacity-60' : ''} ${isHighlighted ? 'animate-highlight bg-warning/20' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500">#{rule.order}</span>
              <Badge variant="secondary" className="text-xs">
                {rule.chain}
              </Badge>
              <ActionBadge action={rule.action} />
            </div>
          </div>
          <Switch
            checked={!rule.disabled}
            onCheckedChange={() => onToggle(rule)}
            aria-label={rule.disabled ? 'Enable rule' : 'Disable rule'}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Matchers */}
        {matchers.length > 0 && (
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {matchers.join(' ')}
          </div>
        )}

        {/* Counters - Replaced with CounterCell */}
        <div
          className="mb-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 p-2 -mx-2 rounded"
          onClick={() => onShowStats(rule)}
        >
          <CounterCell
            packets={rule.packets ?? 0}
            bytes={rule.bytes ?? 0}
            percentOfMax={percentOfMax}
            isUnused={isUnused}
            showRate={false} // Never show rate on mobile
            showBar={showRelativeBar}
          />
        </div>

        {/* Comment */}
        {rule.comment && (
          <div className="text-sm text-slate-600 dark:text-slate-400 italic mb-3">
            {rule.comment}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="flex-1"
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(rule)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(rule)}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface FilterRulesTableMobileProps {
  className?: string;
  chain?: FilterChain;
}

/**
 * FilterRulesTableMobile Component
 *
 * Mobile-optimized card-based layout for filter rules.
 *
 * Features:
 * - Touch-friendly card layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle
 * - Compact counter display
 *
 * @param props - Component props
 * @returns Mobile filter rules table component
 */
export function FilterRulesTableMobile({ className, chain }: FilterRulesTableMobileProps) {
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const pollingInterval = useCounterSettingsStore((state) => state.pollingInterval);

  // Get highlight parameter from URL search params
  const searchParams = useSearch({ strict: false }) as { highlight?: string };
  const highlightRuleId = searchParams.highlight;
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const { data: rules, isLoading, error } = useFilterRules(routerIp, {
    chain,
    refetchInterval: pollingInterval || false
  });
  const deleteFilterRule = useDeleteFilterRule(routerIp);
  const toggleFilterRule = useToggleFilterRule(routerIp);
  const createFilterRule = useCreateFilterRule(routerIp);
  const updateFilterRule = useUpdateFilterRule(routerIp);

  const [editingRule, setEditingRule] = useState<FilterRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<FilterRule | null>(null);
  const [statsRule, setStatsRule] = useState<FilterRule | null>(null);

  // Sort rules by order
  const sortedRules = rules ? [...rules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  // Calculate max bytes for relative bar
  const maxBytes = useMemo(() => {
    if (!sortedRules || sortedRules.length === 0) return 0;
    return Math.max(...sortedRules.map(r => r.bytes ?? 0));
  }, [sortedRules]);

  // Handlers
  const handleEdit = (rule: FilterRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleDuplicate = (rule: FilterRule) => {
    const duplicatedRule = { ...rule, id: undefined, order: undefined };
    setEditingRule(duplicatedRule);
    setIsEditorOpen(true);
  };

  const handleSaveRule = async (ruleInput: FilterRuleInput) => {
    if (editingRule?.id) {
      // Update existing rule
      await updateFilterRule.mutateAsync({
        ruleId: editingRule.id,
        updates: ruleInput,
      });
    } else {
      // Create new rule
      await createFilterRule.mutateAsync(ruleInput);
    }
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleDelete = (rule: FilterRule) => {
    setDeleteConfirmRule(rule);
  };

  const handleToggle = (rule: FilterRule) => {
    toggleFilterRule.mutate({
      ruleId: rule.id!,
      disabled: !rule.disabled,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmRule) {
      deleteFilterRule.mutate(deleteConfirmRule.id!);
      setDeleteConfirmRule(null);
    }
  };

  const handleShowStats = (rule: FilterRule) => {
    setStatsRule(rule);
  };

  // Scroll to highlighted rule when highlight changes
  useEffect(() => {
    if (highlightRuleId && highlightRef.current) {
      // Wait for render to complete
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [highlightRuleId, sortedRules]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`p-4 space-y-4 ${className || ''}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        Error loading filter rules: {error.message}
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        {chain ? `No rules in ${chain} chain` : 'No filter rules found'}
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-3 ${className || ''}`}>
        {sortedRules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            maxBytes={maxBytes}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggle={handleToggle}
            isHighlighted={highlightRuleId === rule.id}
            highlightRef={highlightRuleId === rule.id ? highlightRef : undefined}
            onShowStats={handleShowStats}
          />
        ))}
      </div>

      {/* Edit/Create Filter Rule Editor */}
      <FilterRuleEditor
        routerId={routerIp}
        initialRule={editingRule || undefined}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveRule}
        onDelete={editingRule?.id ? () => handleDelete(editingRule) : undefined}
        isSaving={createFilterRule.isPending || updateFilterRule.isPending}
        isDeleting={deleteFilterRule.isPending}
        mode={editingRule?.id ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && setDeleteConfirmRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Filter Rule?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The rule will be permanently removed from the firewall configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">This will:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Remove the rule from the {deleteConfirmRule?.chain} chain</li>
              <li>Reorder subsequent rules automatically</li>
              <li>Take effect immediately on the router</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRule(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Panel */}
      {statsRule && (
        <RuleStatisticsPanel
          isOpen={!!statsRule}
          onClose={() => setStatsRule(null)}
          rule={statsRule}
          historyData={[]} // TODO: Integrate with IndexedDB counterHistoryStorage
          onExportCsv={() => {
            // TODO: Implement CSV export using counterHistoryStorage.exportToCsv
            console.log('Export CSV for rule:', statsRule.id);
          }}
        />
      )}
    </>
  );
}
