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
export function FormSectionErrors({ errors, className }: FormSectionErrorsProps) {
  // Don't render if no errors
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'bg-error-light/50 border-error/20 mt-2 rounded-lg border p-3',
        'dark:border-red-900/30 dark:bg-red-900/10',
        className
      )}
    >
      {/* Error header with icon */}
      <div className="flex items-start gap-2">
        <AlertCircle
          className="text-error mt-0.5 h-4 w-4 flex-shrink-0"
          aria-hidden="true"
        />

        {/* Error list */}
        <ul
          className="flex-1 space-y-1"
          aria-label="Error list"
        >
          {errors.map((error, index) => (
            <li
              key={index}
              className="text-error-dark text-xs dark:text-red-400"
            >
              {error}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
