/**
 * VStepperItem
 *
 * Individual step item in the vertical stepper.
 * Displays step indicator, title, description, and error state.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 */

import * as React from 'react';

import { motion } from 'framer-motion';
import { Check, XCircle } from 'lucide-react';

import { cn , useReducedMotion ,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Badge,
} from '@nasnet/ui/primitives';

import type { VStepperItemProps } from './v-stepper.types';

/**
 * Individual step item component
 *
 * @param props - Step item props
 * @returns Step item element
 *
 * @example
 * ```tsx
 * <VStepperItem
 *   step={stepConfig}
 *   index={0}
 *   isActive={true}
 *   isCompleted={false}
 *   hasError={false}
 *   errors={[]}
 *   isClickable={true}
 *   onClick={() => stepper.goTo(0)}
 * />
 * ```
 */
export function VStepperItem({
  step,
  index,
  isActive,
  isCompleted,
  hasError,
  errors,
  isClickable,
  onClick,
  showDescription = true,
  showErrorCount = false,
  className,
}: VStepperItemProps) {
  const prefersReducedMotion = useReducedMotion();

  // Determine step state for styling
  const isFuture = !isActive && !isCompleted && !hasError;

  // Handle keyboard activation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isClickable) {
        onClick();
      }
    }
  };

  // Step indicator content
  const renderIndicator = () => {
    if (hasError) {
      return <XCircle className="h-4 w-4" aria-hidden="true" />;
    }
    if (isCompleted) {
      return <Check className="h-4 w-4" aria-hidden="true" />;
    }
    return (
      <span className="text-sm font-medium" aria-hidden="true">
        {index + 1}
      </span>
    );
  };

  // Step content component
  const stepContent = (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      disabled={!isClickable}
      className={cn(
        // Base layout
        'flex items-start gap-3 w-full p-2 rounded-md text-left',
        // Transitions
        !prefersReducedMotion && 'transition-colors duration-200',
        // Active state - highlighted background
        isActive && 'bg-primary/10',
        // Completed/clickable state - hover feedback
        isClickable && !isActive && 'hover:bg-muted',
        // Error state
        hasError && !isActive && 'bg-error/5',
        // Future/disabled state
        !isClickable && 'opacity-50 cursor-not-allowed',
        // Focus styles
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={!isClickable}
      tabIndex={isClickable ? 0 : -1}
    >
      {/* Step indicator circle */}
      <motion.div
        className={cn(
          // Base styles
          'flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0',
          // Active state
          isActive && 'border-primary bg-primary text-primary-foreground',
          // Completed state
          isCompleted && !isActive && 'border-primary bg-primary text-primary-foreground',
          // Error state
          hasError && 'border-error bg-error text-error-foreground',
          // Future/pending state
          isFuture && 'border-muted-foreground text-muted-foreground'
        )}
        initial={false}
        animate={{
          scale: isActive && !prefersReducedMotion ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {renderIndicator()}
      </motion.div>

      {/* Step content - title and description */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium truncate',
            isActive && 'text-primary',
            hasError && 'text-error',
            isFuture && 'text-muted-foreground'
          )}
        >
          {step.title}
        </p>

        {showDescription && step.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {step.description}
          </p>
        )}
      </div>

      {/* Error count badge */}
      {hasError && showErrorCount && errors.length > 0 && (
        <Badge
          variant="error"
          className="shrink-0 h-5 min-w-5 justify-center"
          aria-label={`${errors.length} validation error${errors.length !== 1 ? 's' : ''}`}
        >
          {errors.length}
        </Badge>
      )}
    </button>
  );

  // Wrap with tooltip if there are errors
  if (hasError && errors.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{stepContent}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">
                {errors.length} validation error{errors.length !== 1 ? 's' : ''}
              </p>
              <ul className="text-xs space-y-0.5">
                {errors.slice(0, 3).map((error, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {error}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li className="text-muted-foreground">
                    • ...and {errors.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return stepContent;
}

VStepperItem.displayName = 'VStepperItem';
