/**
 * HStepperItem
 *
 * Individual step indicator for the horizontal stepper.
 * Displays step number/icon with state-based styling.
 *
 * Uses CSS transitions (not Framer Motion) to match Qwik implementation
 * and reduce bundle size.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */

import * as React from 'react';
import { Check, XCircle } from 'lucide-react';
import { cn } from '@nasnet/ui/primitives';
import type { HStepperItemProps } from './h-stepper.types';

/**
 * Individual step indicator component
 *
 * @param props - Step item props
 * @returns Step indicator element
 *
 * @example
 * ```tsx
 * <HStepperItem
 *   step={stepConfig}
 *   index={0}
 *   isActive={true}
 *   isCompleted={false}
 *   hasError={false}
 *   onClick={() => stepper.goTo(0)}
 *   disabled={false}
 * />
 * ```
 */
export function HStepperItem({
  step,
  index,
  isActive,
  isCompleted,
  hasError,
  onClick,
  disabled = false,
  showTitle = true,
  useIcon = true,
  className,
}: HStepperItemProps) {
  // Determine if this is a future (pending) step
  const isFuture = !isActive && !isCompleted && !hasError;

  // Clickability is determined by the disabled prop from parent
  // Parent handles allowSkipSteps logic and passes disabled accordingly
  const isClickable = !disabled;

  // Handle keyboard activation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && isClickable) {
      event.preventDefault();
      onClick?.();
    }
  };

  // Render indicator content (checkmark, error icon, or step number)
  const renderIndicatorContent = () => {
    if (hasError) {
      return <XCircle className="h-4 w-4" aria-hidden="true" />;
    }
    if (isCompleted) {
      return <Check className="h-4 w-4" aria-hidden="true" />;
    }
    // Show icon if step has one and useIcon is true, otherwise show number
    if (useIcon && step.icon) {
      // Icon would be rendered here if we had an icon mapping
      // For now, fallback to number
      return (
        <span className="text-sm font-medium" aria-hidden="true">
          {index + 1}
        </span>
      );
    }
    return (
      <span className="text-sm font-medium" aria-hidden="true">
        {index + 1}
      </span>
    );
  };

  // Determine status for screen reader
  const getStatusLabel = (): string => {
    if (hasError) return 'has errors';
    if (isCompleted) return 'completed';
    if (isActive) return 'current';
    return 'not started';
  };

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      // Touch target container
    >
      {/* Step indicator button */}
      <button
        type="button"
        onClick={isClickable ? onClick : undefined}
        onKeyDown={handleKeyDown}
        disabled={!isClickable}
        className={cn(
          // Base styles - 36px (h-9 w-9) with padding for 44px touch target
          'relative flex items-center justify-center',
          'h-9 w-9 rounded-full border-2',
          'min-h-11 min-w-11', // 44px touch target
          // Shadow for depth
          'shadow-lg',
          // CSS transitions (300ms for transform, 200ms for colors)
          'transition-all duration-300 ease-out',
          'motion-reduce:transition-none',

          // === State-based styling ===

          // Completed state
          isCompleted &&
            !hasError &&
            !isActive &&
            'scale-110 border-primary bg-primary text-primary-foreground',

          // Active/Current state
          isActive &&
            !hasError &&
            'scale-110 border-primary bg-background text-primary',

          // Error state
          hasError && 'scale-110 border-destructive bg-destructive text-destructive-foreground',

          // Future/Pending state
          isFuture && 'scale-100 border-muted-foreground/40 bg-muted/60 text-muted-foreground',

          // Clickable states
          isClickable && 'cursor-pointer hover:opacity-90',
          !isClickable && !isActive && 'cursor-not-allowed',

          // Focus styles
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-current={isActive ? 'step' : undefined}
        aria-disabled={!isClickable}
        aria-label={`Step ${index + 1} of ${step.title}, ${getStatusLabel()}`}
        tabIndex={isClickable ? 0 : -1}
      >
        {renderIndicatorContent()}
      </button>

      {/* Step title - hidden on mobile (below md breakpoint) */}
      {showTitle && (
        <span
          className={cn(
            // Base styles
            'mt-2 text-xs text-center max-w-[80px] truncate',
            // Responsive: hidden on mobile, visible on md+
            'hidden md:block',
            // CSS transitions
            'transition-all duration-300 ease-out',
            'motion-reduce:transition-none',

            // === State-based styling ===

            // Active state - larger, bold
            isActive && 'scale-105 font-bold text-foreground',

            // Completed state
            isCompleted && !isActive && 'font-bold text-foreground',

            // Error state
            hasError && 'font-bold text-destructive',

            // Future state
            isFuture && 'font-medium text-muted-foreground'
          )}
        >
          {step.title}
        </span>
      )}
    </div>
  );
}

HStepperItem.displayName = 'HStepperItem';
