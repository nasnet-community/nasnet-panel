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
  'focus-visible:ring-ring inline-flex items-center rounded-[var(--semantic-radius-badge)] px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        // Brand colors
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // Status colors (semantic - light mode backgrounds)
        success: 'bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400',
        connected: 'bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-warning-light text-warning-dark dark:bg-amber-900/20 dark:text-amber-400',
        error: 'bg-error-light text-error-dark dark:bg-red-900/20 dark:text-red-400',
        info: 'bg-info-light text-info-dark dark:bg-sky-900/20 dark:text-sky-400',
        offline: 'bg-muted text-muted-foreground',
        outline: 'border-border text-foreground border bg-transparent',
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
  React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, pulse, ...props }, ref) => {
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
  })
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
