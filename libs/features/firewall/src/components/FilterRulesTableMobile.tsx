/**
 * FilterRulesTableMobile Component
 * @description Mobile-optimized card-based layout for filter rules
 *
 * Domain component for displaying filter rules on mobile devices with:
 * - Card-based layout optimized for touch
 * - Inline actions (Edit, Duplicate, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.1: Implement Filter Rules - Task 4
 */

import { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useFilterRules,
  useDeleteFilterRule,
  useToggleFilterRule,
  useCreateFilterRule,
  useUpdateFilterRule,
} from '@nasnet/api-client/queries/firewall';
import type { FilterRule, FilterRuleInput, FilterChain } from '@nasnet/core/types';
import { CounterCell, FilterRuleEditor, RuleStatisticsPanel } from '@nasnet/ui/patterns';
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
// CONSTANTS
// ============================================================================

const ACTION_BADGE_VARIANTS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  accept: 'success',
  drop: 'error',
  reject: 'error',
  log: 'info',
  jump: 'warning',
  tarpit: 'error',
  passthrough: 'default',
};

// ============================================================================
// Action Badge Component
// ============================================================================

/**
 * ActionBadge Component
 * @description Badge displaying filter rule action with semantic color
 */
const ActionBadge = memo(function ActionBadge({ action }: { action: string }) {
  const variant = ACTION_BADGE_VARIANTS[action] || 'default';

  return (
    <Badge variant={variant} className="text-xs" role="img" aria-label={`Action: ${action}`}>
      {action}
    </Badge>
  );
});

// ============================================================================
// Rule Card Component
// ============================================================================

/**
 * RuleCardProps
 * @description Props for single filter rule card
 */
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

/**
 * RuleCard Component
 * @description Card displaying single filter rule with inline actions
 */
const RuleCard = memo(function RuleCard({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats, isHighlighted, highlightRef }: RuleCardProps) {
  const { t } = useTranslation('firewall');
  const isUnused = (rule.packets ?? 0) === 0;
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);

  const matchers: string[] = useMemo(() => {
    const result: string[] = [];
    if (rule.protocol && rule.protocol !== 'all') result.push(`${rule.protocol}`);
    if (rule.srcAddress) result.push(`${rule.srcAddress}`);
    if (rule.dstAddress) result.push(`→ ${rule.dstAddress}`);
    if (rule.srcPort) result.push(`:${rule.srcPort}`);
    if (rule.dstPort) result.push(`:${rule.dstPort}`);
    if (rule.connectionState && rule.connectionState.length > 0) {
      result.push(`[${rule.connectionState.join(',')}]`);
    }
    return result;
  }, [rule.protocol, rule.srcAddress, rule.dstAddress, rule.srcPort, rule.dstPort, rule.connectionState]);

  // Calculate percentage of max for progress bar
  const percentOfMax = maxBytes > 0 ? ((rule.bytes ?? 0) / maxBytes) * 100 : 0;

  return (
    <Card
      ref={isHighlighted ? highlightRef as React.RefObject<HTMLDivElement> : undefined}
      className={cn(
        rule.disabled && 'opacity-50',
        isUnused && 'bg-muted/50 opacity-60',
        isHighlighted && 'animate-highlight bg-warning/20'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">#{rule.order}</span>
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
          <div className="font-mono text-xs text-muted-foreground mb-3">
            {matchers.join(' ')}
          </div>
        )}

        {/* Counters - Replaced with CounterCell */}
        <div
          className="mb-3 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded transition-colors"
          onClick={() => onShowStats(rule)}
          role="button"
          tabIndex={0}
          aria-label={`View traffic statistics for rule ${rule.order ?? ''}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onShowStats(rule); }}
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
          <div className="text-sm text-muted-foreground italic mb-3">
            {rule.comment}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2" role="group" aria-label="Filter rule actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="flex-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Edit filter rule ${rule.order}`}
          >
            <Pencil className="h-4 w-4 mr-1" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(rule)}
            className="min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Duplicate filter rule ${rule.order}`}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(rule)}
            className="text-destructive hover:text-destructive/80 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Delete filter rule ${rule.order}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

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
export const FilterRulesTableMobile = memo(function FilterRulesTableMobile({ className, chain }: FilterRulesTableMobileProps) {
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
  const handleEdit = useCallback((rule: FilterRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  }, []);

  const handleDuplicate = useCallback((rule: FilterRule) => {
    const duplicatedRule = { ...rule, id: undefined, order: undefined };
    setEditingRule(duplicatedRule);
    setIsEditorOpen(true);
  }, []);

  const handleSaveRule = useCallback(async (ruleInput: FilterRuleInput) => {
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
  }, [editingRule?.id, updateFilterRule, createFilterRule]);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingRule(null);
  }, []);

  const handleDelete = useCallback((rule: FilterRule) => {
    setDeleteConfirmRule(rule);
  }, []);

  const handleToggle = useCallback((rule: FilterRule) => {
    toggleFilterRule.mutate({
      ruleId: rule.id!,
      disabled: !rule.disabled,
    });
  }, [toggleFilterRule]);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmRule) {
      deleteFilterRule.mutate(deleteConfirmRule.id!);
      setDeleteConfirmRule(null);
    }
  }, [deleteConfirmRule, deleteFilterRule]);

  const handleShowStats = useCallback((rule: FilterRule) => {
    setStatsRule(rule);
  }, []);

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
      <div className={cn('p-component-md space-y-component-md', className)} role="status" aria-label="Loading filter rules">
        <div className="animate-pulse space-y-component-md">
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-component-md rounded-[var(--semantic-radius-card)] bg-error/10 border border-error/20', className)} role="alert" aria-live="assertive">
        <h3 className="font-semibold text-error mb-2">Error loading filter rules</h3>
        <p className="text-sm text-error/80">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={cn('p-component-lg text-center text-muted-foreground', className)} role="status">
        <p className="font-medium">
          {chain ? `No rules in ${chain} chain` : 'No filter rules found'}
        </p>
        <p className="text-sm mt-2">
          {chain
            ? `Add the first rule to the ${chain} chain to get started.`
            : 'Create filter rules to manage traffic on your router.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-component-sm', className)} role="list" aria-label="Filter rules">
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
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Remove the rule from the {deleteConfirmRule?.chain} chain</li>
              <li>Reorder subsequent rules automatically</li>
              <li>Take effect immediately on the router</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRule(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
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
});

FilterRulesTableMobile.displayName = 'FilterRulesTableMobile';
