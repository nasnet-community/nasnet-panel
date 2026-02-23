/**
 * History Panel - Desktop Presenter
 *
 * Desktop-optimized history panel with full action list,
 * keyboard navigation, and scope filtering.
 *
 * Features:
 * - Scrollable action list
 * - Click to jump to history point
 * - Visual current position indicator
 * - Keyboard shortcuts display
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import React, { forwardRef } from 'react';

import {
  Undo2,
  Redo2,
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  Layers,
  Circle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

import { cn , Button , ScrollArea } from '@nasnet/ui/primitives';


import {
  useHistoryPanel,
  formatHistoryTimestamp,
} from './useHistoryPanel';

import type { HistoryPanelProps } from './types';
import type { HistoryPanelItem } from './useHistoryPanel';

/**
 * Get icon component for action type
 */
function ActionIcon({ type, className }: { type: string; className?: string }) {
  const iconProps = { className: cn('h-4 w-4', className) };

  switch (type) {
    case 'edit':
      return <Pencil {...iconProps} />;
    case 'delete':
      return <Trash2 {...iconProps} />;
    case 'create':
      return <Plus {...iconProps} />;
    case 'reorder':
      return <ArrowUpDown {...iconProps} />;
    case 'changeset':
      return <Layers {...iconProps} />;
    default:
      return <Circle {...iconProps} />;
  }
}

/**
 * Single history item row
 */
const HistoryItem = React.memo(forwardRef<
  HTMLLIElement,
  {
    item: HistoryPanelItem;
    index: number;
    getItemProps: ReturnType<typeof useHistoryPanel>['getItemProps'];
    showWarning?: boolean;
  }
>(function HistoryItem({ item, index, getItemProps, showWarning }, ref) {
  const { action, isInPast, isCurrent } = item;
  const itemProps = getItemProps(index);

  return (
    <li
      ref={ref}
      {...itemProps}
      id={`history-item-${index}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
        'hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        isCurrent && 'bg-primary/10 border-l-2 border-primary',
        !isInPast && 'opacity-50'
      )}
    >
      {/* Action type icon */}
      <div
        className={cn(
          'flex-shrink-0 p-1.5 rounded-md',
          isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <ActionIcon type={action.type} />
      </div>

      {/* Description and timestamp */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            isCurrent ? 'font-medium text-foreground' : 'text-foreground',
            !isInPast && 'text-muted-foreground'
          )}
        >
          {action.description}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatHistoryTimestamp(action.timestamp)}
          {action.scope === 'global' && (
            <span className="ml-1 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Global
            </span>
          )}
        </p>
      </div>

      {/* Current position indicator */}
      {isCurrent && (
        <div className="flex-shrink-0 text-xs text-primary font-medium">
          Current
        </div>
      )}

      {/* Warning for future actions that will be discarded */}
      {showWarning && !isInPast && (
        <div className="flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
      )}
    </li>
  );
}));

HistoryItem.displayName = 'HistoryItem';

/**
 * Desktop History Panel Component
 *
 * Full-featured history panel for desktop with:
 * - Complete action list
 * - Undo/redo buttons with shortcuts
 * - Jump to any point
 * - Scope indicators
 */
export const HistoryPanelDesktop = React.memo(function HistoryPanelDesktop({
  className,
  onClose,
  maxHeight = 400,
}: HistoryPanelProps) {
  const {
    items,
    currentIndex,
    canUndo,
    canRedo,
    isEmpty,
    totalItems,
    undo,
    redo,
    clearAll,
    getItemProps,
    getListProps,
    getShortcutDisplay,
  } = useHistoryPanel({
    onClose,
    onAnnounce: (message) => {
      // This would trigger a screen reader announcement
      // via aria-live region in the component
    },
  });

  return (
    <div
      className={cn(
        'w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden',
        className
      )}
      role="dialog"
      aria-label="Undo history panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">History</h3>
          <span className="text-xs text-muted-foreground">
            {totalItems} action{totalItems !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => undo()}
          disabled={!canUndo}
          className="flex-1"
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
          <kbd className="ml-auto text-[10px] text-muted-foreground font-mono">
            {getShortcutDisplay('undo')}
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => redo()}
          disabled={!canRedo}
          className="flex-1"
        >
          <Redo2 className="h-4 w-4 mr-1" />
          Redo
          <kbd className="ml-auto text-[10px] text-muted-foreground font-mono">
            {getShortcutDisplay('redo')}
          </kbd>
        </Button>
      </div>

      {/* History list */}
      {isEmpty ? (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <Circle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No history yet</p>
          <p className="text-xs mt-1">
            Actions you take will appear here
          </p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }}>
          <ul {...getListProps()} className="py-1">
            {items.map((item, index) => (
              <HistoryItem
                key={item.action.id}
                item={item}
                index={index}
                getItemProps={getItemProps}
                showWarning={index > currentIndex}
              />
            ))}
          </ul>
        </ScrollArea>
      )}

      {/* Footer */}
      {!isEmpty && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="w-full text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear History
          </Button>
        </div>
      )}

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
});

HistoryPanelDesktop.displayName = 'HistoryPanelDesktop';
