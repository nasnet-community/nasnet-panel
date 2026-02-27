/**
 * Filter Rules Table Component (Desktop)
 *
 * Domain component for displaying filter rules with drag-drop reordering.
 * Desktop presenter with dense data table layout.
 *
 * Features:
 * - Drag-drop reordering using dnd-kit
 * - Inline enable/disable toggle
 * - Action buttons (Edit, Duplicate, Delete)
 * - Rule counter visualization
 * - Disabled rules styling (opacity-50)
 * - Unused rules badge (0 hits)
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
  useMoveFilterRule,
  useCreateFilterRule,
  useUpdateFilterRule,
} from '@nasnet/api-client/queries/firewall';
import type { FilterRule, FilterRuleInput, FilterChain } from '@nasnet/core/types';
import { CounterCell, FilterRuleEditor, RuleStatisticsPanel } from '@nasnet/ui/patterns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Copy, Trash2, GripVertical } from 'lucide-react';
import { useCounterSettingsStore } from '@nasnet/features/firewall';

// ============================================================================
// Constants
// ============================================================================

const HIGHLIGHT_ANIMATION_DELAY_MS = 100;
const DRAG_OPACITY_ACTIVE = 0.5;
const UNUSED_RULE_OPACITY = 0.6;
const MAX_TOUCH_TARGET_SIZE = 44;
const MIN_TOUCH_TARGET_SPACING = 8;

// ============================================================================
// Action Badge Component
// ============================================================================

/**
 * @description Displays the action type (accept, drop, etc.) with semantic color coding
 */
const ActionBadge = memo(function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  const VARIANT_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
    accept: 'success',
    drop: 'error',
    reject: 'error',
    log: 'info',
    jump: 'warning',
    tarpit: 'error',
    passthrough: 'default',
  };

  const variant = VARIANT_MAP[action] || 'default';

  return (
    <Badge variant={variant}>
      {action}
    </Badge>
  );
});
ActionBadge.displayName = 'ActionBadge';

// ============================================================================
// Chain Badge Component
// ============================================================================

/**
 * @description Displays the filter chain name (forward, input, output, etc.)
 */
const ChainBadge = memo(function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {chain}
    </Badge>
  );
});
ChainBadge.displayName = 'ChainBadge';

// ============================================================================
// Matchers Summary Component
// ============================================================================

/**
 * @description Displays a condensed summary of rule matching criteria (protocol, addresses, ports, etc.)
 */
const MatchersSummary = memo(function MatchersSummary({ rule }: { rule: FilterRule }) {
  const matchers: string[] = [];

  if (rule.protocol && rule.protocol !== 'all') matchers.push(`proto:${rule.protocol}`);
  if (rule.srcAddress) matchers.push(`src:${rule.srcAddress}`);
  if (rule.dstAddress) matchers.push(`dst:${rule.dstAddress}`);
  if (rule.srcPort) matchers.push(`sport:${rule.srcPort}`);
  if (rule.dstPort) matchers.push(`dport:${rule.dstPort}`);
  if (rule.inInterface) matchers.push(`in:${rule.inInterface}`);
  if (rule.outInterface) matchers.push(`out:${rule.outInterface}`);
  if (rule.connectionState && rule.connectionState.length > 0) {
    matchers.push(`state:${rule.connectionState.join(',')}`);
  }

  if (matchers.length === 0) {
    return <span className="text-muted-foreground">any</span>;
  }

  if (matchers.length <= 2) {
    return <span className="text-sm font-mono">{matchers.join(', ')}</span>;
  }

  return (
    <span className="text-sm font-mono">
      {matchers.slice(0, 2).join(', ')}
      <Badge variant="outline" className="ml-component-sm text-xs">
        +{matchers.length - 2} more
      </Badge>
    </span>
  );
});
MatchersSummary.displayName = 'MatchersSummary';

// ============================================================================
// Sortable Row Component
// ============================================================================

