/**
 * Rate Limit Rules Table - Desktop Presenter
 * Dense data table layout with drag-drop reordering
 *
 * Features:
 * - Drag-drop reordering using dnd-kit
 * - Inline enable/disable toggle
 * - Action badges with semantic colors
 * - Counter visualization (triggered count)
 * - Disabled rules styling (opacity-50)
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Copy, Trash2, GripVertical } from 'lucide-react';
import type { RateLimitRule } from '@nasnet/core/types';
import type { RateLimitRulesTablePresenterProps, SortableRowProps } from './types';

// ============================================================================
// Action Badge Component
// ============================================================================

function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  // drop=destructive (red), tarpit=warning (amber), add-to-list=info (blue)
  const variantMap: Record<string, 'default' | 'success' | 'destructive' | 'warning' | 'info'> = {
    drop: 'destructive', // Red
    tarpit: 'warning', // Amber
    'add-to-list': 'info', // Blue
  };

  const variant = variantMap[action] || 'default';

  return <Badge variant={variant}>{action}</Badge>;
}

// ============================================================================
// Sortable Row Component
// ============================================================================

function SortableRow({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, onShowStats }: SortableRowProps) {
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

  // Calculate percentage of max for progress bar
  const percentOfMax = maxBytes > 0 ? ((rule.bytes ?? 0) / maxBytes) * 100 : 0;

  // Format time window for display
  const timeWindowMap: Record<string, string> = {
    'per-second': '/ sec',
    'per-minute': '/ min',
    'per-hour': '/ hour',
  };
  const timeWindowDisplay = timeWindowMap[rule.timeWindow] || rule.timeWindow;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`${rule.disabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''} ${isUnused ? 'bg-muted/50 opacity-60' : ''}`}
    >
      {/* Drag handle */}
      <TableCell className="w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </TableCell>

      {/* Source */}
      <TableCell>
        <span className="text-sm font-mono">
          {rule.srcAddress || rule.srcAddressList || 'any'}
        </span>
      </TableCell>

      {/* Limit */}
      <TableCell>
        <span className="text-sm font-semibold">{rule.connectionLimit}</span>
      </TableCell>

      {/* Time Window */}
      <TableCell>
        <span className="text-sm text-slate-600 dark:text-slate-400">{timeWindowDisplay}</span>
      </TableCell>

      {/* Action */}
      <TableCell>
        <ActionBadge action={rule.action} />
      </TableCell>

      {/* List Name (only for add-to-list action) */}
      <TableCell>
        {rule.action === 'add-to-list' && rule.addressList ? (
          <Badge variant="outline" className="font-mono text-xs">
            {rule.addressList}
          </Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </TableCell>

      {/* Triggered Count */}
      <TableCell
        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
        onClick={() => onShowStats(rule)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{rule.packets ?? 0}</span>
          {percentOfMax > 0 && (
            <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(percentOfMax, 100)}%` }}
              />
            </div>
          )}
        </div>
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
// Main Desktop Presenter Component
// ============================================================================

export interface RateLimitRulesTableDesktopProps extends Omit<RateLimitRulesTablePresenterProps, 'pollingInterval'> {
  editingRule: RateLimitRule | null;
  deleteConfirmRule: RateLimitRule | null;
  statsRule: RateLimitRule | null;
  confirmDelete: () => void;
  closeEdit: () => void;
  closeDelete: () => void;
  closeStats: () => void;
}

/**
 * RateLimitRulesTableDesktop Component
 *
 * Desktop presenter with dense data table layout.
 * Features drag-drop reordering, inline toggles, and action badges.
 *
 * @param props - Component props
 * @returns Rate limit rules table component (desktop)
 */
export function RateLimitRulesTableDesktop({
  className,
  rules,
  isLoading,
  error,
  maxBytes,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onShowStats,
  onReorder,
  editingRule,
  deleteConfirmRule,
  statsRule,
  confirmDelete,
  closeEdit,
  closeDelete,
  closeStats,
}: RateLimitRulesTableDesktopProps) {
  const { t } = useTranslation('firewall');

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler for drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
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
        Error loading rate limit rules: {error.message}
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-8 text-center ${className || ''}`}>
        <p className="text-slate-500 dark:text-slate-400 mb-4">No rate limit rules found</p>
        <Button onClick={() => onEdit({} as RateLimitRule)}>Add Rate Limit Rule</Button>
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
                <TableHead className="w-8" aria-label="Drag handle" />
                <TableHead>Source</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Time Window</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>List Name</TableHead>
                <TableHead>Triggered</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={rules.map((r) => r.id!)}
                strategy={verticalListSortingStrategy}
              >
                {rules.map((rule) => (
                  <SortableRow
                    key={rule.id}
                    rule={rule}
                    maxBytes={maxBytes}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onToggle={onToggle}
                    onShowStats={onShowStats}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Edit/Create Sheet - Will integrate RateLimitRuleEditor when available */}
      <Sheet open={!!editingRule} onOpenChange={(open) => !open && closeEdit()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingRule?.id ? 'Edit Rate Limit Rule' : 'Add Rate Limit Rule'}
            </SheetTitle>
            <SheetDescription>
              {editingRule?.id ? 'Modify the rate limit rule configuration' : 'Create a new rate limit rule'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              RateLimitRuleEditor component will be integrated here (Task #2)
            </p>
            <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
              {JSON.stringify(editingRule, null, 2)}
            </pre>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && closeDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rate Limit Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently removed from the firewall configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold mb-2">This will:</p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Remove the rate limiting rule</li>
              <li>Stop blocking connections from this source</li>
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

      {/* Statistics Panel - Placeholder for RuleStatisticsPanel */}
      {statsRule && (
        <Sheet open={!!statsRule} onOpenChange={(open) => !open && closeStats()}>
          <SheetContent className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Rule Statistics</SheetTitle>
              <SheetDescription>
                Traffic and trigger statistics for this rate limit rule
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                RuleStatisticsPanel will be integrated here
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Packets:</span>
                  <span className="text-sm font-mono">{statsRule.packets ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bytes:</span>
                  <span className="text-sm font-mono">{statsRule.bytes ?? 0}</span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
