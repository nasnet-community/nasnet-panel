/**
 * FirewallRuleList Component
 *
 * Domain-specific sortable list for firewall rules.
 * Supports critical ordering with visual feedback for rule priority.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import { Shield, AlertTriangle } from 'lucide-react';

import { usePlatform } from '@nasnet/ui/layouts';
import { cn, Badge } from '@nasnet/ui/primitives';

import { SortableListDesktop } from '../components/SortableListDesktop';
import { SortableListMobile } from '../components/SortableListMobile';

import type { ContextMenuActions } from '../components/SortableListDesktop';
import type {
  SortableItemData,
  ReorderEvent,
  SortableItemRenderOptions,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface FirewallRule extends SortableItemData {
  id: string;
  chain: 'input' | 'forward' | 'output';
  action: 'accept' | 'drop' | 'reject' | 'log' | 'passthrough';
  src?: string;
  dst?: string;
  protocol?: string;
  dstPort?: string;
  comment?: string;
  disabled?: boolean;
  hitCount?: number;
}

export interface FirewallRuleListProps {
  /** Firewall rules to display */
  rules: FirewallRule[];
  /** Callback when rules are reordered */
  onReorder?: (event: ReorderEvent<FirewallRule>) => void;
  /** Callback to delete a rule */
  onDelete?: (rule: FirewallRule) => void;
  /** Callback to duplicate a rule */
  onDuplicate?: (rule: FirewallRule) => void;
  /** Callback to edit a rule */
  onEdit?: (rule: FirewallRule) => void;
  /** Whether to show confirmation for dangerous changes */
  confirmDangerous?: boolean;
  /** CSS class */
  className?: string;
}

// ============================================================================
// Rule Item Component
// ============================================================================

const FirewallRuleItem: React.FC<{
  rule: FirewallRule;
  options: SortableItemRenderOptions;
}> = ({ rule, options }) => {
  const actionColors: Record<string, string> = {
    accept: 'bg-green-500/10 text-green-600 border-green-500/20',
    drop: 'bg-red-500/10 text-red-600 border-red-500/20',
    reject: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    log: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    passthrough: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-component-md py-component-sm',
        'border-l-4 border-l-category-firewall',
        rule.disabled && 'opacity-50',
      )}
    >
      {/* Rule icon */}
      <Shield
        className={cn(
          'h-5 w-5 flex-shrink-0',
          rule.action === 'accept' ? 'text-success' :
          rule.action === 'drop' ? 'text-error' :
          'text-muted-foreground'
        )}
      />

      {/* Rule content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-component-sm flex-wrap">
          {/* Action badge */}
          <Badge
            variant="outline"
            className={cn('uppercase text-xs font-medium', actionColors[rule.action])}
          >
            {rule.action}
          </Badge>

          {/* Chain */}
          <span className="text-xs text-muted-foreground uppercase font-medium">
            {rule.chain}
          </span>

          {/* Protocol/port if present */}
          {rule.protocol && (
            <span className="text-xs font-mono text-muted-foreground">
              {rule.protocol}
              {rule.dstPort && `:${rule.dstPort}`}
            </span>
          )}
        </div>

        {/* Source/Destination */}
        {(rule.src || rule.dst) && (
          <div className="text-xs text-muted-foreground mt-1 font-mono truncate">
            {rule.src ?? 'any'} → {rule.dst ?? 'any'}
          </div>
        )}

        {/* Comment */}
        {rule.comment && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {rule.comment}
          </div>
        )}
      </div>

      {/* Hit count */}
      {rule.hitCount !== undefined && rule.hitCount > 0 && (
        <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
          {rule.hitCount.toLocaleString()} hits
        </span>
      )}

      {/* Disabled indicator */}
      {rule.disabled && (
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          Disabled
        </Badge>
      )}
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

