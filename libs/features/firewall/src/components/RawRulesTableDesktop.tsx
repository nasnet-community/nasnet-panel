/**
 * RAW Rules Table Component (Desktop)
 *
 * Domain component for displaying RAW rules with drag-drop reordering.
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
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useRawRules,
  useDeleteRawRule,
  useToggleRawRule,
  useReorderRawRules,
  useCreateRawRule,
  useUpdateRawRule,
} from '@nasnet/api-client/queries/firewall';
import type { RawRule, RawRuleInput, RawChain } from '@nasnet/core/types';
import {
  RawRuleEditor,
  CounterCell,
} from '@nasnet/ui/patterns';
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

const HIGHLIGHT_SCROLL_DELAY_MS = 100;

// ============================================================================
// Action Badge Component
// ============================================================================

/**
 * Renders a status badge for RAW rule actions
 * @description Maps action types to semantic color variants
 */
const ActionBadge = ({ action }: { action: string }) => {
  const VARIANT_MAP: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
    accept: 'success',
    drop: 'error',
    notrack: 'warning',
    log: 'info',
    jump: 'warning',
  };

  const variant = VARIANT_MAP[action] || 'default';

  return (
    <Badge variant={variant}>
      {action}
    </Badge>
  );
};

ActionBadge.displayName = 'ActionBadge';

/**
 * Renders a badge for firewall chain names
 * @description Uses font-mono for technical data display
 */
const ChainBadge = ({ chain }: { chain: string }) => {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {chain}
    </Badge>
  );
};

ChainBadge.displayName = 'ChainBadge';

/**
 * Renders a summary of rule matchers
 * @description Computes matcher display from rule properties and renders truncated view
 */
const MatchersSummary = ({ rule }: { rule: RawRule }) => {
  const matchers = useMemo(() => {
    const m: string[] = [];
    if (rule.protocol && rule.protocol !== 'all') m.push(`proto:${rule.protocol}`);
    if (rule.srcAddress) m.push(`src:${rule.srcAddress}`);
    if (rule.dstAddress) m.push(`dst:${rule.dstAddress}`);
    if (rule.srcPort) m.push(`sport:${rule.srcPort}`);
    if (rule.dstPort) m.push(`dport:${rule.dstPort}`);
    if (rule.inInterface) m.push(`in:${rule.inInterface}`);
    if (rule.outInterface) m.push(`out:${rule.outInterface}`);
    if (rule.limit) {
      m.push(`limit:${rule.limit.rate}`);
    }
    return m;
  }, [rule]);

  if (matchers.length === 0) {
    return <span className="text-muted">any</span>;
  }

  if (matchers.length <= 2) {
    return <span className="text-sm font-mono">{matchers.join(', ')}</span>;
  }

  return (
    <span className="text-sm font-mono">
      {matchers.slice(0, 2).join(', ')}
      <Badge variant="outline" className="ml-2 text-xs">
        +{matchers.length - 2} more
      </Badge>
    </span>
  );
};

MatchersSummary.displayName = 'MatchersSummary';

// ============================================================================
// Sortable Row Component
// ============================================================================

interface SortableRowProps {
  /** Rule data to display */
  rule: RawRule;
  /** Maximum bytes for relative bar calculation */
  maxBytes: number;
  /** Callback when edit button clicked */
  onEdit: (rule: RawRule) => void;
  /** Callback when duplicate button clicked */
  onDuplicate: (rule: RawRule) => void;
  /** Callback when delete button clicked */
  onDelete: (rule: RawRule) => void;
  /** Callback when toggle switch changed */
  onToggle: (rule: RawRule) => void;
  /** Whether this row is highlighted */
  isHighlighted?: boolean;
  /** Ref to highlight element for scroll-to-view */
  highlightRef?: React.RefObject<HTMLTableRowElement>;
}

/**
 * Renders a draggable table row for a RAW rule
 * @description Uses dnd-kit for drag-drop, displays rule details and actions
 */
const SortableRow = ({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, isHighlighted, highlightRef }: SortableRowProps) => {
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
      className={cn(
        rule.disabled && 'opacity-50 bg-muted/50',
        isUnused && 'bg-muted/40 opacity-60',
        isHighlighted && 'animate-highlight bg-warning/20'
      )}
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
      <TableCell className="hidden lg:table-cell">
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
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(rule)}
            aria-label="Duplicate rule"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule)}
            className="text-destructive hover:text-destructive/80"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

SortableRow.displayName = 'SortableRow';

// ============================================================================
// Main Component
// ============================================================================

export interface RawRulesTableDesktopProps {
  /** Optional className for styling */
  className?: string;
  /** Optional chain filter */
  chain?: string;
}

/**
 * RawRulesTableDesktop Component
 * @description Desktop presenter for RAW firewall rules with drag-drop reordering
 *
 * Features:
 * - Drag-drop reordering with dnd-kit
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions
 * - Counter visualization (packets/bytes with relative bar)
 * - Disabled rules styling (opacity-50)
 * - Unused rules badge (zero packets)
 * - Highlight scroll-to-view for recently created/edited rules
 *
 * @example
 * ```tsx
 * <RawRulesTableDesktop chain="forward" />
 * ```
 */
