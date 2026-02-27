/**
 * SafetyConfirmationHeader Component
 *
 * Warning header for the safety confirmation dialog.
 * Displays title with destructive styling and warning icon.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

import { AlertTriangle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { SafetyConfirmationHeaderProps } from './safety-confirmation.types';

/**
 * Warning header component for safety confirmation dialogs
 *
 * Features:
 * - AlertTriangle warning icon
 * - Red left border for visual emphasis
 * - Destructive color scheme
 * - Accessible with proper heading semantics
 *
 * @example
 * ```tsx
 * <SafetyConfirmationHeader title="Factory Reset" />
 * ```
 */
export function SafetyConfirmationHeader({
  title,
  className,
}: SafetyConfirmationHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        className
      )}
    >
      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
        <AlertTriangle
          className="h-6 w-6 text-warning"
          aria-hidden="true"
        />
      </div>
      <span className="text-lg font-semibold font-display text-foreground">{title}</span>
    </div>
  );
}