export const FirewallRuleList: React.FC<FirewallRuleListProps> = ({
  rules,
  onReorder,
  onDelete,
  onDuplicate,
  onEdit,
  confirmDangerous = true,
  className,
}) => {
  const platform = usePlatform?.() ?? 'desktop';

  // Context menu actions for desktop
  const actions: ContextMenuActions<FirewallRule> = {
    onMoveToTop: (rule: FirewallRule) => {
      // Find current index and create reorder event
      const currentIndex = rules.findIndex((r) => r.id === rule.id);
      if (currentIndex > 0) {
        const newRules = [...rules];
        newRules.splice(currentIndex, 1);
        newRules.unshift(rule);
        onReorder?.({
          item: rule,
          fromIndex: currentIndex,
          toIndex: 0,
          items: newRules,
        });
      }
    },
    onMoveUp: (rule: FirewallRule) => {
      const currentIndex = rules.findIndex((r) => r.id === rule.id);
      if (currentIndex > 0) {
        const newRules = [...rules];
        [newRules[currentIndex - 1], newRules[currentIndex]] =
          [newRules[currentIndex], newRules[currentIndex - 1]];
        onReorder?.({
          item: rule,
          fromIndex: currentIndex,
          toIndex: currentIndex - 1,
          items: newRules,
        });
      }
    },
    onMoveDown: (rule: FirewallRule) => {
      const currentIndex = rules.findIndex((r) => r.id === rule.id);
      if (currentIndex < rules.length - 1) {
        const newRules = [...rules];
        [newRules[currentIndex], newRules[currentIndex + 1]] =
          [newRules[currentIndex + 1], newRules[currentIndex]];
        onReorder?.({
          item: rule,
          fromIndex: currentIndex,
          toIndex: currentIndex + 1,
          items: newRules,
        });
      }
    },
    onMoveToBottom: (rule: FirewallRule) => {
      const currentIndex = rules.findIndex((r) => r.id === rule.id);
      if (currentIndex < rules.length - 1) {
        const newRules = [...rules];
        newRules.splice(currentIndex, 1);
        newRules.push(rule);
        onReorder?.({
          item: rule,
          fromIndex: currentIndex,
          toIndex: rules.length - 1,
          items: newRules,
        });
      }
    },
    onDuplicate,
    onDelete,
    customActions: onEdit
      ? [
          {
            label: 'Edit Rule',
            onClick: onEdit,
          },
        ]
      : undefined,
  };

  // Render function
  const renderItem = (rule: FirewallRule, options: SortableItemRenderOptions) => (
    <FirewallRuleItem rule={rule} options={options} />
  );

  // Handle move for mobile
  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = rules.findIndex((r) => r.id === id);
    const rule = rules[currentIndex];

    if (direction === 'up' && currentIndex > 0) {
      actions.onMoveUp?.(rule);
    } else if (direction === 'down' && currentIndex < rules.length - 1) {
      actions.onMoveDown?.(rule);
    }
  };

  // Desktop presenter
  if (platform === 'desktop') {
    return (
      <div className={className}>
        {/* Warning for firewall rule ordering */}
        <div className="flex items-center gap-component-md p-component-md mb-3 bg-warning-light border border-warning/20 rounded-[var(--semantic-radius-card)] text-sm text-warning-dark">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Firewall rules are processed in order. Drag to reorder.</span>
        </div>

        <SortableListDesktop<FirewallRule>
          items={rules}
          onReorder={onReorder}
          renderItem={renderItem}
          actions={actions}
          showContextMenu={true}
          showRowNumbers={true}
          multiSelect={true}
          aria-label="Firewall rules list"
        />
      </div>
    );
  }

  // Mobile presenter
  return (
    <div className={className}>
      {/* Warning for firewall rule ordering */}
      <div className="flex items-center gap-component-md p-component-md mb-3 bg-warning-light border border-warning/20 rounded-[var(--semantic-radius-card)] text-sm text-warning-dark">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>Rules are processed in order.</span>
      </div>

      <SortableListMobile<FirewallRule>
        items={rules}
        onReorder={onReorder}
        renderItem={renderItem}
        onMoveItem={handleMoveItem}
        showMoveButtons={true}
        aria-label="Firewall rules list"
      />
    </div>
  );
};

FirewallRuleList.displayName = 'FirewallRuleList';

export default FirewallRuleList;
