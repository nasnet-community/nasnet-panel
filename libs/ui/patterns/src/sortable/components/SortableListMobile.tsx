/**
 * SortableListMobile Component
 *
 * Mobile-optimized sortable list with touch-friendly interactions.
 * Features larger touch targets and move up/down button fallbacks.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { SortableList } from './SortableList';
import { MIN_TOUCH_TARGET } from '../config';
import type {
  SortableListProps,
  SortableItemData,
  SortableItemRenderOptions,
} from '../types';

// ============================================================================
// Mobile Item Wrapper
// ============================================================================

interface MobileItemWrapperProps {
  children: React.ReactNode;
  position: number;
  total: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showMoveButtons?: boolean;
  disabled?: boolean;
}

const MobileItemWrapper: React.FC<MobileItemWrapperProps> = ({
  children,
  position,
  total,
  onMoveUp,
  onMoveDown,
  showMoveButtons = true,
  disabled = false,
}) => {
  const isFirst = position === 1;
  const isLast = position === total;

  return (
    <div className="flex items-stretch gap-2">
      {/* Position number */}
      <div
        className={cn(
          'flex items-center justify-center',
          'w-10 flex-shrink-0',
          'text-lg font-semibold',
          'text-primary',
          'bg-primary/10',
          'rounded-l-lg',
        )}
        aria-hidden="true"
      >
        #{position}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2">{children}</div>

      {/* Move buttons (fallback for touch) */}
      {showMoveButtons && (
        <div className="flex flex-col justify-center gap-1 pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={isFirst || disabled}
            className={cn(
              'h-10 w-10',
              'touch-none',
            )}
            style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET }}
            aria-label={`Move item ${position} up`}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={isLast || disabled}
            className={cn(
              'h-10 w-10',
              'touch-none',
            )}
            style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET }}
            aria-label={`Move item ${position} down`}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Mobile-Specific Props
// ============================================================================

export interface SortableListMobileProps<T extends SortableItemData>
  extends Omit<SortableListProps<T>, 'renderItem'> {
  /** Render function for item content (not the full item) */
  renderItem: (item: T, options: SortableItemRenderOptions) => React.ReactNode;
  /** Whether to show move up/down buttons (default: true for mobile) */
  showMoveButtons?: boolean;
  /** Callback when item is moved via button */
  onMoveItem?: (id: T['id'], direction: 'up' | 'down') => void;
}

// ============================================================================
// Component
// ============================================================================

export function SortableListMobile<T extends SortableItemData>({
  renderItem: externalRenderItem,
  showMoveButtons = true,
  onMoveItem,
  className,
  ...props
}: SortableListMobileProps<T>) {
  // Wrap renderItem to add mobile-specific UI
  const renderItem = React.useCallback(
    (item: T, options: SortableItemRenderOptions) => {
      return (
        <MobileItemWrapper
          position={options.index + 1}
          total={options.total}
          showMoveButtons={showMoveButtons}
          disabled={item.disabled}
          onMoveUp={() => onMoveItem?.(item.id, 'up')}
          onMoveDown={() => onMoveItem?.(item.id, 'down')}
        >
          {externalRenderItem(item, options)}
        </MobileItemWrapper>
      );
    },
    [externalRenderItem, showMoveButtons, onMoveItem]
  );

  return (
    <SortableList<T>
      {...props}
      renderItem={renderItem}
      className={cn(
        // Mobile-specific styles
        'touch-pan-y', // Allow vertical scrolling
        className
      )}
      // Mobile defaults
      showDragHandle={true}
      showPositionNumbers={false} // Position shown in MobileItemWrapper
      gap={3}
      itemClassName={cn(
        'bg-card border border-border rounded-lg shadow-sm',
        'min-h-[64px]', // Larger touch target
      )}
    />
  );
}

SortableListMobile.displayName = 'SortableListMobile';

export default SortableListMobile;
