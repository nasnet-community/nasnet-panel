/**
 * Mangle Rules Table Component (Mobile)
 *
 * Domain component for displaying mangle rules on mobile devices.
 * Mobile presenter with card layout and swipe actions.
 *
 * Features:
 * - Card-based layout optimized for touch
 * - Swipe actions (Edit, Delete)
 * - Inline enable/disable toggle
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge
 *
 * @see NAS-7.5: Implement Mangle Rules - Task 7
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useMangleRules,
  useDeleteMangleRule,
  useToggleMangleRule,
} from '@nasnet/api-client/queries/firewall';
import { useMangleRuleTable } from '@nasnet/ui/patterns/mangle-rule-table';
import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
import type { MangleRule } from '@nasnet/core/types';
import {
  Card,
  CardContent,
  CardHeader,
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
import { Pencil, Copy, Trash2 } from 'lucide-react';

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
    <Badge variant="outline" className={`${colorClass} text-xs`}>
      {action}
    </Badge>
  );
}

// ============================================================================
// Rule Card Component
// ============================================================================

interface RuleCardProps {
  rule: MangleRule;
  onEdit: (rule: MangleRule) => void;
  onDuplicate: (rule: MangleRule) => void;
  onDelete: (rule: MangleRule) => void;
  onToggle: (rule: MangleRule) => void;
}

function RuleCard({ rule, onEdit, onDuplicate, onDelete, onToggle }: RuleCardProps) {
  const { t } = useTranslation('firewall');
  const isUnused = (rule.packets ?? 0) === 0;
  const markValue = rule.newConnectionMark || rule.newPacketMark || rule.newRoutingMark;

  const matchers: string[] = [];
  if (rule.protocol) matchers.push(`${rule.protocol}`);
  if (rule.srcAddress) matchers.push(`${rule.srcAddress}`);
  if (rule.dstAddress) matchers.push(`→ ${rule.dstAddress}`);
  if (rule.srcPort) matchers.push(`:${rule.srcPort}`);

  return (
    <Card className={rule.disabled ? 'opacity-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500">#{rule.position}</span>
              <Badge variant="secondary" className="text-xs">
                {rule.chain}
              </Badge>
              <ActionBadge action={rule.action} />
            </div>
            {markValue && (
              <div className="font-mono text-sm font-semibold mt-1">
                {markValue}
              </div>
            )}
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

        {/* Counters */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{t('mangle.table.columns.packets')}:</span>
            {isUnused ? (
              <Badge variant="outline" className="text-xs text-slate-500">
                {t('mangle.table.unused')}
              </Badge>
            ) : (
              <span className="font-mono">{(rule.packets ?? 0).toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{t('mangle.table.columns.bytes')}:</span>
            <span className="font-mono">{(rule.bytes ?? 0).toLocaleString()}</span>
          </div>
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
            {t('mangle.buttons.edit')}
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

export interface MangleRulesTableMobileProps {
  className?: string;
  chain?: string;
}

/**
 * MangleRulesTableMobile Component
 *
 * Mobile-optimized card-based layout for mangle rules.
 *
 * Features:
 * - Touch-friendly card layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle
 * - Compact counter display
 *
 * @param props - Component props
 * @returns Mobile mangle rules table component
 */
export function MangleRulesTableMobile({ className, chain }: MangleRulesTableMobileProps) {
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const { data: rules, isLoading, error } = useMangleRules(routerIp, chain ? { chain: chain as any } : undefined);
  const deleteMangleRule = useDeleteMangleRule(routerIp);
  const toggleMangleRule = useToggleMangleRule(routerIp);

  const [editingRule, setEditingRule] = useState<MangleRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<MangleRule | null>(null);

  // Use the headless hook
  const { data: sortedRules } = useMangleRuleTable({
    data: rules || [],
    initialSortBy: 'position',
    initialSortDirection: 'asc',
    initialFilters: chain ? { chain } : {},
  });

  // Handlers
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
      <div className={`space-y-3 ${className || ''}`}>
        {sortedRules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
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
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmRule(null)}
              className="min-h-[44px]"
            >
              {t('button.cancel', { ns: 'common' })}
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 min-h-[44px]"
            >
              {t('button.delete', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
