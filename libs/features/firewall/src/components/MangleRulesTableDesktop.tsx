/**
 * Mangle Rules Table Component (Desktop)
 *
 * Domain component for displaying mangle rules with drag-drop reordering.
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
 * @see NAS-7.5: Implement Mangle Rules - Task 5
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/utils';
import {
  useMangleRules,
  useDeleteMangleRule,
  useToggleMangleRule,
  useMoveMangleRule,
} from '@nasnet/api-client/queries/firewall';
import { useMangleRuleTable } from '@nasnet/ui/patterns/mangle-rule-table';
import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
import type { MangleRule } from '@nasnet/core/types';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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

// ============================================================================
// Action Badge Component
// ============================================================================

/**
 * ActionBadge Component
 * Displays mangle action type with semantic color coding
 */
const ActionBadge = React.memo(function ActionBadgeComponent({ action }: { action: string }) {
  ActionBadge.displayName = 'ActionBadge';

  const ACTION_COLORS: Record<string, string> = {
    'mark-connection': 'bg-info/10 text-info',
    'mark-packet': 'bg-primary/10 text-primary',
    'mark-routing': 'bg-success/10 text-success',
    'change-dscp': 'bg-warning/10 text-warning',
    'change-ttl': 'bg-info/10 text-info',
    'change-mss': 'bg-primary/10 text-primary',
    'accept': 'bg-success/10 text-success',
    'drop': 'bg-error/10 text-error',
    'jump': 'bg-primary/10 text-primary',
    'log': 'bg-muted text-muted-foreground',
  };

  const colorClass = ACTION_COLORS[action] || 'bg-muted text-muted-foreground';

  return (
    <Badge variant="outline" className={colorClass}>
      {action}
    </Badge>
  );
});

// ============================================================================
// Chain Badge Component
// ============================================================================

/**
 * ChainBadge Component
 * Displays mangle chain name with monospace formatting
 */
const ChainBadge = React.memo(function ChainBadgeComponent({ chain }: { chain: string }) {
  ChainBadge.displayName = 'ChainBadge';
  return (
    <Badge variant="secondary" className="font-mono tabular-nums text-xs">
      {chain}
    </Badge>
  );
});

// ============================================================================
// Matchers Summary Component
// ============================================================================

/**
 * MatchersSummary Component
 * Displays a compact summary of rule matchers with overflow indicator
 */
const MatchersSummary = React.memo(function MatchersSummaryComponent({ rule }: { rule: MangleRule }) {
  MatchersSummary.displayName = 'MatchersSummary';

  const matchers = useMemo(() => {
    const result: string[] = [];
    if (rule.protocol) result.push(`proto:${rule.protocol}`);
    if (rule.srcAddress) result.push(`src:${rule.srcAddress}`);
    if (rule.dstAddress) result.push(`dst:${rule.dstAddress}`);
    if (rule.srcPort) result.push(`sport:${rule.srcPort}`);
    if (rule.dstPort) result.push(`dport:${rule.dstPort}`);
    if (rule.inInterface) result.push(`in:${rule.inInterface}`);
    if (rule.outInterface) result.push(`out:${rule.outInterface}`);
    return result;
  }, [rule]);

  if (matchers.length === 0) {
    return <span className="text-muted-foreground text-sm">any</span>;
  }

  if (matchers.length <= 2) {
    return <span className="text-sm font-mono">{matchers.join(', ')}</span>;
  }

  return (
    <span className="text-sm">
      <span className="font-mono">{matchers.slice(0, 2).join(', ')}</span>
      <Badge variant="outline" className="ml-component-sm text-xs">
        +{matchers.length - 2} more
      </Badge>
    </span>
  );
});

// ============================================================================
// Sortable Row Component
// ============================================================================

interface SortableRowProps {
  rule: MangleRule;
  onEdit: (rule: MangleRule) => void;
  onDuplicate: (rule: MangleRule) => void;
  onDelete: (rule: MangleRule) => void;
  onToggle: (rule: MangleRule) => void;
  className?: string;
}

/**
 * SortableRow Component
 * Draggable table row for mangle rules with action buttons
 */
