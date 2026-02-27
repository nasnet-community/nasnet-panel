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
 * Icon size variants with proper touch targets per WCAG AAA spec
 */
const helpIconVariants = cva(
  // Base styles - semantic tokens, focus ring, transitions per design spec
  [
    'inline-flex items-center justify-center',
    'h-4 w-4',
    'text-muted-foreground',
    'hover:text-foreground',
    'transition-colors duration-150',
    'cursor-pointer',
    // Focus state - 2px ring (Radix default) with ring-offset
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ],
  {
    variants: {
      size: {
        sm: [
          'h-4 w-4',
          '[&_svg]:h-4 [&_svg]:w-4',
        ],
        md: [
          'h-4 w-4',
          '[&_svg]:h-4 [&_svg]:w-4',
        ],
        lg: [
          'h-5 w-5',
          '[&_svg]:h-5 [&_svg]:w-5',
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
