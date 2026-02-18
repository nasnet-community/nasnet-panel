/**
 * Quick Action Button Component
 * Grid button for common actions on the dashboard
 * Based on UX Design Specification - Direction 1: Clean Minimal
 */

import { type LucideIcon } from 'lucide-react';

import { Card, CardContent, Badge } from '@nasnet/ui/primitives';

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
 * Displays an icon-based action button with optional badge
 * Used in dashboard for quick access to common features
 */
export function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  badge,
  badgeVariant = 'secondary',
  className = '',
  disabled = false,
}: QuickActionButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 text-center 
        transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Badge positioned absolutely if present */}
      {badge !== undefined && (
        <Badge
          variant={badgeVariant}
          className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 flex items-center justify-center"
        >
          {badge}
        </Badge>
      )}

      {/* Icon in colored circle background */}
      <div className="w-12 h-12 mx-auto mb-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-500" aria-hidden="true" />
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
    </button>
  );
}