const SortableRow = React.memo(function SortableRowComponent({
  rule,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  className,
}: SortableRowProps) {
  SortableRow.displayName = 'SortableRow';
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
  const markValue = rule.newConnectionMark || rule.newPacketMark || rule.newRoutingMark || '-';

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={rule.disabled ? 'opacity-50 bg-muted/50' : ''}
    >
      {/* Drag handle */}
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-category-firewall" />
      </TableCell>

      {/* Position */}
      <TableCell className="font-mono tabular-nums text-xs">{rule.position ?? '-'}</TableCell>

      {/* Chain */}
      <TableCell>
        <ChainBadge chain={rule.chain} />
      </TableCell>

      {/* Action */}
      <TableCell>
        <ActionBadge action={rule.action} />
      </TableCell>

      {/* Mark Value */}
      <TableCell className="font-mono tabular-nums text-sm">{markValue}</TableCell>

      {/* Matchers */}
      <TableCell>
        <MatchersSummary rule={rule} />
      </TableCell>

      {/* Packets */}
      <TableCell className="font-mono tabular-nums text-sm">
        {isUnused ? (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            unused
          </Badge>
        ) : (
          (rule.packets ?? 0).toLocaleString()
        )}
      </TableCell>

      {/* Bytes */}
      <TableCell className="font-mono tabular-nums text-sm">
        {(rule.bytes ?? 0).toLocaleString()}
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
        <div className="flex gap-component-xs">
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
            className="text-error hover:text-error/80"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export interface MangleRulesTableDesktopProps {
  className?: string;
  chain?: string;
}

/**
 * MangleRulesTableDesktop Component
 *
 * @description Desktop-optimized dense table for mangle rules with
 * drag-drop reordering and inline actions.
 *
 * Features:
 * - Drag-drop reordering
 * - Inline enable/disable toggle
 * - Edit/Duplicate/Delete actions
 * - Counter visualization (packets/bytes)
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @example
 * ```tsx
 * <MangleRulesTableDesktop
 *   chain="forward"
 *   className="rounded-lg border"
 * />
 * ```
 */
export const MangleRulesTableDesktop = React.memo(function MangleRulesTableDesktopComponent({
  className,
  chain,
}: MangleRulesTableDesktopProps) {
  MangleRulesTableDesktop.displayName = 'MangleRulesTableDesktop';
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: rules, isLoading, error } = useMangleRules(routerIp, chain ? { chain: chain as any } : undefined);
  const deleteMangleRule = useDeleteMangleRule(routerIp);
  const toggleMangleRule = useToggleMangleRule(routerIp);
  const moveMangleRule = useMoveMangleRule(routerIp);

  const [editingRule, setEditingRule] = useState<MangleRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<MangleRule | null>(null);

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Use the headless hook
  const { data: sortedRules } = useMangleRuleTable({
    data: rules || [],
    initialSortBy: 'position',
    initialSortDirection: 'asc',
    initialFilters: chain ? { chain } : {},
  });

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedRules.findIndex((r) => r.id === active.id);
      const newIndex = sortedRules.findIndex((r) => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const rule = sortedRules[oldIndex];
        moveMangleRule.mutate({
          ruleId: rule.id!,
          destination: newIndex,
        });
      }
    }
  };

  const handleEdit = (rule: MangleRule) => {
    setEditingRule(rule);
  };

  const handleDuplicate = (rule: MangleRule) => {
    const duplicatedRule = { ...rule, id: undefined, position: undefined };
    setEditingRule(duplicatedRule);
  };

  const handleDelete = (rule: MangleRule) => {
    setDeleteConfirmRule(rule);
  };

  const handleToggle = (rule: MangleRule) => {
    toggleMangleRule.mutate({
      ruleId: rule.id!,
      disabled: !rule.disabled,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmRule) {
      deleteMangleRule.mutate(deleteConfirmRule.id!);
      setDeleteConfirmRule(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-component-md', className)}>
        <div className="animate-pulse space-y-component-md">
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
      <div className={cn('p-component-md text-error', className)} role="alert">
        <p className="font-semibold mb-component-xs">{t('mangle.notifications.error.load')}</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={cn('p-component-lg text-center', className)}>
        <p className="text-muted-foreground">
          {chain ? t('mangle.table.noRulesInChain') : t('mangle.table.noRules')}
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
                <TableHead>{t('mangle.table.columns.position')}</TableHead>
                <TableHead>{t('mangle.table.columns.chain')}</TableHead>
                <TableHead>{t('mangle.table.columns.action')}</TableHead>
                <TableHead>{t('mangle.table.columns.markValue')}</TableHead>
                <TableHead>{t('mangle.table.columns.matchers')}</TableHead>
                <TableHead>{t('mangle.table.columns.packets')}</TableHead>
                <TableHead>{t('mangle.table.columns.bytes')}</TableHead>
                <TableHead>{t('mangle.table.columns.enabled')}</TableHead>
                <TableHead>{t('mangle.table.columns.actions')}</TableHead>
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
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingRule?.id ? t('mangle.dialogs.editRule.title') : t('mangle.dialogs.addRule.title')}
            </SheetTitle>
            <SheetDescription>
              {editingRule?.id ? t('mangle.dialogs.editRule.description') : t('mangle.dialogs.addRule.description')}
            </SheetDescription>
          </SheetHeader>
          {editingRule && (
            <MangleRuleEditor
              routerId={routerIp}
              initialRule={editingRule}
              open={!!editingRule}
              onClose={() => setEditingRule(null)}
              onSave={async () => setEditingRule(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && setDeleteConfirmRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('mangle.dialogs.deleteRule.title')}</DialogTitle>
            <DialogDescription>
              {t('mangle.dialogs.deleteRule.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-component-md">
            <p className="text-sm font-semibold mb-component-sm">{t('mangle.dialogs.deleteRule.warning')}</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-component-xs">
              {(t('mangle.dialogs.deleteRule.consequences', { returnObjects: true }) as string[]).map((consequence, i) => (
                <li key={i}>{consequence}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmRule(null)}>
              {t('button.cancel', { ns: 'common' })}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('button.delete', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
