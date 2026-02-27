/**
 * DragHandle Component
 *
 * Optional grip icon for dragging items.
 * Can be used as an explicit drag trigger point.
 *
 * Features:
 * - 44x44px minimum touch target (WCAG AAA)
 * - Proper focus indicators
 * - Icon-only button with accessible label
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * <DragHandle
 *   aria-label="Drag to reorder"
 *   {...dragHandleListeners}
 * />
 * ```
 */

import * as React from 'react';

import { GripVertical } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { MIN_TOUCH_TARGET } from '../config';

import type { DragHandleProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * Drag handle trigger button with accessible grip icon
 */
const DragHandleInner = React.forwardRef<HTMLButtonElement, DragHandleProps>(
  (
    {
      className,
      disabled = false,
      'aria-label': ariaLabel = 'Drag to reorder',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          // Base styles
          'flex items-center justify-center',
          'touch-none select-none',
          // Size - minimum 44x44 for WCAG AAA touch targets
          'min-h-[44px] min-w-[44px]',
          'p-component-sm',
          // Visual styles
          'text-muted-foreground',
          'h-4 w-4',
          'transition-colors duration-150',
          // Focus styles (visible focus ring)
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Hover styles
          'hover:text-foreground',
          // Active/dragging styles (cursor changes to grabbing)
          'active:cursor-grabbing',
          // Cursor
          !disabled && 'cursor-grab',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        disabled={disabled}
        style={{
          minWidth: MIN_TOUCH_TARGET,
          minHeight: MIN_TOUCH_TARGET,
        }}
        {...props}
      >
        {children ?? <GripVertical className="h-4 w-4" aria-hidden="true" />}
      </button>
    );
  }
);

DragHandleInner.displayName = 'DragHandle';

/**
 * Memoized DragHandle to prevent unnecessary re-renders
 */
export const DragHandle = React.memo(DragHandleInner);

DragHandle.displayName = 'DragHandle';

export default DragHandle;
