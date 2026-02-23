/**
 * Status Pills Component
 * Horizontal scrollable pill badges for quick status indicators
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @module @nasnet/ui/patterns/status-pills
 * @example
 * ```tsx
 * <StatusPills
 *   pills={[
 *     { id: 'vpn', label: 'VPN Active', variant: 'success' },
 *     { id: 'cpu', label: 'CPU 82%', variant: 'warning' },
 *   ]}
 * />
 * ```
 */

import * as React from 'react';
import { useCallback, useMemo } from 'react';

import { type LucideIcon, Check, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';

/**
 * Status pill variant
 */
export type StatusPillVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'loading';

/**
 * Status pill configuration
 */
export interface StatusPill {
  /** Unique identifier for the pill */
  id: string;
  /** Display label */
  label: string;
  /** Status variant (determines icon and colors) */
  variant: StatusPillVariant;
  /** Optional icon override (replaces default icon for variant) */
  icon?: LucideIcon;
  /** Optional click handler - makes pill interactive when provided */
  onClick?: () => void;
}

/**
 * StatusPills component props
 */
export interface StatusPillsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of status pills to render */
  pills: StatusPill[];
}

/**
 * Variant configuration for pill styling and icons
 */
interface VariantConfig {
  bg: string;
  border: string;
  text: string;
  icon: LucideIcon | undefined;
  iconColor: string;
  showDot: boolean;
  dotColor: string;
}

/**
 * Get variant configuration
 * Memoized via useMemo in component to prevent unnecessary recalculation
 */
const getVariantConfig = (variant: StatusPillVariant): VariantConfig => {
  switch (variant) {
    case 'success':
      return {
        bg: 'bg-success/10 dark:bg-success/20',
        border: 'border-success/20',
        text: 'text-success dark:text-success',
        icon: Check,
        iconColor: 'text-success',
        showDot: true,
        dotColor: 'bg-success',
      };
    case 'warning':
      return {
        bg: 'bg-warning/10 dark:bg-warning/20',
        border: 'border-warning/20',
        text: 'text-warning dark:text-warning',
        icon: AlertTriangle,
        iconColor: 'text-warning',
        showDot: true,
        dotColor: 'bg-warning',
      };
    case 'error':
      return {
        bg: 'bg-error/10 dark:bg-error/20',
        border: 'border-error/20',
        text: 'text-error dark:text-error',
        icon: XCircle,
        iconColor: 'text-error',
        showDot: true,
        dotColor: 'bg-error',
      };
    case 'info':
      return {
        bg: 'bg-info/10 dark:bg-info/20',
        border: 'border-info/20',
        text: 'text-info dark:text-info',
        icon: Info,
        iconColor: 'text-info',
        showDot: false,
        dotColor: '',
      };
    case 'loading':
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: Loader2,
        iconColor: 'text-muted-foreground animate-spin',
        showDot: false,
        dotColor: '',
      };
    case 'neutral':
    default:
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: undefined,
        iconColor: '',
        showDot: false,
        dotColor: '',
      };
  }
};

/**
 * StatusPills Component
 * Displays a horizontally scrollable row of status indicator pills
 * Pills can be clickable (when onClick is provided) or static
 */
const StatusPillsBase = React.forwardRef<HTMLDivElement, StatusPillsProps>(
  ({ pills, className, ...props }, ref) => {
    if (pills.length === 0) return null;

    return (
      <div
        ref={ref}
        className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className || ''}`}
        role="region"
        aria-label="Status pills"
        {...props}
      >
        {pills.map((pill) => {
          const config = getVariantConfig(pill.variant);
          const IconComponent = pill.icon || config.icon;
          const isClickable = !!pill.onClick;

          return (
            <button
              key={pill.id}
              onClick={pill.onClick}
              disabled={!isClickable}
              aria-label={`${pill.label}: ${pill.variant}`}
              className={`
                flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border
                transition-all duration-200
                ${config.bg} ${config.border}
                ${isClickable ? 'cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:scale-95' : 'cursor-default'}
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              `}
            >
              {/* Status dot for success/warning/error */}
              {config.showDot && (
                <span
                  className={`w-2 h-2 rounded-full ${config.dotColor} ${
                    pill.variant === 'success' ? 'animate-pulse' : ''
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Icon for non-dot variants */}
              {!config.showDot && IconComponent && (
                <IconComponent
                  className={`w-3.5 h-3.5 ${config.iconColor}`}
                  aria-hidden="true"
                />
              )}

              {/* Label */}
              <span className={`text-sm font-medium ${config.text} whitespace-nowrap`}>
                {pill.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

StatusPillsBase.displayName = 'StatusPills';

/**
 * Memoized StatusPills component
 * Prevents unnecessary re-renders when props don't change
 */
export const StatusPills = React.memo(StatusPillsBase);



















