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

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearch } from '@tanstack/react-router';
import { cn } from '@nasnet/ui/utils';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  useRawRules,
  useDeleteRawRule,
  useToggleRawRule,
  useCreateRawRule,
  useUpdateRawRule,
} from '@nasnet/api-client/queries/firewall';
import type { RawRule, RawRuleInput, RawChain } from '@nasnet/core/types';
import {
  RawRuleEditor,
  CounterCell,
} from '@nasnet/ui/patterns';
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
// Constants
// ============================================================================

const HIGHLIGHT_SCROLL_DELAY_MS = 100;

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
    <Badge variant={variant} className="text-xs">
      {action}
    </Badge>
  );
};

ActionBadge.displayName = 'ActionBadge';

// ============================================================================
// Rule Card Component
// ============================================================================

interface RuleCardProps {
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
  /** Whether this card is highlighted */
  isHighlighted?: boolean;
  /** Ref to highlight element for scroll-to-view */
  highlightRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Renders a card for a single RAW rule on mobile
 * @description Displays rule details with actions in a touch-friendly layout
 */
const RuleCard = ({ rule, maxBytes, onEdit, onDuplicate, onDelete, onToggle, isHighlighted, highlightRef }: RuleCardProps) => {
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
      className={cn(
        rule.disabled && 'opacity-50',
        isUnused && 'bg-muted/40 opacity-60',
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
          <div className="text-sm text-muted-foreground mb-3 font-mono">
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
          <div className="text-sm text-muted-foreground italic mb-3">
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
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

RuleCard.displayName = 'RuleCard';

// ============================================================================
// Main Component
// ============================================================================

export interface RawRulesTableMobileProps {
  /** Optional className for styling */
  className?: string;
  /** Optional chain filter */
  chain?: string;
}

/**
 * RawRulesTableMobile Component
 * @description Mobile presenter for RAW firewall rules with card layout
 *
 * Features:
 * - Touch-friendly card-based layout
 * - Inline actions (Edit, Duplicate, Delete)
 * - Enable/disable toggle for each rule
 * - Compact counter display
 * - Disabled rules styling
 * - Unused rules badge (zero packets)
 *
 * @example
 * ```tsx
 * <RawRulesTableMobile chain="forward" />
 * ```
 */
export const RawRulesTableMobile = ({ className, chain }: RawRulesTableMobileProps) => {
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

  // ========================================================================
  // Event Handlers
  // ========================================================================

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
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-component-md text-error rounded-[var(--semantic-radius-card)] bg-error/10', className)}>
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
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
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

RawRulesTableMobile.displayName = 'RawRulesTableMobile';
