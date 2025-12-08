/**
 * Status Pills Component
 * Horizontal scrollable pill badges for quick status indicators
 * Based on UX Design Specification - Direction 4: Action-First
 */

import * as React from 'react';
import { LucideIcon, Check, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';

/**
 * Status pill variant
 */
export type StatusPillVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'loading';

/**
 * Status pill configuration
 */
export interface StatusPill {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Status variant */
  variant: StatusPillVariant;
  /** Optional icon override */
  icon?: LucideIcon;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * StatusPills Props
 */
export interface StatusPillsProps {
  /** Array of status pills */
  pills: StatusPill[];
  /** Custom className */
  className?: string;
}

/**
 * Get variant configuration
 */
function getVariantConfig(variant: StatusPillVariant) {
  switch (variant) {
    case 'success':
      return {
        bg: 'bg-success/10 dark:bg-success/20',
        border: 'border-success/20',
        text: 'text-success-dark dark:text-success-light',
        icon: Check,
        iconColor: 'text-success',
        showDot: true,
        dotColor: 'bg-success',
      };
    case 'warning':
      return {
        bg: 'bg-warning/10 dark:bg-warning/20',
        border: 'border-warning/20',
        text: 'text-warning-dark dark:text-warning-light',
        icon: AlertTriangle,
        iconColor: 'text-warning',
        showDot: true,
        dotColor: 'bg-warning',
      };
    case 'error':
      return {
        bg: 'bg-error/10 dark:bg-error/20',
        border: 'border-error/20',
        text: 'text-error-dark dark:text-error-light',
        icon: XCircle,
        iconColor: 'text-error',
        showDot: true,
        dotColor: 'bg-error',
      };
    case 'info':
      return {
        bg: 'bg-info/10 dark:bg-info/20',
        border: 'border-info/20',
        text: 'text-info-dark dark:text-info-light',
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
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        icon: undefined,
        iconColor: '',
        showDot: false,
        dotColor: '',
      };
  }
}

/**
 * StatusPills Component
 * Displays a horizontally scrollable row of status indicator pills
 */
export function StatusPills({
  pills,
  className = '',
}: StatusPillsProps) {
  if (pills.length === 0) return null;

  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`}>
      {pills.map((pill) => {
        const config = getVariantConfig(pill.variant);
        const IconComponent = pill.icon || config.icon;
        const isClickable = !!pill.onClick;

        return (
          <button
            key={pill.id}
            onClick={pill.onClick}
            disabled={!isClickable}
            className={`
              flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border
              transition-all duration-200
              ${config.bg} ${config.border}
              ${isClickable ? 'cursor-pointer hover:shadow-sm hover:-translate-y-0.5 active:scale-95' : 'cursor-default'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
            `}
          >
            {/* Status dot for success/warning/error */}
            {config.showDot && (
              <span className={`w-2 h-2 rounded-full ${config.dotColor} ${pill.variant === 'success' ? 'animate-pulse' : ''}`} />
            )}
            
            {/* Icon for non-dot variants */}
            {!config.showDot && IconComponent && (
              <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
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








