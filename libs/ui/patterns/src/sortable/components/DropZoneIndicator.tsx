/**
 * DropZoneIndicator Component
 *
 * Visual indicator showing where an item will be dropped.
 * Appears between items during drag operations.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import * as React from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@nasnet/ui/primitives';

import type { DropZoneIndicatorProps } from '../types';

// ============================================================================
// Component
// ============================================================================

export const DropZoneIndicator: React.FC<DropZoneIndicatorProps> = ({
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
            'h-0.5 mx-2',
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

DropZoneIndicator.displayName = 'DropZoneIndicator';

// ============================================================================
// Insertion Line Component (Alternative Style)
// ============================================================================

export interface InsertionLineProps {
  visible: boolean;
  className?: string;
}

export const InsertionLine: React.FC<InsertionLineProps> = ({ visible, className }) => {
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
            'bg-primary/20',
            'border-2 border-dashed border-primary',
            'rounded-full',
            'my-1',
            className
          )}
          aria-hidden="true"
        >
          {/* Indicator dots on ends */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

InsertionLine.displayName = 'InsertionLine';

export default DropZoneIndicator;
