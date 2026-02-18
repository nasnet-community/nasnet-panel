/**
 * RAW Rules Table Component (Mobile)
 *
 * Domain component for displaying RAW rules on mobile devices.
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
 * @see NAS-7.X: Implement RAW Firewall Rules - Phase B - Task 10
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useRawRules,
  useDeleteRawRule,
  useToggleRawRule,
  useCreateRawRule,
  useUpdateRawRule,
} from '@nasnet/api-client/queries/firewall';
import type { RawRule, RawRuleInput, RawChain } from '@nasnet/core/types';
import { RawRuleEditor } from '@nasnet/ui/patterns';
import { CounterCell } from '@nasnet/ui/patterns';
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
// Action Badge Component
// ============================================================================

function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  const variantMap: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
    accept: 'success',
    drop: 'error',
    notrack: 'warning',
    log: 'info',
    jump: 'warning',
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
  rule: RawRule;
  maxBytes: number;
  onEdit: (rule: RawRule) => void;
  onDuplicate: (rule: RawRule) => void;
  onDelete: (rule: RawRule) => void;
  onToggle: (rule: RawRule) => void;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLDivElement>;
}

function RuleCard({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, isHighlighted, highlightRef }: RuleCardProps) {
  const { t } = useTranslation('firewall');
  const isUnused = (rule.packets ?? 0) === 0;
  const showRelativeBar = useCounterSettingsStore((state) => state.showRelativeBar);

  const matchers: string[] = [];
  if (rule.protocol && rule.protocol !== 'all') matchers.push(`${rule.protocol}`);
  if (rule.srcAddress) matchers.push(`${rule.srcAddress}`);
  if (rule.dstAddress) matchers.push(`→ ${rule.dstAddress}`);
  if (rule.srcPort) matchers.push(`:${rule.srcPort}`);
  if (rule.dstPort) matchers.push(`:${rule.dstPort}`);
  if (rule.limit) matchers.push(`limit:${rule.limit.rate}`);

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

        {/* Counters */}
        <div className="mb-3">
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
            {t('raw.buttons.edit', 'Edit')}
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

export interface RawRulesTableMobileProps {
  className?: string;
  chain?: string;
}

/**
 * RawRulesTableMobile Component
 *
 * Mobile-optimized card-based layout for RAW rules.
 *
 * Features:
 * - Touch-friendly card layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle
 * - Compact counter display
 *
 * @param props - Component props
 * @returns Mobile RAW rules table component
 */
export function RawRulesTableMobile({ className, chain }: RawRulesTableMobileProps) {
  const { t } = useTranslation('firewall');
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const pollingInterval = useCounterSettingsStore((state) => state.pollingInterval);

  // Get highlight parameter from URL search params
  const searchParams = useSearch({ strict: false }) as { highlight?: string };
  const highlightRuleId = searchParams.highlight;
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const { data: rules, isLoading, error } = useRawRules(routerIp, {
    chain: chain as RawChain | undefined,
    refetchInterval: pollingInterval || false
  });
  const deleteRawRule = useDeleteRawRule(routerIp);
  const toggleRawRule = useToggleRawRule(routerIp);
  const createRawRule = useCreateRawRule(routerIp);
  const updateRawRule = useUpdateRawRule(routerIp);

  const [editingRule, setEditingRule] = useState<RawRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RawRule | null>(null);

  // Sort rules by order
  const sortedRules = rules ? [...rules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];

  // Calculate max bytes for relative bar
  const maxBytes = useMemo(() => {
    if (!sortedRules || sortedRules.length === 0) return 0;
    return Math.max(...sortedRules.map(r => r.bytes ?? 0));
  }, [sortedRules]);

  // Handlers
  const handleEdit = (rule: RawRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleDuplicate = (rule: RawRule) => {
    const duplicatedRule = { ...rule, id: undefined, order: undefined };
    setEditingRule(duplicatedRule);
    setIsEditorOpen(true);
  };

  const handleSaveRule = async (ruleInput: RawRuleInput) => {
    if (editingRule?.id) {
      // Update existing rule
      await updateRawRule.mutateAsync({
        ruleId: editingRule.id,
        updates: ruleInput,
      });
    } else {
      // Create new rule
      await createRawRule.mutateAsync(ruleInput);
    }
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingRule(null);
  };

  const handleDelete = (rule: RawRule) => {
    setDeleteConfirmRule(rule);
  };

  const handleToggle = (rule: RawRule) => {
    toggleRawRule.mutate({
      ruleId: rule.id!,
      disabled: !rule.disabled,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmRule) {
      deleteRawRule.mutate(deleteConfirmRule.id!);
      setDeleteConfirmRule(null);
    }
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
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        {t('raw.notifications.error.loadRules', 'Error loading RAW rules')}: {error.message}
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-8 text-center text-slate-500 dark:text-slate-400 ${className || ''}`}>
        <p className="font-semibold mb-2">
          {chain
            ? t('raw.emptyStates.noRulesInChain.title', 'No rules in {{chain}}', { chain })
            : t('raw.emptyStates.noRules.title', 'No RAW rules found')}
        </p>
        <p className="text-sm">
          {chain
            ? t('raw.emptyStates.noRulesInChain.description', 'This chain has no RAW rules configured.')
            : t('raw.emptyStates.noRules.description', 'RAW rules process packets before connection tracking.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-4 p-4 ${className || ''}`}>
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
          />
        ))}
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
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {t('raw.buttons.delete', 'Delete Rule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
