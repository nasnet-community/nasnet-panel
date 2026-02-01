/**
 * Spinner Component
 *
 * Animated loading spinner for indicating in-progress actions.
 * Used in buttons, loading overlays, and inline loading states.
 *
 * Accessibility:
 * - Uses role="status" for screen reader announcement
 * - Includes sr-only text for context
 * - Respects prefers-reduced-motion
 *
 * @module @nasnet/ui/primitives/spinner
 */

import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { useReducedMotion } from '../hooks';
import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Screen reader label */
  label?: string;
}

// ============================================================================
// Size mappings
// ============================================================================

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

// ============================================================================
// Spinner Component
// ============================================================================

/**
 * Spinner Component
 *
 * Animated loading spinner using the Loader2 icon from Lucide.
 * Automatically respects user's reduced motion preferences.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Spinner />
 *
 * // Different sizes
 * <Spinner size="sm" />  // 16px - for buttons
 * <Spinner size="md" />  // 20px - default
 * <Spinner size="lg" />  // 24px - for overlays
 *
 * // With custom label
 * <Spinner label="Saving configuration..." />
 * ```
 */
const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 'md', label = 'Loading...', ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <span role="status" className="inline-flex">
        <Loader2
          ref={ref}
          className={cn(
            sizeClasses[size],
            !prefersReducedMotion && 'animate-spin',
            'text-current',
            className
          )}
          aria-hidden="true"
          {...props}
        />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner };
