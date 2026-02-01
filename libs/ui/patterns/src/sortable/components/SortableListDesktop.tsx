/**
 * SortableListDesktop Component
 *
 * Desktop-optimized sortable list with context menu and keyboard shortcuts.
 * Features right-click context menu with move options.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@nasnet/ui/primitives';
import {
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  Copy,
} from 'lucide-react';
import { SortableList } from './SortableList';
import type {
  SortableListProps,
  SortableItemData,
  SortableItemRenderOptions,
} from '../types';

// ============================================================================
// Context Menu Actions
// ============================================================================

export interface ContextMenuActions<T extends SortableItemData> {
  onMoveToTop?: (item: T) => void;
  onMoveUp?: (item: T) => void;
  onMoveDown?: (item: T) => void;
  onMoveToBottom?: (item: T) => void;
  onDuplicate?: (item: T) => void;
  onDelete?: (item: T) => void;
  /** Custom actions to add to context menu */
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    disabled?: (item: T) => boolean;
  }>;
}

// ============================================================================
// Desktop Item Wrapper with Context Menu
// ============================================================================

interface DesktopItemWrapperProps<T extends SortableItemData> {
  item: T;
  children: React.ReactNode;
  options: SortableItemRenderOptions;
  actions: ContextMenuActions<T>;
  showContextMenu?: boolean;
}

function DesktopItemWrapper<T extends SortableItemData>({
  item,
  children,
  options,
  actions,
  showContextMenu = true,
}: DesktopItemWrapperProps<T>) {
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);

  if (!showContextMenu) {
    return <>{children}</>;
  }

  return (
    <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
      <DropdownMenuTrigger asChild>
        <div
          className="w-full"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuOpen(true);
          }}
        >
          {children}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {/* Move options */}
        <DropdownMenuItem
          onClick={() => actions.onMoveToTop?.(item)}
          disabled={options.isFirst}
        >
          <ArrowUpToLine className="mr-2 h-4 w-4" />
          Move to Top
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => actions.onMoveUp?.(item)}
          disabled={options.isFirst}
        >
          <MoveUp className="mr-2 h-4 w-4" />
          Move Up
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => actions.onMoveDown?.(item)}
          disabled={options.isLast}
        >
          <MoveDown className="mr-2 h-4 w-4" />
          Move Down
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => actions.onMoveToBottom?.(item)}
          disabled={options.isLast}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Move to Bottom
        </DropdownMenuItem>

        {/* Separator if additional actions */}
        {(actions.onDuplicate || actions.onDelete || actions.customActions?.length) && (
          <DropdownMenuSeparator />
        )}

        {/* Duplicate */}
        {actions.onDuplicate && (
          <DropdownMenuItem onClick={() => actions.onDuplicate?.(item)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}

        {/* Custom actions */}
        {actions.customActions?.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => action.onClick(item)}
            disabled={action.disabled?.(item)}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}

        {/* Delete (destructive) */}
        {actions.onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete?.(item)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Desktop-Specific Props
// ============================================================================

export interface SortableListDesktopProps<T extends SortableItemData>
  extends Omit<SortableListProps<T>, 'renderItem'> {
  /** Render function for item content */
  renderItem: (item: T, options: SortableItemRenderOptions) => React.ReactNode;
  /** Context menu action callbacks */
  actions?: ContextMenuActions<T>;
  /** Whether to show context menu on right-click (default: true) */
  showContextMenu?: boolean;
  /** Whether to show row numbers (default: true for desktop) */
  showRowNumbers?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function SortableListDesktop<T extends SortableItemData>({
  renderItem: externalRenderItem,
  actions = {},
  showContextMenu = true,
  showRowNumbers = true,
  className,
  ...props
}: SortableListDesktopProps<T>) {
  // Wrap renderItem to add context menu
  const renderItem = React.useCallback(
    (item: T, options: SortableItemRenderOptions) => {
      const content = (
        <div className="flex items-center gap-3 w-full">
          {/* Row number */}
          {showRowNumbers && (
            <span
              className={cn(
                'flex-shrink-0',
                'w-6 text-center',
                'text-xs font-medium',
                'text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {options.index + 1}
            </span>
          )}

          {/* Item content */}
          <div className="flex-1 min-w-0">
            {externalRenderItem(item, options)}
          </div>
        </div>
      );

      return (
        <DesktopItemWrapper
          item={item}
          options={options}
          actions={actions}
          showContextMenu={showContextMenu}
        >
          {content}
        </DesktopItemWrapper>
      );
    },
    [externalRenderItem, actions, showContextMenu, showRowNumbers]
  );

  return (
    <SortableList<T>
      {...props}
      renderItem={renderItem}
      className={cn(
        // Desktop-specific styles
        'select-none',
        className
      )}
      // Desktop defaults
      showDragHandle={true}
      showPositionNumbers={false} // Shown inline
      gap={1}
      itemClassName={cn(
        'bg-card border border-border rounded-md',
        'hover:bg-muted/50 transition-colors',
        'py-2 px-3',
      )}
    />
  );
}

SortableListDesktop.displayName = 'SortableListDesktop';

export default SortableListDesktop;
