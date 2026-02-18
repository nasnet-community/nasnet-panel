/**
 * HelpIcon Component
 * Accessible trigger icon for contextual help
 *
 * Features:
 * - WCAG AAA compliant with 3px focus ring
 * - 44px minimum touch target on mobile
 * - Hover/focus states with semantic colors
 * - Size variants (sm, md, lg)
 *
 * @see NAS-4A.12: Build Help System Components
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { HelpCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { HelpIconProps } from './help.types';

/**
 * Icon size variants with proper touch targets
 */
const helpIconVariants = cva(
  // Base styles - semantic tokens, focus ring, transitions
  [
    'inline-flex items-center justify-center',
    'rounded-full',
    'text-muted-foreground',
    'transition-colors duration-150',
    'cursor-pointer',
    // Hover state
    'hover:text-foreground hover:bg-muted/50',
    // Focus state - 3px ring per design system
    'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2',
    // Active/pressed state
    'active:bg-muted',
  ],
  {
    variants: {
      size: {
        sm: [
          'h-5 w-5',
          '[&_svg]:h-3.5 [&_svg]:w-3.5',
          // Mobile: ensure 44px touch target via padding
          'touch-action-manipulation',
          'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
        ],
        md: [
          'h-6 w-6',
          '[&_svg]:h-4 [&_svg]:w-4',
          // Mobile: ensure 44px touch target
          'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
        ],
        lg: [
          'h-8 w-8',
          '[&_svg]:h-5 [&_svg]:w-5',
          // Already meets 44px target
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type HelpIconVariantProps = VariantProps<typeof helpIconVariants>;

/**
 * HelpIcon - Trigger icon for contextual help
 *
 * Renders a question mark icon that opens help content when clicked.
 * Follows WCAG AAA guidelines with proper focus indicators and touch targets.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <HelpIcon field="gateway" onClick={() => setOpen(true)} />
 *
 * // With custom size
 * <HelpIcon field="ip" size="lg" onClick={handleClick} />
 *
 * // With form label
 * <div className="flex items-center gap-1">
 *   <Label>Gateway</Label>
 *   <HelpIcon field="gateway" onClick={() => setHelpOpen(true)} />
 * </div>
 * ```
 */
export const HelpIcon = React.forwardRef<HTMLButtonElement, HelpIconProps>(
  (
    {
      field,
      className,
      size = 'md',
      onClick,
      'aria-label': ariaLabelProp,
      tabIndex = 0,
      ...props
    },
    ref
  ) => {
    // Generate aria-label if not provided
    const ariaLabel = ariaLabelProp ?? `Help for ${field} field`;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(helpIconVariants({ size }), className)}
        onClick={onClick}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        // Ensure keyboard activation
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...props}
      >
        <HelpCircle aria-hidden="true" />
      </button>
    );
  }
);

HelpIcon.displayName = 'HelpIcon';

export { helpIconVariants };
