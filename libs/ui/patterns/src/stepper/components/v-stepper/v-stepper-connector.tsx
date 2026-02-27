/**
 * VStepperConnector
 *
 * Vertical connector line between stepper steps.
 * Indicates progress completion state with color transitions.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */

import * as React from 'react';

import { motion } from 'framer-motion';

import { cn , useReducedMotion } from '@nasnet/ui/primitives';

import type { VStepperConnectorProps } from './v-stepper.types';

/**
 * Vertical connector line between stepper steps
 *
 * @param props - Connector props
 * @returns Connector element
 *
 * @example
 * ```tsx
 * <VStepperConnector isCompleted={stepCompleted} />
 * ```
 */
export function VStepperConnector({
  isCompleted,
  animated = true,
  className,
}: VStepperConnectorProps) {
  const prefersReducedMotion = useReducedMotion();

  // Skip animation if reduced motion is preferred
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <div
      className={cn(
        // Positioning - left-aligned with step indicator center
        'absolute left-4 top-10 w-0.5 h-8 -translate-x-1/2',
        // Base state - border color (pending)
        'bg-border',
        className
      )}
      aria-hidden="true"
    >
      {/* Filled portion for completed state - success color */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 bg-success origin-top"
          initial={shouldAnimate ? { scaleY: 0 } : { scaleY: 1 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: shouldAnimate ? 0.3 : 0,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      )}
    </div>
  );
}

VStepperConnector.displayName = 'VStepperConnector';
