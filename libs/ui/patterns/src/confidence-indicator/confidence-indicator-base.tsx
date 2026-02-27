/**
 * Confidence Indicator Base Component
 *
 * Core visual component for confidence indicators.
 * Renders the icon and optional label with semantic design tokens.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

import { cn, useReducedMotion } from '@nasnet/ui/primitives';

import type {
  ConfidenceLevel,
  ConfidenceIndicatorSize,
  UseConfidenceIndicatorReturn,
} from './confidence-indicator.types';

/**
 * Icon mapping for confidence levels
 */
const LEVEL_ICONS = {
  high: CheckCircle2,
  medium: AlertTriangle,
  low: XCircle,
} as const;

/**
 * Size configuration for the indicator
 */
const SIZE_CONFIG = {
  sm: {
    container: 'h-5 w-5',
    icon: 'h-3 w-3',
    dot: 'h-2 w-2',
    text: 'text-xs',
  },
  md: {
    container: 'h-6 w-6',
    icon: 'h-4 w-4',
    dot: 'h-2.5 w-2.5',
    text: 'text-sm',
  },
  lg: {
    container: 'h-8 w-8',
    icon: 'h-5 w-5',
    dot: 'h-3 w-3',
    text: 'text-base',
  },
} as const;

/**
 * CVA variants for the confidence indicator container
 */
const confidenceIndicatorVariants = cva(
  // Base styles - shared across all variants
  'focus-visible:ring-ring inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      level: {
        high: 'bg-success/10 text-success ring-success/20',
        medium: 'bg-warning/10 text-warning ring-warning/20',
        low: 'bg-error/10 text-error ring-error/20',
      },
      size: {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2',
      },
      interactive: {
        true: 'cursor-pointer hover:ring-1',
        false: '',
      },
    },
    defaultVariants: {
      level: 'high',
      size: 'md',
      interactive: false,
    },
  }
);

/**
 * Pulse animation keyframes (CSS)
 * Applied via Tailwind arbitrary value
 */
const PULSE_ANIMATION_CLASS = 'animate-[confidence-pulse_1.5s_ease-in-out]';

export interface ConfidenceIndicatorBaseProps
  extends VariantProps<typeof confidenceIndicatorVariants> {
  /**
   * Computed state from the headless hook
   */
  state: UseConfidenceIndicatorReturn;

  /**
   * Size of the indicator
   * @default 'md'
   */
  size?: ConfidenceIndicatorSize;

  /**
   * Whether the indicator is interactive (can be clicked/focused)
   */
  interactive?: boolean;

  /**
   * Whether to animate on initial render
   * @default true
   */
  animateOnMount?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Optional ID for accessibility
   */
  id?: string;

  /**
   * Click handler (for opening tooltip/details)
   */
  onClick?: () => void;

  /**
   * Keyboard handler
   */
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/**
 * Confidence Indicator Base Component
 *
 * Renders the visual indicator with icon and semantic colors.
 * Used by both mobile and desktop presenters.
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 95 });
 *
 * <ConfidenceIndicatorBase
 *   state={state}
 *   size="md"
 *   interactive
 *   onClick={() => setShowDetails(true)}
 * />
 * ```
 */
export const ConfidenceIndicatorBase = React.forwardRef<
  HTMLDivElement,
  ConfidenceIndicatorBaseProps
>(function ConfidenceIndicatorBase(
  {
    state,
    size = 'md',
    interactive = false,
    animateOnMount = true,
    className,
    id,
    onClick,
    onKeyDown,
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const [hasAnimated, setHasAnimated] = React.useState(false);

  // Mark animation as complete after mount
  React.useEffect(() => {
    if (animateOnMount && !prefersReducedMotion) {
      const timer = setTimeout(() => setHasAnimated(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [animateOnMount, prefersReducedMotion]);

  const Icon = LEVEL_ICONS[state.level];
  const sizeConfig = SIZE_CONFIG[size];

  // Determine if we should show animation
  const shouldAnimate = animateOnMount && !prefersReducedMotion && !hasAnimated;

  // Handle keyboard events for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(event);
      return;
    }

    if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={ref}
      id={id}
      role={interactive ? 'button' : 'status'}
      tabIndex={interactive ? 0 : -1}
      aria-label={state.ariaLabel}
      className={cn(
        confidenceIndicatorVariants({
          level: state.level,
          size,
          interactive,
        }),
        shouldAnimate && PULSE_ANIMATION_CLASS,
        className
      )}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      <Icon
        className={cn(sizeConfig.icon, 'flex-shrink-0')}
        aria-hidden="true"
      />
    </div>
  );
});

/**
 * Confidence Indicator Dot
 *
 * Compact dot-only variant for space-constrained contexts.
 * Shows just a colored dot without the icon.
 */
export function ConfidenceIndicatorDot({
  level,
  size = 'md',
  className,
}: {
  level: ConfidenceLevel;
  size?: ConfidenceIndicatorSize;
  className?: string;
}) {
  const sizeConfig = SIZE_CONFIG[size];

  const dotColorClasses = {
    high: 'bg-success',
    medium: 'bg-warning',
    low: 'bg-error',
  } as const;

  return (
    <span
      className={cn('inline-block rounded-full', sizeConfig.dot, dotColorClasses[level], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Confidence Level Label
 *
 * Displays the human-readable label for a confidence level.
 */
export function ConfidenceLevelLabel({
  state,
  size = 'md',
  showPercentage = true,
  className,
}: {
  state: UseConfidenceIndicatorReturn;
  size?: ConfidenceIndicatorSize;
  showPercentage?: boolean;
  className?: string;
}) {
  const sizeConfig = SIZE_CONFIG[size];

  const textColorClasses = {
    high: 'text-success',
    medium: 'text-warning',
    low: 'text-error',
  } as const;

  return (
    <span className={cn('font-medium', sizeConfig.text, textColorClasses[state.level], className)}>
      {state.levelLabel}
      {showPercentage && state.showPercentage && (
        <span className="ml-1 opacity-75">({state.percentage}%)</span>
      )}
    </span>
  );
}

export { confidenceIndicatorVariants };
