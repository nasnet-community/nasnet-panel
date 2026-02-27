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
      return (
        <XCircle
          className="h-4 w-4"
          aria-hidden="true"
        />
      );
    }
    if (isCompleted) {
      return (
        <Check
          className="h-4 w-4"
          aria-hidden="true"
        />
      );
    }
    // Show icon if step has one and useIcon is true, otherwise show number
    if (useIcon && step.icon) {
      // Icon would be rendered here if we had an icon mapping
      // For now, fallback to number
      return (
        <span
          className="text-sm font-medium"
          aria-hidden="true"
        >
          {index + 1}
        </span>
      );
    }
    return (
      <span
        className="text-sm font-medium"
        aria-hidden="true"
      >
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
          // Base styles - 32px (h-8 w-8) as per spec
          'relative flex items-center justify-center',
          'h-8 w-8 rounded-full',
          'min-h-11 min-w-11', // 44px touch target
          // CSS transitions (300ms for all transitions)
          'transition-all duration-300 ease-out',
          'motion-reduce:transition-none',

          // === State-based styling ===

          // Completed state - bg-success text-white
          isCompleted && !hasError && !isActive && 'bg-success text-white',

          // Active/Current state - bg-primary text-primary-foreground
          isActive && !hasError && 'bg-primary text-primary-foreground',

          // Error state - bg-error text-white
          hasError && 'bg-error text-white',

          // Future/Pending state - bg-muted text-muted-foreground
          isFuture && 'bg-muted text-muted-foreground',

          // Clickable states
          isClickable && 'cursor-pointer hover:opacity-90',
          !isClickable && !isActive && 'cursor-not-allowed',

          // Focus styles
          'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
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
            'mt-2 max-w-[80px] truncate text-center text-xs',
            // Responsive: hidden on mobile, visible on md+
            'hidden md:block',
            // CSS transitions
            'transition-all duration-300 ease-out',
            'motion-reduce:transition-none',

            // === State-based styling ===

            // Active state - larger, bold
            isActive && 'text-foreground scale-105 font-bold',

            // Completed state
            isCompleted && !isActive && 'text-foreground font-bold',

            // Error state
            hasError && 'text-destructive font-bold',

            // Future state
            isFuture && 'text-muted-foreground font-medium'
          )}
        >
          {step.title}
        </span>
      )}
    </div>
  );
}

HStepperItem.displayName = 'HStepperItem';
