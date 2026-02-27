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

import { Undo2, Redo2, Trash2, Pencil, Plus, ArrowUpDown, Layers, Circle, X } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { useHistoryPanel, formatHistoryTimestamp } from './useHistoryPanel';

import type { HistoryPanelProps } from './types';
import type { HistoryPanelItem } from './useHistoryPanel';

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
function HistoryItemMobile({ item, onSelect }: { item: HistoryPanelItem; onSelect: () => void }) {
  const { action, isInPast, isCurrent } = item;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex min-h-[56px] w-full items-center gap-3 px-4 py-3', // 44px+ touch target
        'active:bg-muted transition-colors',
        isCurrent && 'bg-primary/10',
        !isInPast && 'opacity-50'
      )}
    >
      {/* Action type icon */}
      <div
        className={cn(
          'flex-shrink-0 rounded-full p-2',
          isCurrent ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <ActionIcon type={action.type} />
      </div>

      {/* Description */}
      <div className="min-w-0 flex-1 text-left">
        <p
          className={cn(
            'truncate text-base',
            isCurrent ? 'font-medium' : 'text-foreground',
            !isInPast && 'text-muted-foreground'
          )}
        >
          {action.description}
        </p>
        <p className="text-muted-foreground text-sm">{formatHistoryTimestamp(action.timestamp)}</p>
      </div>

      {/* Current indicator */}
      {isCurrent && <div className="bg-primary h-2 w-2 flex-shrink-0 rounded-full" />}
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
export const HistoryPanelMobile = React.memo(function HistoryPanelMobile({
  className,
  onClose,
  maxHeight = 300,
}: HistoryPanelProps) {
  const { items, currentIndex, canUndo, canRedo, isEmpty, undo, redo, jumpTo, clearAll } =
    useHistoryPanel({
      onClose,
    });

  // Show only the most recent 5 actions on mobile
  const visibleItems = items.slice(-5);

  return (
    <div
      className={cn(
        'bg-card border-border overflow-hidden rounded-t-xl border-t shadow-lg',
        className
      )}
      role="dialog"
      aria-label="Undo history"
    >
      {/* Drag handle */}
      <div className="flex justify-center py-2">
        <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3">
        <h3 className="text-lg font-semibold">History</h3>
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
      <div className="flex gap-3 px-4 pb-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => undo()}
          disabled={!canUndo}
          className="h-14 flex-1"
        >
          <Undo2 className="mr-2 h-5 w-5" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => redo()}
          disabled={!canRedo}
          className="h-14 flex-1"
        >
          <Redo2 className="mr-2 h-5 w-5" />
          Redo
        </Button>
      </div>

      {/* History list */}
      {isEmpty ?
        <div className="text-muted-foreground px-4 py-6 text-center">
          <Circle className="mx-auto mb-2 h-10 w-10 opacity-30" />
          <p className="text-base">No history yet</p>
        </div>
      : <div
          className="border-border overflow-y-auto border-t"
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
      }

      {/* Footer with clear button */}
      {!isEmpty && (
        <div className="border-border border-t px-4 py-3">
          <Button
            variant="ghost"
            onClick={clearAll}
            className="text-muted-foreground active:text-destructive w-full"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Clear History
          </Button>
        </div>
      )}
    </div>
  );
});

HistoryPanelMobile.displayName = 'HistoryPanelMobile';