interface SortableRowProps {
  rule: FilterRule;
  maxBytes: number;
  onEdit: (rule: FilterRule) => void;
  onDuplicate: (rule: FilterRule) => void;
  onDelete: (rule: FilterRule) => void;
  onToggle: (rule: FilterRule) => void;
  onShowStats: (rule: FilterRule) => void;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLTableRowElement>;
}

/**
 * @description Table row component with drag-drop reordering and action buttons
 */
const SortableRow = memo(function SortableRow({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats, isHighlighted, highlightRef }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_ACTIVE : 1,
  };

  const isUnused = (rule.packets ?? 0) === 0;
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);
  const showRate = useCounterSettingsStore((state) => state.showRate);

  // Calculate percentage of max for progress bar
  const percentOfMax = maxBytes > 0 ? ((rule.bytes ?? 0) / maxBytes) * 100 : 0;

  const rowClassName = cn(
    rule.disabled && 'opacity-50 bg-muted',
    isUnused && 'bg-muted/50 opacity-60',
    isHighlighted && 'animate-highlight bg-warning/20'
  );

  return (
    <TableRow
      ref={(node) => {
        setNodeRef(node);
        if (isHighlighted && highlightRef) {
          (highlightRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }
      }}
      style={style}
      className={rowClassName}
    >
      {/* Drag handle */}
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </TableCell>

      {/* Position */}
      <TableCell className="font-mono text-xs">{rule.order ?? '-'}</TableCell>

      {/* Chain */}
      <TableCell>
        <ChainBadge chain={rule.chain} />
      </TableCell>

      {/* Action */}
      <TableCell>
        <ActionBadge action={rule.action} />
      </TableCell>

      {/* Matchers */}
      <TableCell>
        <MatchersSummary rule={rule} />
      </TableCell>

      {/* Traffic (Counter Cell) */}
      <TableCell
        className="cursor-pointer hover:bg-muted/50 transition-colors"
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
          showRate={showRate}
          showBar={showRelativeBar}
        />
      </TableCell>

      {/* Enabled Toggle */}
      <TableCell>
        <Switch
          checked={!rule.disabled}
          onCheckedChange={() => onToggle(rule)}
          aria-label={rule.disabled ? 'Enable rule' : 'Disable rule'}
        />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex gap-component-xs" role="group" aria-label="Rule actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(rule)}
            aria-label="Edit rule"
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(rule)}
            aria-label="Duplicate rule"
            className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule)}
            className="hover:text-error focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
SortableRow.displayName = 'SortableRow';

// ============================================================================
// Main Component
// ============================================================================

export interface FilterRulesTableDesktopProps {
  className?: string;
  chain?: FilterChain;
}

/**
 * FilterRulesTableDesktop Component
 *
 * @description Desktop-optimized table for managing MikroTik filter rules with drag-drop reordering,
 * inline toggle, and detailed statistics visualization. Supports rule search highlight and traffic monitoring.
 *
 * Features:
 * - Drag-drop reordering with keyboard support
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions with confirmation
 * - Counter visualization (packets/bytes) with relative bar
 * - Disabled rules styling
 * - Unused rules highlighting (0 hits)
 * - URL-based rule highlighting with auto-scroll
 * - Traffic statistics panel with export
 *
 * @param props - Component props with optional className and chain filter
 * @returns Filter rules table component or loading/error state
 */
