/**
 * FormSectionErrors Component
 *
 * Displays a summary of validation errors at the section level.
 * Uses semantic error color tokens for accessibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';

import { AlertCircle } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import type { FormSectionErrorsProps } from './form-section.types';

/**
 * FormSectionErrors displays validation errors for a form section.
 *
 * Features:
 * - Error count summary
 * - Individual error message list
 * - Semantic error styling (red/error color tokens)
 * - Accessible with proper ARIA live region
 *
 * @example
 * ```tsx
 * <FormSectionErrors
 *   errors={[
 *     'IP address is invalid',
 *     'Subnet mask is required',
 *   ]}
 * />
 * ```
 */
export function FormSectionErrors({
  errors,
  className,
}: FormSectionErrorsProps) {
  // Don't render if no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'bg-error-light/50 border border-error/20 rounded-lg p-3 mt-2',
        'dark:bg-red-900/10 dark:border-red-900/30',
        className
      )}
    >
      {/* Error header with icon */}
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-error flex-shrink-0 mt-0.5" aria-hidden="true" />

        {/* Error list */}
        <ul
          className="space-y-1 flex-1"
          aria-label="Error list"
        >
          {errors.map((error, index) => (
            <li key={index} className="text-xs text-error-dark dark:text-red-400">
              {error}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
