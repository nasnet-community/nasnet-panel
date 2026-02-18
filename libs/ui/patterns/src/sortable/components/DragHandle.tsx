/**
 * DragHandle Component
 *
 * Optional grip icon for dragging items.
 * Can be used as an explicit drag trigger point.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import * as React from 'react';

import { GripVertical } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { MIN_TOUCH_TARGET } from '../config';

import type { DragHandleProps } from '../types';

// ============================================================================
// Component
// ============================================================================

export const DragHandle = React.forwardRef<HTMLButtonElement, DragHandleProps>(
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
          'p-2',
          // Visual styles
          'text-muted-foreground',
          'rounded-md',
          'transition-colors duration-150',
          // Focus styles (visible focus ring)
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Hover styles
          'hover:text-foreground hover:bg-muted/50',
          // Active/dragging styles
          'active:bg-muted',
          // Cursor
          !disabled && 'cursor-grab active:cursor-grabbing',
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
        {children ?? <GripVertical className="h-5 w-5" aria-hidden="true" />}
      </button>
    );
  }
);

DragHandle.displayName = 'DragHandle';

export default DragHandle;
