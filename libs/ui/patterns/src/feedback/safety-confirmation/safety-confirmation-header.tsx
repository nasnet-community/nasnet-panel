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
        'flex items-center gap-3 border-l-4 border-destructive pl-4',
        className
      )}
    >
      <div className="flex-shrink-0 rounded-full bg-destructive/10 p-2">
        <AlertTriangle
          className="h-5 w-5 text-destructive"
          aria-hidden="true"
        />
      </div>
      <span className="text-lg font-semibold text-destructive">{title}</span>
    </div>
  );
}