export const RawRulesTableDesktop = ({ className, chain }: RawRulesTableDesktopProps) => {
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const pollingInterval = useCounterSettingsStore((state) => state.pollingInterval);

  // Get highlight parameter from URL search params
  const searchParams = useSearch({ strict: false }) as { highlight?: string };
  const highlightRuleId = searchParams.highlight;
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const { data: rules, isLoading, error } = useRawRules(routerIp, {
    chain: chain as RawChain | undefined,
    refetchInterval: pollingInterval || false
  });
  const deleteRawRule = useDeleteRawRule(routerIp);
  const toggleRawRule = useToggleRawRule(routerIp);
  const reorderRawRules = useReorderRawRules(routerIp);
  const createRawRule = useCreateRawRule(routerIp);
  const updateRawRule = useUpdateRawRule(routerIp);

  const [editingRule, setEditingRule] = useState<RawRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RawRule | null>(null);

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

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRules.findIndex((r) => r.id === active.id);
      const newIndex = sortedRules.findIndex((r) => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const rule = sortedRules[oldIndex];
        reorderRawRules.mutate({
          ruleId: rule.id!,
          destination: newIndex,
        });
      }
    }
  }, [sortedRules, reorderRawRules]);

  const handleEdit = useCallback((rule: RawRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  }, []);

  const handleDuplicate = useCallback((rule: RawRule) => {
    const duplicatedRule = { ...rule, id: undefined, order: undefined };
    setEditingRule(duplicatedRule);
    setIsEditorOpen(true);
  }, []);

  const handleSaveRule = useCallback(async (ruleInput: RawRuleInput) => {
    if (editingRule?.id) {
      await updateRawRule.mutateAsync({
        ruleId: editingRule.id,
        updates: ruleInput,
      });
    } else {
      await createRawRule.mutateAsync(ruleInput);
    }
    setIsEditorOpen(false);
    setEditingRule(null);
  }, [editingRule, updateRawRule, createRawRule]);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingRule(null);
  }, []);

  const handleDelete = useCallback((rule: RawRule) => {
    setDeleteConfirmRule(rule);
  }, []);

  const handleToggle = useCallback((rule: RawRule) => {
    toggleRawRule.mutate({
      ruleId: rule.id!,
      disabled: !rule.disabled,
    });
  }, [toggleRawRule]);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmRule) {
      deleteRawRule.mutate(deleteConfirmRule.id!);
      setDeleteConfirmRule(null);
    }
  }, [deleteConfirmRule, deleteRawRule]);

  // ========================================================================
  // Effects
  // ========================================================================

  useEffect(() => {
    if (highlightRuleId && highlightRef.current) {
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, HIGHLIGHT_SCROLL_DELAY_MS);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [highlightRuleId, sortedRules]);

  // ========================================================================
  // Render States
  // ========================================================================

  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4 animate-pulse', className)}>
        <div className="h-10 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-destructive rounded-lg bg-destructive/10', className)}>
        <p className="font-medium">{t('raw.notifications.error.loadRules', 'Error loading RAW rules')}</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className={cn('p-8 text-center space-y-2', className)}>
        <p className="font-semibold text-foreground">
          {chain
            ? t('raw.emptyStates.noRulesInChain.title', 'No rules in {{chain}}', { chain })
            : t('raw.emptyStates.noRules.title', 'No RAW rules found')}
        </p>
        <p className="text-sm text-muted-foreground">
          {chain
            ? t('raw.emptyStates.noRulesInChain.description', 'This chain has no rules configured.')
            : t('raw.emptyStates.noRules.description', 'RAW rules process packets before connection tracking.')}
        </p>
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
                    isHighlighted={highlightRuleId === rule.id}
                    highlightRef={highlightRuleId === rule.id ? highlightRef : undefined}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Edit/Create RAW Rule Editor */}
      <RawRuleEditor
        routerId={routerIp}
        initialRule={editingRule || undefined}
        open={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveRule}
        onDelete={editingRule?.id ? () => handleDelete(editingRule) : undefined}
        isSaving={createRawRule.isPending || updateRawRule.isPending}
        isDeleting={deleteRawRule.isPending}
        mode={editingRule?.id ? 'edit' : 'create'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && setDeleteConfirmRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('raw.dialogs.deleteRule.title', 'Delete RAW Rule?')}</DialogTitle>
            <DialogDescription>
              {t('raw.dialogs.deleteRule.warning', 'This action cannot be undone. The rule will be permanently removed.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">{t('raw.dialogs.deleteRule.message', 'This will:')}</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Remove the rule from the {deleteConfirmRule?.chain} chain</li>
              <li>Reorder subsequent rules automatically</li>
              <li>Take effect immediately on the router</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRule(null)}>
              {t('raw.buttons.cancel', 'Cancel')}
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {t('raw.buttons.delete', 'Delete Rule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

RawRulesTableDesktop.displayName = 'RawRulesTableDesktop';
