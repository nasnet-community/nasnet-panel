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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore } from '@nasnet/state/stores';
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

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    'mark-connection': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'mark-packet': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'mark-routing': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'change-dscp': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'change-ttl': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'change-mss': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'accept': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'drop': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'jump': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'log': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };

  const colorClass = colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

  return (
    <Badge variant="outline" className={colorClass}>
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

function MatchersSummary({ rule }: { rule: MangleRule }) {
  const matchers: string[] = [];

  if (rule.protocol) matchers.push(`proto:${rule.protocol}`);
  if (rule.srcAddress) matchers.push(`src:${rule.srcAddress}`);
  if (rule.dstAddress) matchers.push(`dst:${rule.dstAddress}`);
  if (rule.srcPort) matchers.push(`sport:${rule.srcPort}`);
  if (rule.dstPort) matchers.push(`dport:${rule.dstPort}`);
  if (rule.inInterface) matchers.push(`in:${rule.inInterface}`);
  if (rule.outInterface) matchers.push(`out:${rule.outInterface}`);

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
  rule: MangleRule;
  onEdit: (rule: MangleRule) => void;
  onDuplicate: (rule: MangleRule) => void;
  onDelete: (rule: MangleRule) => void;
  onToggle: (rule: MangleRule) => void;
}

function SortableRow({ rule, onEdit, onDuplicate, onDelete, onToggle }: SortableRowProps) {
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
      className={rule.disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''}
    >
      {/* Drag handle */}
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </TableCell>

      {/* Position */}
      <TableCell className="font-mono text-xs">{rule.position ?? '-'}</TableCell>

      {/* Chain */}
      <TableCell>
        <ChainBadge chain={rule.chain} />
      </TableCell>

      {/* Action */}
      <TableCell>
        <ActionBadge action={rule.action} />
      </TableCell>

      {/* Mark Value */}
      <TableCell className="font-mono text-sm">{markValue}</TableCell>

      {/* Matchers */}
      <TableCell>
        <MatchersSummary rule={rule} />
      </TableCell>

      {/* Packets */}
      <TableCell className="font-mono text-sm">
        {isUnused ? (
          <Badge variant="outline" className="text-xs text-slate-500">
            unused
          </Badge>
        ) : (
          (rule.packets ?? 0).toLocaleString()
        )}
      </TableCell>

      {/* Bytes */}
      <TableCell className="font-mono text-sm">
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

export interface MangleRulesTableDesktopProps {
  className?: string;
  chain?: string;
}

/**
 * MangleRulesTableDesktop Component
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
 * @returns Mangle rules table component
 */
export function MangleRulesTableDesktop({ className, chain }: MangleRulesTableDesktopProps) {
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
        {t('mangle.notifications.error.load')}: {error.message}
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        {chain ? t('mangle.table.noRulesInChain') : t('mangle.table.noRules')}
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
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">{t('mangle.dialogs.deleteRule.warning')}</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
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
}