export const FilterRulesTableDesktop = memo(function FilterRulesTableDesktop({ className, chain }: FilterRulesTableDesktopProps) {
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const pollingInterval = useCounterSettingsStore((state) => state.pollingInterval);

  // Get highlight parameter from URL search params
  const searchParams = useSearch({ strict: false }) as { highlight?: string };
  const highlightRuleId = searchParams.highlight;
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const { data: rules, isLoading, error } = useFilterRules(routerIp, {
    chain,
    refetchInterval: pollingInterval || false
  });
  const deleteFilterRule = useDeleteFilterRule(routerIp);
  const toggleFilterRule = useToggleFilterRule(routerIp);
  const moveFilterRule = useMoveFilterRule(routerIp);
  const createFilterRule = useCreateFilterRule(routerIp);
  const updateFilterRule = useUpdateFilterRule(routerIp);

  const [editingRule, setEditingRule] = useState<FilterRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<FilterRule | null>(null);
  const [statsRule, setStatsRule] = useState<FilterRule | null>(null);

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort rules by order
  const sortedRules = rules ? [...rules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  // Calculate max bytes for relative bar
  const maxBytes = useMemo(() => {
    if (!sortedRules || sortedRules.length === 0) return 0;
    return Math.max(...sortedRules.map(r => r.bytes ?? 0));
  }, [sortedRules]);

  // Handlers (wrapped with useCallback for stable references)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRules.findIndex((r) => r.id === active.id);
      const newIndex = sortedRules.findIndex((r) => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const rule = sortedRules[oldIndex];
        moveFilterRule.mutate({
          ruleId: rule.id!,
          destination: newIndex,
        });
      }
    }
  }, [sortedRules, moveFilterRule]);

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

  const handleConfirmDelete = useCallback(() => {
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
      }, HIGHLIGHT_ANIMATION_DELAY_MS);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [highlightRuleId, sortedRules]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-component-md', className)} role="status" aria-live="polite">
        <div className="space-y-component-lg">
          {/* Table header skeleton */}
          <div className="h-10 bg-muted rounded animate-pulse" />
          {/* Row skeletons */}
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-12 bg-muted/60 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn('p-component-xl', className)}
        role="alert"
        aria-live="assertive"
      >
        <div className="rounded-md bg-error/10 p-component-md border border-error/20">
          <h3 className="font-semibold text-error mb-component-sm">Failed to load filter rules</h3>
          <p className="text-sm text-error/80">
            {error.message || 'An error occurred while retrieving filter rules. Please check your connection and try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={cn('p-component-xl text-center', className)}>
        <div className="space-y-component-md">
          <p className="text-muted-foreground font-medium">
            {chain ? `No rules in ${chain} chain` : 'No filter rules found'}
          </p>
          <p className="text-sm text-muted-foreground">
            {chain
              ? `Add the first rule to the ${chain} chain to get started.`
              : 'Create filter rules to manage traffic on your router.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table aria-label={chain ? `Filter rules in ${chain} chain` : 'Filter rules'}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" scope="col">
                  <span className="sr-only">Drag handle</span>
                </TableHead>
                <TableHead scope="col">#</TableHead>
                <TableHead scope="col">Chain</TableHead>
                <TableHead scope="col">Action</TableHead>
                <TableHead scope="col">Matchers</TableHead>
                <TableHead scope="col" className="hidden lg:table-cell">
                  Traffic
                </TableHead>
                <TableHead scope="col">Enabled</TableHead>
                <TableHead scope="col">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={sortedRules.map((r) => r.id!)}
                strategy={verticalListSortingStrategy}
              >
                {sortedRules.map((rule) => (
                  <SortableRow
                    key={rule.id}
                    rule={rule}
                    maxBytes={maxBytes}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    onShowStats={handleShowStats}
                    isHighlighted={highlightRuleId === rule.id}
                    highlightRef={highlightRuleId === rule.id ? highlightRef : undefined}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
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
          <div className="py-component-lg">
            <p className="text-sm font-semibold mb-component-sm">This will:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-component-xs">
              <li>Remove the rule from the <span className="font-mono">{deleteConfirmRule?.chain}</span> chain</li>
              <li>Reorder subsequent rules automatically</li>
              <li>Take effect immediately on the router</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRule(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
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
          historyData={[]}
          onExportCsv={() => {
            // TODO: Implement CSV export using counterHistoryStorage.exportToCsv
            console.log('Export CSV for rule:', statsRule.id);
          }}
        />
      )}
    </>
  );
});

FilterRulesTableDesktop.displayName = 'FilterRulesTableDesktop';
