/**
 * History Panel - Mobile Presenter
 *
 * Mobile-optimized history panel as a bottom sheet with
 * large touch targets and simplified interaction.
 *
 * Features:
 * - Bottom sheet layout
 * - Large touch targets (44px+)
 * - Swipe gestures
 * - Condensed action list
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import React from 'react';
import { cn } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import {
  Undo2,
  Redo2,
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  Layers,
  Circle,
  X,
} from 'lucide-react';
import type { HistoryPanelItem } from './useHistoryPanel';
import {
  useHistoryPanel,
  formatHistoryTimestamp,
} from './useHistoryPanel';
import type { HistoryPanelProps } from './types';

/**
 * Get icon component for action type
 */
function ActionIcon({ type, className }: { type: string; className?: string }) {
  const iconProps = { className: cn('h-5 w-5', className) };

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
 * Mobile history item with large touch target
 */
function HistoryItemMobile({
  item,
  onSelect,
}: {
  item: HistoryPanelItem;
  onSelect: () => void;
}) {
  const { action, isInPast, isCurrent } = item;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 min-h-[56px]', // 44px+ touch target
        'active:bg-muted transition-colors',
        isCurrent && 'bg-primary/10',
        !isInPast && 'opacity-50'
      )}
    >
      {/* Action type icon */}
      <div
        className={cn(
          'flex-shrink-0 p-2 rounded-full',
          isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <ActionIcon type={action.type} />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'text-base truncate',
            isCurrent ? 'font-medium' : 'text-foreground',
            !isInPast && 'text-muted-foreground'
          )}
        >
          {action.description}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatHistoryTimestamp(action.timestamp)}
        </p>
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
      )}
    </button>
  );
}

/**
 * Mobile History Panel Component
 *
 * Simplified bottom sheet for mobile with:
 * - Large undo/redo buttons
 * - Condensed action list
 * - Touch-friendly interactions
 */
export function HistoryPanelMobile({
  className,
  onClose,
  maxHeight = 300,
}: HistoryPanelProps) {
  const {
    items,
    currentIndex,
    canUndo,
    canRedo,
    isEmpty,
    undo,
    redo,
    jumpTo,
    clearAll,
  } = useHistoryPanel({
    onClose,
  });

  // Show only the most recent 5 actions on mobile
  const visibleItems = items.slice(-5);

  return (
    <div
      className={cn(
        'bg-card border-t border-border rounded-t-xl shadow-lg overflow-hidden',
        className
      )}
      role="dialog"
      aria-label="Undo history"
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">History</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Large undo/redo buttons */}
      <div className="px-4 pb-4 flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => undo()}
          disabled={!canUndo}
          className="flex-1 h-14"
        >
          <Undo2 className="h-5 w-5 mr-2" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => redo()}
          disabled={!canRedo}
          className="flex-1 h-14"
        >
          <Redo2 className="h-5 w-5 mr-2" />
          Redo
        </Button>
      </div>

      {/* History list */}
      {isEmpty ? (
        <div className="px-4 py-6 text-center text-muted-foreground">
          <Circle className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-base">No history yet</p>
        </div>
      ) : (
        <div
          className="overflow-y-auto border-t border-border"
          style={{ maxHeight }}
        >
          {visibleItems.map((item) => (
            <HistoryItemMobile
              key={item.action.id}
              item={item}
              onSelect={() => jumpTo(item.index)}
            />
          ))}
        </div>
      )}

      {/* Footer with clear button */}
      {!isEmpty && (
        <div className="px-4 py-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={clearAll}
            className="w-full text-muted-foreground active:text-destructive"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Clear History
          </Button>
        </div>
      )}
    </div>
  );
}
