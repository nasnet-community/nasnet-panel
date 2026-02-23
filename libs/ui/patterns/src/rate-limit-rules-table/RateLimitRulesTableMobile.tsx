/**
 * Rate Limit Rules Table - Mobile Presenter
 * Card-based accordion layout with 44px touch targets
 *
 * Features:
 * - Card-based layout with stacked information
 * - 44px minimum touch targets (WCAG AAA)
 * - Action badges with semantic colors
 * - Swipe gestures for delete (future enhancement)
 * - Disabled rules styling (opacity-50)
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { Pencil, Copy, Trash2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { RateLimitRule } from '@nasnet/core/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Skeleton,
} from '@nasnet/ui/primitives';

import type { RateLimitRulesTablePresenterProps } from './types';

// ============================================================================
// Action Badge Component
// ============================================================================

function ActionBadge({ action }: { action: string }) {
  // Map actions to Badge semantic variants
  const variantMap: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
    drop: 'error',
    tarpit: 'warning',
    'add-to-list': 'info',
  };

  const variant = variantMap[action] || 'default';

  return <Badge variant={variant}>{action}</Badge>;
}

// ============================================================================
// Rule Card Component
// ============================================================================

interface RuleCardProps {
  rule: RateLimitRule;
  onEdit: (rule: RateLimitRule) => void;
  onDuplicate: (rule: RateLimitRule) => void;
  onDelete: (rule: RateLimitRule) => void;
  onToggle: (rule: RateLimitRule) => void;
  onShowStats: (rule: RateLimitRule) => void;
}

function RuleCard({ rule, onEdit, onDuplicate, onDelete, onToggle, onShowStats }: RuleCardProps) {
  // Format time window for display
  const timeWindowMap: Record<string, string> = {
    'per-second': '/ sec',
    'per-minute': '/ min',
    'per-hour': '/ hour',
  };
  const timeWindowDisplay = timeWindowMap[rule.timeWindow] || rule.timeWindow;

  const isUnused = (rule.packets ?? 0) === 0;

  return (
    <Card
      className={`${rule.isDisabled ? 'opacity-50 bg-slate-50 dark:bg-slate-800/50' : ''} ${isUnused ? 'bg-muted/50' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-2">
              <span className="font-mono text-sm">
                {rule.srcAddress || rule.srcAddressList || 'any'}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <ActionBadge action={rule.action} />
              {rule.action === 'add-to-list' && rule.addressList && (
                <Badge variant="outline" className="font-mono text-xs">
                  {rule.addressList}
                </Badge>
              )}
            </div>
          </div>
          <Switch
            checked={!rule.isDisabled}
            onCheckedChange={() => onToggle(rule)}
            aria-label={rule.isDisabled ? 'Enable rule' : 'Disable rule'}
            className="ml-2"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Rate Limit Info */}
        <div className="flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-slate-600 dark:text-slate-400">Limit</span>
          <span className="text-sm font-semibold">
            {rule.connectionLimit} {timeWindowDisplay}
          </span>
        </div>

        {/* Triggered Count */}
        <button
          onClick={() => onShowStats(rule)}
          className="w-full flex items-center justify-between py-2 border-t border-slate-200 dark:border-slate-700 min-h-[44px]"
        >
          <span className="text-sm text-slate-600 dark:text-slate-400">Triggered</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{rule.packets ?? 0}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </button>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(rule)}
            className="flex-1 min-h-[44px]"
            aria-label="Edit rule"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(rule)}
            className="flex-1 min-h-[44px]"
            aria-label="Duplicate rule"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(rule)}
            className="text-red-600 hover:text-red-700 dark:text-red-400 min-h-[44px]"
            aria-label="Delete rule"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Mobile Presenter Component
// ============================================================================

export interface RateLimitRulesTableMobileProps extends Omit<RateLimitRulesTablePresenterProps, 'onReorder' | 'pollingInterval'> {
  editingRule: RateLimitRule | null;
  deleteConfirmRule: RateLimitRule | null;
  statsRule: RateLimitRule | null;
  confirmDelete: () => void;
  closeEdit: () => void;
  closeDelete: () => void;
  closeStats: () => void;
}

/**
 * RateLimitRulesTableMobile Component
 *
 * Mobile presenter with card-based layout.
 * Features 44px touch targets and simplified UI.
 *
 * @param props - Component props
 * @returns Rate limit rules table component (mobile)
 */
export function RateLimitRulesTableMobile({
  className,
  rules,
  isLoading,
  error,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onShowStats,
  editingRule,
  deleteConfirmRule,
  statsRule,
  confirmDelete,
  closeEdit,
  closeDelete,
  closeStats,
}: RateLimitRulesTableMobileProps) {
  const { t } = useTranslation('firewall');

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 p-4 ${className || ''}`}>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        <p className="text-sm font-semibold mb-1">Error loading rate limit rules</p>
        <p className="text-xs">{error.message}</p>
      </div>
    );
  }

  // Empty state
  if (!rules || rules.length === 0) {
    return (
      <div className={`p-6 text-center ${className || ''}`}>
        <p className="text-slate-500 dark:text-slate-400 mb-4">No rate limit rules found</p>
        <Button onClick={() => onEdit({} as RateLimitRule)} className="min-h-[44px]">
          Add Rate Limit Rule
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-4 p-4 ${className || ''}`}>
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggle={onToggle}
            onShowStats={onShowStats}
          />
        ))}
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={!!editingRule} onOpenChange={(open) => !open && closeEdit()}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
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
      <Dialog open={!!deleteConfirmRule} onOpenChange={(open) => !open && closeDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rate Limit Rule?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The rule will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={confirmDelete}
              variant="destructive"
              className="min-h-[44px] w-full"
            >
              Delete Rule
            </Button>
            <Button
              onClick={closeDelete}
              variant="outline"
              className="min-h-[44px] w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Panel */}
      {statsRule && (
        <Sheet open={!!statsRule} onOpenChange={(open) => !open && closeStats()}>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Rule Statistics</SheetTitle>
              <SheetDescription>
                Traffic and trigger statistics
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Packets</span>
                <span className="text-lg font-mono font-semibold">{statsRule.packets ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Bytes</span>
                <span className="text-lg font-mono font-semibold">{statsRule.bytes ?? 0}</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
