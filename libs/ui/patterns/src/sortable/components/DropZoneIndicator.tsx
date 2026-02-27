/**
 * DropZoneIndicator Component
 *
 * Visual indicator showing where an item will be dropped.
 * Appears between items during drag operations.
 *
 * Features:
 * - Animated appearance/disappearance
 * - Positioned before or after items
 * - Accessible (aria-hidden for decorative element)
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * <DropZoneIndicator visible={isOverItem} position="before" />
 * ```
 */

import * as React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@nasnet/ui/primitives';

import type { DropZoneIndicatorProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * Drop zone visual indicator
 */
const DropZoneIndicatorInner: React.FC<DropZoneIndicatorProps> = ({
  visible,
  position,
  className,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0.8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute left-0 right-0',
            'h-0.5',
            'bg-primary',
            'rounded-full',
            'pointer-events-none',
            'z-10',
            position === 'before' && '-top-px',
            position === 'after' && '-bottom-px',
            className
          )}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
};

/**
 * Memoized DropZoneIndicator to prevent unnecessary re-renders
 */
export const DropZoneIndicator = React.memo(DropZoneIndicatorInner);

DropZoneIndicator.displayName = 'DropZoneIndicator';

// ============================================================================
// Insertion Line Component (Alternative Style)
// ============================================================================

/**
 * Props for InsertionLine component
 */
export interface InsertionLineProps {
  /** Whether the line is visible */
  visible: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Alternative insertion line indicator with dashed border and end dots
 */
const InsertionLineInner: React.FC<InsertionLineProps> = ({ visible, className }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'h-1 w-full',
            'bg-primary/5',
            'border-2 border-dashed border-primary/30',
            'rounded-[var(--semantic-radius-card)]',
            'my-1',
            className
          )}
          aria-hidden="true"
        >
          {/* Indicator dots on ends */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/50" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/50" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Memoized InsertionLine to prevent unnecessary re-renders
 */
export const InsertionLine = React.memo(InsertionLineInner);

InsertionLine.displayName = 'InsertionLine';

export default DropZoneIndicator;
