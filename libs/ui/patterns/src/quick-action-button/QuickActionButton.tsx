/**
 * Quick Action Button Component
 *
 * Grid button for common actions on the dashboard.
 * Based on UX Design Specification - Direction 1: Clean Minimal
 *
 * @module @nasnet/ui/patterns/quick-action-button
 */

import * as React from 'react';
import { type LucideIcon } from 'lucide-react';

import { Badge, cn } from '@nasnet/ui/primitives';

/**
 * QuickActionButton Props
 */
export interface QuickActionButtonProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional badge text or count */
  badge?: string | number;
  /** Badge variant */
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'connected' | 'warning' | 'error' | 'info' | 'offline';
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * QuickActionButton Component
 *
 * Displays an icon-based action button with optional badge.
 * Used in dashboard for quick access to common features.
 *
 * Features:
 * - Icon with colored background circle
 * - Optional badge for status/count
 * - Semantic color tokens
 * - 44px minimum touch target
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * <QuickActionButton
 *   icon={Wifi}
 *   label="Network"
 *   onClick={() => navigate('/network')}
 * />
 *
 * <QuickActionButton
 *   icon={Bell}
 *   label="Alerts"
 *   badge={3}
 *   badgeVariant="error"
 *   onClick={() => navigate('/alerts')}
 * />
 * ```
 */
const QuickActionButtonComponent = React.forwardRef<
  HTMLButtonElement,
  QuickActionButtonProps
>(
  (
    {
      icon: Icon,
      label,
      onClick,
      badge,
      badgeVariant = 'secondary',
      className,
      disabled = false,
    },
    ref
  ) => {
    const handleClick = React.useCallback(() => {
      if (!disabled) {
        onClick();
      }
    }, [onClick, disabled]);

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        type="button"
        className={cn(
          'relative',
          // Base styles
          'rounded-lg p-4',
          'bg-card border border-border',
          'text-center',
          // Transitions
          'transition-all duration-200',
          'hover:shadow-sm hover:-translate-y-0.5',
          'active:scale-95',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Min touch target 44x44
          'min-h-[44px] min-w-[44px]',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          className
        )}
        aria-label={label}
        aria-disabled={disabled}
      >
        {/* Badge positioned absolutely if present */}
        {badge !== undefined && (
          <Badge
            variant={badgeVariant}
            className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 flex items-center justify-center"
            aria-label={`${label} badge: ${badge}`}
          >
            {badge}
          </Badge>
        )}

        {/* Icon in colored circle background */}
        <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>

        {/* Label */}
        <p className="text-xs font-medium text-foreground/70">{label}</p>
      </button>
    );
  }
);

QuickActionButtonComponent.displayName = 'QuickActionButton';

export const QuickActionButton = React.memo(QuickActionButtonComponent);

