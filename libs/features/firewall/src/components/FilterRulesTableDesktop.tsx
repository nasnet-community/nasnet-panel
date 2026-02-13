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

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useFilterRules,
  useDeleteFilterRule,
  useToggleFilterRule,
  useMoveFilterRule,
  useCreateFilterRule,
  useUpdateFilterRule,
} from '@nasnet/api-client/queries/firewall';
import type { FilterRule, FilterRuleInput } from '@nasnet/core/types';
import { CounterCell, FilterRuleEditor } from '@nasnet/ui/patterns';
import { RuleStatisticsPanel } from '@nasnet/ui/patterns';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
// Action Badge Component (Refactored to use Badge with semantic variants)
// ============================================================================

function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  const variantMap: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'info'> = {
    accept: 'success',
    drop: 'destructive',
    reject: 'destructive',
    log: 'info',
    jump: 'warning',
    tarpit: 'destructive',
    passthrough: 'default',
  };

  const variant = variantMap[action] || 'default';

  return (
    <Badge variant={variant}>
      {action}
    </Badge>
  );
}

// ============================================================================
// Chain Badge Component
// ============================================================================

function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {chain}
    </Badge>
  );
}

// ============================================================================
// Matchers Summary Component
// ============================================================================

function MatchersSummary({ rule }: { rule: FilterRule }) {
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
    return <span className="text-slate-500 dark:text-slate-400">any</span>;
  }

  if (matchers.length <= 2) {
    return <span className="text-sm">{matchers.join(', ')}</span>;
  }

  return (
    <span className="text-sm">
      {matchers.slice(0, 2).join(', ')}
      <Badge variant="outline" className="ml-2 text-xs">
        +{matchers.length - 2} more
      </Badge>
    </span>
  );
}

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

function SortableRow({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats, isHighlighted, highlightRef }: SortableRowProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const isUnused = (rule.packets ?? 0) === 0;
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);
  const showRate = useCounterSettingsStore((state) => state.showRate);

  // Calculate percentage of max for progress bar
  const percentOfMax = maxBytes > 0 ? ((rule.bytes ?? 0) / maxBytes) * 100 : 0;

  return (
    <TableRow
      ref={(node) => {
        setNodeRef(node);
        if (isHighlighted && highlightRef) {
          (highlightRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }
      }}
      style={style}
      className={`${rule.disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''} ${isUnused ? 'bg-muted/50 opacity-60' : ''} ${isHighlighted ? 'animate-highlight bg-warning/20' : ''}`}
    >
      {/* Drag handle */}
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-slate-400" />
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
        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
        onClick={() => onShowStats(rule)}
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(rule)}
            aria-label="Edit rule"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(rule)}
            aria-label="Duplicate rule"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule)}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface FilterRulesTableDesktopProps {
  className?: string;
  chain?: string;
}

/**
 * FilterRulesTableDesktop Component
 *
 * Features:
 * - Drag-drop reordering
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions
 * - Counter visualization (packets/bytes)
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @param props - Component props
 * @returns Filter rules table component
 */
export function FilterRulesTableDesktop({ className, chain }: FilterRulesTableDesktopProps) {
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

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
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
  };

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
  }, [highlightRuleId, sortedRules]);

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
      <div className={className}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>#</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Matchers</TableHead>
                <TableHead className="hidden lg:table-cell">Traffic</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
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
      <AlertDialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && setDeleteConfirmRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filter Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently removed from the firewall configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">This will:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Remove the rule from the {deleteConfirmRule?.chain} chain</li>
              <li>Reorder subsequent rules automatically</li>
              <li>Take effect immediately on the router</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
