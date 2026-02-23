/**
 * Badge Component
 *
 * A small, inline label component used for status indicators, tags, and categorization.
 * Layer 1 Primitive: Provides base styling and semantic color variants.
 *
 * Variants (all use semantic color tokens):
 * - `default`: Primary brand color (Golden Amber) - emphasis/highlights
 * - `secondary`: Secondary brand color (Trust Blue) - links/info
 * - `success`: Green - online, healthy, valid status
 * - `connected`: Green - device/service connected (alias for success)
 * - `warning`: Amber - pending, degraded status
 * - `error`: Red - offline, failed, invalid status
 * - `info`: Blue - informational/help status
 * - `offline`: Gray - disabled/inactive status
 * - `outline`: Transparent with border - lightweight variant
 *
 * Pulse Animation:
 * - `pulse` prop enables fade-in/fade-out animation for live indicators
 * - Automatically disabled via `prefers-reduced-motion` for accessibility
 * - Uses `animate-pulse-glow` CSS animation (100-200ms duration)
 *
 * Accessibility (WCAG AAA):
 * - 7:1 contrast ratio for all variants
 * - Color NEVER sole indicator of status (always pair with icon + text)
 * - Supports dark/light theme via CSS variables
 * - Respects prefers-reduced-motion (pulse disabled automatically)
 * - Focus ring visible for keyboard navigation
 *
 * @module @nasnet/ui/primitives/badge
 * @see Docs/design/DESIGN_TOKENS.md for color token reference
 * @see Docs/design/ux-design/8-responsive-design-accessibility.md
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge>Default Badge</Badge>
 *
 * // Status indicators (always pair with icon/text, never color-only)
 * <Badge variant="success">Online</Badge>
 * <Badge variant="error">Offline</Badge>
 * <Badge variant="warning">Pending</Badge>
 *
 * // Live/real-time indicator with pulse
 * <Badge variant="success" pulse>Live</Badge>
 *
 * // With icon (respects prefers-reduced-motion)
 * <Badge variant="connected" className="gap-1">
 *   <span className="h-2 w-2 rounded-full bg-green-600" />
 *   Connected
 * </Badge>
 *
 * // Custom styling with semantic tokens
 * <Badge variant="info" className="border-info/50">
 *   Custom Info
 * </Badge>
 * ```
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        // Brand colors
        default:
          'bg-primary text-primary-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm',
        // Status colors (semantic - NEVER use for branding)
        success:
          'bg-success/10 text-success border border-success/20',
        connected:
          'bg-success/10 text-success border border-success/20',
        warning:
          'bg-warning/10 text-warning border border-warning/20',
        error:
          'bg-error/10 text-error border border-error/20',
        info:
          'bg-info/10 text-info border border-info/20',
        offline:
          'bg-muted text-muted-foreground border border-border',
        outline:
          'border border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Props for the Badge component
 *
 * @property variant - Color variant (default, secondary, success, warning, error, info, offline, outline)
 * @property pulse - Enable pulse animation for live/real-time indicators (automatically disabled via prefers-reduced-motion)
 * @property className - Optional custom CSS classes for additional styling
 * @property children - Badge content (status text, tag, or label)
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Enable pulse animation for live/real-time indicators (respects prefers-reduced-motion) */
  pulse?: boolean;
}

/**
 * Badge component - A small, inline label for status and categorization
 *
 * Uses semantic color tokens that automatically adapt to light/dark theme.
 * Pulse animation respects prefers-reduced-motion for accessibility.
 * Color should NEVER be the sole indicator of status (always pair with icon/text).
 */
const Badge = React.memo(
  React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, pulse, ...props }, ref) => {
      // Check prefers-reduced-motion to disable animations for accessibility
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      return (
        <div
          ref={ref}
          className={cn(
            badgeVariants({ variant }),
            pulse && !prefersReducedMotion && 'animate-pulse-glow',
            className
          )}
          {...props}
        />
      );
    }
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

